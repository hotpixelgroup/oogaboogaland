// Public toy cards teach ordered backups without collecting or generating wallet recovery words.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,S=BL.scene,SECONDS=75,MEMORIZE=12,COUNT=12;
  const WORDS=["OOGA","PIER","GULL","TIDE","KITE","SURF","CONE","PALM","WAVE","SAND","BOAT","GLOW"];
  const createRound=(random=n=>BL.math.randomInt(n))=>{
    const order=new Uint8Array(COUNT),cards=new Uint8Array(COUNT);
    const state={phase:"idle",elapsed:0,remaining:SECONDS,selected:0,held:-1,correct:0,score:0,tickets:0,swaps:0,event:"",revision:0,order,cards};
    const changed=event=>{state.event=event;state.revision++;};
    const shuffle=a=>{for(let i=COUNT-1;i>0;i--){const j=random(i+1),v=a[i];a[i]=a[j];a[j]=v;}};
    const reset=()=>{state.phase="intro";state.elapsed=state.correct=state.score=state.tickets=state.swaps=state.selected=0;state.remaining=SECONDS;state.held=-1;for(let i=0;i<COUNT;i++)order[i]=cards[i]=i;changed("intro");};
    const start=()=>{if(state.phase!=="intro"&&state.phase!=="result")return false;reset();shuffle(order);cards.set(order);state.phase="memorize";changed("memorize");return true;};
    const select=i=>{if(state.phase!=="recall"||!Number.isInteger(i)||i<0||i>=COUNT)return false;state.selected=i;changed("select");return true;};
    const move=(dx,dy)=>select(Math.max(0,Math.min(2,state.selected%3+dx))+Math.max(0,Math.min(3,Math.floor(state.selected/3)+dy))*3);
    const choose=()=>{if(state.phase!=="recall")return false;if(state.held<0){state.held=state.selected;changed("pick");}else {const h=state.held;state.held=-1;if(h===state.selected){changed("cancel");return true;}const v=cards[h];cards[h]=cards[state.selected];cards[state.selected]=v;state.swaps++;changed("swap");}return true;};
    const countCorrect=()=>{let n=0;for(let i=0;i<COUNT;i++)if(cards[i]===order[i])n++;return n;};
    const check=()=>{if(state.phase!=="recall")return false;state.correct=countCorrect();state.held=-1;if(state.correct===COUNT){state.phase="secured";state.score=COUNT;state.tickets=30;changed("secured");}else changed("check");return true;};
    const update=dt=>{if(state.phase!=="memorize"&&state.phase!=="recall"&&state.phase!=="secured"||!Number.isFinite(dt)||dt<=0)return;state.elapsed=Math.min(SECONDS,state.elapsed+dt);state.remaining=SECONDS-state.elapsed;if(state.phase==="memorize"&&state.elapsed>=MEMORIZE-1e-9){cards.set(order);shuffle(cards);let same=true;for(let i=0;i<COUNT;i++)if(cards[i]!==order[i])same=false;if(same){const v=cards[0];cards[0]=cards[1];cards[1]=v;}state.phase="recall";changed("recall");}if(state.elapsed>=SECONDS-1e-9){state.elapsed=SECONDS;state.remaining=0;state.correct=state.score=countCorrect();state.tickets=state.score*2+(state.score===COUNT?6:0);state.held=-1;state.phase="result";changed("result");}};
    const close=()=>{state.phase="idle";state.held=-1;changed("close");};
    return {state,reset,start,select,move,choose,check,update,close};
  };
  const smallFaces=(source,size)=>BL.pierDetails.smallFaces(source,size);
  const COLORS=["#f3dfb4","#80d4c1","#f7931a"];
  const cardGeometry=WORDS.map(word=>COLORS.map(color=>M.cached(()=>{
    const parts=[M.bevelBox({w:.88,h:.07,d:.38,color})],cell=.043;
    for(let i=0;i<word.length;i++){const glyph=BL.hubModels.SIGN_GLYPHS[word[i]];for(let y=0;y<5;y++)for(let x=0;x<3;x++)if(glyph[y][x]==="1")parts.push(M.box({w:cell*.9,h:.055,d:cell*.9,color:"#173840",offset:{x:(i*4+x-(word.length*4-2)/2)*cell,y:.0625,z:(y-2)*cell}}));}
    return smallFaces(M.merge(...parts),.09);
  })));
  const spark=M.cached(()=>{const g=M.box({w:.05,h:.05,d:.05,color:"#f7931a"});g.castShadow=false;return g;});
  const build=layout=>{
    const q=layout.seedMatch,root=S.createNode(),solid=S.createNode();S.addChild(root,solid);
    const parts=[];
    for(const x of [-.9,.9])for(const z of [-1.55,1.55])parts.push(M.beam(x,0,z,x,.85,z,.16,"#d3a974"));
    for(let x=0;x<5;x++)for(let z=0;z<7;z++)parts.push(M.moved(M.box({w:.48,h:.18,d:.5,color:"#287b86"}),(x-2)*.48,.9,(z-3)*.5));
    for(const z of [-1.6,1.6])parts.push(M.beam(-1.2,1,z,1.2,1,z,.08,"#e6bc65"));
    for(const z of [-1.5,1.5])parts.push(M.beam(-1.05,.9,z,-1.05,2.3,z,.08,"#d3a974"));
    S.addChild(solid,S.createNode({geometry:M.merge(...parts),position:{x:q.x,y:q.floor,z:q.z}}));
    S.addChild(root,S.createNode({geometry:smallFaces(BL.pierDetails.shopSign("SEED MATCH",6),.15),position:{x:q.x-1.05,y:q.floor+2.3,z:q.z},rotation:{x:0,y:Math.PI/2,z:0},scale:{x:.72,y:.65,z:.45}}));
    const cards=[];for(let i=0;i<COUNT;i++){const n=S.createNode({geometry:cardGeometry[i][0](),position:{x:q.x+(Math.floor(i/3)-1.5)*.49,y:q.floor+1.045,z:q.z-(i%3-1)*1.04},rotation:{x:0,y:Math.PI/2,z:0}});S.addChild(root,n);cards.push(n);}
    const marker=S.createNode({geometry:M.torus(.44,.025,"#fff0b1",0,16,5),visible:false});S.addChild(root,marker);
    S.addChild(root,S.createNode({geometry:M.box({w:1.6,h:.012,d:1.6,color:"#eac66f"}),position:{x:q.play.x,y:q.floor+.01,z:q.play.z}}));
    for(const variants of cardGeometry)for(const cached of variants)cached();spark();return {root,solid,cards,marker};
  };
  const audio=()=>{
    let ctx=null,master=null,muted=false;const voices=[];try{muted=localStorage.getItem("oogaboogaland.audio")==="off";}catch{}
    const volume=()=>{if(master)master.gain.setTargetAtTime(muted||document.hidden?0:.12,ctx.currentTime,.025);};
    const unlock=e=>{if(!e?.isTrusted)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);for(let i=0;i<3;i++){const tone=ctx.createOscillator(),gain=ctx.createGain();tone.type="triangle";gain.gain.value=0;tone.connect(gain);gain.connect(master);tone.start();voices.push({tone,gain});}volume();}if(ctx.state==="suspended")ctx.resume().catch(()=>{});};
    const cue=event=>{if(!ctx||muted||document.hidden)return;const now=ctx.currentTime,win=event==="win";for(let i=0;i<voices.length;i++){const v=voices[i],t=now+(win?i*.1:0);v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(0,now);v.tone.frequency.setValueAtTime(win?[523,659,784][i]:event==="swap"?440:220,t);v.gain.gain.linearRampToValueAtTime(i&&!win?.02:.1,t+.01);v.gain.gain.exponentialRampToValueAtTime(.0001,t+(win?.35:.12));}};
    document.addEventListener("visibilitychange",volume);return {unlock,cue,get running(){return ctx?.state==="running";},get muted(){return muted;},setMuted:value=>{muted=!!value;volume();},dispose:()=>{document.removeEventListener("visibilitychange",volume);for(const v of voices)v.tone.stop();voices.length=0;if(ctx)ctx.close().catch(()=>{});ctx=master=null;}};
  };
  const TIMES=Array.from({length:SECONDS+1},(_,i)=>`${i}s`),NUMBERS=Array.from({length:COUNT},(_,i)=>String(i+1));
  const create=({models,layout,camera,crew,pilot,hud,fx,game})=>{
    const q=layout.seedMatch,sim=createRound(),state=sim.state,sound=audio(),touch=matchMedia("(pointer: coarse)").matches;
    const id=name=>document.getElementById(`pier-seed-${name}`),ui={panel:id("panel"),time:id("time"),score:id("score"),info:id("info"),grid:id("grid"),lesson:id("lesson"),more:id("more"),act:id("act"),done:id("done"),nav:document.querySelector(".pier-navigation")};
    const fact=BL.pierFacts.seedMatch;ui.lesson.textContent=fact.line;id("detail").textContent=fact.detail;id("source").href=fact.source;id("source").textContent=fact.sourceTitle;
    const buttons=[],quiet=[hud.el.act,hud.el.hint,document.getElementById("joy-move"),document.getElementById("joy-look"),document.getElementById("equipment-hud")],hidden=new Array(quiet.length);
    for(let i=0;i<COUNT;i++){const b=document.createElement("button");b.type="button";b.id=`pier-seed-card-${i}`;b.dataset.card=String(i);ui.grid.append(b);buttons.push(b);}
    let actor=null,paid=false,revision=-1,seconds=-1,flash=0;
    const near=()=>{const a=crew.player;return !!a&&!a.jet&&!a.camp.seat&&Math.abs(a.root.position.y-a.baseY-q.floor)<.15&&Math.hypot(a.root.position.x-q.play.x,a.root.position.z-q.play.z)<2;};
    const close=()=>{if(ui.panel.contains(document.activeElement))document.activeElement.blur();const a=actor;actor=null;sim.close();ui.panel.hidden=true;ui.more.open=false;models.marker.visible=false;for(let i=0;i<COUNT;i++){models.cards[i].geometry=cardGeometry[i][0]();models.cards[i].position.y=q.floor+1.045;}if(!a)return;ui.nav.hidden=false;for(let i=0;i<quiet.length;i++)quiet[i].hidden=hidden[i];pilot.setExternalControl(false);pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);if(crew.player===a)pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:Math.PI/2,pitch:.28,dist:6});pilot.showAct();};
    const refresh=()=>{
      revision=state.revision;const intro=state.phase==="intro",result=state.phase==="result",memory=state.phase==="memorize",recall=state.phase==="recall",secured=state.phase==="secured";
      ui.panel.dataset.phase=state.phase;ui.grid.hidden=intro;ui.lesson.hidden=ui.more.hidden=!intro&&!result;ui.act.disabled=memory||secured;ui.act.textContent=intro?"Start · 75s":result?"Play again":memory?"Memorize · 12s":secured?"Order secured":"Check order";
      ui.score.textContent=result?`${state.score}/12 correct · ${state.tickets} tickets saved · best ${game.state.pier.seedMatch}/12`:secured?"12/12 correct · 30 tickets pending":"12 game words · 2 tickets per correct position";
      ui.info.textContent=intro?"Memorize the numbered cards for 12s, then swap them back into order.":memory?"Remember the words and their numbered positions.":secured?"Perfect order! Stay until the clock ends to bank tickets.":result?"Your ordered backup is checked. The lesson matters beyond this game.":state.event==="check"?`${state.correct}/12 positions correct. Keep reordering.`:state.held>=0?`Card ${state.held+1} picked. ${touch?"Tap":"Select"} another to swap.`:touch?"Tap two cards to swap them. Then check the order.":"Arrows / WASD select · Space picks and swaps";
      for(let i=0;i<COUNT;i++){const b=buttons[i],word=WORDS[state.cards[i]],correct=state.cards[i]===state.order[i];b.textContent=`${NUMBERS[i]}. ${word}`;b.disabled=!recall;b.setAttribute("aria-pressed",String(recall&&state.selected===i));b.setAttribute("aria-label",`Position ${i+1}: ${word}${recall&&state.held===i?", picked":""}`);b.dataset.held=String(state.held===i);b.dataset.correct=result||secured?String(correct):"";models.cards[i].geometry=cardGeometry[state.cards[i]][result||secured?(correct?1:2):state.held===i?1:0]();}
      models.marker.visible=recall;const p=models.cards[state.selected].position;models.marker.position.x=p.x;models.marker.position.z=p.z;models.marker.position.y=q.floor+1.11;
    };
    const choose=()=>{if(sim.choose()){sound.cue(state.event);if(state.event==="swap")flash=.2;refresh();}};
    const move=(x,y)=>{if(sim.move(x,y)){if(ui.panel.contains(document.activeElement))document.activeElement.blur();refresh();}};
    const act=()=>{
      if(!actor){if(!near())return false;const a=crew.player;if(a.hopV>0){hud.toast("Land on the Playland pad first");return true;}document.activeElement.blur();actor=a;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:Math.PI/2,pitch:.28,dist:6});pilot.setActive(false);pilot.setExternalControl(true);camera.position.x=q.x+7;camera.position.y=q.floor+7;camera.position.z=q.z+2.5;camera.target.x=q.x;camera.target.y=q.floor+1;camera.target.z=q.z;camera.up=null;for(let i=0;i<quiet.length;i++){hidden[i]=quiet[i].hidden;quiet[i].hidden=true;}ui.nav.hidden=true;ui.panel.hidden=false;ui.more.open=false;sim.reset();seconds=-1;refresh();return true;}
      if(state.phase==="intro"||state.phase==="result"){paid=false;sim.start();refresh();}else if(sim.check()){sound.cue(state.phase==="secured"?"win":"check");refresh();}return true;
    };
    const onKey=e=>{if(!actor)return false;if(e.metaKey||e.ctrlKey||e.altKey)return true;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();return true;}if(e.key==="Tab"||e.key==="Enter"&&e.target.closest?.("button, a, summary"))return true;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return true;const key=e.key.toLowerCase();if(key===" "||key==="enter"){if(state.phase==="recall")choose();else act();}else if(key==="c")act();else if(key==="arrowleft"||key==="a")move(-1,0);else if(key==="arrowright"||key==="d")move(1,0);else if(key==="arrowup"||key==="w")move(0,-1);else if(key==="arrowdown"||key==="s")move(0,1);return true;};
    const onPanelKey=e=>{if(e.key===" "&&e.target.closest("button")){e.stopPropagation();if(e.repeat)e.preventDefault();}};
    const onGrid=e=>{const b=e.target.closest("[data-card]");if(b&&sim.select(Number(b.dataset.card)))choose();};
    ui.panel.addEventListener("keydown",onPanelKey);ui.grid.addEventListener("click",onGrid);ui.act.addEventListener("click",act);ui.done.addEventListener("click",close);
    const update=dt=>{if(!actor)return;if(crew.player!==actor){close();return;}crew.steer(0,0,0,0,0);sim.update(dt);if(state.phase==="result"&&!paid){paid=true;game.addTickets(state.tickets);game.recordPierSeedMatch(state.score);sound.cue("win");const p=models.cards[0].position;for(let i=0;i<6;i++){const angle=i*Math.PI/3;fx.spawnParticle(spark(),p.x,q.floor+1.4,p.z,Math.cos(angle),1.1,Math.sin(angle),.5,0,BL.pilot.WALK.gravity,q.floor);}hud.toast(`Seed Phrase Match · +${state.tickets} tickets saved`);}if(revision!==state.revision)refresh();const time=Math.ceil(state.remaining);if(time!==seconds){seconds=time;ui.time.textContent=TIMES[time];}flash=Math.max(0,flash-dt);for(let i=0;i<COUNT;i++)models.cards[i].position.y=q.floor+1.045+(state.held===i?.12:flash>0?.025*Math.sin(flash/.2*Math.PI):0);};
    return {act,close,near,onKey,update,state,unlock:sound.unlock,setMuted:sound.setMuted,get audioRunning(){return sound.running;},get muted(){return sound.muted;},get busy(){return !!actor;},dispose:()=>{close();ui.panel.removeEventListener("keydown",onPanelKey);ui.grid.removeEventListener("click",onGrid);ui.act.removeEventListener("click",act);ui.done.removeEventListener("click",close);ui.grid.replaceChildren();sound.dispose();}};
  };
  BL.pierSeedMatch={build,create,createRound,SECONDS,MEMORIZE,WORDS,MAX_SCORE:COUNT};
})();
