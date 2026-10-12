// Double-Spend Whack: pooled transactions and a toy spent-output ledger at Playland's porch.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,S=BL.scene,SECONDS=75,INTERVAL=2.5,WAVES=30,MAX_SCORE=120;
  const COINS=["A","B","C","D","E","F"];
  const createRound=(random=n=>BL.math.randomInt(n))=>{
    const cells=Array.from({length:9},()=>({coin:-1,active:false,verdict:""})),coins=new Uint8Array(6),slots=new Uint8Array(9);
    const state={phase:"idle",elapsed:0,remaining:SECONDS,next:INTERVAL,wave:0,spent:0,selected:4,score:0,tickets:0,rejected:0,wrong:0,missed:0,allowed:0,event:"",revision:0,cells};
    const changed=event=>{state.event=event;state.revision++;};
    const clear=()=>{for(const c of cells){c.coin=-1;c.active=false;c.verdict="";}};
    const shuffle=a=>{for(let i=0;i<a.length;i++)a[i]=i;for(let i=a.length-1;i>0;i--){const j=random(i+1),n=a[i];a[i]=a[j];a[j]=n;}};
    const spawn=()=>{clear();shuffle(coins);shuffle(slots);state.spent=(1<<coins[0])|(1<<coins[1])|(1<<coins[2]);const third=random(4);for(let i=0;i<3;i++){const c=cells[slots[i]];c.coin=coins[i===0?0:i===1?3:third<2?third+1:third+2];c.active=true;}state.wave++;state.next=state.wave*INTERVAL;changed("wave");};
    const reset=()=>{state.phase="intro";state.elapsed=state.wave=state.spent=state.score=state.tickets=state.rejected=state.wrong=state.missed=state.allowed=0;state.remaining=SECONDS;state.next=INTERVAL;state.selected=4;clear();changed("intro");};
    const start=()=>{if(state.phase!=="intro"&&state.phase!=="result")return false;reset();state.phase="ready";spawn();return true;};
    const select=i=>{if(state.phase!=="ready"||!Number.isInteger(i)||i<0||i>=cells.length)return false;state.selected=i;changed("select");return true;};
    const move=(dx,dy)=>select(Math.max(0,Math.min(2,state.selected%3+dx))+Math.max(0,Math.min(2,Math.floor(state.selected/3)+dy))*3);
    const whack=()=>{if(state.phase!=="ready")return false;const c=cells[state.selected];if(!c.active){changed("empty");return false;}c.active=false;const bad=!!(state.spent&(1<<c.coin));c.verdict=bad?"rejected":"wrong";if(bad){state.rejected++;state.score+=2;}else {state.wrong++;state.score=Math.max(0,state.score-2);}state.tickets=Math.floor(state.score/3);changed(c.verdict);return true;};
    const settle=()=>{for(const c of cells)if(c.active){c.active=false;if(state.spent&(1<<c.coin)){c.verdict="missed";state.missed++;state.score=Math.max(0,state.score-1);}else {c.verdict="allowed";state.allowed++;}}state.tickets=Math.floor(state.score/3);};
    const update=dt=>{if(state.phase!=="ready"||!Number.isFinite(dt)||dt<=0)return;const end=Math.min(SECONDS,state.elapsed+dt);while(state.next<=end+1e-9){state.elapsed=state.next;settle();if(state.wave===WAVES){state.elapsed=SECONDS;state.remaining=0;state.phase="result";changed("result");return;}spawn();}state.elapsed=end;state.remaining=SECONDS-end;};
    const close=()=>{state.phase="idle";clear();changed("close");};
    return {state,reset,start,select,move,whack,update,close};
  };
  const PALETTE=["#6dcad1","#f7931a","#e77b9e"],tiles=COINS.map(letter=>PALETTE.map(color=>M.cached(()=>{
    const parts=[],glyph=BL.hubModels.SIGN_GLYPHS[letter],cell=.12;
    parts.push(M.bevelBox({w:.66,h:.78,d:.2,color}));
    for(let row=0;row<5;row++)for(let col=0;col<3;col++){const x=(col-1)*cell,y=(2-row)*cell;parts.push(M.box({w:cell,h:cell,d:.035,color,offset:{x,y,z:.116}}));if(glyph[row][col]==="1")parts.push(M.box({w:cell*.9,h:cell*.9,d:.03,color:"#173840",offset:{x,y,z:.15}}));}
    return M.merge(...parts);
  })));
  const spark=M.cached(()=>{const g=M.box({w:.055,h:.055,d:.055,color:"#ffe0a0"});g.castShadow=false;return g;});
  // Short backing faces keep the Canvas painter from covering raised targets or lettering.
  // Copy cached signs before subdivision; other storefronts share the original geometry.
  const smallFaces=(source,size=.5)=>{
    const g={...source,verts:source.verts.slice(),faces:[]};
    for(const f of source.faces){
      if(f.i.length!==4){g.faces.push(f);continue;}const a=f.i[0]*3,b=f.i[1]*3,d=f.i[3]*3,v=source.verts;
      const nx=Math.ceil(Math.hypot(v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2])/size),ny=Math.ceil(Math.hypot(v[d]-v[a],v[d+1]-v[a+1],v[d+2]-v[a+2])/size);
      if(nx<=1&&ny<=1){g.faces.push(f);continue;}
      for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const start=g.verts.length/3;for(const [u,t] of [[x/nx,y/ny],[(x+1)/nx,y/ny],[(x+1)/nx,(y+1)/ny],[x/nx,(y+1)/ny]])for(let k=0;k<3;k++)g.verts.push(v[a+k]+(v[b+k]-v[a+k])*u+(v[d+k]-v[a+k])*t);g.faces.push({...f,i:[start,start+1,start+2,start+3]});}
    }return g;
  };
  const build=layout=>{
    const q=layout.whack,root=S.createNode(),solid=S.createNode();S.addChild(root,solid);
    const box=(w,h,d,x,y,z,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
    const parts=[box(3.65,.32,2.65,0,.84,0,"#287b86"),box(3.5,.08,2.5,0,1.04,0,"#193e49"),box(3.65,.15,.12,0,.75,1.3,"#f7931a")];
    for(const x of [-1.55,1.55])for(const z of [-1.05,1.05])parts.push(M.beam(x,0,z,x,.75,z,.18,"#d3a974"));
    for(const x of [-1.5,1.5])parts.push(M.beam(x,1,-.95,x,2.45,-.95,.08,"#d3a974"));
    const base=S.createNode({geometry:M.merge(...parts.map(g=>smallFaces(g))),position:{x:q.x,y:q.floor,z:q.z},rotation:{x:0,y:Math.PI/2,z:0}});S.addChild(solid,base);
    const sign=smallFaces(BL.pierDetails.shopSign("DOUBLE SPEND",5),.15);S.addChild(root,S.createNode({geometry:sign,position:{x:q.x-.95,y:q.floor+2.45,z:q.z},rotation:{x:0,y:Math.PI/2,z:0},scale:{x:.85,y:.75,z:.5}}));
    const targets=[],rims=[];
    for(let i=0;i<9;i++){const x=(i%3-1)*1.05,z=(Math.floor(i/3)-1)*.8;
      rims.push(M.moved(M.torus(.38,.04,"#e6bc65",0,16,5),x,1.12,z));
      const n=S.createNode({geometry:tiles[0][0](),visible:false,position:{x:q.x+z,y:q.floor+1.52,z:q.z-x},rotation:{x:0,y:Math.PI/2,z:0}});S.addChild(root,n);targets.push(n);
    }
    S.addChild(root,S.createNode({geometry:M.merge(...rims),position:{x:q.x,y:q.floor,z:q.z},rotation:{x:0,y:Math.PI/2,z:0}}));
    const marker=S.createNode({geometry:M.torus(.44,.035,"#fff0b1",0,16,5),visible:false});S.addChild(root,marker);
    const mallet=S.createNode({geometry:M.merge(M.beam(0,0,0,0,.7,0,.065,"#d5ae78"),box(.6,.3,.3,0,.72,0,"#f7931a")),visible:false});S.addChild(root,mallet);
    S.addChild(root,S.createNode({geometry:M.box({w:1.6,h:.012,d:1.6,color:"#eac66f"}),position:{x:q.play.x,y:q.floor+.01,z:q.play.z}}));
    for(const variants of tiles)for(const cached of variants)cached();spark();return {root,solid,targets,marker,mallet};
  };
  const audio=()=>{
    let ctx=null,master=null,muted=false;const voices=[];try{muted=localStorage.getItem("oogaboogaland.audio")==="off";}catch{}
    const volume=()=>{if(master)master.gain.setTargetAtTime(muted||document.hidden?0:.16,ctx.currentTime,.025);};
    const unlock=e=>{if(!e?.isTrusted)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);for(let i=0;i<3;i++){const tone=ctx.createOscillator(),gain=ctx.createGain();tone.type="triangle";gain.gain.value=0;tone.connect(gain);gain.connect(master);tone.start();voices.push({tone,gain});}volume();}if(ctx.state==="suspended")ctx.resume().catch(()=>{});};
    const cue=event=>{if(!ctx||muted||document.hidden)return;const now=ctx.currentTime;for(let i=0;i<voices.length;i++){const v=voices[i],t=now+(event==="win"?i*.1:0);v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(0,now);v.tone.frequency.setValueAtTime(event==="win"?[523,659,784][i]:event==="rejected"?440*(i+1):110,t);v.gain.gain.linearRampToValueAtTime(i&&event!=="win"?.02:.1,t+.01);v.gain.gain.exponentialRampToValueAtTime(.0001,t+(event==="win"?.35:.13));}};
    document.addEventListener("visibilitychange",volume);return {unlock,cue,get running(){return ctx?.state==="running";},get muted(){return muted;},setMuted:value=>{muted=!!value;volume();},dispose:()=>{document.removeEventListener("visibilitychange",volume);for(const v of voices)v.tone.stop();voices.length=0;if(ctx)ctx.close().catch(()=>{});ctx=master=null;}};
  };
  const TIMES=Array.from({length:SECONDS+1},(_,i)=>`${i}s`),LABELS=COINS.map(c=>`Spend ${c}`);
  const create=({models,layout,camera,crew,pilot,hud,fx,game})=>{
    const q=layout.whack,sim=createRound(),state=sim.state,sound=audio(),touch=matchMedia("(pointer: coarse)").matches;
    const id=name=>document.getElementById(`pier-whack-${name}`),ui={panel:id("panel"),time:id("time"),score:id("score"),info:id("info"),ledger:id("ledger"),grid:id("grid"),lesson:id("lesson"),more:id("more"),act:id("act"),done:id("done"),play:id("play"),nav:document.querySelector(".pier-navigation")};
    const fact=BL.pierFacts.whack;ui.lesson.textContent=fact.line;id("detail").textContent=fact.detail;id("source").href=fact.source;id("source").textContent=fact.sourceTitle;
    const buttons=[],quiet=[hud.el.act,hud.el.hint,document.getElementById("joy-move"),document.getElementById("joy-look"),document.getElementById("equipment-hud")],hidden=new Array(quiet.length);
    for(let i=0;i<9;i++){const b=document.createElement("button");b.type="button";b.id=`pier-whack-cell-${i}`;b.dataset.cell=String(i);ui.grid.append(b);buttons.push(b);}
    let actor=null,paid=false,revision=-1,seconds=-1,strike=0;
    const near=()=>{const a=crew.player;return !!a&&!a.jet&&!a.camp.seat&&Math.abs(a.root.position.y-a.baseY-q.floor)<.15&&Math.hypot(a.root.position.x-q.play.x,a.root.position.z-q.play.z)<2;};
    const close=()=>{if(ui.panel.contains(document.activeElement))document.activeElement.blur();const a=actor;actor=null;sim.close();ui.panel.hidden=true;ui.more.open=false;for(const n of models.targets)n.visible=false;models.marker.visible=models.mallet.visible=false;strike=0;if(!a)return;ui.nav.hidden=false;for(let i=0;i<quiet.length;i++)quiet[i].hidden=hidden[i];pilot.setExternalControl(false);pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);if(crew.player===a)pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:Math.PI/2,pitch:.28,dist:6});pilot.showAct();};
    const refresh=()=>{
      revision=state.revision;const playing=state.phase==="ready",result=state.phase==="result";ui.panel.dataset.phase=state.phase;ui.play.hidden=!playing;ui.lesson.hidden=ui.more.hidden=playing;ui.act.textContent=playing?(touch?"Whack selected":"Whack · Space"):result?"Play again":"Start · 75s";
      ui.score.textContent=`${state.score} points · ${state.tickets} tickets ${result?"saved":"pending"}`;
      ui.info.textContent=playing?(state.event==="wrong"?"That coin was unspent. Let valid transactions pass. −2 points.":state.event==="rejected"?"Already spent! Rejected. +2 points.":state.event==="empty"?"Empty slot. Watch for the next transactions.":touch?"Tap a transaction using a spent coin to whack it.":"Arrows / WASD select · Space whacks · 1–9 select"):result?`${state.rejected} rejected · ${state.wrong} wrong · ${state.missed} missed · best ${game.state.pier.whack} points.`:"Check the ledger. Whack repeat spends; leave unspent coins alone. Each wave lasts 2.5 seconds.";
      ui.ledger.textContent=`Spent coins: ${COINS.filter((_,i)=>state.spent&(1<<i)).join(" · ")} · wave ${state.wave}/30`;
      for(let i=0;i<9;i++){const c=state.cells[i],b=buttons[i],n=models.targets[i];b.textContent=c.active?LABELS[c.coin]:c.verdict==="rejected"?"Rejected":c.verdict==="wrong"?"Unspent!":"—";b.dataset.verdict=c.verdict;b.setAttribute("aria-pressed",String(state.selected===i));b.setAttribute("aria-label",`Slot ${i+1}: ${c.active?LABELS[c.coin]:c.verdict||"empty"}`);n.visible=playing&&c.coin>=0;if(n.visible)n.geometry=tiles[c.coin][c.verdict==="rejected"?1:c.verdict==="wrong"?2:0]();}
      models.marker.visible=playing;const selected=models.targets[state.selected];models.marker.position.x=selected.position.x;models.marker.position.y=q.floor+1.16;models.marker.position.z=selected.position.z;
    };
    const whack=()=>{strike=.22;if(sim.whack()){sound.cue(state.event);if(state.event==="rejected"){const n=models.targets[state.selected];for(let i=0;i<6;i++){const a=i*Math.PI/3;fx.spawnParticle(spark(),n.position.x,q.floor+1.7,n.position.z,Math.cos(a)*.6,1.1,Math.sin(a)*.6,.4,0,BL.pilot.WALK.gravity,q.floor);}}}else sound.cue("empty");refresh();};
    const act=()=>{
      if(!actor){if(!near())return false;const a=crew.player;if(a.hopV>0){hud.toast("Land on the Playland pad first");return true;}document.activeElement.blur();actor=a;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:Math.PI/2,pitch:.28,dist:6});pilot.setActive(false);pilot.setExternalControl(true);camera.position.x=q.x+7;camera.position.y=q.floor+6;camera.position.z=q.z+3.5;camera.target.x=q.x;camera.target.y=q.floor+1;camera.target.z=q.z;camera.up=null;for(let i=0;i<quiet.length;i++){hidden[i]=quiet[i].hidden;quiet[i].hidden=true;}ui.nav.hidden=true;ui.panel.hidden=false;ui.more.open=false;sim.reset();seconds=-1;refresh();return true;}
      if(state.phase==="intro"||state.phase==="result"){paid=false;sim.start();refresh();}else whack();return true;
    };
    const onKey=e=>{if(!actor)return false;if(e.metaKey||e.ctrlKey||e.altKey)return true;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();return true;}if(e.key==="Tab"||e.key==="Enter"&&e.target.closest?.("button, a, summary"))return true;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return true;const key=e.key.toLowerCase();if(key===" "||key==="enter")act();else if(/^[1-9]$/.test(key)){sim.select(Number(key)-1);refresh();}else if(key==="arrowleft"||key==="a"){sim.move(-1,0);refresh();}else if(key==="arrowright"||key==="d"){sim.move(1,0);refresh();}else if(key==="arrowup"||key==="w"){sim.move(0,-1);refresh();}else if(key==="arrowdown"||key==="s"){sim.move(0,1);refresh();}return true;};
    const onPanelKey=e=>{if(e.key===" "&&e.target.closest("button")){e.stopPropagation();if(e.repeat)e.preventDefault();}};
    const onGrid=e=>{const b=e.target.closest("[data-cell]");if(b&&sim.select(Number(b.dataset.cell)))whack();};
    ui.panel.addEventListener("keydown",onPanelKey);ui.grid.addEventListener("click",onGrid);ui.act.addEventListener("click",act);ui.done.addEventListener("click",close);
    const update=dt=>{if(!actor)return;if(crew.player!==actor){close();return;}crew.steer(0,0,0,0,0);sim.update(dt);if(state.phase==="result"&&!paid){paid=true;game.addTickets(state.tickets);game.recordPierWhack(state.score);sound.cue("win");hud.toast(`Double-Spend Whack · +${state.tickets} tickets saved`);}if(revision!==state.revision)refresh();const time=Math.ceil(state.remaining);if(time!==seconds){seconds=time;ui.time.textContent=TIMES[time];}for(let i=0;i<9;i++)models.targets[i].position.y=q.floor+(state.cells[i].active?1.52+Math.sin(state.elapsed*6+i)*.06:1.18);strike=Math.max(0,strike-dt);models.mallet.visible=strike>0;const p=models.targets[state.selected].position;models.mallet.position.x=p.x+.35;models.mallet.position.z=p.z;models.mallet.position.y=q.floor+1.7;models.mallet.rotation.z=-.9+Math.sin(strike/.22*Math.PI)*1.5;};
    return {act,close,near,onKey,update,state,unlock:sound.unlock,setMuted:sound.setMuted,get audioRunning(){return sound.running;},get muted(){return sound.muted;},get busy(){return !!actor;},dispose:()=>{close();ui.panel.removeEventListener("keydown",onPanelKey);ui.grid.removeEventListener("click",onGrid);ui.act.removeEventListener("click",act);ui.done.removeEventListener("click",close);ui.grid.replaceChildren();sound.dispose();}};
  };
  BL.pierWhack={build,create,createRound,SECONDS,MAX_SCORE};
})();
