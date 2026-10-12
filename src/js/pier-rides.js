// Pier rides share boarding, a seated visitor and safe platform exits. Walking physics stays in crew.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2,CARS=10,SECONDS=48;
  const COLORS=["#f35f79","#ffd04e","#20c3bc","#557cde","#b368dc"];
  const cabins=COLORS.map(color=>M.cached(()=>{
    const box=(w,h,d,x,y,z,c)=>M.moved(M.box({w,h,d,color:c}),x,y,z);
    const parts=[box(3.6,.18,3.4,0,-3.55,0,color),box(3.5,.18,3.3,0,-.08,0,color),box(3.3,.45,.7,0,-2.9,-.75,"#f3d9aa"),box(3.3,.75,.15,0,-2.5,-1.15,color)];
    for(const x of [-1.65,1.65])for(const z of [-1.5,1.5])parts.push(M.beam(x,-3.5,z,x,-.1,z,.1,"#f3d9aa"));
    // The boarding side is open; side rails and canopy keep the cabin legible from below.
    for(const x of [-1.65,1.65])parts.push(box(.12,.65,3.1,x,-2.85,0,color));
    return M.merge(...parts);
  }));
  const rotor=M.cached(()=>{
    const parts=[];
    for(const z of [-1.8,1.8]){
      parts.push(M.moved(M.turnedX(M.torus(10,.12,"#f4c855",.15,60,6),Math.PI/2),0,0,z));
      for(let i=0;i<CARS;i++){const a=i*TAU/CARS-Math.PI/2;parts.push(M.beam(0,0,z,Math.cos(a)*10,Math.sin(a)*10,z,.1,i%2?"#e87964":"#f3d9aa"));}
      for(let i=0;i<60;i++){const a=i*TAU/60;parts.push(M.moved(M.box({w:.13,h:.13,d:.1,color:COLORS[i%COLORS.length],emissive:.85}),Math.cos(a)*10,Math.sin(a)*10,z));}
    }
    for(let i=0;i<CARS;i++){const a=i*TAU/CARS-Math.PI/2;parts.push(M.beam(Math.cos(a)*10,Math.sin(a)*10,-1.8,Math.cos(a)*10,Math.sin(a)*10,1.8,.1,"#f3d9aa"));}
    return M.merge(...parts);
  });
  const build=layout=>{
    const q=layout.wheel,root=S.createNode({position:{x:q.x,y:layout.top+13.7,z:q.z}}),frame=S.createNode(),parts=[];
    for(const z of [-2.7,2.7])for(const x of [-3.5,3.5])parts.push(M.beam(x,-13.7,z,0,0,z,.42,"#f2ecdd"));
    parts.push(M.beam(0,0,-3,0,0,3,.55,"#f3d9aa"));frame.geometry=M.merge(...parts);S.addChild(root,frame);
    const wheel=S.createNode({geometry:rotor()});S.addChild(root,wheel);
    const cars=[];for(let i=0;i<CARS;i++){const n=S.createNode({geometry:cabins[i%COLORS.length]()});S.addChild(root,n);cars.push(n);}
    const pose=angle=>{wheel.rotation.z=angle;for(let i=0;i<CARS;i++){const a=angle-Math.PI/2+i*TAU/CARS;cars[i].position.x=Math.cos(a)*10;cars[i].position.y=Math.sin(a)*10;}};pose(0);
    const seat={x:q.x,y:layout.top+.8,z:q.z-.75,ry:Math.PI,floor:layout.top,walkAt:{x:q.board.x,z:q.board.z},sitter:null,allowWeapons:false,lockMovement:true};
    const ridePose=u=>{pose(TAU*u*u*(3-2*u));const car=cars[0];seat.x=q.x+car.position.x;seat.y=root.position.y+car.position.y-2.9;seat.z=q.z-.75;};
    return {id:"wheel",label:"Ferris wheel",seconds:SECONDS,root,frame,wheel,cars,seat,pose,ridePose,board:q.board,tilt:null};
  };
  const create=({models,crew,pilot,hud,layout})=>{
    const entries=models.map(model=>({model,pose:model.ridePose||model.pose,button:`Ride ${model.label}`}));
    let age=0,rider=null,pending=null,current=null,jetBefore=false,exitRequested=false;
    const nearby=()=>{
      const a=crew.player;if(!a)return null;
      const p=a.root.position;
      let best=null,distance=Infinity;
      for(const e of entries){const q=e.model.board,d=Math.hypot(p.x-q.x,p.z-q.z);if(Math.abs(p.y-a.baseY-e.model.seat.floor)<.45&&d<4.5&&d<distance){best=e;distance=d;}}
      return best;
    };
    const near=()=>!!nearby();
    const board=(space=false)=>{
      if(rider||pending)return true;
      const entry=nearby();if(!entry)return false;
      if(entry.model.advance){
        if(!space){hud.toast("Press Space during the train's one-second boarding window");return true;}
        if(!entry.model.boardOpen){hud.toast("Missed the train — press Space when BOARD NOW appears");return true;}
      }
      const a=crew.player;if(a.hopV>0){hud.toast("Land on the boarding pad first");return true;}
      current=entry;pending=a;age=0;exitRequested=false;jetBefore=!!a.jet;
      // Walking adds a small visual bob. Stop input and let canonical gravity settle it before sitPlayer.
      crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();return true;
    };
    const requestExit=()=>{
      if(pending){pending=null;current=null;pilot.controls.reset();return true;}
      if(!rider)return false;if(exitRequested)return true;exitRequested=true;hud.toast("Returning to the boarding platform");return true;
    };
    const placeRider=()=>{
      const m=current.model,seat=m.seat;rider.root.position.x=seat.x;rider.root.position.y=seat.y+rider.traits.height*.08;rider.root.position.z=seat.z;
      rider.root.rotation.y=seat.ry;rider.root.quaternion=m.tilt;rider.hop=rider.hopV=0;
    };
    const update=dt=>{
      for(const e of entries)if(e.model.advance)e.model.advance(dt);
      if(pending){
        age+=dt;
        if(crew.player!==pending||nearby()!==current||age>.75){pending=null;current=null;hud.toast("Stand on the boarding pad to ride");return;}
        if(!crew.sitPlayer(current.model.seat))return;
        rider=pending;pending=null;age=0;pilot.showAct();hud.toast(`${current.model.label}: one circuit, then back to the platform`);
      }
      if(!rider)return;
      if(rider.camp.seat!==current.model.seat){if(!current.model.advance)current.pose(0);rider=current=null;return;}
      const m=current.model;age+=dt;
      if(!m.advance)current.pose(Math.min(1,age/m.seconds));placeRider();
      if(m.advance){if(age<(exitRequested?1:m.seconds-m.boardingSeconds)||!m.boardOpen)return;}
      else{if(age<m.seconds)return;current.pose(0);}
      // standPlayer validates the deck exit, not the ride's moving seat or track.
      if(!crew.standPlayer(rider))return;
      if(jetBefore)crew.wearJetpack(rider,BL.hubModels.jetpack(),BL.hubModels.jetFlame());
      rider=current=null;pilot.controls.reset();pilot.showAct();hud.toast("Back on the pier");
    };
    const dispose=()=>{pending=null;if(rider){if(!current.model.advance)current.pose(0);crew.standPlayer(rider);rider=null;}for(const e of entries)e.model.seat.sitter=null;current=null;};
    const ownsSeat=seat=>{for(const e of entries)if(e.model.seat===seat)return true;return false;};
    return {board,near,nearest:()=>nearby()?.model||null,spaceBoard:()=>nearby()?.model.advance?board(true):false,requestExit,update,dispose,ownsSeat,
      get riding(){return !!(rider||pending);},get boarding(){return !!pending;},get kind(){return current?.model.id||null;},
      get label(){if(pending)return "Boarding…";if(rider)return exitRequested?"Returning to platform":"Exit at platform";const e=nearby();return e?.model.advance?(e.model.boardOpen?"SPACE · BOARD NOW (1 second)":`Train arriving in ${Math.ceil(e.model.untilBoard)}s · Space to board`):(e?.button||"Ride");},
      get progress(){return current?Math.min(1,age/current.model.seconds):0;},get exitRequested(){return exitRequested;}};
  };
  BL.pierRides={build,create,SECONDS};
})();
