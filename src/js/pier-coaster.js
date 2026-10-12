// A compact ocean-side coaster: one closed rail curve owns the track and the seated train's motion.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2;
  const sample=(out,t)=>{
    const s=Math.sin(t/2),c=Math.cos(t/2),b=Math.sin(t*3);
    out.x=8*Math.cos(t);out.z=20*Math.sin(t);out.y=.55+10*s*s*s*s+1.7*b*b*s*s;
    out.dx=-8*Math.sin(t);out.dz=20*Math.cos(t);out.dy=20*s*s*s*c+10.2*b*Math.cos(t*3)*s*s+1.7*b*b*s*c;
  };
  const engine=M.cached(()=>{
    const box=(w,h,d,x,y,z,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
    const cylinder=(r,h,x,y,z,color)=>M.moved(M.lathe({profile:[[0,0],[r,0],[r,h],[0,h]],segments:16,color}),x,y,z);
    const parts=[box(2.8,.24,4.6,0,0,0,"#a32d32"),box(2.55,.3,1.4,0,.5,-1.45,"#efca7c")];
    // Smokebox, brass boiler bands, flared chimney, cab and cowcatcher read as a locomotive.
    parts.push(M.moved(M.turnedX(M.lathe({profile:[[0,-1.3],[.75,-1.3],[.75,1.3],[0,1.3]],segments:20,color:"#253c46"}),Math.PI/2),0,.95,.55));
    for(const z of [-.5,.55,1.65])parts.push(M.moved(M.turnedX(M.torus(.76,.045,"#edbd57",0,20,6),Math.PI/2),0,.95,z));
    parts.push(cylinder(.25,.65,0,1.6,1.2,"#253c46"),cylinder(.4,.15,0,2.25,1.2,"#253c46"),cylinder(.22,.25,0,1.65,-.15,"#edbd57"));
    parts.push(box(2.55,1,.18,0,.85,-2.1,"#a32d32"),box(2.95,.18,1.65,0,3.25,-1.45,"#253c46"));
    for(const x of [-1.2,1.2]){
      parts.push(box(.16,1.15,1.25,x,.8,-1.45,"#a32d32"));
      for(const z of [-2.05,-.85])parts.push(box(.13,2.65,.13,x,1.8,z,"#edbd57"));
      parts.push(box(.16,.12,1.25,x,2.35,-1.45,"#edbd57"));
    }
    parts.push(M.moved(M.turnedX(M.lathe({profile:[[0,0],[.22,0],[.22,.12],[0,.12]],segments:16,color:"#fff1bd",emissive:.8}),Math.PI/2),0,1.05,1.88));
    for(let i=-4;i<=4;i++)parts.push(M.beam(i*.31,-.1,2.55,i*.18,.6,1.95,.09,"#edbd57"));
    parts.push(M.beam(-1.35,-.1,2.55,1.35,-.1,2.55,.12,"#a32d32"));return M.merge(...parts);
  });
  const drivingWheel=M.cached(()=>{
    const parts=[M.turnedZ(M.torus(.42,.09,"#253c46",0,16,6),Math.PI/2)];
    for(let i=0;i<8;i++){const t=i*TAU/8;parts.push(M.beam(0,0,0,0,Math.cos(t)*.39,Math.sin(t)*.39,.055,"#edbd57"));}
    return M.merge(...parts);
  });
  const steamGeometry=M.cached(()=>{
    const puff=()=>M.lathe({profile:[[0,-.35],[.3,-.25],[.45,0],[.3,.3],[0,.45]],segments:10,color:"#f7e8d6"});
    const g=M.merge(puff(),M.moved(puff(),.22,.17,.06),M.moved(puff(),-.18,.1,-.12));g.castShadow=false;return g;
  });
  // A flat wagon carrying one sealed crate: a block coupled on behind the engine.
  const wagon=M.cached(()=>{
    const box=(w,h,d,x,y,z,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
    const parts=[box(2.5,.22,3.4,0,0,0,"#5a3a2a"),box(1.9,1.25,2.5,0,.74,0,"#f7931a"),box(1.94,.16,2.54,0,1.2,0,"#fff0d3"),box(1.94,.16,2.54,0,.3,0,"#fff0d3")];
    for(const x of [-1.35,1.35])for(const z of [-1.1,1.1])parts.push(M.moved(M.turnedZ(M.torus(.3,.08,"#253c46",0,12,5),Math.PI/2),x,-.02,z));
    return M.merge(...parts);
  });
  const CARS=6,GAP=1.45;
  const build=layout=>{
    const q=layout.coaster,root=S.createNode({position:{x:q.x,y:layout.top,z:q.z}}),parts=[],posts=[],a={},b={};
    const point=(p,t,side)=>{sample(p,t);const l=Math.hypot(p.dx,p.dz);p.x+=side*p.dz/l;p.z-=side*p.dx/l;};
    for(let i=0;i<144;i++){
      const t=i*TAU/144,next=(i+1)*TAU/144;
      for(const side of [-1.35,1.35]){point(a,t,side);point(b,next,side);parts.push(M.beam(a.x,a.y,a.z,b.x,b.y,b.z,.15,"#ee6b87"));}
      if(i%2===0){point(a,t,-1.6);point(b,t,1.6);parts.push(M.beam(a.x,a.y-.15,a.z,b.x,b.y-.15,b.z,.15,"#4cc4ce"));}
      if(i%12===0){sample(a,t);posts.push(M.beam(a.x,0,a.z,a.x,a.y-.2,a.z,.28,"#f4eddd"));}
    }
    const frame=S.createNode({geometry:M.merge(...parts,...posts)});S.addChild(root,frame);
    const train=S.createNode({geometry:engine(),quaternion:BL.math.quat.create()});S.addChild(root,train);
    const wheels=[];for(const x of [-1.35,1.35])for(const z of [-1.5,-.3,.9]){const wheel=S.createNode({geometry:drivingWheel(),position:{x,y:.07,z}});S.addChild(train,wheel);wheels.push(wheel);}
    const seat={x:0,y:0,z:0,ry:0,floor:layout.top,walkAt:{x:q.board.x,z:q.board.z},sitter:null,allowWeapons:false,lockMovement:true};
    const cars=[];for(let i=0;i<CARS;i++){const node=S.createNode({geometry:wagon(),quaternion:BL.math.quat.create(),visible:false});S.addChild(root,node);cars.push(node);}
    let coupled=0;const c={};
    // Fixed exhaust pool: no collision, geometry creation or particle allocation while moving.
    const steam=[];for(let i=0;i<8;i++){const node=S.createNode({geometry:steamGeometry(),visible:false});S.addChild(root,node);steam.push({node,age:2,vx:0,vz:0});}
    const chimney={x:0,y:0,z:0};
    const seconds=28,boardingSeconds=1;let phase=seconds-boardingSeconds/2,wheelAngle=0,speed=0,chug=0,nextSteam=0;
    const p={},pose=u=>{
      const t=TAU*u;sample(p,t);const yaw=Math.atan2(p.dx,p.dz),pitch=-Math.atan2(p.dy,Math.hypot(p.dx,p.dz));
      const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),forward=-1.45*cp+.8*sp;
      train.position.x=p.x;train.position.y=p.y+.35;train.position.z=p.z;BL.math.quat.fromEuler(train.quaternion,pitch,yaw,0);
      const exhaust=1.2*cp+2.4*sp;chimney.x=p.x+sy*exhaust;chimney.y=p.y+.35+2.4*cp-1.2*sp;chimney.z=p.z+cy*exhaust;
      speed=Math.hypot(p.dx,p.dy,p.dz)*TAU/seconds;
      seat.x=q.x+p.x+sy*forward;seat.y=layout.top+p.y+.35+.8*cp+1.45*sp;seat.z=q.z+p.z+cy*forward;seat.ry=yaw;
      // Each coupled wagon follows the same rails a little behind the last.
      for(let i=0;i<coupled;i++){const n=cars[i];sample(c,TAU*(((u-(i+1)*GAP/seconds-.12/seconds)%1+1)%1));n.position.x=c.x;n.position.y=c.y+.35;n.position.z=c.z;BL.math.quat.fromEuler(n.quaternion,-Math.atan2(c.dy,Math.hypot(c.dx,c.dz)),Math.atan2(c.dx,c.dz),0);}
    };pose(phase/seconds);
    const advance=dt=>{
      phase=(phase+dt)%seconds;pose(phase/seconds);
      wheelAngle=(wheelAngle+Math.hypot(p.dx,p.dy,p.dz)*TAU*dt/seconds/.42)%TAU;
      for(const wheel of wheels)wheel.rotation.x=wheelAngle;
      for(const puff of steam){
        puff.age+=dt;const n=puff.node;n.visible=puff.age<1.35;if(!n.visible)continue;
        n.position.x+=puff.vx*dt;n.position.y+=1.15*dt;n.position.z+=puff.vz*dt;
        const size=(.35+puff.age*.6)*Math.min(1,(1.35-puff.age)*4);n.scale.x=n.scale.z=size;n.scale.y=size*.85;
      }
      const beat=Math.floor(chug);chug+=dt*speed*4/(TAU*.42);
      if(Math.floor(chug)!==beat){const puff=steam[nextSteam];nextSteam=(nextSteam+1)%steam.length;puff.age=0;puff.vx=-.55+p.dx*TAU/seconds*.2;puff.vz=p.dz*TAU/seconds*.2;Object.assign(puff.node.position,chimney);puff.node.scale.x=puff.node.scale.z=.35;puff.node.scale.y=.3;puff.node.visible=true;}
    };
    // One wagon for each block found while the visitor is here, up to the customary six confirmations.
    const couple=n=>{coupled=Math.max(0,Math.min(CARS,n));for(let i=0;i<CARS;i++)cars[i].visible=i<coupled;pose(phase/seconds);return coupled;};
    return {id:"coaster",label:"Nothing Stops This Train",seconds,boardingSeconds,strict:true,stub:5,root,frame,train,cars,couple,get coupled(){return coupled;},seat,board:q.board,pose,advance,tilt:train.quaternion,
      get speed(){return speed;},get chug(){return chug;},get phase(){return phase;},get boardOpen(){return phase<boardingSeconds/2||phase>=seconds-boardingSeconds/2;},
      get untilBoard(){return phase<boardingSeconds/2||phase>=seconds-boardingSeconds/2?0:seconds-boardingSeconds/2-phase;}};
  };
  BL.pierCoaster={build};
})();
