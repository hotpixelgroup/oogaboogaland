// One visit-owned registry for what can be used, coastal navigation, saved stamps and vendor conversations.
// Whatever is in reach is offered on the game's own action button, as everywhere else on the island: it reads
// JUMP! with nothing near and the action (BOARD BOAT, BOARD TRAIN, PLAY) beside something, and Space or a tap
// on it does that. The pier has no prompt or action button of its own.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,L=BL.pierModels.LAYOUT;
  const beacon=BL.pierLighthouse.LAYOUT;
  const POIS=[
    {id:"boardwalk",name:"Bitcoin Boardwalk",x:0,z:250,y:L.entrance.y,radius:5,hint:"Walk under the orange entrance arch."},
    {id:"hippodrome",name:"Looff Hippodrome",x:-18,z:80,y:L.hippodrome.floor,radius:3,hint:"Climb the east stairs to the carousel hall."},
    {id:"aquarium",name:"Pier Aquarium",x:-27,z:80,y:L.aquarium.floor,radius:5,hint:"Use the lower ramp or the beach entrance."},
    {id:"pacific-park",name:"Pacific Park",x:-34,z:-29,y:L.top,radius:4,hint:"Visit the park entrance arch."},
    {id:"playland",name:"Playland Arcade",x:-44,z:44,y:L.top,radius:4,arrive:{x:-39,z:48.5},hint:"Walk to the arcade's seaside frontage."},
    {id:"route66",name:"Route 66",x:-16,z:63,y:L.top,radius:3,hint:"Find the End of the Trail photo sign."},
    {id:"seafood",name:"Sunset Seafood",x:-44,z:78,y:L.top,radius:3,arrive:{x:-41.5,z:79.5},hint:"Visit the restaurant's café seating."},
    {id:"muscle-beach",name:"Muscle Beach",x:90,z:76,y:.35,radius:7,arrive:{x:94.5,z:76},hint:"Find the rings and bars on the beach."},
    {id:"pier-tip",name:"Fishing Lookout",x:0,z:-264.5,y:L.top,radius:7,hint:"Walk to the ocean end of the boardwalk."},
    {id:"lighthouse",name:"Bitcoin Lighthouse",x:beacon.x,z:beacon.z,y:L.sea,radius:32,boat:true,hint:"Sail a launch to the beacon, or take the Block Ferry and land."}
  ];
  const ring=M.cached(()=>{const g=M.torus(.8,.035,"#f7931a",.65,24,5);g.castShadow=false;return g;});
  const create=({root,land,crew,pilot,hud,fx,game,rides,games,boats,gate,minis,wheels,occupied,available,exploring,travel,byWater})=>{
    const group=S.createNode(),entries=[],rows=[];S.addChild(root,group);
    const ui={map:document.getElementById("pier-minimap"),toggle:document.getElementById("pier-map-toggle"),compass:document.getElementById("pier-compass"),passport:document.getElementById("pier-passport-open"),dialog:document.getElementById("pier-guide"),book:document.getElementById("pier-passport"),list:document.getElementById("pier-stamp-list"),progress:document.getElementById("pier-passport-progress"),reward:document.getElementById("pier-passport-reward"),vendor:document.getElementById("pier-vendor"),title:document.getElementById("pier-vendor-title"),fact:document.getElementById("pier-vendor-fact"),learn:document.getElementById("pier-vendor-learn"),detail:document.getElementById("pier-vendor-detail"),source:document.getElementById("pier-vendor-source"),treat:document.getElementById("pier-vendor-treat"),close:document.getElementById("pier-guide-close")};
    let current=null,talking=null,shown=null,stampCount=-1,prize=false,mapAge=1,dialogActor=null;
    const trainLabels=Array.from({length:Math.ceil(land.coaster.seconds)+1},(_,i)=>`TRAIN IN ${i}s`);
    const coarse=matchMedia("(pointer: coarse)").matches;
    // What the game's one action button reads beside each thing, as it does everywhere else on the island:
    // JUMP! with nothing in reach, the action when something is. A verb is a word or a function for one that changes.
    const BOARD={wheel:"BOARD WHEEL",coaster:"BOARD TRAIN",carousel:"BOARD CAROUSEL",ship:"BOARD SHIP",scrambler:"BOARD SCRAMBLER",drop:"BOARD TOWER"},WHEELS={bike:"RIDE BIKE",board:"SKATE",cart:"DRIVE CART"};
    const verbOf=q=>typeof q.verb==="function"?q.verb():q.verb;
    // A phone starts with the map folded to a chip; its button opens it.
    ui.map.hidden=ui.compass.hidden=coarse;ui.toggle.setAttribute("aria-expanded",String(!coarse));
    const map=ui.map.getContext("2d"),base=document.createElement("canvas");base.width=base.height=256;const ink=base.getContext("2d");
    const mx=x=>128+x*240/660,mz=z=>12+(330-z)*232/710;
    const rect=(x,z,w,d,color)=>{ink.fillStyle=color;ink.fillRect(mx(x-w/2),mz(z+d/2),w*240/660,d*232/710);};
    ink.fillStyle="#286576";ink.fillRect(0,0,256,256);rect(0,145,660,370,"#d9bc84");
    rect(0,180,660,10,"#79695e");rect(0,158,660,6,"#f3e0b9");rect(0,122,660,6,"#4eaaa3");rect(0,245,660,96,"#849888");
    for(const d of L.decks)rect(d.x,d.z,d.w,d.d,"#c49661");rect(0,169,L.bridge.width,L.bridge.length,"#c49661");
    ink.fillStyle="#1e464e";ink.font="10px monospace";ink.textAlign="center";ink.fillText("Ocean Ave",128,mz(190));ink.fillText("Beach",210,mz(60));ink.fillStyle="#dbefea";ink.fillText("Pacific Ocean",195,mz(-225));
    const register=q=>{if(entries.length===64)throw new RangeError("Pier interaction capacity exceeded");const n=S.createNode({geometry:ring(),position:{x:q.x,y:q.y+.035,z:q.z},visible:false});S.addChild(group,n);q.ring=n;q.mapX=mx(q.x);q.mapZ=mz(q.z);entries.push(q);return q;};
    const close=()=>{if(!ui.dialog.open)return;talking=dialogActor=null;ui.dialog.close();pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);pilot.showAct();if(ui.dialog.contains(document.activeElement)||document.activeElement===ui.passport)document.activeElement.blur();};
    const show=()=>{pilot.controls.reset();crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.setActive(false);dialogActor=crew.player;ui.dialog.showModal();ui.close.focus({preventScroll:true});ui.dialog.scrollTop=0;};
    const talk=vendor=>{
      const fact=BL.pierFacts[vendor.fact];talking=vendor;ui.book.hidden=true;ui.vendor.hidden=false;ui.title.textContent=vendor.label;
      ui.fact.textContent=fact.line;ui.detail.textContent=fact.detail;ui.detail.hidden=ui.source.hidden=true;ui.learn.setAttribute("aria-expanded","false");ui.source.href=fact.source;ui.source.textContent=fact.sourceTitle;
      show();fx.say(vendor.person.cave,fact.line,4);return true;
    };
    const passport=()=>{if(gate.isOpen||occupied()){hud.toast("Visit the Passport when back on the boardwalk");return;}if(ui.dialog.open)close();ui.vendor.hidden=true;ui.book.hidden=false;show();};
    for(const model of rides.models)register({id:model.id,label:model.label,verb:model.strict?()=>model.boardOpen?BOARD[model.id]:trainLabels[Math.ceil(model.untilBoard)]:BOARD[model.id],x:model.board.x,z:model.board.z,y:model.seat.floor,icon:"R",near:()=>rides.nearest()===model,act:()=>rides.tapBoard()});
    for(const station of land.midway.stations)register({id:station.q.id,label:station.q.label,verb:"PLAY",x:station.q.play.x,z:station.q.play.z,y:L.top,icon:"G",near:()=>games.near()===station,act:games.act});
    register({id:"prizes",label:"Tickets and Prizes",verb:"PRIZES",x:L.prizes.play.x,z:L.prizes.play.z,y:L.top,icon:"★",near:()=>games.near()==="prizes",act:games.act});
    for(const m of minis)register({id:m.id,label:m.label,verb:m.verb||"PLAY",x:m.pad.x,z:m.pad.z,y:m.floor,icon:m.icon||"G",near:m.game.near,act:m.game.act});
    // A vehicle's prompt follows it wherever it was last left.
    for(const v of wheels.vehicles)register({id:v.id,label:`${v.kind.verb} the ${v.kind.label}`,verb:WHEELS[v.type],x:v.x,z:v.z,y:v.y,icon:"W",follow:v,near:()=>wheels.nearest()===v,act:wheels.mount});
    for(const boat of boats.entries)register({id:boat.name,label:`Sail ${boat.name}`,verb:"BOARD BOAT",x:boat.board.x,z:boat.board.z,y:L.top,icon:"B",near:()=>boats.nearest()===boat,act:boats.board});
    register({id:"gate",label:"₿IFRÖST gate",verb:"OPEN GATE!",x:L.gate.x,z:L.gate.z,y:L.gate.y,icon:"↗",near:()=>{const a=crew.player;return !!a&&Math.abs(a.root.position.y-a.baseY-L.gate.y)<.5&&Math.hypot(a.root.position.x-L.gate.x,a.root.position.z-L.gate.z)<7;},act:()=>{gate.open();return true;}});
    for(let i=0;i<land.beach.vendors.length;i++){
      const vendor=land.beach.vendors[i];vendor.fact=i?"keys":"verification";vendor.label=i?"Sunny · Ice cream vendor":"Coral · Ice cream vendor";
      register({id:`vendor-${i}`,label:`Talk to ${i?"Sunny":"Coral"}`,verb:"TALK",x:vendor.x,z:vendor.z-1.5,y:.35,icon:"V",near:()=>land.beach.near(crew.player)===vendor,act:()=>talk(vendor)});
    }
    // A stamped landmark is also a place to travel to: exploring once earns the shortcut.
    const trips=[];
    for(let i=0;i<POIS.length;i++){const q=POIS[i],li=document.createElement("li"),name=document.createElement("b"),hint=document.createElement("small"),trip=document.createElement("button");q.number=String(i+1);name.textContent=`${q.number}. ${q.name}`;hint.textContent=q.hint;trip.type="button";trip.textContent="Go there";trip.dataset.poi=String(i);trip.hidden=true;li.append(name,hint,trip);ui.list.append(li);rows.push(li);trips.push(trip);}
    const activate=()=>{if(!available()||ui.dialog.open)return false;select();if(!current)return false;return current.act();};
    const select=()=>{current=null;if(!available()||ui.dialog.open)return;const a=crew.player;if(!a||a.jet||a.camp.seat)return;let best=Infinity;for(const q of entries)if(q.near()){const d=Math.hypot(a.root.position.x-q.x,a.root.position.z-q.z);if(d<best){current=q;best=d;}}};
    const onKey=e=>{
      if(e.key.toLowerCase()!=="e"||e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.("input, textarea, button, a, dialog, #sheet"))return;
      select();if(!current)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)activate();
    };
    const onDialogKey=e=>{if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close();}};
    const onCancel=e=>{e.preventDefault();close();};
    const learn=()=>{const open=ui.detail.hidden;ui.detail.hidden=ui.source.hidden=!open;ui.learn.setAttribute("aria-expanded",String(open));(open?ui.detail:ui.fact).focus();};
    const treat=()=>{if(talking)land.beach.act(crew.player,hud,fx);ui.fact.focus();};
    const onTrip=e=>{const b=e.target.closest("button[data-poi]");if(!b||b.hidden)return;const q=POIS[Number(b.dataset.poi)];close();travel(q);};
    const toggle=()=>{ui.map.hidden=ui.compass.hidden=!ui.map.hidden;ui.toggle.setAttribute("aria-expanded",String(!ui.map.hidden));ui.toggle.blur();};
    ui.passport.addEventListener("click",passport);ui.close.addEventListener("click",close);ui.learn.addEventListener("click",learn);ui.treat.addEventListener("click",treat);ui.toggle.addEventListener("click",toggle);ui.list.addEventListener("click",onTrip);ui.dialog.addEventListener("cancel",onCancel);ui.dialog.addEventListener("keydown",onDialogKey);window.addEventListener("keydown",onKey,true);hud.dismissOutside(ui.dialog,close);
    const refreshPassport=()=>{
      const p=game.state.pier;if(stampCount===p.stamps.length&&prize===p.prize)return;stampCount=p.stamps.length;prize=p.prize;
      ui.passport.textContent=`Passport ${stampCount}/10`;ui.progress.textContent=`${stampCount} of 10 landmarks visited · saved`;
      for(let i=0;i<POIS.length;i++){const stamped=p.stamps.includes(POIS[i].id);rows[i].dataset.stamped=String(stamped);trips[i].hidden=!stamped||!!POIS[i].boat;rows[i].setAttribute("aria-label",`${POIS[i].name}: ${stamped?"stamped":"not visited"}`);}
      ui.reward.textContent=prize?"Orange Beacon medallion claimed!":stampCount===10?"Your Orange Beacon medallion is ready at Tickets and Prizes.":"Collect all ten stamps to unlock a free Orange Beacon medallion.";
    };
    const drawMap=()=>{
      map.clearRect(0,0,256,256);map.drawImage(base,0,0);map.textAlign="center";map.textBaseline="middle";map.font="bold 9px monospace";
      for(const q of entries){map.fillStyle="#ffe1a1";map.fillText(q.icon,q.mapX,q.mapZ);}
      for(let i=0;i<POIS.length;i++){const q=POIS[i],x=mx(q.x),z=mz(q.z);map.beginPath();map.arc(x,z,5,0,Math.PI*2);map.fillStyle=game.state.pier.stamps.includes(q.id)?"#f7931a":"#fff0d3";map.fill();map.fillStyle="#153e49";map.fillText(q.number,x,z);}
      const a=crew.player;if(a){const p=a.root.position,x=Math.max(7,Math.min(249,mx(p.x))),z=Math.max(7,Math.min(249,mz(p.z))),angle=-a.root.rotation.y;map.save();map.translate(x,z);map.rotate(angle);map.beginPath();map.moveTo(0,7);map.lineTo(-5,-5);map.lineTo(0,-3);map.lineTo(5,-5);map.closePath();map.fillStyle="#fff";map.strokeStyle="#142d38";map.lineWidth=2;map.fill();map.stroke();map.restore();}
    };
    const update=dt=>{
      if(ui.dialog.open&&crew.player!==dialogActor)close();
      for(let i=0;i<entries.length;i++){const q=entries[i],f=q.follow;if(f&&(q.x!==f.x||q.z!==f.z||q.y!==f.y)){q.x=f.x;q.y=f.y;q.z=f.z;q.ring.position.x=q.x;q.ring.position.y=q.y+.035;q.ring.position.z=q.z;q.mapX=mx(q.x);q.mapZ=mz(q.z);}}
      select();
      for(const q of entries)q.ring.visible=!!current&&q.near();
      const a=crew.player;
      // The hint says it once, on arriving; the button is set every frame, since closing a panel or landing a jump
      // puts JUMP! back. With nothing in reach the button is the pilot's again (a seated rider's is their ride's).
      if(current!==shown){shown=current;if(current)hud.hint(`${coarse?verbOf(current):"Space"}: ${current.label}`);else if(a&&!a.camp.seat)pilot.showAct();}
      if(current)hud.setAct(verbOf(current));
      if(a&&exploring()&&!ui.dialog.open&&!a.jet&&a.hopV<=0)for(const q of POIS){
        if(game.state.pier.stamps.includes(q.id)||q.boat!==undefined&&!byWater()||!q.boat&&(a.camp.seat||Math.abs(a.root.position.y-a.baseY-q.y)>.35))continue;
        if(Math.hypot(a.root.position.x-q.x,a.root.position.z-q.z)<q.radius&&game.stampPier(q.id))hud.toast(`${q.name} stamped · ${game.state.pier.stamps.length}/10`);
      }
      refreshPassport();mapAge+=dt;if(mapAge>=.15){mapAge=0;if(!ui.map.hidden)drawMap();}
    };
    refreshPassport();drawMap();
    return {register,activate,update,passport,close,pois:POIS,entries,get current(){return current;},get busy(){return ui.dialog.open;},
      dispose:()=>{close();window.removeEventListener("keydown",onKey,true);ui.passport.removeEventListener("click",passport);ui.close.removeEventListener("click",close);ui.learn.removeEventListener("click",learn);ui.treat.removeEventListener("click",treat);ui.toggle.removeEventListener("click",toggle);ui.list.removeEventListener("click",onTrip);ui.dialog.removeEventListener("cancel",onCancel);ui.dialog.removeEventListener("keydown",onDialogKey);ui.map.hidden=ui.compass.hidden=false;ui.toggle.setAttribute("aria-expanded","true");ui.list.replaceChildren();S.removeChild(root,group);}};
  };
  BL.pierInteractions={create,POIS};
})();
