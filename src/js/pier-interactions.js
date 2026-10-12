// One visit-owned registry for prompts, coastal navigation, saved stamps and vendor conversations.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,L=BL.pierModels.LAYOUT;
  const beacon=BL.pierLighthouse.LAYOUT;
  const PIXELS=Array.from({length:4096},(_,i)=>`${i}px`);
  const POIS=[
    {id:"boardwalk",name:"Bitcoin Boardwalk",x:0,z:250,y:L.entrance.y,radius:5,hint:"Walk under the orange entrance arch."},
    {id:"hippodrome",name:"Looff Hippodrome",x:-18,z:80,y:L.hippodrome.floor,radius:3,hint:"Climb the east stairs to the carousel hall."},
    {id:"aquarium",name:"Pier Aquarium",x:-27,z:80,y:L.aquarium.floor,radius:5,hint:"Use the lower ramp or the beach entrance."},
    {id:"pacific-park",name:"Pacific Park",x:-34,z:-29,y:L.top,radius:4,hint:"Visit the park entrance arch."},
    {id:"playland",name:"Playland Arcade",x:-44,z:44,y:L.top,radius:4,hint:"Walk to the arcade's seaside frontage."},
    {id:"route66",name:"Route 66",x:-16,z:63,y:L.top,radius:3,hint:"Find the End of the Trail photo sign."},
    {id:"seafood",name:"Sunset Seafood",x:-44,z:78,y:L.top,radius:3,hint:"Visit the restaurant's café seating."},
    {id:"muscle-beach",name:"Muscle Beach",x:90,z:76,y:.35,radius:7,hint:"Find the rings and bars on the beach."},
    {id:"pier-tip",name:"Fishing Lookout",x:0,z:-264.5,y:L.top,radius:7,hint:"Walk to the ocean end of the boardwalk."},
    {id:"lighthouse",name:"Bitcoin Lighthouse",x:beacon.x,z:beacon.z,y:L.sea,radius:32,boat:true,hint:"Sail a boat within 32 m of the beacon; stay aboard."}
  ];
  const ring=M.cached(()=>{const g=M.torus(.8,.035,"#f7931a",.65,24,5);g.castShadow=false;return g;});
  const create=({root,land,crew,pilot,hud,fx,game,rides,games,boats,gate,fishing,builder,mayhem,whack,seedMatch,volley,available,exploring})=>{
    const group=S.createNode(),entries=[],rows=[];S.addChild(root,group);
    const ui={prompt:document.getElementById("pier-prompt"),text:document.getElementById("pier-prompt-text"),use:document.getElementById("pier-prompt-use"),map:document.getElementById("pier-minimap"),toggle:document.getElementById("pier-map-toggle"),compass:document.getElementById("pier-compass"),passport:document.getElementById("pier-passport-open"),dialog:document.getElementById("pier-guide"),book:document.getElementById("pier-passport"),list:document.getElementById("pier-stamp-list"),progress:document.getElementById("pier-passport-progress"),reward:document.getElementById("pier-passport-reward"),vendor:document.getElementById("pier-vendor"),title:document.getElementById("pier-vendor-title"),fact:document.getElementById("pier-vendor-fact"),learn:document.getElementById("pier-vendor-learn"),detail:document.getElementById("pier-vendor-detail"),source:document.getElementById("pier-vendor-source"),treat:document.getElementById("pier-vendor-treat"),close:document.getElementById("pier-guide-close")};
    let current=null,talking=null,shown=null,stampCount=-1,prize=false,mapAge=1,dialogActor=null;
    const trainLabels=Array.from({length:Math.ceil(land.coaster.seconds)+1},(_,i)=>`Train arriving in ${i}s · Space to board`);
    const promptMinY=matchMedia("(pointer: coarse)").matches?240:180;
    const screen={x:0,y:0,depth:0},map=ui.map.getContext("2d"),base=document.createElement("canvas");base.width=base.height=256;const ink=base.getContext("2d");
    const mx=x=>128+x*240/660,mz=z=>12+(330-z)*232/710;
    const rect=(x,z,w,d,color)=>{ink.fillStyle=color;ink.fillRect(mx(x-w/2),mz(z+d/2),w*240/660,d*232/710);};
    ink.fillStyle="#286576";ink.fillRect(0,0,256,256);rect(0,145,660,370,"#d9bc84");
    rect(0,180,660,10,"#79695e");rect(0,158,660,6,"#f3e0b9");rect(0,122,660,6,"#4eaaa3");rect(0,245,660,96,"#849888");
    for(const d of L.decks)rect(d.x,d.z,d.w,d.d,"#c49661");rect(0,169,L.bridge.width,L.bridge.length,"#c49661");
    ink.fillStyle="#1e464e";ink.font="10px monospace";ink.textAlign="center";ink.fillText("Ocean Ave",128,mz(190));ink.fillText("Beach",210,mz(60));ink.fillStyle="#dbefea";ink.fillText("Pacific Ocean",195,mz(-225));
    const register=q=>{if(entries.length===32)throw new RangeError("Pier interaction capacity exceeded");const n=S.createNode({geometry:ring(),position:{x:q.x,y:q.y+.035,z:q.z},visible:false});S.addChild(group,n);q.ring=n;q.mapX=mx(q.x);q.mapZ=mz(q.z);entries.push(q);return q;};
    const close=()=>{if(!ui.dialog.open)return;talking=dialogActor=null;ui.dialog.close();pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);pilot.showAct();if(ui.dialog.contains(document.activeElement)||document.activeElement===ui.passport||document.activeElement===ui.use)document.activeElement.blur();};
    const show=()=>{pilot.controls.reset();crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.setActive(false);dialogActor=crew.player;ui.dialog.showModal();ui.close.focus();};
    const talk=vendor=>{
      const fact=BL.pierFacts[vendor.fact];talking=vendor;ui.book.hidden=true;ui.vendor.hidden=false;ui.title.textContent=vendor.label;
      ui.fact.textContent=fact.line;ui.detail.textContent=fact.detail;ui.detail.hidden=ui.source.hidden=true;ui.learn.setAttribute("aria-expanded","false");ui.source.href=fact.source;ui.source.textContent=fact.sourceTitle;
      show();fx.say(vendor.person.cave,fact.line,4);return true;
    };
    const passport=()=>{if(rides.riding||boats.riding||gate.isOpen||games.busy||fishing.busy||builder.busy||mayhem.busy||whack.busy||seedMatch.busy||volley.busy){hud.toast("Visit the Passport when back on the boardwalk");return;}if(ui.dialog.open)close();ui.vendor.hidden=true;ui.book.hidden=false;show();};
    for(const model of [land.ferris,land.coaster,land.carousel])register({id:model.id,label:model.label,x:model.board.x,z:model.board.z,y:model.seat.floor,icon:"R",spaceOnly:!!model.advance,near:()=>rides.nearest()===model,act:()=>rides.board()});
    for(const station of land.midway.stations)register({id:station.q.id,label:station.q.label,x:station.q.play.x,z:station.q.play.z,y:L.top,icon:"G",near:()=>games.near()===station,act:games.act});
    register({id:"prizes",label:"Tickets and Prizes",x:L.prizes.play.x,z:L.prizes.play.z,y:L.top,icon:"★",near:()=>games.near()==="prizes",act:games.act});
    register({id:"fishing",label:"Hash Fishing",x:L.fishing.play.x,z:L.fishing.play.z,y:L.top,icon:"G",near:fishing.near,act:fishing.act});
    register({id:"builder",label:"Block Builder",x:L.builder.play.x,z:L.builder.play.z,y:L.builder.floor,icon:"G",near:builder.near,act:builder.act});
    register({id:"mayhem",label:"Mempool Mayhem",x:L.mayhem.play.x,z:L.mayhem.play.z,y:L.top,icon:"G",near:mayhem.near,act:mayhem.act});
    register({id:"whack",label:"Double-Spend Whack",x:L.whack.play.x,z:L.whack.play.z,y:L.whack.floor,icon:"G",near:whack.near,act:whack.act});
    register({id:"seed-match",label:"Seed Phrase Match",x:L.seedMatch.play.x,z:L.seedMatch.play.z,y:L.seedMatch.floor,icon:"G",near:seedMatch.near,act:seedMatch.act});
    register({id:"volley",label:"Lightning Volley",x:L.volley.play.x,z:L.volley.play.z,y:L.volley.floor,icon:"G",near:volley.near,act:volley.act});
    for(const boat of boats.entries)register({id:boat.name,label:`Sail ${boat.name}`,x:boat.board.x,z:boat.board.z,y:L.top,icon:"B",near:()=>boats.nearest()===boat,act:boats.board});
    register({id:"gate",label:"₿IFRÖST gate",x:L.gate.x,z:L.gate.z,y:L.gate.y,icon:"↗",near:()=>{const a=crew.player;return !!a&&Math.abs(a.root.position.y-a.baseY-L.gate.y)<.5&&Math.hypot(a.root.position.x-L.gate.x,a.root.position.z-L.gate.z)<7;},act:()=>{gate.open();return true;}});
    for(let i=0;i<land.beach.vendors.length;i++){
      const vendor=land.beach.vendors[i];vendor.fact=i?"keys":"verification";vendor.label=i?"Sunny · Ice cream vendor":"Coral · Ice cream vendor";
      register({id:`vendor-${i}`,label:`Talk to ${i?"Sunny":"Coral"}`,x:vendor.x,z:vendor.z-1.5,y:.35,icon:"V",near:()=>land.beach.near(crew.player)===vendor,act:()=>talk(vendor)});
    }
    for(let i=0;i<POIS.length;i++){const q=POIS[i],li=document.createElement("li"),name=document.createElement("b"),hint=document.createElement("small");q.number=String(i+1);name.textContent=`${q.number}. ${q.name}`;hint.textContent=q.hint;li.append(name,hint);ui.list.append(li);rows.push(li);}
    const activate=()=>{if(!available()||ui.dialog.open)return false;select();if(!current)return false;if(current.spaceOnly){hud.toast("Only a fresh Space press during BOARD NOW boards the train");return true;}return current.act();};
    const select=()=>{current=null;if(!available()||ui.dialog.open)return;const a=crew.player;if(!a||a.jet||a.camp.seat)return;let best=Infinity;for(const q of entries)if(q.near()){const d=Math.hypot(a.root.position.x-q.x,a.root.position.z-q.z);if(d<best){current=q;best=d;}}};
    const onKey=e=>{
      if(e.key.toLowerCase()!=="e"||e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.("input, textarea, button, a, dialog, #sheet"))return;
      select();if(!current)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)activate();
    };
    const onPromptKey=e=>{if(e.key===" ")e.stopPropagation();};
    const onDialogKey=e=>{if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();}};
    const onCancel=e=>{e.preventDefault();close();};
    const learn=()=>{const open=ui.detail.hidden;ui.detail.hidden=ui.source.hidden=!open;ui.learn.setAttribute("aria-expanded",String(open));(open?ui.detail:ui.fact).focus();};
    const treat=()=>{if(talking)land.beach.act(crew.player,hud,fx);ui.fact.focus();};
    const toggle=()=>{ui.map.hidden=!ui.map.hidden;ui.toggle.setAttribute("aria-expanded",String(!ui.map.hidden));ui.toggle.blur();};
    ui.use.addEventListener("click",activate);ui.use.addEventListener("keydown",onPromptKey);ui.passport.addEventListener("click",passport);ui.close.addEventListener("click",close);ui.learn.addEventListener("click",learn);ui.treat.addEventListener("click",treat);ui.toggle.addEventListener("click",toggle);ui.dialog.addEventListener("cancel",onCancel);ui.dialog.addEventListener("keydown",onDialogKey);window.addEventListener("keydown",onKey,true);hud.dismissOutside(ui.dialog,close);
    const refreshPassport=()=>{
      const p=game.state.pier;if(stampCount===p.stamps.length&&prize===p.prize)return;stampCount=p.stamps.length;prize=p.prize;
      ui.passport.textContent=`Passport ${stampCount}/10`;ui.progress.textContent=`${stampCount} of 10 landmarks visited · saved`;
      for(let i=0;i<POIS.length;i++){const stamped=p.stamps.includes(POIS[i].id);rows[i].dataset.stamped=String(stamped);rows[i].setAttribute("aria-label",`${POIS[i].name}: ${stamped?"stamped":"not visited"}`);}
      ui.reward.textContent=prize?"Orange Beacon medallion claimed!":stampCount===10?"Your Orange Beacon medallion is ready at Tickets and Prizes.":"Collect all ten stamps to unlock a free Orange Beacon medallion.";
    };
    const drawMap=()=>{
      map.clearRect(0,0,256,256);map.drawImage(base,0,0);map.textAlign="center";map.textBaseline="middle";map.font="bold 9px monospace";
      for(const q of entries){map.fillStyle="#ffe1a1";map.fillText(q.icon,q.mapX,q.mapZ);}
      for(let i=0;i<POIS.length;i++){const q=POIS[i],x=mx(q.x),z=mz(q.z);map.beginPath();map.arc(x,z,5,0,Math.PI*2);map.fillStyle=game.state.pier.stamps.includes(q.id)?"#f7931a":"#fff0d3";map.fill();map.fillStyle="#153e49";map.fillText(q.number,x,z);}
      const a=crew.player;if(a){const p=a.root.position,x=Math.max(7,Math.min(249,mx(p.x))),z=Math.max(7,Math.min(249,mz(p.z))),angle=-a.root.rotation.y;map.save();map.translate(x,z);map.rotate(angle);map.beginPath();map.moveTo(0,7);map.lineTo(-5,-5);map.lineTo(0,-3);map.lineTo(5,-5);map.closePath();map.fillStyle="#fff";map.strokeStyle="#142d38";map.lineWidth=2;map.fill();map.stroke();map.restore();}
    };
    const update=dt=>{
      if(ui.dialog.open&&crew.player!==dialogActor)close();select();
      for(const q of entries)q.ring.visible=!!current&&q.near();
      if(current!==shown){shown=current;ui.prompt.hidden=!current;if(current){ui.text.textContent=current.label;ui.use.textContent=current.spaceOnly?"Space only · 1 second":"Press E / tap";}}
      if(current?.spaceOnly){const label=land.coaster.boardOpen?"SPACE · BOARD NOW (1 second)":trainLabels[Math.ceil(land.coaster.untilBoard)];if(ui.use.textContent!==label)ui.use.textContent=label;}
      const a=crew.player;
      if(a&&exploring()&&!ui.dialog.open&&!a.jet&&a.hopV<=0)for(const q of POIS){
        if(game.state.pier.stamps.includes(q.id)||q.boat!==undefined&&!boats.riding||!q.boat&&(a.camp.seat||Math.abs(a.root.position.y-a.baseY-q.y)>.35))continue;
        if(Math.hypot(a.root.position.x-q.x,a.root.position.z-q.z)<q.radius&&game.stampPier(q.id))hud.toast(`${q.name} stamped · ${game.state.pier.stamps.length}/10`);
      }
      refreshPassport();mapAge+=dt;if(mapAge>=.15){mapAge=0;if(!ui.map.hidden)drawMap();}
    };
    const overlay=(_c,project)=>{
      if(!current){ui.prompt.hidden=true;return;}const pos=project(current.x,current.y+2.5,current.z);const w=window.innerWidth,h=window.innerHeight;
      if(!pos){ui.prompt.hidden=true;return;}screen.x=pos.x;
      // A nearby cart can pull the shoulder camera in; keep its projected tap target on screen.
      screen.y=Math.max(Math.min(promptMinY,h-100),Math.min(h-100,pos.y));
      ui.prompt.hidden=false;ui.prompt.style.left=PIXELS[Math.round(Math.max(110,Math.min(4095,w-110,screen.x)))];ui.prompt.style.top=PIXELS[Math.round(Math.min(4095,screen.y))];
    };
    refreshPassport();drawMap();
    return {register,activate,update,overlay,passport,close,pois:POIS,entries,get current(){return current;},get busy(){return ui.dialog.open;},
      dispose:()=>{close();window.removeEventListener("keydown",onKey,true);ui.use.removeEventListener("click",activate);ui.use.removeEventListener("keydown",onPromptKey);ui.passport.removeEventListener("click",passport);ui.close.removeEventListener("click",close);ui.learn.removeEventListener("click",learn);ui.treat.removeEventListener("click",treat);ui.toggle.removeEventListener("click",toggle);ui.dialog.removeEventListener("cancel",onCancel);ui.dialog.removeEventListener("keydown",onDialogKey);ui.prompt.hidden=true;ui.list.replaceChildren();S.removeChild(root,group);}};
  };
  BL.pierInteractions={create,POIS};
})();
