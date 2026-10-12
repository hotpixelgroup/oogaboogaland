// The pier uses DSB's ocean optics; a bounded flock and drifting crests work in either renderer.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2;
  const body=M.cached(()=>M.merge(M.bevelBox({w:.25,h:.25,d:.9,color:"#f2f1e8"}),M.moved(M.box({w:.22,h:.22,d:.25,color:"#f2f1e8"}),0,.08,.45),M.moved(M.box({w:.09,h:.07,d:.22,color:"#e7b54d"}),0,.03,.64)));
  const wing=side=>M.cached(()=>M.merge(M.moved(M.box({w:.62,h:.045,d:.25,color:"#f2f1e8"}),side*.34,0,-.02),M.moved(M.box({w:.44,h:.035,d:.17,color:"#737b82"}),side*.84,-.02,-.13)));
  const wings=[wing(-1),wing(1)];
  const crest=M.cached(()=>{
    const parts=[];for(let i=0;i<10;i++)parts.push(M.moved(M.box({w:5.5,h:.025,d:.14,color:"#b9ded7"}),i*6-27,0,Math.sin(i*.7)*.7));
    const g=M.merge(...parts);g.castShadow=false;return g;
  });
  // Shared, flattened cloud lobes catch coral light above the ocean horizon.
  const cloudColors=["#d99caa","#efa28c","#be95ac"],cloudGeometry=cloudColors.map(color=>M.cached(()=>{
    const parts=[];for(let i=0;i<7;i++){const g=M.lathe({profile:[[0,-1],[.8,-.5],[1,0],[.8,.5],[0,1]],segments:12,color,emissive:.8});for(let j=0;j<g.verts.length;j+=3){g.verts[j]*=9;g.verts[j+1]*=1.4+(i%3)*.3;g.verts[j+2]*=4;}parts.push(M.moved(g,i*11-33,Math.sin(i*2)*.7,Math.sin(i)*2));}const g=M.merge(...parts);g.castShadow=false;return g;
  }));
  const ridges=new Map();
  const ridgeGeometry=q=>{
    if(ridges.has(q.id))return ridges.get(q.id);
    const g={verts:[],faces:[],lines:[],castShadow:false},rand=BL.math.mulberry32(BL.math.fnv1a(q.id)),color=BL.math.hexToRgb(q.color);
    for(let i=0;i<=16;i++){
      const x=(i/16-.5)*q.w,h=Math.sin(i*Math.PI/16)*(q.h*(.6+rand()*.4));
      g.verts.push(x,0,-q.d/2,x,h,-q.d*.1,x,h*.7,q.d*.25,x,0,q.d/2);
    }
    for(let i=0;i<16;i++){const a=i*4,b=a+4;for(let j=0;j<3;j++)g.faces.push({i:[a+j,a+j+1,b+j+1,b+j],color},{i:[b+j,b+j+1,a+j+1,a+j],color});}
    ridges.set(q.id,g);return g;
  };
  const create=({root,land,renderer,lighting})=>{
    const shore=BL.pierBeach.LAYOUT.shore;
    const ocean=BL.dsbWater.create({coast:[[-1800,shore],[1800,shore],[1800,325],[-1800,325]],heightAt:BL.pierBeach.heightAt});
    // Clip this straight beachfront at its exact mean waterline once, including the Canvas surface.
    // DSB's spectrum, FFT, wave energy and water level remain untouched.
    const edge=shore+(land.layout.sea-BL.pierBeach.LAYOUT.sand)/.075,g=ocean.geometry,verts=[],faces=[];
    for(const face of g.faces){
      const points=face.i.map(i=>[g.verts[i*3],g.verts[i*3+2]]),clipped=[];
      for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(a[1]<=edge)clipped.push(a);if((a[1]<=edge)!==(b[1]<=edge)){const t=(edge-a[1])/(b[1]-a[1]);clipped.push([a[0]+(b[0]-a[0])*t,edge]);}}
      if(clipped.length<3)continue;const at=verts.length/3;for(const p of clipped)verts.push(p[0],land.layout.sea,p[1]);
      for(let i=1;i<clipped.length-1;i++)faces.push({...face,i:[at,at+i,at+i+1]});
    }
    g.verts=verts;g.faces=faces;
    // Extend only the distant surface, using the same DSB shader and repeating spectrum.
    // The optical-depth texture and all simulation constants retain their original 650 m patch.
    for(const [x0,x1,z0,z1] of [[-1800,-325,-1800,edge],[325,1800,-1800,edge],[-325,325,-1800,-325]]){
      const at=g.verts.length/3,color=[14,74,117];g.verts.push(x0,land.layout.sea,z0,x0,land.layout.sea,z1,x1,land.layout.sea,z0,x1,land.layout.sea,z1);
      g.faces.push({i:[at,at+1,at+2],color,water:"aegean"},{i:[at+2,at+1,at+3],color,water:"aegean"});
    }
    const oceanMood={waveEnergy:1,roughness:0,glint:1,foam:1};
    S.removeChild(land.root,land.sea);S.addChild(root,ocean.node);
    const group=S.createNode({sightHidden:true});S.addChild(root,group);
    const lighthouse=BL.pierLighthouse.create({root:group,sea:land.layout.sea,lighting,entrance:land.layout.entrance});
    const backdrop=land.layout.backdrop;
    for(const q of backdrop.ridges)S.addChild(group,S.createNode({geometry:ridgeGeometry(q),position:{x:q.x,y:q.id==="mountains"?BL.pierBeach.LAYOUT.upland:land.layout.sea,z:q.z}}));
    const cliff=backdrop.bluff;S.addChild(group,S.createNode({geometry:M.box({w:cliff.w,h:cliff.h,d:cliff.d,color:"#c8b198"}),position:{x:cliff.x,y:BL.pierBeach.LAYOUT.upland+cliff.h/2,z:cliff.z}}));
    for(let i=0;i<backdrop.palms.length;i++){const [x,z]=backdrop.palms[i];S.addChild(group,S.createNode({geometry:BL.dressing.palm(i%3),position:{x,y:BL.pierBeach.LAYOUT.upland+cliff.h,z},scale:{x:1.35,y:1.85,z:1.35},rotation:{x:0,y:i*.7,z:0}}));}
    const cloudDeck=S.createNode({sightHidden:true}),clouds=[];S.addChild(group,cloudDeck);
    for(let i=0;i<18;i++){const a=i*TAU/18,r=700+(i%3)*25,node=S.createNode({geometry:cloudGeometry[i%3](),position:{x:Math.sin(a)*r,y:55+(i%4)*13,z:Math.cos(a)*r},rotation:{x:0,y:a,z:0},scale:{x:1.8+(i%3)*.25,y:1,z:1}});S.addChild(cloudDeck,node);clouds.push({node,x:node.position.x});}
    const birds=[];
    for(let i=0;i<12;i++){
      const node=S.createNode({geometry:body()}),left=S.createNode({geometry:wings[0]()}),right=S.createNode({geometry:wings[1]()});
      S.addChild(node,left);S.addChild(node,right);S.addChild(group,node);birds.push({node,left,right,phase:i*2.39996,side:i%2?1:-1});
    }
    const canvas=renderer.kind==="canvas2d",crests=[];for(let i=0;i<24;i++){const node=S.createNode({geometry:crest(),visible:canvas});S.addChild(group,node);crests.push(node);}
    let frame=0;
    // flash: a new block lights the beacon whatever the hour. surf and rain: the backlog's swell and the arrivals' weather.
    const update=(time,warm=0,night=0,eye,flash=0,surf=0,rain=0)=>{
      lighthouse.update(time,Math.max(night,warm*.55,flash),eye);
      // Low geographic silhouettes remain visible beyond the sailing boundary, through coastal haze.
      lighting.fogFar=Math.max(lighting.fogFar,1800);
      cloudDeck.visible=warm>.2;for(let i=0;i<clouds.length;i++)clouds[i].node.position.x=clouds[i].x+Math.sin(time*.008+i)*5;
      // Broaden the existing sun reflection at golden hour; spectrum, wave energy and waterline stay DSB's.
      oceanMood.roughness=Math.max(warm*.85,rain*.5);oceanMood.waveEnergy=1+surf*1.6+rain*.4;oceanMood.foam=1+surf*1.2+rain*.6;ocean.setEnvironment(oceanMood);
      // The low tier and Canvas refresh the wave normals every other frame; the surface reads the same.
      if(!(canvas||renderer.quality==="low")||(frame++&1)===0)ocean.update(time);
      const cap=renderer.kind==="canvas2d"||renderer.quality==="low"?6:renderer.quality==="medium"?9:12;
      for(let i=0;i<birds.length;i++){
        const b=birds[i],p=b.node.position,a=b.phase+time*(.065+i*.002),r=19+(i%4)*7;
        b.node.visible=i<cap;p.x=b.side*48+Math.cos(a)*r;p.z=-110+Math.sin(a)*r*1.9;p.y=11+(i%5)*3+Math.sin(a*2)*1.8;
        b.node.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a)*1.9);b.node.rotation.z=Math.sin(a)*-.12;
        const flap=Math.sin(time*4.8+b.phase)*.28*Math.max(0,Math.sin(time*.28+b.phase));b.left.rotation.z=flap;b.right.rotation.z=-flap;
      }
      if(canvas)for(let i=0;i<crests.length;i++){
        const n=crests[i],t=(time*.65+i*9)%180;n.position.x=i%2?80:-110;n.position.z=t+edge-180;n.position.y=-.22+Math.sin(time*.9+i)*.035;n.rotation.y=.12*Math.sin(i);n.scale.z=.4+.6*Math.sin(Math.PI*t/180)**2;
      }
    };
    update(0);
    return {ocean,birds,lighthouse,update,dispose:()=>{lighthouse.dispose();S.removeChild(root,ocean.node);S.removeChild(root,group);birds.length=crests.length=clouds.length=0;}};
  };
  BL.pierLife={create};
})();
