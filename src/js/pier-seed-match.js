// Public toy cards teach ordered backups without collecting or generating wallet recovery words.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,S=BL.scene,SECONDS=75,MEMORIZE=12,SAND=3,WASH=15,COUNT=12;
  const WORDS=["OOGA","PIER","GULL","TIDE","KITE","SURF","CONE","PALM","WAVE","SAND","BOAT","GLOW"];
  const createRound=(random=n=>BL.math.randomInt(n))=>{
    const order=new Uint8Array(COUNT),cards=new Uint8Array(COUNT);
    const state={phase:"idle",elapsed:0,remaining:SECONDS,selected:0,held:-1,correct:0,score:0,tickets:0,swaps:0,event:"",revision:0,order,cards,steel:true,plate:false,memorize:MEMORIZE};
    const changed=event=>{state.event=event;state.revision++;};
    const shuffle=a=>{for(let i=COUNT-1;i>0;i--){const j=random(i+1),v=a[i];a[i]=a[j];a[j]=v;}};
    const reset=()=>{state.phase="intro";state.elapsed=state.correct=state.score=state.tickets=state.swaps=state.selected=0;state.remaining=SECONDS;state.held=-1;state.plate=false;for(let i=0;i<COUNT;i++)order[i]=cards[i]=i;changed("intro");};
    // The backup is the lesson. Stamped in steel it takes the full twelve seconds and is there to read all round;
    // scratched in sand it takes three, and the tide has it WASH seconds into the recall.
    const start=(steel=true)=>{if(state.phase!=="intro"&&state.phase!=="result")return false;reset();state.steel=steel;state.memorize=steel?MEMORIZE:SAND;state.plate=true;shuffle(order);cards.set(order);state.phase="memorize";changed("memorize");return true;};
    const select=i=>{if(state.phase!=="recall"||!Number.isInteger(i)||i<0||i>=COUNT)return false;state.selected=i;changed("select");return true;};
    const move=(dx,dy)=>select(Math.max(0,Math.min(2,state.selected%3+dx))+Math.max(0,Math.min(3,Math.floor(state.selected/3)+dy))*3);
    const choose=()=>{if(state.phase!=="recall")return false;if(state.held<0){state.held=state.selected;changed("pick");}else {const h=state.held;state.held=-1;if(h===state.selected){changed("cancel");return true;}const v=cards[h];cards[h]=cards[state.selected];cards[state.selected]=v;state.swaps++;changed("swap");}return true;};
    const countCorrect=()=>{let n=0;for(let i=0;i<COUNT;i++)if(cards[i]===order[i])n++;return n;};
    const check=()=>{if(state.phase!=="recall")return false;state.correct=countCorrect();state.held=-1;// A perfect order ends the round there and then: nobody waits out a clock they have beaten.
      if(state.correct===COUNT){state.phase="result";state.score=COUNT;state.tickets=30;changed("result");}else{state.score=Math.max(state.score,state.correct);state.tickets=Math.max(state.tickets,state.correct*2);changed("check");}return true;};
    const update=dt=>{if(state.phase!=="memorize"&&state.phase!=="recall"&&state.phase!=="secured"||!Number.isFinite(dt)||dt<=0)return;state.elapsed=Math.min(SECONDS,state.elapsed+dt);state.remaining=SECONDS-state.elapsed;if(state.phase==="recall"&&!state.steel&&state.plate&&state.elapsed>=state.memorize+WASH-1e-9){state.plate=false;changed("washed");}if(state.phase==="memorize"&&state.elapsed>=state.memorize-1e-9){cards.set(order);shuffle(cards);let same=true;for(let i=0;i<COUNT;i++)if(cards[i]!==order[i])same=false;if(same){const v=cards[0];cards[0]=cards[1];cards[1]=v;}state.phase="recall";changed("recall");}if(state.elapsed>=SECONDS-1e-9){state.elapsed=SECONDS;state.remaining=0;state.correct=countCorrect();state.score=Math.max(state.score,state.correct);state.tickets=Math.max(state.tickets,state.score*2+(state.score===COUNT?6:0));state.held=-1;state.phase="result";changed("result");}};
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
  const TIMES=Array.from({length:SECONDS+1},(_,i)=>`${i}s`),NUMBERS=Array.from({length:COUNT},(_,i)=>String(i+1));
  const create=({models,layout,camera,crew,pilot,hud,fx,game,sound:engine})=>{
    const q=layout.seedMatch,sim=createRound(),state=sim.state,sound=engine.channel(.8),touch=matchMedia("(pointer: coarse)").matches;
    const id=name=>document.getElementById(`pier-seed-${name}`),ui={panel:id("panel"),time:id("time"),score:id("score"),info:id("info"),grid:id("grid"),plate:id("plate"),sand:id("sand"),lesson:id("lesson"),more:id("more"),act:id("act"),done:id("done"),nav:document.querySelector(".pier-navigation")};
    const fact=BL.pierFacts.seedMatch;ui.lesson.textContent=fact.line;id("detail").textContent=fact.detail;id("source").href=fact.source;id("source").textContent=fact.sourceTitle;
    const buttons=[],quiet=[hud.el.act,hud.el.hint,document.getElementById("joy-move"),document.getElementById("joy-look"),document.getElementById("equipment-hud")],hidden=new Array(quiet.length);
    for(let i=0;i<COUNT;i++){const b=document.createElement("button");b.type="button";b.id=`pier-seed-card-${i}`;b.dataset.card=String(i);ui.grid.append(b);buttons.push(b);}
    let actor=null,paid=false,banked=0,revision=-1,seconds=-1,flash=0;
    const near=()=>{const a=crew.player;return !!a&&!a.jet&&!a.camp.seat&&Math.abs(a.root.position.y-a.baseY-q.floor)<.15&&Math.hypot(a.root.position.x-q.play.x,a.root.position.z-q.play.z)<2;};
    const close=()=>{if(ui.panel.contains(document.activeElement))document.activeElement.blur();const a=actor;actor=null;sim.close();ui.panel.hidden=true;ui.more.open=false;models.marker.visible=false;for(let i=0;i<COUNT;i++){models.cards[i].geometry=cardGeometry[i][0]();models.cards[i].position.y=q.floor+1.045;}if(!a)return;ui.nav.hidden=false;for(let i=0;i<quiet.length;i++)quiet[i].hidden=hidden[i];pilot.setExternalControl(false);pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);if(crew.player===a)pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:Math.PI/2,pitch:.28,dist:6});pilot.showAct();};
    const refresh=()=>{
      revision=state.revision;const intro=state.phase==="intro",result=state.phase==="result",memory=state.phase==="memorize",recall=state.phase==="recall";
      ui.panel.dataset.phase=state.phase;ui.grid.hidden=intro;ui.lesson.hidden=ui.more.hidden=!intro&&!result;ui.act.disabled=memory;ui.act.textContent=intro?"Stamp it in steel":result?"Play again":memory?(state.steel?"Stamping · 12s":"Scratching · 3s"):"Check order";ui.sand.hidden=!intro&&!result;
      // The plate: the words in order, for as long as the backup lasts.
      ui.plate.hidden=!recall;if(recall){const text=state.plate?plateText():"The tide took your sand copy. Memory is all you have.";if(ui.plate.textContent!==text)ui.plate.textContent=text;ui.plate.dataset.kept=String(state.plate);}
      ui.score.textContent=result?`${state.score}/12 correct · ${state.tickets} tickets banked · best ${game.state.pier.seedMatch}/12`:`12 game words · ${state.tickets} tickets banked`;
      ui.info.textContent=intro?"Back up twelve words, then put the shuffled cards back in order. Steel takes longer and lasts.":memory?(state.steel?"Stamping your backup into steel…":"Scratching your backup into the sand…"):result?(state.score===COUNT?(state.steel?"Recovered from steel: every word in its place.":"Recovered from memory. A steel plate would not have needed luck."):"Time. A backup you can still read makes this easy."):state.event==="washed"?"The tide has washed your sand copy away.":state.event==="check"?`${state.correct}/12 positions correct. Keep reordering.`:state.held>=0?`Card ${state.held+1} picked. ${touch?"Tap":"Select"} another to swap.`:touch?"Tap two cards to swap them. Then check the order.":"Arrows / WASD select · Space picks and swaps";
      for(let i=0;i<COUNT;i++){const b=buttons[i],word=WORDS[state.cards[i]],correct=state.cards[i]===state.order[i];b.textContent=`${NUMBERS[i]}. ${word}`;b.disabled=!recall;b.setAttribute("aria-pressed",String(recall&&state.selected===i));b.setAttribute("aria-label",`Position ${i+1}: ${word}${recall&&state.held===i?", picked":""}`);b.dataset.held=String(state.held===i);b.dataset.correct=result?String(correct):"";models.cards[i].geometry=cardGeometry[state.cards[i]][result?(correct?1:2):state.held===i?1:0]();}
      models.marker.visible=recall;const p=models.cards[state.selected].position;models.marker.position.x=p.x;models.marker.position.z=p.z;models.marker.position.y=q.floor+1.11;
    };
    const plateText=()=>{let text="Your backup: ";for(let i=0;i<COUNT;i++)text+=`${i?" · ":""}${i+1} ${WORDS[state.order[i]]}`;return text;};
    const sand=()=>{if(state.phase==="intro"||state.phase==="result"){paid=false;banked=0;sim.start(false);document.activeElement.blur();refresh();}};
    const choose=()=>{if(sim.choose()){sound.cue(state.event);if(state.event==="swap")flash=.2;refresh();}};
    const move=(x,y)=>{if(sim.move(x,y)){if(ui.panel.contains(document.activeElement))document.activeElement.blur();refresh();}};
    // Tickets are banked the moment they are earned, a check included, never a frame later.
    const bank=()=>{if(state.tickets>banked){game.addTickets(state.tickets-banked);banked=state.tickets;}if(state.phase==="result"&&!paid){paid=true;const best=game.recordPierSeedMatch(state.score);sound.cue(best?"best":"win");if(best)hud.hint("New best!",2500);const p=models.cards[0].position;for(let i=0;i<6;i++){const angle=i*Math.PI/3;fx.spawnParticle(spark(),p.x,q.floor+1.4,p.z,Math.cos(angle),1.1,Math.sin(angle),.5,0,BL.pilot.WALK.gravity,q.floor);}hud.toast(`Seed Phrase Match · +${state.tickets} tickets saved`);}};
    const act=()=>{
      if(!actor){if(!near())return false;const a=crew.player;if(a.hopV>0){hud.toast("Land on the Playland pad first");return true;}document.activeElement.blur();actor=a;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:Math.PI/2,pitch:.28,dist:6});pilot.setActive(false);pilot.setExternalControl(true);camera.position.x=q.x+7;camera.position.y=q.floor+7;camera.position.z=q.z+2.5;camera.target.x=q.x;camera.target.y=q.floor+1;camera.target.z=q.z;camera.up=null;for(let i=0;i<quiet.length;i++){hidden[i]=quiet[i].hidden;quiet[i].hidden=true;}ui.nav.hidden=true;ui.panel.hidden=false;ui.more.open=false;sim.reset();seconds=-1;refresh();return true;}
      if(state.phase==="intro"||state.phase==="result"){paid=false;banked=0;sim.start();refresh();}else if(sim.check()){bank();sound.cue(state.phase==="result"?"win":"check");refresh();}return true;
    };
    const onKey=e=>{if(!actor)return false;if(e.metaKey||e.ctrlKey||e.altKey)return true;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();return true;}if(e.key==="Tab"||e.key==="Enter"&&e.target.closest?.("button, a, summary"))return true;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return true;const key=e.key.toLowerCase();if(key===" "||key==="enter"){if(state.phase==="recall")choose();else act();}else if(key==="c")act();else if(key==="arrowleft"||key==="a")move(-1,0);else if(key==="arrowright"||key==="d")move(1,0);else if(key==="arrowup"||key==="w")move(0,-1);else if(key==="arrowdown"||key==="s")move(0,1);return true;};
    const onPanelKey=e=>{if(e.key===" "&&e.target.closest("button")){e.stopPropagation();if(e.repeat)e.preventDefault();}};
    const onGrid=e=>{const b=e.target.closest("[data-card]");if(b&&sim.select(Number(b.dataset.card)))choose();};
    ui.panel.addEventListener("keydown",onPanelKey);ui.grid.addEventListener("click",onGrid);ui.act.addEventListener("click",act);ui.sand.addEventListener("click",sand);ui.done.addEventListener("click",close);
    const update=dt=>{if(!actor)return;if(crew.player!==actor){close();return;}crew.steer(0,0,0,0,0);sim.update(dt);bank();if(revision!==state.revision)refresh();const time=Math.ceil(state.remaining);if(time!==seconds){seconds=time;ui.time.textContent=TIMES[time];}flash=Math.max(0,flash-dt);for(let i=0;i<COUNT;i++)models.cards[i].position.y=q.floor+1.045+(state.held===i?.12:flash>0?.025*Math.sin(flash/.2*Math.PI):0);};
    return {act,close,near,onKey,update,state,unlock:sound.unlock,setMuted:sound.setMuted,get audioRunning(){return sound.running;},get muted(){return sound.muted;},get busy(){return !!actor;},dispose:()=>{close();ui.panel.removeEventListener("keydown",onPanelKey);ui.grid.removeEventListener("click",onGrid);ui.act.removeEventListener("click",act);ui.sand.removeEventListener("click",sand);ui.done.removeEventListener("click",close);ui.grid.replaceChildren();sound.dispose();}};
  };
  BL.pierSeedMatch={build,create,createRound,SECONDS,MEMORIZE,SAND,WASH,WORDS,MAX_SCORE:COUNT};
})();
