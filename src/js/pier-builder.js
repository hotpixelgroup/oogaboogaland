// Block Builder: one bounded packing puzzle, a pooled beach table and visit-owned controls.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,S=BL.scene,SECONDS=75,SIZE=6,CAPACITY=36,MAX_FEES=216,SKIPS=3;
  const SHAPES=[[[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[0,2],[1,2]]].map(cells=>{
    const turns=[];let points=cells;
    for(let r=0;r<4;r++){const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));turns.push(points.map(p=>[p[0]-x,p[1]-y]));points=points.map(p=>[-p[1],p[0]]);}return turns;
  });
  const createRound=(random=n=>BL.math.randomInt(n))=>{
    const state={phase:"idle",elapsed:0,remaining:SECONDS,fees:0,tickets:0,used:0,placed:0,selected:0,rotation:0,x:0,y:0,skips:SKIPS,event:"",revision:0,board:new Uint8Array(CAPACITY),offers:Array.from({length:3},()=>({shape:0,rate:1,fee:2,size:2}))};
    const changed=event=>{state.event=event;state.revision++;};
    const offer=i=>{const q=state.offers[i];q.shape=random(SHAPES.length);q.rate=1+random(6);q.size=SHAPES[q.shape][0].length;q.fee=q.size*q.rate;};
    const reset=()=>{state.phase="intro";state.elapsed=state.fees=state.tickets=state.used=state.placed=state.selected=state.rotation=state.x=state.y=0;state.remaining=SECONDS;state.skips=SKIPS;state.board.fill(0);changed("intro");};
    const start=()=>{if(state.phase!=="intro"&&state.phase!=="result")return false;reset();for(let i=0;i<3;i++)offer(i);state.phase="ready";changed("start");return true;};
    const cells=()=>SHAPES[state.offers[state.selected].shape][state.rotation];
    const fits=()=>{for(const p of cells()){const x=state.x+p[0],y=state.y+p[1];if(x>=SIZE||y>=SIZE||state.board[y*SIZE+x])return false;}return true;};
    const select=i=>{if(state.phase!=="ready"||!Number.isInteger(i)||i<0||i>2)return false;state.selected=i;state.rotation=0;changed("choose");return true;};
    const anchor=(x,y)=>{if(state.phase!=="ready"||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=SIZE||y>=SIZE)return false;state.x=x;state.y=y;changed("move");return true;};
    const move=(dx,dy)=>anchor(Math.max(0,Math.min(SIZE-1,state.x+dx)),Math.max(0,Math.min(SIZE-1,state.y+dy)));
    const rotate=()=>{if(state.phase!=="ready")return false;state.rotation=(state.rotation+1)%4;changed("rotate");return true;};
    // Waiting for a better transaction is a real choice, so it is not free: SKIPS a round.
    const skip=()=>{if(state.phase!=="ready")return false;if(state.skips<=0){changed("spent");return false;}state.skips--;offer(state.selected);state.rotation=0;changed("skip");return true;};
    const place=()=>{if(state.phase!=="ready")return false;if(!fits()){changed("blocked");return false;}const q=state.offers[state.selected];for(const p of cells())state.board[(state.y+p[1])*SIZE+state.x+p[0]]=q.rate;state.used+=q.size;state.fees+=q.fee;state.tickets=Math.floor(state.fees/4);state.placed++;offer(state.selected);state.rotation=0;
      // A full block is sealed at once; nobody waits out the clock.
      if(state.used===CAPACITY){state.phase="result";changed("result");}else changed("place");return true;};
    const update=dt=>{if(state.phase!=="ready"||!Number.isFinite(dt)||dt<=0)return;state.elapsed=Math.min(SECONDS,state.elapsed+dt);state.remaining=SECONDS-state.elapsed;if(state.remaining<1e-9){state.elapsed=SECONDS;state.remaining=0;state.phase="result";changed("result");}};
    const close=()=>{state.phase="idle";changed("close");};
    return {state,reset,start,cells,fits,select,anchor,move,rotate,skip,place,update,close};
  };
  const COLORS=["#57b9c6","#7ac494","#e6bd55","#ee9169","#da89b1","#f7931a"];
  const tile=COLORS.map(color=>M.cached(()=>M.bevelBox({w:.48,h:.16,d:.48,color})));
  const ghost=M.cached(()=>{const g=M.bevelBox({w:.46,h:.07,d:.46,color:"#f9e9b8"});g.glow=.4;return g;});
  const spark=M.cached(()=>{const g=M.box({w:.05,h:.05,d:.05,color:"#f7931a"});g.castShadow=false;return g;});
  const build=layout=>{
    const q=layout.builder,root=S.createNode(),solid=S.createNode();S.addChild(root,solid);
    const parts=[M.moved(M.bevelBox({w:4.2,h:.22,d:4.2,color:"#287b86"}),0,.95,0),M.moved(M.bevelBox({w:3.5,h:.08,d:3.5,color:"#193e49"}),0,1.1,0)];
    for(const x of [-1.65,1.65])for(const z of [-1.65,1.65])parts.push(M.beam(x,0,z,x,.9,z,.16,"#d1ab73"));
    for(let i=0;i<=SIZE;i++){const a=(i-SIZE/2)*.54;parts.push(M.moved(M.box({w:.018,h:.014,d:3.24,color:"#d8d2ac"}),a,1.15,0),M.moved(M.box({w:3.24,h:.014,d:.018,color:"#d8d2ac"}),0,1.15,a));}
    S.addChild(solid,S.createNode({geometry:M.merge(...parts),position:{x:q.x,y:q.floor,z:q.z}}));
    S.addChild(solid,S.createNode({geometry:BL.hubModels.postSign("BLOCK BUILDER",.36,1.4),position:{x:q.sign.x,y:q.floor,z:q.sign.z}}));
    S.addChild(root,S.createNode({geometry:M.box({w:1.8,h:.015,d:1.8,color:"#eac66f"}),position:{x:q.play.x,y:q.floor+.01,z:q.play.z}}));
    const blocks=[],preview=[];
    for(let i=0;i<CAPACITY;i++){const n=S.createNode({geometry:tile[0](),visible:false,position:{x:q.x+(i%SIZE-2.5)*.54,y:q.floor+1.23,z:q.z+(Math.floor(i/SIZE)-2.5)*.54}});S.addChild(root,n);blocks.push(n);}
    for(let i=0;i<4;i++){const n=S.createNode({geometry:ghost(),visible:false});S.addChild(root,n);preview.push(n);}return {root,solid,blocks,preview};
  };
  const TIMES=Array.from({length:SECONDS+1},(_,i)=>`${i}s`);
  const create=({models,layout,camera,crew,pilot,hud,fx,game,sound:engine})=>{
    const q=layout.builder,sim=createRound(),state=sim.state,sound=engine.channel(.8),touch=matchMedia("(pointer: coarse)").matches;
    const id=name=>document.getElementById(`pier-builder-${name}`),ui={panel:id("panel"),score:id("score"),time:id("time"),info:id("info"),grid:id("grid"),offers:id("offers"),lesson:id("lesson"),more:id("more"),act:id("act"),done:id("done"),rotate:id("rotate"),skip:id("skip"),play:id("play"),nav:document.querySelector(".pier-navigation")};
    const fact=BL.pierFacts.builder;ui.lesson.textContent=fact.line;id("detail").textContent=fact.detail;id("source").href=fact.source;id("source").textContent=fact.sourceTitle;ui.rotate.textContent=touch?"Rotate":"Rotate · R";
    const buttons=[],offers=[],ages=new Float32Array(CAPACITY),seen=new Uint8Array(CAPACITY),marked=new Uint8Array(CAPACITY),quiet=[hud.el.act,hud.el.hint,document.getElementById("joy-move"),document.getElementById("joy-look")],hidden=new Array(quiet.length);
    for(let i=0;i<CAPACITY;i++){const b=document.createElement("button");b.type="button";b.dataset.cell=String(i);b.id=`pier-builder-cell-${i}`;b.setAttribute("aria-label",`Row ${Math.floor(i/SIZE)+1}, column ${i%SIZE+1}, empty`);ui.grid.append(b);buttons.push(b);}
    for(let i=0;i<3;i++){const b=document.createElement("button"),canvas=document.createElement("canvas"),label=document.createElement("span");b.type="button";b.dataset.offer=String(i);b.id=`pier-builder-offer-${i}`;canvas.width=72;canvas.height=40;canvas.setAttribute("aria-hidden","true");b.append(canvas,label);ui.offers.append(b);offers.push({b,canvas,ink:canvas.getContext("2d"),label});}
    let actor=null,paid=false,banked=0,revision=-1,seconds=-1;
    const near=()=>{const a=crew.player;return !!a&&!a.jet&&!a.camp.seat&&Math.abs(a.root.position.y-a.baseY-q.floor)<.15&&Math.hypot(a.root.position.x-q.play.x,a.root.position.z-q.play.z)<2;};
    const close=()=>{if(ui.panel.contains(document.activeElement))document.activeElement.blur();const a=actor;actor=null;sim.close();ui.panel.hidden=true;ui.more.open=false;for(const n of models.preview)n.visible=false;ages.fill(0);for(const n of models.blocks)n.position.y=q.floor+1.23;if(!a)return;ui.nav.hidden=false;for(let i=0;i<quiet.length;i++)quiet[i].hidden=hidden[i];pilot.setExternalControl(false);pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);if(crew.player===a)pilot.navigate({position:{x:a.root.position.x,y:a.root.position.y-a.baseY,z:a.root.position.z},yaw:0,pitch:.28,dist:6});pilot.showAct();};
    const refresh=()=>{
      revision=state.revision;const playing=state.phase==="ready",result=state.phase==="result",valid=sim.fits();ui.panel.dataset.phase=state.phase;ui.play.hidden=!playing;ui.act.textContent=playing?(touch?"Place transaction":"Place · Space"):result?"Build again":"Start · 75s";ui.act.disabled=false;ui.skip.disabled=state.skips<=0;ui.skip.textContent=`${touch?"New offer":"New offer · X"} (${state.skips} left)`;ui.lesson.hidden=ui.more.hidden=playing;ui.score.textContent=`${state.fees} fees · ${state.used}/36 space · ${state.tickets} tickets banked`;
      ui.info.textContent=playing?(state.event==="blocked"?"That transaction overlaps or crosses the edge. Move or rotate it.":state.event==="spent"?"No new offers left this round. Fit what the mempool gives you.":touch?"Choose an offer · tap a cell · Rotate · Place":"1–3 choose · arrows move · R rotate · Space places"):result?`Block sealed · +${state.tickets} tickets banked · best ${game.state.pier.builder} fees.`:"Fit fee-tagged transactions into one block. Aim for more fees in less space.";
      marked.fill(0);if(playing)for(const p of sim.cells()){const x=state.x+p[0],y=state.y+p[1];if(x<SIZE&&y<SIZE)marked[y*SIZE+x]=1;}
      for(let i=0;i<CAPACITY;i++){
        const rate=state.board[i],b=buttons[i],n=models.blocks[i];b.textContent=rate?String(rate):marked[i]?"+":"";b.dataset.preview=marked[i]?(valid?"valid":"blocked"):"";b.style.backgroundColor=rate?COLORS[rate-1]:"";b.setAttribute("aria-label",`Row ${Math.floor(i/SIZE)+1}, column ${i%SIZE+1}, ${rate?`packed at ${rate} fees per unit`:marked[i]?valid?"preview fits":"preview blocked":"empty"}`);n.visible=!!rate;if(rate){n.geometry=tile[rate-1]();if(!seen[i])ages[i]=.32;}seen[i]=rate;
      }
      for(let i=0;i<3;i++){const o=offers[i],tx=state.offers[i];o.b.setAttribute("aria-pressed",String(state.selected===i));o.label.textContent=`${i+1}: ${tx.fee} fees / ${tx.size} space (${tx.rate}/unit)`;o.ink.clearRect(0,0,72,40);o.ink.fillStyle=COLORS[tx.rate-1];for(const p of SHAPES[tx.shape][0])o.ink.fillRect(12+p[0]*12,2+p[1]*12,10,10);}
      const cells=sim.cells();for(let i=0;i<models.preview.length;i++){const n=models.preview[i],p=cells[i];n.visible=playing&&valid&&!!p;if(n.visible){n.position.x=q.x+(state.x+p[0]-2.5)*.54;n.position.z=q.z+(state.y+p[1]-2.5)*.54;n.position.y=q.floor+1.25;}}
    };
    // Tickets are banked the moment a placement earns them, the one that seals the block included.
    const bank=()=>{if(state.tickets>banked){game.addTickets(state.tickets-banked);banked=state.tickets;}if(state.phase==="result"&&!paid){paid=true;const best=game.recordPierBuilder(state.fees);sound.cue(best?"best":"win");if(best)hud.hint("New best!",2500);hud.toast(`Block Builder · +${state.tickets} tickets saved`);}};
    const place=()=>{if(sim.place()){bank();sound.cue("place");const x=q.x+(state.x-2.5)*.54,z=q.z+(state.y-2.5)*.54;for(let i=0;i<6;i++){const a=i*Math.PI/3;fx.spawnParticle(spark(),x,q.floor+1.4,z,Math.cos(a)*.5,1.1,Math.sin(a)*.5,.4,0,BL.pilot.WALK.gravity,q.floor);}}else sound.cue("blocked");refresh();};
    const act=()=>{
      if(!actor){if(!near())return false;const a=crew.player;if(a.hopV>0){hud.toast("Land on the Block Builder pad first");return true;}document.activeElement.blur();actor=a;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();pilot.navigate({position:{x:q.play.x,y:q.floor,z:q.play.z},yaw:0,pitch:.28,dist:6});pilot.setActive(false);pilot.setExternalControl(true);camera.position.x=q.x-6;camera.position.y=q.floor+9;camera.position.z=q.z+10;camera.target.x=q.x;camera.target.y=q.floor+1;camera.target.z=q.z;camera.up=null;for(let i=0;i<quiet.length;i++){hidden[i]=quiet[i].hidden;quiet[i].hidden=true;}ui.nav.hidden=true;ui.panel.hidden=false;ui.more.open=false;seen.fill(0);ages.fill(0);sim.reset();seconds=-1;refresh();return true;}
      if(state.phase==="intro"||state.phase==="result"){paid=false;banked=0;seen.fill(0);ages.fill(0);sim.start();refresh();}else place();return true;
    };
    const onKey=e=>{if(!actor)return false;if(e.metaKey||e.ctrlKey||e.altKey)return true;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();return true;}if(e.key==="Tab")return true;if(e.key==="Enter"&&e.target.closest?.("button, a, summary"))return true;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return true;const key=e.key.toLowerCase();if(key===" "||key==="enter")act();else if(key==="r"){sim.rotate();refresh();}else if(key==="x"){sim.skip();refresh();}else if(/^[1-3]$/.test(key)){sim.select(Number(key)-1);refresh();}else if(key==="arrowleft"||key==="a"){sim.move(-1,0);refresh();}else if(key==="arrowright"||key==="d"){sim.move(1,0);refresh();}else if(key==="arrowup"||key==="w"){sim.move(0,-1);refresh();}else if(key==="arrowdown"||key==="s"){sim.move(0,1);refresh();}return true;};
    const onPanelKey=e=>{if(e.key===" "&&e.target.closest("button")){e.stopPropagation();if(e.repeat)e.preventDefault();}};
    const onGrid=e=>{const b=e.target.closest("[data-cell]");if(!b)return;const i=Number(b.dataset.cell);sim.anchor(i%SIZE,Math.floor(i/SIZE));refresh();};
    const onOffer=e=>{const b=e.target.closest("[data-offer]");if(b){sim.select(Number(b.dataset.offer));refresh();}};
    const rotate=()=>{sim.rotate();refresh();},skip=()=>{sim.skip();refresh();};
    ui.panel.addEventListener("keydown",onPanelKey);ui.grid.addEventListener("click",onGrid);ui.offers.addEventListener("click",onOffer);ui.act.addEventListener("click",act);ui.done.addEventListener("click",close);ui.rotate.addEventListener("click",rotate);ui.skip.addEventListener("click",skip);
    const update=dt=>{if(!actor)return;if(crew.player!==actor){close();return;}crew.steer(0,0,0,0,0);sim.update(dt);bank();if(revision!==state.revision)refresh();const time=Math.ceil(state.remaining);if(seconds!==time){seconds=time;ui.time.textContent=TIMES[time];}for(let i=0;i<CAPACITY;i++)if(ages[i]>0){ages[i]=Math.max(0,ages[i]-dt);models.blocks[i].position.y=q.floor+1.23+Math.sin(ages[i]/.32*Math.PI)*.3;}};
    return {act,close,near,onKey,update,state,unlock:sound.unlock,setMuted:sound.setMuted,get busy(){return !!actor;},dispose:()=>{close();ui.panel.removeEventListener("keydown",onPanelKey);ui.grid.removeEventListener("click",onGrid);ui.offers.removeEventListener("click",onOffer);ui.act.removeEventListener("click",act);ui.done.removeEventListener("click",close);ui.rotate.removeEventListener("click",rotate);ui.skip.removeEventListener("click",skip);ui.grid.replaceChildren();ui.offers.replaceChildren();sound.dispose();}};
  };
  BL.pierBuilder={build,create,createRound,SECONDS,MAX_FEES,SKIPS};
})();
