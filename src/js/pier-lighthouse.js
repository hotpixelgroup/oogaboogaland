// An offshore Bitcoin beacon: cached scenery and dusk-driven light, with no walking or water changes.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2,ORANGE="#f7931a";
  const LAYOUT={x:160,z:-350,lampY:25.2,range:480,signalAt:380,skyPitch:.2,seaPitch:-.075,sweep:.45,period:120};
  const noShadow=g=>{g.castShadow=false;return g;};
  const cylinder=(radius,y,h,color,emissive=0)=>M.lathe({profile:[[0,y],[radius,y],[radius,y+h],[0,y+h]],segments:32,color,emissive});
  const disk=(radius,color,alpha)=>{
    const g=M.lathe({profile:[[0,0],[radius,0]],segments:32,color,emissive:1});
    // Both sides face out. A beam material avoids a glass-like grazing rim on airborne light.
    for(const face of g.faces.slice())g.faces.push({...face,i:face.i.slice().reverse()});
    g.glass=alpha;g.lightBeam=10000;return noShadow(g);
  };
  const beam=M.cached(()=>{
    const profile=[];
    for(let i=0;i<=12;i++){const x=i*LAYOUT.range/12;profile.push([.28+Math.tan(.061)*x,x]);}
    profile.push([0,LAYOUT.range]);
    const g=M.turnedZ(M.lathe({profile,segments:20,color:"#ffe4b7",emissive:1}),-Math.PI/2);
    g.glass=.055;g.lightBeam=LAYOUT.range*1.6;return noShadow(g);
  });
  const signal=M.cached(()=>{
    const g=BL.factoryModels.smoothBitcoin(34,.035,ORANGE,1);
    // One cap faces the view: transparent front/rear copies would fill each other's counters.
    g.faces=g.faces.filter(f=>f.i.every(i=>g.verts[i*3+2]>0));
    // A flat light image has width along local x; leave the cone's longitudinal fade out of its lettering.
    g.glass=.82;g.lightBeam=10000;return noShadow(g);
  });
  const kit=M.cached(()=>{
    const body=[M.lathe({profile:[[0,-6],[10,-6],[10,.4],[7.5,1.7],[0,1.7]],segments:16,color:"#586570"}),
      M.lathe({profile:[[0,1.7],[4.3,1.7],[4.3,2.5],[3.6,2.8],[2.6,21.8],[2.6,22.6],[0,22.6]],segments:32,color:"#f4e7ce"}),
      cylinder(4.6,22.6,.3,"#244653"),cylinder(2.7,23,.25,"#244653"),
      M.lathe({profile:[[0,27.5],[3.6,27.5],[3.6,27.7],[.2,30],[0,30]],segments:24,color:ORANGE}),
      M.beam(0,30,0,0,31.1,0,.09,"#d4ac64")],trim=[];
    const radius=y=>3.6-(y-2.8)/19;
    for(const y of [5.5,11.5,17.5])trim.push(M.lathe({profile:[[radius(y)+.025,y],[radius(y+1.5)+.025,y+1.5]],segments:32,color:ORANGE,emissive:1}));
    for(const y of [23.2,27.3])trim.push(M.moved(M.torus(2.76,.075,ORANGE,1,32,6),0,y,0));
    for(let i=0;i<24;i++){
      const a=i*TAU/24,b=(i+1)*TAU/24,x=Math.cos(a)*4.25,z=Math.sin(a)*4.25;
      body.push(M.beam(x,22.9,z,x,24.1,z,.07,"#d7c399"),M.beam(x,24.1,z,Math.cos(b)*4.25,24.1,Math.sin(b)*4.25,.07,"#d7c399"));
      if(i%3===0)body.push(M.beam(Math.cos(a)*2.7,23.2,Math.sin(a)*2.7,Math.cos(a)*2.7,27.4,Math.sin(a)*2.7,.14,"#244653"));
    }
    // Four medallions, slit windows and a small door give the tower a coastal silhouette at human scale.
    for(let i=0;i<4;i++){
      const a=i*TAU/4;
      body.push(M.turnedY(M.moved(M.box({w:.55,h:1.1,d:.07,color:"#244653"}),0,9.1,3.33),a),
        M.turnedY(M.moved(M.box({w:.45,h:1,d:.07,color:"#244653"}),0,15.2,3.03),a),
        M.turnedY(M.moved(M.turnedX(cylinder(.82,0,.09,ORANGE),Math.PI/2),0,20.05,2.84),a));
      trim.push(M.turnedY(M.moved(BL.factoryModels.smoothBitcoin(1.16,.06,"#fff1da",1),0,20.05,2.99),a));
    }
    body.push(M.moved(M.bevelBox({w:1.1,h:2.15,d:.1,color:"#244653"}),0,3.78,3.57),M.beam(.32,3.7,3.65,.48,3.7,3.65,.06,"#e6b34f"));
    const glass=M.lathe({profile:[[2.66,23.25],[2.66,27.3]],segments:24,color:"#b7dcd9"});glass.glass=.13;glass.castShadow=false;
    const head=M.turnedZ(M.lathe({profile:[[0,0],[.5,0],[.8,2],[.8,2.35],[0,2.35]],segments:24,color:"#244653"}),-Math.PI/2);
    const lens=noShadow(M.moved(M.turnedZ(cylinder(.72,0,.04,"#fff0cf",1),-Math.PI/2),2.36,0,0));
    const halos=[disk(24,ORANGE,.015),disk(21,ORANGE,.025),disk(18,ORANGE,.04)].map(g=>M.turnedX(g,Math.PI/2));
    const pool=disk(1,ORANGE,.075);pool.lightBeam=0;pool.glassOpacity=.075;
    return {body:M.merge(...body),trim:noShadow(M.merge(...trim)),glass,head,lens,halos,pool};
  });
  const create=({root,sea,lighting,entrance})=>{
    const geo=kit(),node=S.createNode({position:{x:LAYOUT.x,y:sea,z:LAYOUT.z},sightHidden:true});S.addChild(root,node);
    const add=(parent,geometry,position={x:0,y:0,z:0})=>{const n=S.createNode({geometry,position});S.addChild(parent,n);return n;};
    const body=add(node,geo.body),trim=add(node,geo.trim);add(node,geo.glass);
    const turret=S.createNode({position:{x:0,y:LAYOUT.lampY,z:0}});S.addChild(node,turret);
    const skyHead=S.createNode({rotation:{x:0,y:0,z:LAYOUT.skyPitch}}),seaHead=S.createNode({rotation:{x:0,y:0,z:LAYOUT.seaPitch}});
    S.addChild(turret,skyHead);S.addChild(turret,seaHead);
    add(skyHead,geo.head);const lamp=add(skyHead,geo.lens),skyBeam=add(skyHead,beam(),{x:2.42,y:0,z:0});
    const seaBeam=add(seaHead,beam(),{x:2.42,y:0,z:0});
    // Like atmospheric particles, the light's image faces the eye while its world position follows the beam.
    const projection=S.createNode({sightHidden:true});S.addChild(root,projection);
    const projected=[];
    for(let i=0;i<geo.halos.length;i++)projected.push(add(projection,geo.halos[i]));
    projected.push(add(projection,signal()));
    const pool=add(root,geo.pool,{x:0,y:sea+.035,z:0});pool.scale.x=60;pool.scale.z=18;
    const lights=new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY*8),spot=new Float32Array(12);
    lighting.lights=lights;lighting.lightCount=3;lighting.spotLight=spot;
    lights.set([entrance.x,entrance.y+8,entrance.z+1.2,9,.28,.12,.025,0,LAYOUT.x+6,sea+2.2,LAYOUT.z+6,32,0,0,0,0,LAYOUT.x,sea+LAYOUT.lampY,LAYOUT.z,12,0,0,0,0]);
    spot[7]=Math.cos(.061);spot[11]=Math.cos(.035);
    const update=(time,night,eye)=>{
      const yaw=Math.PI/2+LAYOUT.sweep*Math.sin(time*TAU/LAYOUT.period),c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(LAYOUT.seaPitch),sp=Math.sin(LAYOUT.seaPitch);
      const skyReach=Math.cos(LAYOUT.skyPitch)*LAYOUT.signalAt,p=projection.position;
      p.x=LAYOUT.x+c*skyReach;p.y=sea+LAYOUT.lampY+Math.sin(LAYOUT.skyPitch)*LAYOUT.signalAt;p.z=LAYOUT.z-s*skyReach;
      const dx=(eye?eye.x:entrance.x)-p.x,dy=(eye?eye.y:entrance.y)-p.y,dz=(eye?eye.z:entrance.z)-p.z;
      projection.rotation.y=Math.atan2(dx,dz);projection.rotation.x=-Math.atan2(dy,Math.hypot(dx,dz));
      turret.rotation.y=yaw;trim.glow=.08+night*.32;lamp.glow=.3+night*.7;
      skyBeam.visible=seaBeam.visible=projection.visible=pool.visible=night>.005;
      skyBeam.smokeOpacity=night;seaBeam.smokeOpacity=night*.55;pool.smokeOpacity=night;
      for(let i=0;i<projected.length;i++){
        const glyph=i===geo.halos.length;
        projected[i].smokeOpacity=glyph?Math.min(1,night*3):night;
        projected[i].glow=glyph?.75+(1-night)*.25:.35;
      }
      // Real shared spotlight and a faint sea glint accompany the visible atmospheric cones.
      spot[0]=LAYOUT.x+c*cp*2.42;spot[1]=sea+LAYOUT.lampY+sp*2.42;spot[2]=LAYOUT.z-s*cp*2.42;spot[3]=night>0?LAYOUT.range:0;
      spot[4]=c*cp;spot[5]=sp;spot[6]=-s*cp;spot[8]=night*8;spot[9]=night*4.6;spot[10]=night*1.3;
      const reach=-LAYOUT.lampY/sp*cp;
      pool.position.x=LAYOUT.x+c*reach;pool.position.z=LAYOUT.z-s*reach;pool.rotation.y=yaw;
      pool.glow=.8+.15*Math.sin(time*.8);pool.scale.z=17+Math.sin(time*.7)*1.5;
      lights[12]=night*.65;lights[13]=night*.28;lights[14]=night*.055;lights[20]=night;lights[21]=night*.63;lights[22]=night*.24;
      // Distant light needs open sightlines by sunset, before the tower reaches its full nighttime glow.
      const haze=Math.min(1,night*3);
      lighting.fogNear=360+haze*220;lighting.fogFar=900+haze*600;
    };
    update(0,0);
    return {root:node,body,update,dispose:()=>{S.removeChild(root,node);S.removeChild(root,pool);S.removeChild(root,projection);lighting.lights=null;lighting.lightCount=0;delete lighting.spotLight;lighting.fogNear=360;lighting.fogFar=900;}};
  };
  BL.pierLighthouse={LAYOUT,create};
})();
