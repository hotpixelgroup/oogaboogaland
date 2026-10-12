// Hash Fishing makes the proof-of-work target tangible through short, repeatable casts.
// One bounded round and pooled tackle reuse the pier's tickets, controls and DSB ocean.
(() => {
  "use strict";
  const BL=window.BL,SECONDS=75,CAST=1.6,REEL=.9,INTERVAL=3,PACE=8,MAX=4294967295,TICKET=5;
  const createRound=(random=()=>BL.math.randomInt(4294967296))=>{
    const state={phase:"idle",elapsed:0,remaining:SECONDS,age:0,casts:0,catches:0,score:0,hash:0,target:Math.floor(MAX*.32),castTarget:0,hit:false,retargets:0,direction:"",revision:0};
    let pending=false,windowStart=0;
    const phase=name=>{state.phase=name;state.age=0;state.revision++;};
    const reset=()=>{state.elapsed=state.age=state.casts=state.catches=state.score=state.hash=state.retargets=0;state.remaining=SECONDS;state.target=Math.floor(MAX*.32);state.castTarget=state.target;state.hit=pending=false;state.direction="";windowStart=0;phase("intro");};
    const start=()=>{if(state.phase!=="intro"&&state.phase!=="result")return false;reset();phase("ready");return true;};
    const cast=()=>{if(state.phase!=="ready"||state.remaining<=0)return false;state.hash=random()>>>0;state.castTarget=state.target;pending=state.hash<=state.castTarget;state.hit=false;state.casts++;phase("cast");return true;};
    const update=dt=>{
      if(!Number.isFinite(dt)||dt<=0)return;
      while(dt>1e-9&&state.phase!=="idle"&&state.phase!=="intro"&&state.phase!=="result"){
        const duration=state.phase==="cast"?CAST:state.phase==="reel"?REEL:Infinity;
        const step=Math.min(dt,state.remaining,duration-state.age);state.elapsed+=step;state.remaining=Math.max(0,SECONDS-state.elapsed);state.age+=step;dt-=step;
        // A cast unresolved at the deadline never becomes a late catch or a second payout.
        if(state.remaining<1e-9){state.elapsed=SECONDS;state.remaining=0;phase("result");break;}
        if(state.age+1e-9<duration)break;
        if(state.phase==="cast"){
          state.hit=pending;
          if(pending){state.catches++;state.score+=TICKET;
            if(state.catches%INTERVAL===0){const before=state.target,ratio=Math.max(.25,Math.min(4,(state.elapsed-windowStart)/(INTERVAL*PACE)));
              state.target=Math.floor(Math.max(MAX*.08,Math.min(MAX*.8,before*ratio)));state.direction=state.target<before?"harder":state.target>before?"easier":"steady";state.retargets++;windowStart=state.elapsed;
            }
          }
          phase("reel");
        }else phase("ready");
      }
    };
    const close=()=>phase("idle");
    return {state,reset,start,cast,update,close};
  };
  const audio=()=>{
    let ctx=null,master=null,muted=false;const voices=[];
    try{muted=localStorage.getItem("oogaboogaland.audio")==="off";}catch{}
    const volume=()=>{if(master)master.gain.setTargetAtTime(muted||document.hidden?0:.2,ctx.currentTime,.025);};
    const unlock=e=>{if(!e?.isTrusted)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
        for(let i=0;i<3;i++){const tone=ctx.createOscillator(),gain=ctx.createGain();tone.type=i?"sine":"triangle";gain.gain.value=0;tone.connect(gain);gain.connect(master);tone.start();voices.push({tone,gain});}volume();
      }if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    };
    const cue=name=>{if(!ctx||muted||document.hidden)return;const now=ctx.currentTime;
      for(let i=0;i<voices.length;i++){const v=voices[i],t=now+(name==="win"?i*.13:0),f=name==="win"?[523.25,659.25,783.99][i]:name==="catch"?440*(i+1):name==="cast"?220:160;
        v.tone.frequency.cancelScheduledValues(now);v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(0,now);v.tone.frequency.setValueAtTime(f,t);v.tone.frequency.exponentialRampToValueAtTime(name==="cast"?80:f*1.1,t+.15);v.gain.gain.linearRampToValueAtTime(i&&name!=="win"?.035:.12,t+.015);v.gain.gain.exponentialRampToValueAtTime(.0001,t+(name==="win"?.38:.22));
      }
    };
    document.addEventListener("visibilitychange",volume);
    return {unlock,cue,setMuted:value=>{muted=!!value;volume();},dispose:()=>{document.removeEventListener("visibilitychange",volume);for(const v of voices)v.tone.stop();voices.length=0;if(ctx)ctx.close().catch(()=>{});ctx=master=null;}};
  };
  const M=BL.models,S=BL.scene;
  const rod=M.cached(()=>M.merge(M.beam(0,0,0,0,1.8,-2.2,.055,"#b58252"),M.moved(M.turnedX(M.torus(.15,.035,"#e4c78a",0,12,5),Math.PI/2),.08,.12,-.14)));
  const bob=M.cached(()=>M.merge(M.lathe({profile:[[0,-.15],[.12,-.08],[.12,.08],[0,.18]],segments:10,color:"#f7931a"}),M.moved(M.box({w:.035,h:.3,d:.035,color:"#fff0d4"}),0,.22,0)));
  const fish=M.cached(()=>M.merge(M.turnedZ(M.lathe({profile:[[0,-.4],[.17,-.18],[.18,.12],[.08,.3],[0,.36]],segments:10,color:"#65bfc1"}),Math.PI/2),M.moved(M.turnedZ(M.box({w:.24,h:.27,d:.035,color:"#f2bd50"}),Math.PI/4),.39,0,0),M.moved(M.box({w:.06,h:.06,d:.035,color:"#142d38"}),-.23,.055,.17)));
  const string=M.cached(()=>{const g=M.beam(0,0,0,0,0,1,.012,"#f5e7c9");g.castShadow=false;return g;});
  const splash=M.cached(()=>{const g=M.box({w:.05,h:.06,d:.05,color:"#c8e7dd"});g.castShadow=false;return g;});
  const build=layout=>{
    const q=layout.fishing,root=S.createNode(),solid=S.createNode(),tackle=S.createNode({visible:false,position:{x:q.play.x,y:layout.top,z:q.play.z},rotation:{x:0,y:q.ry,z:0}});S.addChild(root,solid);S.addChild(root,tackle);
    const sign=S.createNode({geometry:BL.hubModels.postSign("HASH FISHING",.36,1.3),position:{x:q.sign.x,y:layout.top,z:q.sign.z},rotation:{x:0,y:q.ry,z:0}});S.addChild(solid,sign);
    S.addChild(root,S.createNode({geometry:M.box({w:1.8,h:.015,d:1.8,color:"#eac66f"}),position:{x:q.play.x,y:layout.top+.01,z:q.play.z}}));
    const pole=S.createNode({geometry:rod(),position:{x:0,y:1.1,z:.15}}),float=S.createNode({geometry:bob()}),line=S.createNode({geometry:string()}),catchNode=S.createNode({geometry:fish(),visible:false});S.addChild(tackle,pole);S.addChild(tackle,float);S.addChild(tackle,line);S.addChild(tackle,catchNode);
    const basket=S.createNode({geometry:M.merge(M.moved(M.bevelBox({w:1,h:.18,d:.7,color:"#b99164"}),.75,.12,.7),M.moved(M.box({w:1,h:.35,d:.07,color:"#d2ac78"}),.75,.3,1.02))});S.addChild(tackle,basket);
    const haul=[];for(let i=0;i<3;i++){const n=S.createNode({geometry:fish(),visible:false,position:{x:.75,y:.25+i*.1,z:.7},rotation:{x:0,y:i*.3,z:0}});S.addChild(tackle,n);haul.push(n);}
    return {root,solid,tackle,pole,float,line,catchNode,haul};
  };
  const TIMES=Array.from({length:SECONDS+1},(_,i)=>`${i}s remaining`);
  const create=({models,layout,water,camera,crew,pilot,hud,fx,game})=>{
    const q=layout.fishing,sim=createRound(),state=sim.state,sound=audio(),sin=Math.sin(q.ry),cos=Math.cos(q.ry),G=BL.pilot.WALK.gravity;
    const ui={nav:document.querySelector(".pier-navigation"),panel:document.getElementById("pier-fishing-panel"),score:document.getElementById("pier-fishing-score"),time:document.getElementById("pier-fishing-time"),info:document.getElementById("pier-fishing-info"),hash:document.getElementById("pier-fishing-hash"),target:document.getElementById("pier-fishing-target"),lesson:document.getElementById("pier-fishing-lesson"),detail:document.getElementById("pier-fishing-more"),source:document.getElementById("pier-fishing-source"),act:document.getElementById("pier-fishing-act"),done:document.getElementById("pier-fishing-done")};
    const fact=BL.pierFacts.fishing;ui.lesson.textContent=fact.line;document.getElementById("pier-fishing-detail").textContent=fact.detail;ui.source.href=fact.source;ui.source.textContent=fact.sourceTitle;
    let actor=null,paid=false,revision=-1,seconds=-1;const quiet=[hud.el.act,hud.el.hint,document.getElementById("joy-move"),document.getElementById("joy-look")],hidden=new Array(quiet.length);
    const near=()=>{const a=crew.player;return !!a&&!a.jet&&!a.camp.seat&&Math.abs(a.root.position.y-a.baseY-layout.top)<.15&&Math.hypot(a.root.position.x-q.play.x,a.root.position.z-q.play.z)<2;};
    const close=()=>{if(ui.panel.contains(document.activeElement))document.activeElement.blur();const a=actor;actor=null;sim.close();models.tackle.visible=false;ui.panel.hidden=true;ui.nav.hidden=false;ui.detail.open=false;pilot.setExternalControl(false);pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);if(a){for(let i=0;i<quiet.length;i++)quiet[i].hidden=hidden[i];if(crew.player===a)pilot.navigate({position:{x:a.root.position.x,y:a.root.position.y-a.baseY,z:a.root.position.z},yaw:q.ry,pitch:.28,dist:6});}pilot.showAct();};
    const refresh=()=>{
      revision=state.revision;ui.panel.dataset.phase=state.phase;ui.act.disabled=state.phase==="cast"||state.phase==="reel";ui.act.textContent=state.phase==="intro"?"Start · 75s":state.phase==="result"?"Fish again":state.phase==="ready"?"Cast · Space / tap":"Reeling…";
      ui.score.textContent=`${state.catches} catches · ${state.score} tickets ${state.phase==="result"?"saved":"pending"} · best ${game.state.pier.fishing}`;
      ui.hash.textContent=state.casts?`0x${state.hash.toString(16).padStart(8,"0")}`:"Cast to try a hash";ui.target.textContent=`Target ≤ 0x${state.target.toString(16).padStart(8,"0")}`;
      ui.lesson.hidden=ui.detail.hidden=state.phase!=="intro"&&state.phase!=="result";
      ui.info.textContent=state.phase==="intro"?"Cast, watch the bobber, and collect a fish when your hash meets the target.":state.phase==="result"?`Round complete · +${state.score} tickets banked at Tickets and Prizes.`:state.phase==="cast"?"Checking this cast against the target…":state.phase==="reel"?state.hit?`Fish caught! +5 pending tickets.${state.catches%INTERVAL===0?` Target adjusted ${state.direction}; aim for a catch every 8 seconds.`:""}`:"No catch — this hash was above the target.":"Space or tap casts again. The target adjusts after every three catches.";
    };
    const act=()=>{
      if(!actor){if(!near())return false;const a=crew.player;if(a.hopV>0){hud.toast("Land on the fishing pad first");return true;}document.activeElement.blur();actor=a;paid=false;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();pilot.navigate({position:{x:q.play.x,y:layout.top,z:q.play.z},yaw:q.ry,pitch:.28,dist:6});pilot.setActive(false);pilot.setExternalControl(true);const v=q.camera;camera.position.x=q.play.x+sin*v.back;camera.position.y=layout.top+v.height;camera.position.z=q.play.z+cos*v.back;camera.target.x=q.play.x-sin*v.look;camera.target.y=layout.top+.7;camera.target.z=q.play.z-cos*v.look;camera.up=null;for(let i=0;i<quiet.length;i++){hidden[i]=quiet[i].hidden;quiet[i].hidden=true;}sim.reset();ui.panel.hidden=false;ui.nav.hidden=true;models.tackle.visible=true;ui.detail.open=false;seconds=-1;refresh();return true;}
      if(state.phase==="intro"||state.phase==="result"){paid=false;sim.start();sound.cue("cast");refresh();return true;}
      if(sim.cast()){sound.cue("cast");refresh();}return true;
    };
    const onButtonKey=e=>{if(e.key===" "&&e.target.closest("button"))e.stopPropagation();};
    ui.panel.addEventListener("keydown",onButtonKey);ui.act.addEventListener("click",act);ui.done.addEventListener("click",close);
    const update=dt=>{
      if(!actor)return;if(crew.player!==actor){close();return;}crew.steer(0,0,0,0,0);const before=state.phase;sim.update(dt);
      if(before==="cast"&&state.phase==="reel"){
        const p=models.float.position,x=q.play.x+sin*p.z+cos*p.x,z=q.play.z+cos*p.z-sin*p.x;
        for(let i=0;i<8;i++){const a=i*Math.PI/4;fx.spawnParticle(splash(),x,water.heightAt(x,z)+.08,z,Math.cos(a)*.7,1.1,Math.sin(a)*.7,.5,0,G,layout.sea);}
        sound.cue(state.hit?"catch":"miss");
      }
      if(state.phase==="result"&&!paid){paid=true;game.addTickets(state.score);game.recordPierFishing(state.score);sound.cue("win");hud.toast(`Hash Fishing · +${state.score} tickets saved`);}
      if(revision!==state.revision)refresh();const time=Math.ceil(state.remaining);if(time!==seconds){seconds=time;ui.time.textContent=TIMES[time];}
      const p=models.float.position,age=state.age;let bend=0;
      if(state.phase==="cast"){
        const t=Math.min(1,age/1.1),end=layout.sea-layout.top+.12,vy=end-3+G/2;p.x=0;p.z=-2.2-(q.castDistance-2.2)*t;p.y=3+vy*t-G*t*t/2;bend=Math.sin(t*Math.PI)*-.45;
        if(age>1.1)p.y=water.heightAt(q.play.x+sin*p.z,q.play.z+cos*p.z)-layout.top+.12;
      }else if(state.phase==="reel"){
        const t=Math.min(1,age/REEL);p.x=.75*t;p.z=-q.castDistance+(q.castDistance+.7)*t;p.y=(layout.sea-layout.top+.12)*(1-t)+.35*t+Math.sin(t*Math.PI)*2.3;bend=Math.sin(t*Math.PI)*.3;
      }else {p.x=0;p.y=2.65;p.z=-1.9;}
      models.pole.rotation.x=bend;const ty=1.1+1.8*Math.cos(bend)+2.2*Math.sin(bend),tz=.15+1.8*Math.sin(bend)-2.2*Math.cos(bend);
      const dx=p.x,dy=p.y-ty,dz=p.z-tz,line=models.line;line.position.x=0;line.position.y=ty;line.position.z=tz;line.rotation.x=-Math.atan2(dy,Math.hypot(dx,dz));line.rotation.y=Math.atan2(dx,dz);line.scale.z=Math.hypot(dx,dy,dz);
      models.float.visible=state.phase!=="intro"&&state.phase!=="result";line.visible=models.float.visible;models.catchNode.visible=state.phase==="reel"&&state.hit;Object.assign(models.catchNode.position,p);models.catchNode.rotation.z=Math.sin(age*9)*.15;
      for(let i=0;i<models.haul.length;i++)models.haul[i].visible=i<state.catches;
    };
    return {act,close,near,update,state,unlock:sound.unlock,setMuted:sound.setMuted,get busy(){return !!actor;},dispose:()=>{close();ui.panel.removeEventListener("keydown",onButtonKey);ui.act.removeEventListener("click",act);ui.done.removeEventListener("click",close);sound.dispose();}};
  };
  BL.pierFishing={build,create,createRound,SECONDS,MAX_SCORE:150};
})();
