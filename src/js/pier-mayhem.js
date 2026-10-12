// Mempool Mayhem: bounded bumper-car motion and a toy fee-priority queue inside the existing pavilion.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,S=BL.scene,SECONDS=75,INTERVAL=10,COUNT=6,RADIUS=1.05,STEP=1/120,TICKETS=6;
  const COLORS=["#f7931a","#e979a1","#6dcad1","#f1c64b","#899bdc","#82c18b"];
  const createRound=({halfX=8,halfZ=7}={})=>{
    const cars=Array.from({length:COUNT},(_,i)=>({x:0,z:0,vx:0,vz:0,yaw:0,fee:i+1,queued:-1})),boosts=[{x:0,z:3,active:true},{x:-5,z:0,active:true},{x:5,z:0,active:true}];
    const state={phase:"idle",elapsed:0,remaining:SECONDS,next:INTERVAL,blocks:0,admissions:0,tickets:0,lastWinner:-1,event:"",bumps:0,pickups:0,bumpX:0,bumpZ:0,revision:0,cars,boosts};
    const cooldown=new Float32Array(COUNT*COUNT);let accumulator=0,braking=0;
    const changed=event=>{state.event=event;state.revision++;};
    const spawn=i=>{const c=cars[i];c.x=i?(i-3)*2.7:0;c.z=i?halfZ-4.5:halfZ-1.4;c.vx=c.vz=c.yaw=0;c.fee=i?1+(i+state.blocks)%6:1;c.queued=-1;};
    const reset=()=>{state.phase="intro";state.elapsed=state.blocks=state.admissions=state.tickets=state.bumps=state.pickups=0;state.remaining=SECONDS;state.next=INTERVAL;state.lastWinner=-1;accumulator=braking=0;cooldown.fill(0);for(let i=0;i<COUNT;i++)spawn(i);for(const b of boosts)b.active=true;changed("intro");};
    const start=()=>{if(state.phase!=="intro"&&state.phase!=="result")return false;reset();state.phase="driving";changed("start");return true;};
    const brake=()=>{if(state.phase!=="driving")return false;cars[0].vx=cars[0].vz=0;braking=.35;return true;};
    const clamp=c=>{if(Math.abs(c.x)>halfX){c.x=Math.sign(c.x)*halfX;c.vx*=-.35;}if(Math.abs(c.z)>halfZ){c.z=Math.sign(c.z)*halfZ;c.vz*=-.35;}};
    const admit=()=>{
      let winner=-1;for(let i=0;i<COUNT;i++){const c=cars[i];if(c.queued<0)continue;const best=cars[winner];if(winner<0||c.fee>best.fee||c.fee===best.fee&&c.queued<best.queued)winner=i;}
      state.blocks++;state.next=(state.blocks+1)*INTERVAL;state.lastWinner=winner;
      if(winner===0){state.admissions++;state.tickets+=TICKETS;}
      if(winner>=0)spawn(winner);for(const b of boosts)b.active=true;changed(winner===0?"admitted":winner<0?"empty":"waiting");
    };
    const step=(dt,x,y)=>{
      braking=Math.max(0,braking-dt);const length=Math.max(1,Math.hypot(x,y));
      for(let i=0;i<COUNT;i++){
        const c=cars[i];let tx=x/length*5.2,tz=-y/length*5.2;
        if(i){const dx=(i-3)*2.7-c.x,dz=-halfZ+1.6-c.z,d=Math.hypot(dx,dz),speed=Math.min(2.2,d*3);tx=d>.01?dx/d*speed:0;tz=d>.01?dz/d*speed:0;}
        else if(braking>0)tx=tz=0;
        const blend=1-Math.exp(-6*dt);c.vx+=(tx-c.vx)*blend;c.vz+=(tz-c.vz)*blend;c.x+=c.vx*dt;c.z+=c.vz*dt;clamp(c);
        if(Math.hypot(c.vx,c.vz)>.15)c.yaw=Math.atan2(-c.vx,-c.vz);
      }
      for(let i=0;i<COUNT;i++)for(let j=i+1;j<COUNT;j++){
        const a=cars[i],b=cars[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),key=i*COUNT+j;cooldown[key]=Math.max(0,cooldown[key]-dt);if(d>=RADIUS*2)continue;
        const nx=d>.0001?dx/d:1,nz=d>.0001?dz/d:0,overlap=(RADIUS*2-d)/2;a.x-=nx*overlap;a.z-=nz*overlap;b.x+=nx*overlap;b.z+=nz*overlap;
        const closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(closing>0){const impulse=closing*.8;a.vx-=nx*impulse;a.vz-=nz*impulse;b.vx+=nx*impulse;b.vz+=nz*impulse;}
        if(closing>.8&&cooldown[key]===0){cooldown[key]=.4;state.bumps++;state.bumpX=(a.x+b.x)/2;state.bumpZ=(a.z+b.z)/2;}
        clamp(a);clamp(b);
      }
      const player=cars[0];for(const b of boosts)if(b.active&&Math.hypot(player.x-b.x,player.z-b.z)<1.4){b.active=false;player.fee=Math.min(9,player.fee+2);state.pickups++;changed("boost");}
      state.elapsed=Math.min(SECONDS,state.elapsed+dt);state.remaining=SECONDS-state.elapsed;
      for(const c of cars){const queued=c.z<=-halfZ+2.4;if(queued&&c.queued<0)c.queued=state.elapsed;else if(!queued)c.queued=-1;}
      if(state.elapsed+1e-9>=state.next&&state.next<SECONDS)admit();
      if(state.remaining<1e-9){state.elapsed=SECONDS;state.remaining=0;state.phase="result";changed("result");}
    };
    const update=(dt,x=0,y=0)=>{if(state.phase!=="driving"||!Number.isFinite(dt)||dt<=0)return;x=Number.isFinite(x)?Math.max(-1,Math.min(1,x)):0;y=Number.isFinite(y)?Math.max(-1,Math.min(1,y)):0;accumulator+=Math.min(dt,state.remaining);while(accumulator+1e-9>=STEP&&state.phase==="driving"){accumulator=Math.max(0,accumulator-STEP);step(STEP,x,y);}};
    const close=()=>{state.phase="idle";accumulator=0;changed("close");};reset();state.phase="idle";
    return {state,reset,start,brake,update,close};
  };
  const car=COLORS.map(color=>M.cached(()=>{
    const box=(w,h,d,x,y,z,c)=>M.moved(M.bevelBox({w,h,d,color:c}),x,y,z),parts=[box(1.75,.42,2,0,.55,0,color),box(1.35,.12,.75,0,.78,.32,"#f6e5c3"),box(1.35,.65,.18,0,1.05,.72,"#365b70"),M.moved(M.torus(1,.12,"#384956",0,24,6),0,.31,0),M.moved(M.turnedX(M.torus(.23,.035,"#e8c47e",0,12,5),.55),0,1.02,-.3),M.beam(0,.85,.85,0,4.35,.85,.025,"#65697b")];
    return M.merge(...parts);
  }));
  const fee=Array.from({length:9},(_,i)=>M.cached(()=>{
    const parts=[M.beam(0,1,0,0,2.2,0,.035,"#f1d89f")],glyph=BL.hubModels.SIGN_GLYPHS[String(i+1)],cell=.23;
    for(const side of [-1,1])parts.push(M.bevelBox({w:1.05,h:.175,d:.1,color:"#fff2c8",offset:{x:0,y:2.2+side*.6625,z:0},emissive:.12}),M.box({w:.18,h:1.15,d:.1,color:"#fff2c8",offset:{x:side*.435,y:2.2,z:0},emissive:.12}));
    // Cell-sized backing faces keep every raised digit visible in the Canvas painter too.
    for(let row=0;row<5;row++)for(let col=0;col<3;col++){const x=(col-1)*cell,y=2.2+(2-row)*cell;parts.push(M.box({w:cell,h:cell,d:.1,color:"#fff2c8",offset:{x,y,z:0},emissive:.12}));if(glyph[row][col]==="1")parts.push(M.box({w:cell*.92,h:cell*.92,d:.035,color:"#173840",offset:{x,y,z:.08}}));}
    return M.merge(...parts);
  }));
  const token=M.cached(()=>M.merge(M.lathe({profile:[[0,-.04],[.42,-.04],[.42,.04],[0,.04]],segments:16,color:"#f7931a"}),M.moved(M.turnedX(M.torus(.27,.04,"#ffdfa0",0,16,5),Math.PI/2),0,.07,0)));
  const spark=M.cached(()=>{const g=M.box({w:.06,h:.06,d:.06,color:"#ffe0a0"});g.castShadow=false;return g;});
  const nextBlock=M.cached(()=>{
    const text="NEXT BLOCK",cell=.16,width=37*cell,parts=[];
    for(const side of [-1,1])parts.push(M.bevelBox({w:width+.4,h:.14,d:.15,color:"#f2bd65",offset:{x:0,y:side*.49,z:0}}));
    for(let row=0;row<5;row++)parts.push(M.box({w:width+.2,h:cell,d:.1,color:"#173840",offset:{x:0,y:(2-row)*cell,z:0}}));
    let x=-width/2;for(const ch of text){if(ch===" "){x+=cell*2;continue;}const glyph=BL.hubModels.SIGN_GLYPHS[ch];for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyph[row][col]==="1")parts.push(M.box({w:cell*.92,h:cell*.92,d:.035,color:"#fff2c8",emissive:.3,offset:{x:x+(col+.5)*cell,y:(2-row)*cell,z:.08}}));x+=cell*4;}
    return M.merge(...parts);
  });
  const build=layout=>{
    const q=layout.mayhem,root=S.createNode(),solid=S.createNode(),cars=[],labels=[],boosts=[];S.addChild(root,solid);
    for(const make of fee)make();spark(); // Every in-round geometry swap uses a warmed cache.
    for(let i=0;i<COUNT;i++){const n=S.createNode({geometry:car[i]()}),label=S.createNode({geometry:fee[i]()});S.addChild(root,n);S.addChild(n,label);cars.push(n);labels.push(label);}
    for(let i=0;i<3;i++){const n=S.createNode({geometry:token()});S.addChild(root,n);boosts.push(n);}
    const p=[],box=(w,h,d,x,y,z,color)=>p.push(M.moved(M.bevelBox({w,h,d,color}),x,y,z));
    // Low rails contain pedestrians; ride entry is via the clear exterior pad. No new floor or roof.
    for(const x of [-q.halfX-1.25,q.halfX+1.25])box(.15,.7,q.halfZ*2+2.5,x,.65,0,"#e6c67d");
    for(const z of [-q.halfZ-1.25,q.halfZ+1.25])box(q.halfX*2+2.5,.7,.15,0,.65,z,"#e6c67d");
    S.addChild(solid,S.createNode({geometry:M.merge(...p),position:{x:q.x,y:layout.top,z:q.z}}));
    S.addChild(solid,S.createNode({geometry:BL.hubModels.postSign("MEMPOOL MAYHEM",.4,1.4),position:{x:q.sign.x,y:layout.top,z:q.sign.z},rotation:{x:0,y:Math.PI/2,z:0}}));
    S.addChild(root,S.createNode({geometry:M.box({w:1.8,h:.015,d:1.8,color:"#eac66f"}),position:{x:q.play.x,y:layout.top+.01,z:q.play.z}}));
    const posts=M.merge(M.beam(-q.halfX,0,0,-q.halfX,2.6,0,.18,"#f6e5c3"),M.beam(q.halfX,0,0,q.halfX,2.6,0,.18,"#f6e5c3"));
    S.addChild(root,S.createNode({geometry:posts,position:{x:q.x,y:layout.top+.16,z:q.z-q.halfZ-.4}}));
    const gate=S.createNode({geometry:M.bevelBox({w:q.halfX*2,h:.2,d:.2,color:"#f7931a"}),position:{x:q.x,y:layout.top+1.45,z:q.z-q.halfZ-.4}});S.addChild(root,gate);
    const banner=S.createNode({geometry:nextBlock(),position:{x:q.x,y:layout.top+3.65,z:q.z-q.halfZ-.4}});S.addChild(root,banner);
    S.addChild(root,S.createNode({geometry:M.box({w:q.halfX*2,h:.008,d:.08,color:"#ffe6a0"}),position:{x:q.x,y:layout.top+.168,z:q.z-q.halfZ+2.4}}));
    return {root,solid,cars,labels,boosts,gate,banner};
  };
  const TIMES=Array.from({length:SECONDS+1},(_,i)=>`${i}s`),GATES=Array.from({length:INTERVAL+1},(_,i)=>`Gate in ${i}s`);
  const create=({models,roof,layout,camera,crew,pilot,hud,fx,game,sound:engine})=>{
    const q=layout.mayhem,sim=createRound(q),state=sim.state,sound=engine.channel(.8),touch=matchMedia("(pointer: coarse)").matches;
    const id=name=>document.getElementById(`pier-mayhem-${name}`),ui={panel:id("panel"),time:id("time"),score:id("score"),info:id("info"),fee:id("fee"),lesson:id("lesson"),more:id("more"),act:id("act"),done:id("done"),nav:document.querySelector(".pier-navigation")};
    const fact=BL.pierFacts.mayhem;ui.lesson.textContent=fact.line;id("detail").textContent=fact.detail;id("source").href=fact.source;id("source").textContent=fact.sourceTitle;
    const seat={x:q.play.x,y:layout.top+.7,z:q.play.z,ry:0,floor:layout.top,walkAt:{x:q.play.x,z:q.play.z},sitter:null,allowWeapons:false,lockMovement:true};
    const quiet=[hud.el.act,hud.el.hint,document.getElementById("joy-look")],hidden=new Array(quiet.length),stick=document.getElementById("joy-move");let stickHidden=false,actor=null,pending=0,paid=false,banked=0,revision=-1,seconds=-1,gateSeconds=-1,feeShown=-1,bumps=0,pickups=0,blocks=0;
    const near=()=>{const a=crew.player;return !!a&&!a.jet&&!a.camp.seat&&Math.abs(a.root.position.y-a.baseY-layout.top)<.15&&Math.hypot(a.root.position.x-q.play.x,a.root.position.z-q.play.z)<2;};
    const close=()=>{
      if(actor?.camp.seat===seat&&!crew.standPlayer(actor)){seat.walkAt.x=layout.spawn.x;seat.walkAt.z=layout.spawn.z;seat.floor=layout.spawn.y;if(!crew.standPlayer(actor))return false;seat.walkAt.x=q.play.x;seat.walkAt.z=q.play.z;seat.floor=layout.top;}
      if(ui.panel.contains(document.activeElement))document.activeElement.blur();const a=actor;actor=null;pending=0;sim.close();ui.panel.hidden=true;ui.more.open=false;roof.visible=true;if(!a)return true;ui.nav.hidden=false;for(let i=0;i<quiet.length;i++)quiet[i].hidden=hidden[i];stick.hidden=stickHidden;pilot.setExternalControl(false);pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);if(crew.player===a)pilot.navigate({position:{x:a.root.position.x,y:a.root.position.y-a.baseY,z:a.root.position.z},yaw:0,pitch:.28,dist:6});pilot.showAct();return true;
    };
    const refresh=()=>{revision=state.revision;const driving=state.phase==="driving",result=state.phase==="result";ui.panel.dataset.phase=state.phase;ui.act.disabled=!!pending;ui.act.textContent=pending?"Boarding…":driving?"Brake · Space":result?"Ride again":"Start · 75s";ui.lesson.hidden=ui.more.hidden=driving;ui.score.textContent=`${state.admissions} admissions · ${state.tickets} tickets banked`;ui.info.textContent=driving?(state.event==="admitted"?"You made the block! New transaction, new fee boosts.":state.event==="waiting"?"A higher-fee car got the slot. Boost your fee or clear the queue.":touch?"Left stick drives · tokens add fees · wait past the yellow line":"WASD / arrows drive · tokens add fees · wait past the yellow line"):result?`Round complete · +${state.tickets} tickets banked · best ${game.state.pier.mayhem} tickets.`:"Collect fee boosts, then wait past the yellow line. The highest-fee queued car gets one slot every 10 seconds.";};
    const act=()=>{
      if(!actor){if(!near())return false;const a=crew.player;if(a.hopV>0){hud.toast("Land on the Mempool Mayhem pad first");return true;}document.activeElement.blur();actor=a;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();pilot.navigate({position:{x:q.play.x,y:layout.top,z:q.play.z},yaw:0,pitch:.28,dist:6});pilot.setActive(false);pilot.setExternalControl(true);camera.position.x=q.x;camera.position.y=layout.top+(touch?44:26);camera.position.z=q.z+(touch?22:20);camera.target.x=q.x;camera.target.y=layout.top+.7;camera.target.z=q.z-1.5;camera.up=null;for(let i=0;i<quiet.length;i++){hidden[i]=quiet[i].hidden;quiet[i].hidden=true;}stickHidden=stick.hidden;stick.hidden=true;ui.nav.hidden=true;ui.panel.hidden=false;roof.visible=false;sim.reset();seconds=gateSeconds=feeShown=-1;refresh();return true;}
      if(pending)return true;if(state.phase==="intro"||state.phase==="result"){if(actor.camp.seat===seat)crew.standPlayer(actor);pilot.controls.reset();pending=.75;paid=false;banked=0;refresh();}else sim.brake();return true;
    };
    const pose=()=>{
      for(let i=0;i<COUNT;i++){const c=state.cars[i],n=models.cars[i];n.position.x=q.x+c.x;n.position.y=layout.top+.16;n.position.z=q.z+c.z;n.rotation.y=c.yaw;models.labels[i].geometry=fee[c.fee-1]();models.labels[i].rotation.y=-c.yaw;}
      for(let i=0;i<state.boosts.length;i++){const b=state.boosts[i],n=models.boosts[i];n.visible=b.active&&state.phase==="driving";n.position.x=q.x+b.x;n.position.z=q.z+b.z;n.position.y=layout.top+.5+Math.sin(state.elapsed*3+i)*.08;n.rotation.y=state.elapsed;}
      models.gate.position.y=layout.top+1.45+(state.blocks&&state.elapsed%INTERVAL<1.5?1:0);
      if(actor?.camp.seat===seat){const c=state.cars[0];seat.x=q.x+c.x;seat.y=layout.top+.16+.82;seat.z=q.z+c.z;seat.ry=c.yaw+Math.PI;actor.root.position.x=seat.x;actor.root.position.y=seat.y+actor.traits.height*.08;actor.root.position.z=seat.z;actor.root.rotation.y=seat.ry;actor.root.quaternion=null;actor.hop=actor.hopV=0;}
    };
    const update=dt=>{
      if(!actor)return;if(crew.player!==actor){close();return;}crew.steer(0,0,0,0,0);
      if(pending){pending-=dt;if(crew.sitPlayer(seat)){pending=0;sim.start();bumps=pickups=blocks=0;stick.hidden=!touch;refresh();}else if(pending<=0){close();hud.toast("Stand on the boarding pad to drive");return;}}
      const axes=pilot.controls.read();sim.update(dt,axes.x,axes.y);pose();
      if(state.bumps!==bumps){bumps=state.bumps;sound.cue("bump");for(let i=0;i<4;i++)fx.spawnParticle(spark(),q.x+state.bumpX,layout.top+.7,q.z+state.bumpZ,(i%2?.5:-.5),1,(i<2?.5:-.5),.35,0,BL.pilot.WALK.gravity,layout.top);}
      if(state.pickups!==pickups){pickups=state.pickups;sound.cue("boost");}
      if(state.blocks!==blocks){blocks=state.blocks;if(state.lastWinner===0){sound.cue("win");hud.toast("Next block! +6 tickets banked");}}
      if(state.tickets>banked){game.addTickets(state.tickets-banked);banked=state.tickets;}if(state.phase==="result"&&!paid){paid=true;const best=game.recordPierMayhem(state.tickets);sound.cue(best?"best":"win");if(best)hud.hint("New best!",2500);pilot.controls.reset();stick.hidden=true;hud.toast(`Mempool Mayhem · +${state.tickets} tickets saved`);}
      if(revision!==state.revision)refresh();const time=Math.ceil(state.remaining),gate=Math.max(0,Math.min(INTERVAL,Math.ceil(state.next-state.elapsed))),feeNow=state.cars[0].fee;
      if(time!==seconds){seconds=time;ui.time.textContent=TIMES[time];}if(gate!==gateSeconds||feeNow!==feeShown){gateSeconds=gate;feeShown=feeNow;ui.fee.textContent=state.phase==="driving"?`Your fee ${feeNow} · ${state.next<SECONDS?GATES[gate]+" · 1 slot":"Final block closed"}`:"6 tickets per admission · finish the round to bank";}
    };
    const onKey=e=>{if(!actor)return false;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();return true;}if(e.key==="Tab"||e.key==="Enter"&&e.target.closest?.("button, a, summary"))return true;if(state.phase==="driving"&&/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/i.test(e.key))return true;e.preventDefault();e.stopImmediatePropagation();if((e.key===" "||e.key==="Enter")&&!e.repeat&&!e.metaKey&&!e.ctrlKey&&!e.altKey)act();return true;};
    const onPanelKey=e=>{if(e.key===" "&&e.target.closest("button")){e.stopPropagation();if(e.repeat)e.preventDefault();}};
    ui.panel.addEventListener("keydown",onPanelKey);ui.act.addEventListener("click",act);ui.done.addEventListener("click",close);pose();
    return {act,close,near,onKey,update,state,ownsSeat:s=>s===seat,unlock:sound.unlock,setMuted:sound.setMuted,get busy(){return !!actor;},get audioRunning(){return sound.running;},dispose:()=>{close();ui.panel.removeEventListener("keydown",onPanelKey);ui.act.removeEventListener("click",act);ui.done.removeEventListener("click",close);seat.sitter=null;sound.dispose();}};
  };
  BL.pierMayhem={createRound,build,create,SECONDS,MAX_TICKETS:42};
})();
