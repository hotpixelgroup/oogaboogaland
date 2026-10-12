// Ocean Front Walk: shared-scale sand, separate coastal trails and a capped cast of beach visitors.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2;
  // Historic bridge: 488 ft × 34 ft, crest 36 ft above deck, maximum grade 10.2%.
  // Coastal offsets are rounded aerial estimates, in the same metre-sized units as DSB.
  const LAYOUT={sand:.35,shore:-40,walk:158,bike:122,road:180,ocean:288,upland:12.3228,extent:300,courtZ:40,
    bridge:{start:95,length:148.7424,width:10.3632,rise:10.9728,grade:.102},courts:[-240,-180,-100,60,120,180],vendors:[-110,48]};
  // One continuous shore profile feeds the rendered sand, walking support and DSB optical depth.
  const heightAt=(x,z)=>Math.abs(x)<=1800&&z<=325?Math.max(-5,LAYOUT.sand+Math.min(0,z-LAYOUT.shore)*.075)+Math.max(0,Math.min(1,(z-194)/66))*(LAYOUT.upland-LAYOUT.sand):-5;
  const ROWS=[-110,-75,-55,-49,-45,-40,-32,-16,0,30,60,90,95,110,119,125,132,145,155,161,170,175,185,194,210,230,250,260,275,288,305,325];
  const box=(w,h,d,x,y,z,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
  const ball=M.cached(()=>{
    const g=M.lathe({profile:[[0,-.16],[.12,-.12],[.16,0],[.12,.12],[0,.16]],segments:12,color:"#fff4d8"});
    for(let i=0;i<g.faces.length;i++)if(i%3===0)g.faces[i].color=BL.math.hexToRgb("#ecb547");return g;
  });
  const cone=M.cached(()=>M.merge(M.lathe({profile:[[0,0],[.07,.2],[0,.2]],segments:10,color:"#dba466"}),M.moved(M.lathe({profile:[[0,0],[.08,.03],[.09,.1],[0,.16]],segments:10,color:"#ffd6dc"}),0,.19,0)));
  const wheel=M.cached(()=>{
    const parts=[M.turnedZ(M.torus(.34,.035,"#3b4951",0,16,5),Math.PI/2)];
    for(let i=0;i<8;i++){const a=i*TAU/8;parts.push(M.beam(0,0,0,0,Math.cos(a)*.3,Math.sin(a)*.3,.012,"#d7ded8"));}return M.merge(...parts);
  });
  const bike=M.cached(()=>{
    const parts=[],beam=(a,b)=>parts.push(M.beam(...a,...b,.045,"#33aebe"));
    beam([0,.36,-.65],[0,.36,.65]);beam([0,.36,-.65],[0,.77,-.3]);beam([0,.77,-.3],[0,.36,-.1]);beam([0,.36,-.1],[0,.36,.65]);beam([0,.36,-.1],[0,.9,.42]);beam([0,.9,.42],[0,.77,-.3]);beam([0,.9,.42],[0,.36,.65]);
    parts.push(box(.25,.065,.32,0,.83,-.3,"#3b4951"),M.beam(-.3,.98,.45,.3,.98,.45,.035,"#e5ddd0"));return M.merge(...parts);
  });
  const umbrella=M.cached(()=>{
    const g=M.lathe({profile:[[1.4,2.4],[1.4,2.5],[.7,2.8],[0,2.95]],segments:12,color:"#f1797c"});
    for(let i=0;i<g.faces.length;i++)if(i%2)g.faces[i].color=BL.math.hexToRgb("#fff1d4");return g;
  });
  const cart=M.cached(()=>{
    const parts=[box(1.5,.75,.9,0,.82,0,"#48bfc7"),box(1.62,.1,1,0,1.25,0,"#fff0d4"),box(1.4,.18,.025,0,.8,.47,"#fff0d4"),M.beam(0,1.2,0,0,2.95,0,.06,"#e5bd77"),umbrella()];
    for(const x of [-.62,.62])parts.push(M.moved(M.turnedZ(M.torus(.22,.045,"#425361",0,12,5),Math.PI/2),x,.27,0));
    for(const x of [-.28,0,.28])parts.push(M.moved(M.merge(cone()),x,.98,.5));
    const sign=M.merge(BL.pierDetails.shopSign("ICE CREAM",2));for(let i=0;i<sign.verts.length;i++)sign.verts[i]*=.38;
    parts.push(M.moved(sign,0,1.66,.56));return M.merge(...parts);
  });
  const tower=["#88c7d5","#e99d8a"].map(color=>M.cached(()=>{
    const parts=[];
    for(const x of [-1.05,1.05])for(const z of [-.85,.85])parts.push(M.beam(x,0,z,x,1.6,z,.13,"#d7d7c3"));
    parts.push(box(2.9,.16,2.6,0,1.65,0,"#ebddbd"),box(2.3,1.65,1.9,0,2.52,0,color),box(2.7,.16,2.3,0,3.42,0,"#f2e6cc"));
    parts.push(box(1.7,.65,.025,0,2.7,-.97,"#385e78"),box(.5,.16,.03,0,2.09,-.98,"#fff0d9"),box(.16,.5,.03,0,2.09,-.99,"#fff0d9"));
    for(let i=0;i<5;i++)parts.push(box(1,.18,.4,1.72,.25+i*.28,1.55-i*.3,"#eee0c8"));
    return M.merge(...parts);
  }));
  const kiteGeometry=M.cached(()=>{
    const verts=[0,1.3,0,-.85,0,0,0,-.8,.05,.85,0,0,0,.2,.12],faces=[],colors=["#f17491","#ffd34f","#46c8cc","#607bc4"];
    for(let i=0;i<4;i++){const j=(i+1)%4,color=BL.math.hexToRgb(colors[i]);faces.push({i:[i,j,4],color},{i:[4,j,i],color});}return {verts,faces,lines:[],castShadow:false};
  });
  const stringGeometry=M.cached(()=>{const g=M.box({w:.012,h:1,d:.012,color:"#eed9bb"});g.castShadow=false;return g;});
  const ribbon=M.cached(()=>{const g=M.box({w:.2,h:.035,d:.1,color:"#f5b1c6"});g.castShadow=false;return g;});
  const net=M.cached(()=>{
    const parts=[];
    for(const x of [-4.7,4.7])parts.push(M.beam(x,0,0,x,2.45,0,.09,"#3599aa"));
    for(let y=1.55;y<=2.36;y+=.16)parts.push(M.beam(-4.7,y,0,4.7,y,0,y>2.3?.065:.015,y>2.3?"#fff1d9":"#6d777c"));
    for(let x=-4.65;x<4.7;x+=.25)parts.push(M.beam(x,1.55,0,x,2.35,0,.012,"#6d777c"));return M.merge(...parts);
  });
  let terrainBake;
  const terrain=layout=>{
    if(terrainBake)return terrainBake;
    const g={verts:[],faces:[],lines:[]};
    // Fine strips near the wet edge and small dry faces keep Canvas depth sorting useful.
    const rows=ROWS;
    for(let x=-330;x<330;x+=10)for(let j=0;j<rows.length-1;j++){
      const a=rows[j],b=rows[j+1],q=layout.park.bumper,near=x<q.x+q.w/2+10&&x+10>q.x-q.w/2-10&&a<q.z+q.d/2+10&&b>q.z-q.d/2-10;
      const color=BL.math.hexToRgb(a<LAYOUT.shore?"#d9bb92":a>=194?"#a5ad76":j%2?"#e9cda4":"#e6c89e"),step=near?2:10;
      // Only sand near the pavilion needs finer faces to avoid painting across its raised floor in Canvas.
      for(let xx=x;xx<x+10;xx+=step)for(let z=a;z<b;){const end=near?Math.min(b,z+2):b,at=g.verts.length/3;g.verts.push(xx,heightAt(xx,z),z,xx,heightAt(xx,end),end,xx+step,heightAt(xx+step,z),z,xx+step,heightAt(xx+step,end),end);g.faces.push({i:[at,at+1,at+2],color},{i:[at+2,at+1,at+3],color});z=end;}
    }
    return terrainBake=g;
  };
  const palmGeometry=[0,1,2].map(v=>M.cached(()=>({...BL.dressing.palm(v),collisionGeometry:M.lathe({profile:[[.24,0],[.22,4.8],[0,4.8]],segments:8,color:"#92704f"})})));
  let benchBake;
  // Scenery that never changes is built once a page and shared by every visit.
  const kept=new Map(),keep=(key,make)=>{let g=kept.get(key);if(!g){g=make();kept.set(key,g);}return g;};
  // Beach visitors past this distance from the eye are a few pixels tall; their thirteen parts each are not drawn.
  const FAR=260;
  const build=layout=>{
    const root=S.createNode({sightHidden:true}),solid=S.createNode(),people=[],cyclists=[],kites=[],courts=[],vendors=[],lamps=[];
    S.addChild(root,solid);S.addChild(solid,S.createNode({geometry:terrain(layout)}));
    // Scenic coast continues into the haze with the same beach and inland profile.
    const far=keep("distant",()=>{
      const distant={verts:[],faces:[],lines:[]};
      for(const side of [-1,1])for(let j=0;j<ROWS.length-1;j++){
        const a=ROWS[j],b=ROWS[j+1],x0=side<0?-1800:330,x1=side<0?-330:1800,at=distant.verts.length/3;
        distant.verts.push(x0,heightAt(x0,a),a,x0,heightAt(x0,b),b,x1,heightAt(x1,a),a,x1,heightAt(x1,b),b);
        const color=BL.math.hexToRgb(a>=194?"#a5ad76":"#e6c99f");distant.faces.push({i:[at,at+1,at+2],color},{i:[at+2,at+1,at+3],color});
      }
      // Inland scenery continues beyond Ocean Avenue; the Pacific belongs on the beach side.
      const inland=BL.math.hexToRgb("#a5ad76");
      for(let x=-1800;x<1800;x+=120)for(let z=325;z<1200;z+=125){
        const at=distant.verts.length/3,y=LAYOUT.upland;
        distant.verts.push(x,y,z,x,y,z+125,x+120,y,z,x+120,y,z+125);
        distant.faces.push({i:[at,at+1,at+2],color:inland},{i:[at+2,at+1,at+3],color:inland});
      }
      return distant;
    });
    S.addChild(root,S.createNode({geometry:far}));
    const slab=(z,d,color,y=LAYOUT.sand)=>S.addChild(solid,S.createNode({geometry:keep(`slab|${d}|${color}`,()=>M.box({w:650,h:.06,d,color})),position:{x:0,y:y+.03,z}}));
    slab(LAYOUT.walk,6,"#cbc6bc");slab(LAYOUT.bike,4.8,"#8e9c9e");slab(LAYOUT.road,10,"#6c747b");slab(170,5,"#d1cbbb");slab(188.5,3,"#d1cbbb");
    slab(LAYOUT.ocean,22,"#6c747b",LAYOUT.upland);slab(274,6,"#d1cbbb",LAYOUT.upland);slab(302,6,"#d1cbbb",LAYOUT.upland);
    const paint=keep("markings",()=>{
    const markings=[];
      for(let x=-320;x<=320;x+=8){markings.push(box(3,.012,.075,x,.421,LAYOUT.bike,"#f8eac5"),box(3,.012,.09,x,.421,LAYOUT.road,"#efd57e"),box(3,.012,.09,x,LAYOUT.upland+.071,LAYOUT.ocean,"#efd57e"));}
      for(const z of [LAYOUT.walk-3,LAYOUT.walk+3,LAYOUT.bike-2.4,LAYOUT.bike+2.4,LAYOUT.road-5,LAYOUT.road+5])markings.push(box(650,.012,.06,0,.425,z,"#eee7d7"));
      for(const z of [277,299])markings.push(box(650,.012,.06,0,LAYOUT.upland+.072,z,"#eee7d7"));
      for(const x of [-220,-140,-60,60,140,220]){
        markings.push(box(3,.012,1.5,x,.43,LAYOUT.bike,"#6eb882"));
        for(const side of [-1,1]){const direction=side,z=LAYOUT.bike+side*.8;markings.push(M.beam(x-direction*.55,.45,z,x+direction*.55,.45,z,.04,"#f7f2df"),M.beam(x+direction*.55,.45,z,x+direction*.22,.45,z+.25,.04,"#f7f2df"),M.beam(x+direction*.55,.45,z,x+direction*.22,.45,z-.25,.04,"#f7f2df"));}
      }
      for(const x of [-240,-100,35,180])for(let z=164;z<186;z+=2)markings.push(box(3,.012,.8,x,.43,z,"#f5eddc"));
      for(const x of [-12,12])for(let z=277;z<299;z+=2)markings.push(box(3,.012,.8,x,LAYOUT.upland+.075,z,"#f5eddc"));
      return M.merge(...markings);
    });
    S.addChild(root,S.createNode({geometry:paint}));
    const ramp=(x0,z0,x1,z1,w,y0=layout.top,y1=LAYOUT.sand,colorHex="#c3a47b")=>{
      S.addChild(solid,S.createNode({geometry:keep(`ramp|${x0}|${z0}|${x1}|${z1}|${w}|${y0}|${y1}|${colorHex}`,()=>{
      const horizontal=z0===z1,dx=horizontal?0:w/2,dz=horizontal?w/2:0,g={verts:[x0-dx,y0,z0-dz,x0+dx,y0,z0+dz,x1-dx,y1,z1-dz,x1+dx,y1,z1+dz],faces:[],lines:[]},color=BL.math.hexToRgb(colorHex);
      // A closed 18 cm deck shell leaves the space underneath empty in solid-props' winding query.
      for(let i=0;i<12;i+=3)g.verts.push(g.verts[i],g.verts[i+1]-.18,g.verts[i+2]);
      const flip=horizontal?x1>x0:z1<z0;
      for(const ids of [[0,2,1],[1,2,3],[4,5,6],[5,7,6],[0,1,5,4],[2,6,7,3],[0,4,6,2],[1,3,7,5]])g.faces.push({i:flip?ids.reverse():ids,color});return g;})}));
    };
    // The two trails pass UNDER the road bridge. Beach access joins through separate low ramps.
    ramp(-35,95,-35,112,6);ramp(-75,92,-90,92,6);ramp(7,92,22,92,6);
    const bridge=LAYOUT.bridge,crest=bridge.start+bridge.rise/bridge.grade,end=bridge.start+bridge.length;
    ramp(0,bridge.start,0,crest,bridge.width,layout.top,LAYOUT.upland,"#c9c4b5");
    for(const [a,b,color] of [[crest,end,"#c9c4b5"],[end,LAYOUT.ocean,"#d1cbbb"]])S.addChild(solid,S.createNode({geometry:keep(`span|${a}|${b}|${color}`,()=>M.box({w:bridge.width,h:.18,d:b-a,color})),position:{x:0,y:LAYOUT.upland-.09,z:(a+b)/2}}));
    const bridgeAt=z=>layout.top+Math.min(bridge.rise,Math.max(0,z-bridge.start)*bridge.grade);
    const rails=keep("bridge",()=>{
      const parts=[];
    for(const x of [-bridge.width/2+.15,bridge.width/2-.15]){
        for(const [a,b] of [[bridge.start,crest],[crest,255]])parts.push(M.beam(x,bridgeAt(a)+1,a,x,bridgeAt(b)+1,b,.12,"#f1e4c8"));
        for(let z=bridge.start;z<=255;z+=6)parts.push(M.beam(x,bridgeAt(z),z,x,bridgeAt(z)+1.15,z,.14,"#c1b18f"));
        for(const z of [118,150,190,212,end]){const floor=heightAt(x,z),top=bridgeAt(z)-.18;if(top-floor>1)parts.push(M.beam(x,floor,z,x,top,z,.45,"#a9a494"));}
      }
      return M.merge(...parts);
    });
    S.addChild(solid,S.createNode({geometry:rails}));
    // Meet Ocean Avenue at its edge, rather than laying coplanar paving over the carriageway.
    S.addChild(solid,S.createNode({geometry:keep("forecourt",()=>M.box({w:18,h:.18,d:22,color:"#d9c5a6"})),position:{x:0,y:LAYOUT.upland-.03,z:266}}));
    const sign=(text,x,z,yaw=0)=>S.addChild(solid,S.createNode({geometry:BL.hubModels.postSign(text,.25,1.5),position:{x,y:.35,z},rotation:{x:0,y:yaw,z:0}}));
    sign("OCEAN FRONT WALK",-42,150);sign("BEACH AND BIKE TRAIL",22,102);sign("RETURN TO PIER",-42,153,Math.PI);
    sign("APPIAN WAY",-18,170);const oceanSign=S.createNode({geometry:BL.hubModels.postSign("OCEAN AVENUE",.25,1.5),position:{x:22,y:LAYOUT.upland,z:272}});S.addChild(solid,oceanSign);
    for(let x=-280,i=0;x<=280;x+=40,i++){
      for(const z of [150,193,310])if(Math.abs(x)>12)S.addChild(solid,S.createNode({geometry:palmGeometry[i%3](),position:{x,y:heightAt(x,z),z},scale:{x:1.35,y:1.85,z:1.35},rotation:{x:0,y:i*.7,z:0},sightHidden:true}));
      if(i%2===0){const lamp=S.createNode({geometry:BL.pierDetails.lamp(),position:{x:x+5,y:.35,z:152},rotation:{x:0,y:Math.PI,z:0}});S.addChild(solid,lamp);lamps.push(lamp);}
    }
    if(!benchBake){const set=BL.dressing.set();for(const x of [-260,-180,-100,60,140,220]){set.put("bench",x,.35,152);set.put("barrel",x+2,.35,152);}benchBake=set.build();}
    for(const node of BL.dressing.nodes(benchBake))S.addChild(node.geometry===benchBake.solid?solid:root,node);
    const visitor=(index,x,z)=>{
      const cave=M.caveman(BL.contributors.traitsFor(`beach-visitor-${index%6}`)),baseY=cave.root.position.y;
      for(const key of ["club","snack","gun","jetpack","jetFlame"])if(cave.parts[key])cave.parts[key].visible=false;
      cave.root.position.x=x;cave.root.position.y=heightAt(x,z)+baseY;cave.root.position.z=z;S.addChild(root,cave.root);const person={cave,baseY,x,z};people.push(person);return person;
    };
    for(let i=0;i<6;i++){
      const node=S.createNode({geometry:bike()}),wheels=[];S.addChild(root,node);
      for(const z of [-.65,.65]){const n=S.createNode({geometry:wheel(),position:{x:0,y:.36,z}});S.addChild(node,n);wheels.push(n);}
      const person=visitor(i,0,LAYOUT.bike);person.cave.parts.armL.rotation.x=person.cave.parts.armR.rotation.x=-1.1;
      cyclists.push({node,wheels,person,distance:i*185,speed:3.4+i*.22});
    }
    for(let i=0;i<LAYOUT.courts.length;i++){
      const x=LAYOUT.courts[i],z=LAYOUT.courtZ;
      S.addChild(root,S.createNode({geometry:keep(`court|${i}`,()=>{const lines=[box(8,.012,.055,x,.368,z-8,"#f6f1d9"),box(8,.012,.055,x,.368,z+8,"#f6f1d9")];for(const side of [-1,1])lines.push(box(.055,.012,16,x+side*4,.368,z,"#f6f1d9"));return M.merge(...lines);})}));
      const n=S.createNode({geometry:net(),position:{x,y:.35,z}});S.addChild(root,n);
      // Only the posts collide; players can pass under the net and into each open court.
      for(const side of [-1,1])S.addChild(solid,S.createNode({geometry:keep("courtPost",()=>M.box({w:.1,h:2.45,d:.1,color:"#3599aa"})),position:{x:x+side*4.7,y:1.575,z}}));
      const players=[visitor(i,x-.7,z-4),visitor(i+1,x+.7,z+4)],node=S.createNode({geometry:ball()});S.addChild(root,node);courts.push({x,players,node,net:n,phase:i*.8});
    }
    for(let i=0;i<4;i++){
      const x=[-105,35,-220,220][i],z=-12,person=visitor(i,x,z),node=S.createNode({geometry:kiteGeometry()}),strings=[],tail=[];person.cave.parts.armR.rotation.x=-1.8;S.addChild(root,node);
      for(let j=0;j<8;j++){const n=S.createNode({geometry:stringGeometry(),quaternion:BL.math.quat.create()});S.addChild(root,n);strings.push(n);}
      for(let j=0;j<10;j++){const n=S.createNode({geometry:ribbon()});S.addChild(root,n);tail.push(n);}kites.push({x,z,person,node,strings,tail,phase:i*1.7});
    }
    for(let i=0;i<LAYOUT.vendors.length;i++){
      const x=LAYOUT.vendors[i],z=152,node=S.createNode({geometry:cart(),position:{x,y:.35,z}});S.addChild(solid,node);
      const person=visitor(i+4,x,z-1.5);person.cave.root.rotation.y=0;vendors.push({x,z,person});
    }
    for(const q of layout.coastalTowers)S.addChild(solid,S.createNode({geometry:tower[q.variant](),position:{x:q.x,y:.35,z:q.z}}));
    for(const x of [-140,140])S.addChild(solid,S.createNode({geometry:BL.pierDetails.cafe(),position:{x,y:.35,z:15}}));
    for(const x of [-250,-210,-160,45,85,165])S.addChild(root,S.createNode({geometry:keep(x<0?"towel|blue":"towel|rose",()=>M.box({w:1.3,h:.015,d:2,color:x<0?"#6baed0":"#e79baf"})),position:{x,y:.37,z:-18}}));
    const rod=()=>keep("rod",()=>M.merge(M.beam(0,1.2,0,-4,2.4,0,.035,"#365c6d"),M.beam(-4,2.4,0,-6,layout.sea-layout.top+.04,0,.008,"#dbcead"),M.moved(M.turnedX(M.torus(.09,.025,"#d2ac6e",0,12,5),Math.PI/2),-.3,1.3,0)));
    for(let i=0;i<8;i++){
      if(i<layout.fishing.people.length){
        const [x,z]=layout.fishing.people[i],person=visitor(i,x,z);person.fisher=true;person.cave.root.position.y=layout.top+person.baseY;person.cave.root.rotation.y=-Math.PI/2;person.cave.parts.armL.rotation.x=person.cave.parts.armR.rotation.x=-1.3;
        S.addChild(root,S.createNode({geometry:rod(),position:{x:x-.35,y:layout.top,z}}));
      }else{const person=visitor(i,-260+i*74,LAYOUT.walk+(i%2?1.5:-1.5));person.walker=true;person.phase=i*67;}
    }
    const gift=S.createNode({geometry:cone(),visible:false,position:{x:0,y:-.55,z:.16}});let giftAge=0;
    let elapsed=0,serveAt=-10;
    const near=player=>{
      if(!player)return null;const p=player.root.position;
      if(Math.abs(p.y-player.baseY-.35)>.75)return null;
      for(const vendor of vendors)if(Math.hypot(p.x-vendor.x,p.z-vendor.z)<3)return vendor;return null;
    };
    const act=(player,hud,fx)=>{const vendor=near(player);if(!vendor)return false;if(elapsed-serveAt<3)return true;serveAt=elapsed;if(gift.parent)S.removeChild(gift.parent,gift);S.addChild(player.parts.armL,gift);gift.visible=true;giftAge=8;hud.toast("Strawberry scoop, paid over Lightning: settled before it reached your hand");fx.say(vendor.person.cave,"Cool treats, ocean breeze!",3);return true;};
    const update=(dt,time,player,eye)=>{
      elapsed=time;
      if(eye)for(let i=0;i<people.length;i++){const c=people[i].cave.root;c.visible=Math.abs(c.position.x-eye.x)<FAR&&Math.abs(c.position.z-eye.z)<FAR;}
      if(giftAge>0){giftAge=Math.max(0,giftAge-dt);if(!giftAge){gift.visible=false;S.removeChild(gift.parent,gift);}}
      for(const rider of cyclists){
        // Rounded rectangle: the two lanes never cross, and U-turns stay at the trail ends.
        const p=rider.node.position,visitor=player?.root.position;
        const ahead=visitor&&Math.abs(visitor.z-p.z)<1.1&&Math.abs(visitor.x-p.x)<4&&(visitor.x-p.x)*Math.sin(rider.node.rotation.y)>0;
        const straight=556,turn=Math.PI*1.5;
        if(!ahead)rider.distance=(rider.distance+dt*rider.speed)%(2*(straight+turn));const t=rider.distance;let yaw;
        if(t<straight){p.x=-278+t;p.z=LAYOUT.bike-1.5;yaw=Math.PI/2;}
        else if(t<straight+turn){const a=(t-straight)/1.5;p.x=278+1.5*Math.sin(a);p.z=LAYOUT.bike-1.5*Math.cos(a);yaw=Math.PI/2-a;}
        else if(t<2*straight+turn){p.x=278-(t-straight-turn);p.z=LAYOUT.bike+1.5;yaw=-Math.PI/2;}
        else{const a=(t-2*straight-turn)/1.5;p.x=-278-1.5*Math.sin(a);p.z=LAYOUT.bike+1.5*Math.cos(a);yaw=-Math.PI/2-a;}
        p.y=.41;rider.node.rotation.y=yaw;const c=rider.person.cave;c.root.position.x=p.x;c.root.position.y=.41+.82+rider.person.baseY;c.root.position.z=p.z;c.root.rotation.y=yaw;
        const pedal=rider.distance/.34;c.parts.legL.rotation.x=-1.1+Math.sin(pedal)*.3;c.parts.legR.rotation.x=-1.1-Math.sin(pedal)*.3;for(const w of rider.wheels)w.rotation.x=pedal;
      }
      for(const court of courts){
        if(court.playing)continue;
        const a=time*1.1+court.phase,s=Math.sin(a),p=court.node.position;p.x=court.x+Math.cos(a*.5)*1.2;p.z=LAYOUT.courtZ+s*4.2;p.y=.35+1.6+Math.cos(a)**2*3;
        for(let i=0;i<2;i++){const person=court.players[i],c=person.cave,reach=Math.max(0,(i?s:-s)-.55)/.45;c.root.position.x=court.x+Math.cos(a*.5)*1.2;c.root.rotation.y=i?Math.PI:0;c.root.position.y=.35+person.baseY+reach*.25;c.parts.armL.rotation.x=c.parts.armR.rotation.x=-.3-reach*2.1;}
      }
      for(const kite of kites){
        const a=time*.65+kite.phase,p=kite.node.position;p.x=kite.x+Math.sin(a)*3;p.y=12+Math.sin(a*.7)*1.1;p.z=kite.z-6+Math.cos(a)*1.5;kite.node.rotation.z=Math.sin(a)*.18;kite.node.rotation.y=Math.sin(a*.4)*.3;
        const c=kite.person.cave,handY=c.root.position.y+c.parts.armR.position.y-Math.cos(1.8)*c.traits.height*.62,handZ=kite.z+Math.sin(1.8)*c.traits.height*.62;
        let ax=kite.x+c.parts.armR.position.x,ay=handY,az=handZ;
        for(let i=0;i<kite.strings.length;i++){
          const u=(i+1)/kite.strings.length,bx=kite.x+c.parts.armR.position.x+(p.x-kite.x-c.parts.armR.position.x)*u,by=handY+(p.y-handY)*u-Math.sin(u*Math.PI)*.6,bz=handZ+(p.z-handZ)*u,dx=bx-ax,dy=by-ay,dz=bz-az,n=kite.strings[i],len=Math.hypot(dx,dy,dz);
          n.position.x=(ax+bx)/2;n.position.y=(ay+by)/2;n.position.z=(az+bz)/2;n.scale.y=len;BL.math.quat.fromEuler(n.quaternion,Math.atan2(Math.hypot(dx,dz),dy),Math.atan2(dx,dz),0);ax=bx;ay=by;az=bz;
        }
        for(let i=0;i<kite.tail.length;i++){const n=kite.tail[i];n.position.x=p.x+Math.sin(a*2-i*.65)*(.12+i*.045);n.position.y=p.y-.9-i*.23;n.position.z=p.z+Math.sin(a-i*.4)*.15;n.rotation.z=Math.sin(a*2-i*.65)*.5;}
        kite.person.cave.parts.armR.rotation.z=-.2+Math.sin(a)*.1;
      }
      for(const person of people)if(person.walker){
        const a=(time*1.25+person.phase)%1120,direction=a<560?1:-1,x=a<560?-280+a:280-(a-560),p=person.cave.root.position;
        // Yield on approach, keeping the centre of the pedestrian path clear for the visitor.
        p.x=x;const targetZ=person.z+(player&&Math.abs(player.root.position.x-x)<3&&Math.abs(player.root.position.z-person.z)<2?(person.z<LAYOUT.walk?-1:1):0);p.z+=(targetZ-p.z)*(1-Math.exp(-dt*7));p.y=.41+person.baseY;
        person.cave.root.rotation.y=direction*Math.PI/2;const swing=Math.sin(time*7+person.phase)*.45;person.cave.parts.legL.rotation.x=swing;person.cave.parts.legR.rotation.x=-swing;person.cave.parts.armL.rotation.x=-swing*.5;person.cave.parts.armR.rotation.x=swing*.5;
      }
      for(const vendor of vendors)vendor.person.cave.parts.armL.rotation.x=-.6-Math.sin(time*1.5)*.15;
    };
    update(0,0,null);
    return {root,solid,layout:LAYOUT,people,cyclists,courts,kites,vendors,lamps,near,act,update,liveGeometry:set=>{set.add(gift.geometry);for(const p of people)set.add(p.cave.headOpen).add(p.cave.headClosed);},dispose:()=>{if(gift.parent)S.removeChild(gift.parent,gift);if(root.parent)S.removeChild(root.parent,root);people.length=cyclists.length=courts.length=kites.length=vendors.length=lamps.length=0;}};
  };
  BL.pierBeach={LAYOUT,heightAt,build,parts:{bike,wheel,cart,umbrella}};
})();
