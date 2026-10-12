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
    }
    for(let i=0;i<CARS;i++){const a=i*TAU/CARS-Math.PI/2;parts.push(M.beam(Math.cos(a)*10,Math.sin(a)*10,-1.8,Math.cos(a)*10,Math.sin(a)*10,1.8,.1,"#f3d9aa"));}
    return M.merge(...parts);
  });
  // A few beach visitors ride along, seated, so the rides are never empty. They are scenery: no AI, no collision.
  const passengers=(seats,picks,x,y,z,ry,look=-1)=>{
    const riders=[];
    for(let i=0;i<picks.length;i++){
      const cave=M.caveman(BL.contributors.traitsFor(`beach-visitor-${((look<0?picks[i]:look)+2)%6}`));
      for(const key of ["club","snack","gun","jetpack","jetFlame"])if(cave.parts[key])cave.parts[key].visible=false;
      cave.parts.legL.rotation.x=cave.parts.legR.rotation.x=-Math.PI/2;cave.parts.armL.rotation.x=cave.parts.armR.rotation.x=-.75;
      cave.root.position.x=x;cave.root.position.y=y+cave.traits.height*.08;cave.root.position.z=z;cave.root.rotation.y=ry;
      S.addChild(seats[picks[i]],cave.root);riders.push(cave);
    }
    return riders;
  };
  // The rim's 120 bulbs in twelve arcs, each its own mesh so a light program can run round the wheel by glow alone.
  const ARCS=12,bulbs=Array.from({length:ARCS},(_,k)=>M.cached(()=>{
    const parts=[];
    for(const z of [-1.8,1.8])for(let j=0;j<5;j++){const i=k*5+j,a=i*TAU/60;parts.push(M.moved(M.box({w:.2,h:.2,d:.12,color:COLORS[k%COLORS.length],emissive:1}),Math.cos(a)*10,Math.sin(a)*10,z));}
    const g=M.merge(...parts);g.castShadow=false;return g;
  }));
  const build=layout=>{
    const q=layout.wheel,root=S.createNode({position:{x:q.x,y:layout.top+13.7,z:q.z}}),frame=S.createNode(),parts=[];
    for(const z of [-2.7,2.7])for(const x of [-3.5,3.5])parts.push(M.beam(x,-13.7,z,0,0,z,.42,"#f2ecdd"));
    parts.push(M.beam(0,0,-3,0,0,3,.55,"#f3d9aa"));frame.geometry=M.merge(...parts);S.addChild(root,frame);
    const wheel=S.createNode({geometry:rotor()});S.addChild(root,wheel);
    const arcs=[];for(let k=0;k<ARCS;k++){const n=S.createNode({geometry:bulbs[k]()});S.addChild(wheel,n);arcs.push(n);}
    // Light programs: a chase, two chasing heads, alternate arcs and a slow breath, each for twelve seconds.
    // `fill` (0 to 1) instead lights that share of the rim as a clock; `burst` (1 falling to 0) flashes the lot.
    const show=(time,night,fill=-1,burst=0)=>{
      const base=.12+night*.3,program=Math.floor(time/12)%4;
      for(let k=0;k<ARCS;k++){
        let v;
        if(burst>0)v=Math.sin(time*18+k)>0?1:.3;
        else if(program===0)v=((k-time*6)%ARCS+ARCS)%ARCS<3?1:0;
        else if(program===1)v=((k-time*5)%6+6)%6<2?1:0;
        else if(program===2)v=(k+Math.floor(time*2))%2?1:0;
        else v=.5+.5*Math.sin(time*1.6+k*.5);
        // As a clock, only the share of the rim that has filled since the last block plays the program.
        if(fill>=0&&burst<=0&&k>=Math.ceil(fill*ARCS))v=0;
        arcs[k].glow=base+v*(.35+night*1.4+burst);
      }
    };show(0,0);
    const cars=[];for(let i=0;i<CARS;i++){const n=S.createNode({geometry:cabins[i%COLORS.length]()});S.addChild(root,n);cars.push(n);}
    const pose=angle=>{wheel.rotation.z=angle;for(let i=0;i<CARS;i++){const a=angle-Math.PI/2+i*TAU/CARS;cars[i].position.x=Math.cos(a)*10;cars[i].position.y=Math.sin(a)*10;}};pose(0);
    const seat={x:q.x,y:layout.top+.8,z:q.z-.75,ry:Math.PI,floor:layout.top,walkAt:{x:q.board.x,z:q.board.z},sitter:null,allowWeapons:false,lockMovement:true};
    // The wheel never stops. A rider takes whichever cabin is lowest and steps off when it comes round;
    // asking to get off early brings that cabin down at three times the pace.
    let angle=0,taken=0,fast=false;
    const follow=()=>{const car=cars[taken];seat.x=q.x+car.position.x;seat.y=root.position.y+car.position.y-2.9;seat.z=q.z-.75;};
    const advance=dt=>{angle=(angle+dt*TAU/SECONDS*(fast?3:1))%TAU;pose(angle);follow();};
    const take=()=>{let low=Infinity;for(let i=0;i<CARS;i++)if(cars[i].position.y<low){low=cars[i].position.y;taken=i;}fast=false;follow();};
    const riders=passengers(cars,[3,7],0,-2.9,-.75,Math.PI);
    return {id:"wheel",label:"Ferris wheel",seconds:SECONDS,boardingSeconds:3.4,stub:3,root,frame,wheel,cars,arcs,show,seat,pose,advance,take,riders,hurry:on=>{fast=on;},board:q.board,tilt:null,
      get angle(){return angle;},get boardOpen(){return cars[taken].position.y<-9.75;}};
  };
  const ARRIVING=Array.from({length:61},(_,i)=>`Train arriving in ${i}s`);
  const create=({models,crew,pilot,hud,game,sound,layout})=>{
    const coarse=matchMedia("(pointer: coarse)").matches;
    const entries=models.map(model=>({model,button:`Ride ${model.label}`}));
    let age=0,rider=null,pending=null,current=null,jetBefore=false,exitRequested=false,completed=0,rings=0;
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
      if(entry.model.waits&&!entry.model.boardOpen){hud.toast(`The ${entry.model.label.toLowerCase()} is running. Board when it comes to rest`);return true;}
      // The train alone is boarded on the fly: any fresh press or tap inside its one-second window, never a held key.
      if(entry.model.strict){
        if(!space){hud.toast("Jump aboard when BOARD NOW shows: one second, every lap");return true;}
        if(!entry.model.boardOpen){hud.toast("Missed the train. Jump when BOARD NOW shows");return true;}
      }
      const a=crew.player;if(a.hopV>0){hud.toast("Land on the boarding pad first");return true;}
      current=entry;pending=a;age=0;exitRequested=false;jetBefore=!!a.jet;
      // Walking adds a small visual bob. Stop input and let canonical gravity settle it before sitPlayer.
      crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();return true;
    };
    const requestExit=()=>{
      if(pending){pending=null;current=null;pilot.controls.reset();return true;}
      if(!rider)return false;
      // One verb while riding: catch what is in reach, else ask to get off at the platform.
      if(current.model.grab?.()){rings++;const paid=game.addTickets(current.model.ring);sound.cue("coin");hud.toast(`Brass ring! +${paid} tickets`);return true;}
      if(exitRequested)return true;exitRequested=true;current.model.hurry?.(true);hud.toast("Off at the platform");return true;
    };
    const placeRider=()=>{
      const m=current.model,seat=m.seat;rider.root.position.x=seat.x;rider.root.position.y=seat.y+rider.traits.height*.08;rider.root.position.z=seat.z;
      rider.root.rotation.y=seat.ry;rider.root.quaternion=m.tilt;rider.hop=rider.hopV=0;
    };
    const update=dt=>{
      for(let i=0;i<entries.length;i++)entries[i].model.advance(dt);
      if(pending){
        age+=dt;
        if(crew.player!==pending||nearby()!==current||age>.75){pending=null;current=null;hud.toast("Stand on the boarding pad to ride");return;}
        current.model.take?.();
        if(!crew.sitPlayer(current.model.seat))return;
        rider=pending;pending=null;age=0;pilot.showAct();sound.cue("select");hud.toast(`${current.model.label}: one circuit, then back to the platform`);hud.hint(coarse?"Pinch in for the rider's view":"Scroll in for the rider's view",5000);
      }
      if(!rider)return;
      if(rider.camp.seat!==current.model.seat){current.model.hurry?.(false);rider=current=null;return;}
      const m=current.model;age+=dt;placeRider();hud.setAct(exitRequested?"GETTING OFF":m.reach?"GRAB THE RING":"GET OFF");
      if(age<(exitRequested?1:m.seconds-m.boardingSeconds)||!m.boardOpen)return;
      // standPlayer validates the deck exit, not the ride's moving seat or track.
      if(!crew.standPlayer(rider))return;
      if(jetBefore)crew.wearJetpack(rider,BL.hubModels.jetpack(),BL.hubModels.jetFlame());
      m.hurry?.(false);
      // A whole ride pays its stub; getting off early does not.
      if(!exitRequested){completed++;const paid=game.addTickets(m.stub);sound.cue("coin");hud.toast(`${m.label} · +${paid} tickets`);}else hud.toast("Back on the pier");
      rider=current=null;pilot.controls.reset();pilot.showAct();
    };
    const dispose=()=>{pending=null;if(rider){current.model.hurry?.(false);crew.standPlayer(rider);rider=null;}for(const e of entries)e.model.seat.sitter=null;current=null;};
    const ownsSeat=seat=>{for(const e of entries)if(e.model.seat===seat)return true;return false;};
    return {models,board,near,nearest:()=>nearby()?.model||null,spaceBoard:()=>nearby()?.model.strict?board(true):false,tapBoard:()=>nearby()?.model.strict?board(true):board(),requestExit,update,dispose,ownsSeat,
      get riding(){return !!(rider||pending);},get boarding(){return !!pending;},get kind(){return current?.model.id||null;},
      get label(){if(pending)return "Boarding…";if(rider)return exitRequested?"Getting off…":current.model.reach?"Grab the ring!":"Off at the platform";const e=nearby();return e?.model.strict?(e.model.boardOpen?"BOARD NOW":ARRIVING[Math.min(60,Math.ceil(e.model.untilBoard))]):(e?.button||"Ride");},
      get progress(){return current?Math.min(1,age/current.model.seconds):0;},get completed(){return completed;},get rings(){return rings;},get exitRequested(){return exitRequested;}};
  };
  BL.pierRides={build,create,passengers,SECONDS};
})();
