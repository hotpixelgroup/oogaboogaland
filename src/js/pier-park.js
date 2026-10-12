// Western park silhouettes; the bumper pavilion supplies a hideable roof for its own game controller.
// Each fixed exhibit is a cached, cullable venue; its complete footprint comes from the pier layout.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2,cache=new Map();
  const box=(x,y,z,w,h,d,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
  const paint=["#e77e79","#f3c84e","#41bdbb","#6e83c5"];
  const bake=(id,q)=>{
    if(cache.has(id))return cache.get(id);
    const p=[],cream="#f6e5c3",teal="#368f97";
    if(id==="ship"){
      for(const x of [-5,5]){p.push(M.beam(x,0,-8,x,10,0,.35,teal),M.beam(x,0,8,x,10,0,.35,teal));}
      p.push(M.beam(-5.4,10,0,5.4,10,0,.45,cream));
      p.push(M.beam(0,3.2,9.4,0,5.6,9.4,.12,teal),box(0,5.3,9.4,1.2,.6,.05,paint[1]));
    }else if(id==="ship-hull"){
      // Hung from the axle: local y is down from the pivot, so the node swings by its rotation alone.
      for(const x of [-1.5,1.5])p.push(M.beam(x,0,0,x,-5.9,-1,.14,cream),M.beam(x,0,0,x,-5.9,1,.14,cream));
      const hull={verts:[],faces:[],lines:[]},sections=[[-6,.25],[-4,2],[4,2],[6,.25]];
      for(const [z,w] of sections)hull.verts.push(-w,-6.7,z,w,-6.7,z,-w*.65,-7.7,z,w*.65,-7.7,z);
      const color=BL.math.hexToRgb("#cf6c47");
      for(let i=0;i<3;i++){const a=i*4,b=a+4;for(const ids of [[a,b,b+1,a+1],[a+2,a+3,b+3,b+2],[a,a+2,b+2,b],[a+1,b+1,b+3,a+3]])hull.faces.push({i:ids,color});}
      hull.faces.push({i:[0,1,3,2],color},{i:[12,14,15,13],color});p.push(hull);
      for(let z=-4;z<=4;z+=1.2)p.push(box(0,-6.35,z,3.5,.18,.65,paint[(Math.round(z*5)+24)%4]));
      for(const x of [-1.9,1.9])p.push(M.beam(x,-6.5,-4,x,-6.5,4,.13,cream));
    }else if(id==="scrambler"){
      p.push(M.lathe({profile:[[0,0],[6.5,0],[6.5,.25],[0,.25]],segments:32,color:"#91c9ca"}));
    }else if(id==="scrambler-hub"){
      p.push(box(0,1.2,0,1.2,2.2,1.2,cream));
      for(let i=0;i<3;i++){const a=i*TAU/3;p.push(M.beam(0,1.2,0,Math.cos(a)*4,1.2,Math.sin(a)*4,.28,paint[i]));}
    }else if(id.startsWith("scrambler-pod")){
      // A pair of cars on a short bar, turning about the end of its arm.
      const i=Number(id.slice(-1));p.push(M.beam(0,.9,-1.2,0,.9,1.2,.18,paint[i]));
      for(const side of [-1,1])p.push(box(0,.8,side*1.2,1.8,.65,1.35,paint[i]),box(0,1.3,side*1.2-.5,1.8,.5,.15,cream),box(0,.85,side*1.2+.2,1.35,.12,.6,"#365b70"));
    }else if(id==="drop"){
      p.push(box(0,.2,0,5,.4,5,teal));
      for(const x of [-.8,.8])for(const z of [-.8,.8])p.push(M.beam(x,.4,z,x,q.height,z,.2,cream));
      for(let y=1;y<q.height;y+=1.2){p.push(box(0,y,0,1.8,.12,1.8,y%2>1?paint[1]:teal));for(const z of [-.8,.8])p.push(M.beam(-.8,y,z,.8,y+1.15,z,.08,teal));}
      p.push(box(0,q.height-.25,0,2.6,.5,2.6,paint[1]));
    }else if(id==="drop-car"){
      // The ring of seats that climbs the tower; local y 0 is the deck.
      for(const side of [-1,1]){p.push(box(0,.6,side*1.75,4.6,.3,1.1,paint[0]),box(side*1.75,.6,0,1.1,.3,2.4,paint[0]));
        for(let x=-1.4;x<=1.4;x+=.9)p.push(box(x,1.15,side*1.7,.75,.9,.45,paint[1]),box(x,.72,side*1.9,.72,.12,.8,"#365b70"));}
    }else if(id==="bumper"){
      // Small floor faces let Canvas depth-sort the cars above their supporting surface.
      const queue=-q.d/2+4.4;
      for(let z=-q.d/2;z<q.d/2;){const depth=Math.min(2,q.d/2-z,z<queue?queue-z:2);for(let x=-q.w/2;x<q.w/2;x+=2)p.push(M.moved(M.box({w:2,h:.16,d:depth,color:z<queue?"#689f9b":"#79aaaf"}),x+1,.08,z+depth/2));z+=depth;}
      for(const x of [-q.w/2+.25,q.w/2-.25])for(const z of [-q.d/2+.25,q.d/2-.25])p.push(M.beam(x,0,z,x,4.7,z,.23,cream));
    }else if(id==="bumper-roof"){
      for(let i=0;i<10;i++)p.push(box(-q.w/2+(i+.5)*q.w/10,4.7,0,q.w/10,.2,q.d+.2,i%2?cream:paint[2]));
      for(const z of [-q.d/2,q.d/2])p.push(box(0,4.42,z,q.w,.28,.15,paint[0]));
    }else{
      for(const x of [-3.7,3.7])p.push(M.beam(x,0,0,x,4.2,0,.25,teal),box(x,.15,0,.6,.3,.6,cream));
      p.push(box(0,4,0,8,.5,.4,paint[0]));
      for(let i=0;i<8;i++)p.push(box(-3.5+i,3.65,0,.65,.28,.12,paint[i%4]));
      p.push(M.moved(BL.hubModels.postSign("PACIFIC PARK",.7,0),0,4.3,.35));
    }
    const geometry=M.merge(...p);cache.set(id,geometry);return geometry;
  };
  const Q=BL.math.quat,pad=M.cached(()=>M.box({w:3.2,h:.015,d:2.2,color:"#eac66f"}));
  // One whole turn count eased in and out: the machine starts from rest and comes back to exactly where it began.
  const eased=u=>u-Math.sin(TAU*u)/TAU;
  const build=layout=>{
    const root=S.createNode(),solid=S.createNode(),venues=[],rides=[],top=layout.top;
    const place=(parent,id,q,x=0,y=0,z=0)=>{const node=S.createNode({geometry:bake(id,q),position:{x:q.x+x,y:top+y,z:q.z+z}});S.addChild(parent,node);return node;};
    const seated=(parent,x,y,z,ry,k)=>BL.pierRides.passengers([parent],[0],x,y,z,ry,k)[0];
    for(const id of ["ship","scrambler","drop","bumper","entrance"]){const q=layout.park[id];venues.push({id,node:place(solid,id,q),layout:q});}
    const q=layout.park.bumper,bumperRoof=S.createNode({geometry:bake("bumper-roof",q),position:{x:q.x,y:top,z:q.z}});S.addChild(solid,bumperRoof);
    const model=(id,label,pose,seconds,rest,stub,board,frame,riders)=>{
      S.addChild(root,S.createNode({geometry:pad(),position:{x:board.x,y:top+.009,z:board.z}}));
      const seat={x:board.x,y:top+1,z:board.z,ry:0,floor:top,walkAt:board,sitter:null,allowWeapons:false,lockMovement:true};
      // Every machine rests for `rest` seconds at the start of each cycle: that is when it loads and lets off.
      const m={id,label,seconds,boardingSeconds:rest,stub,waits:true,root:frame,frame,seat,board,riders,tilt:null,phase:0,fast:false,
        advance:dt=>{m.phase=(m.phase+dt*(m.fast&&m.phase>=rest?4:1))%seconds;pose(m.phase<rest?0:(m.phase-rest)/(seconds-rest));},
        hurry:on=>{m.fast=on;},get boardOpen(){return m.phase<rest;}};
      rides.push(m);return m;
    };
    {
      // The ship hangs from its axle and swings, building up and dying away, then rests level.
      const q=layout.park.ship,hull=place(root,"ship-hull",q,0,10,0),tilt=Q.create(),riders=[seated(hull,-.9,-6.05,2.6,Math.PI,1),seated(hull,.9,-6.05,-2.6,0,4)];
      const m=model("ship","Pirate ship",u=>{
        const a=u?Math.pow(Math.sin(Math.PI*u),1.2)*1.05*Math.sin(u*36*TAU/5.2):0,s=Math.sin(a),c=Math.cos(a);
        hull.rotation.x=a;Q.fromEuler(tilt,a,0,0);
        m.seat.x=q.x+.9;m.seat.y=top+10+c*-6.05-s*.2;m.seat.z=q.z+s*-6.05+c*.2;
      },44,8,4,{x:q.x+8.4,z:q.z},venues[0].node,riders);
      m.tilt=tilt;
    }
    {
      // Three arms turn one way while the pair of cars on each turns the other: whole turns, so it parks where it began.
      const q=layout.park.scrambler,hub=place(root,"scrambler-hub",q),pods=[],riders=[];
      for(let i=0;i<3;i++){const a=i*TAU/3,pod=S.createNode({geometry:bake(`scrambler-pod${i}`,q),position:{x:Math.cos(a)*4,y:0,z:Math.sin(a)*4}});S.addChild(hub,pod);pods.push(pod);}
      riders.push(seated(pods[1],0,.85,1.2,Math.PI,2),seated(pods[2],0,.85,-1.2,Math.PI,5));
      const m=model("scrambler","Scrambler",u=>{
        const a=eased(u)*TAU*5,b=-eased(u)*TAU*9;hub.rotation.y=-a;for(const pod of pods)pod.rotation.y=-b;
        // The rider's car: on the first arm's pod, one car's reach from its middle.
        const ex=Math.cos(a)*4,ez=Math.sin(a)*4,t=a+b,cx=-Math.sin(t)*1.2,cz=Math.cos(t)*1.2;
        m.seat.x=q.x+ex+cx;m.seat.y=top+.9;m.seat.z=q.z+ez+cz;m.seat.ry=-t+Math.PI;
      },40,8,4,{x:q.x+8.6,z:q.z},venues[1].node,riders);
    }
    {
      // A slow climb, a breath at the top, then the drop.
      const q=layout.park.drop,car=place(root,"drop-car",q),high=q.height-4.2,riders=[seated(car,-.5,.72,1.9,0,3),seated(car,.5,.72,-1.9,Math.PI,0)];
      const m=model("drop","Drop tower",u=>{
        const t=u*19;let y=0;
        if(t<9){const k=t/9;y=high*k*k*(3-2*k);}else if(t<11.4)y=high;else if(t<12.9){const k=(t-11.4)/1.5;y=high*(1-.86*k*k);}else if(t<15){const k=(t-12.9)/2.1;y=high*.14*(1-k)*(1-k);}
        car.position.y=top+y;m.seat.y=top+y+.72;
      },27,8,5,{x:q.x,z:q.z+7.2},venues[2].node,riders);
      m.seat.x=q.x+1.4;m.seat.z=q.z+1.9;m.seat.ry=0;
    }
    for(const m of rides)m.advance(0);
    return {root,solid,venues,bumperRoof,rides};
  };
  BL.pierPark={build};
})();
