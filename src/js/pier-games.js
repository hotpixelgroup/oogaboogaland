// In-place midway games: pooled projectiles, canonical gravity, shared saved tickets and prizes.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,G=BL.pilot.WALK.gravity,THROWS=5;
  const PRIZES=BL.arcadeModels.PRIZES;
  const NEEDLE=Array.from({length:101},(_,i)=>`translateX(${i}%)`),STREAKS=["","","2 in a row!","3 in a row!","4 in a row!","5 in a row! A perfect round"];
  const ring=M.cached(()=>M.torus(.43,.06,"#efc85d",0,24,6));
  const ball=M.cached(()=>M.merge(M.lathe({profile:[[0,-.22],[.16,-.16],[.22,0],[.16,.16],[0,.22]],segments:16,color:"#dc8650"}),M.torus(.22,.012,"#614432",0,20,4),M.turnedX(M.torus(.22,.012,"#614432",0,20,4),Math.PI/2)));
  const medallion=M.cached(()=>M.merge(M.turnedX(M.torus(.28,.04,"#f7931a",.6,24,5),Math.PI/2),BL.factoryModels.smoothBitcoin(.35,.025,"#fff0d3",.3)));
  const build=layout=>{
    const root=S.createNode(),solid=S.createNode(),stations=[];S.addChild(root,solid);
    const box=(parts,w,h,d,x,y,z,color)=>parts.push(M.moved(M.bevelBox({w,h,d,color}),x,y,z));
    for(const q of layout.games){
      const node=S.createNode({position:{x:q.x,y:layout.top,z:q.z},rotation:{x:0,y:q.ry,z:0}}),parts=[];S.addChild(root,node);
      box(parts,4.2,.2,3.8,0,1,-1.8,q.id==="ring"?"#66aaa7":"#df8965");
      for(const x of [-1.8,1.8])for(const z of [-.2,-3.3])box(parts,.16,1,.16,x,.5,z,"#866344");
      const targets=[];
      if(q.id==="ring")for(const x of [-1.1,0,1.1]){
        parts.push(M.moved(M.lathe({profile:[[.18,0],[.18,.27],[.1,.4],[.1,.55],[0,.55]],segments:12,color:"#74b9bd"}),x,1.1,-2.4));targets.push({x,y:1.65,z:-2.4});
      }
      else {
        box(parts,.16,3.6,.16,0,1.8,-3.4,"#866344");box(parts,2.2,1.25,.12,0,3.4,-3.3,"#f3dfb5");
        box(parts,.7,.05,.02,0,3.1,-3.22,"#d56e55");
        for(const x of [-.35,.35])box(parts,.05,.55,.02,x,3.35,-3.22,"#d56e55");
        parts.push(M.moved(M.torus(.55,.055,"#d56e55",0,28,6),0,2.9,-2.8));
        for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(M.beam(.5*Math.cos(a),2.9,-2.8+.5*Math.sin(a),.26*Math.cos(a),2.35,-2.8+.26*Math.sin(a),.025,"#f3dfb5"));}
        targets.push({x:0,y:2.9,z:-2.8});
      }
      const frame=S.createNode({geometry:M.merge(...parts)});S.addChild(node,frame);
      const sign=S.createNode({geometry:BL.hubModels.postSign(q.label,.32,1.3),position:{x:-2,y:0,z:-2.1}});S.addChild(node,sign);
      const projectile=S.createNode({geometry:q.id==="ring"?ring():ball(),visible:false});S.addChild(node,projectile);
      const landed=[];if(q.id==="ring")for(let i=0;i<THROWS;i++){const n=S.createNode({geometry:ring(),visible:false});S.addChild(node,n);landed.push(n);}
      stations.push({q,node,frame,sign,projectile,targets,landed,button:`Play ${q.label}`});
      S.addChild(root,S.createNode({geometry:M.box({w:1.8,h:.015,d:2.2,color:"#eac66f"}),position:{x:q.play.x,y:layout.top+.009,z:q.play.z}}));
    }
    const q=layout.prizes,parts=[];box(parts,3.8,1.05,1.5,0,.525,0,"#68aaa9");box(parts,4,.15,1.7,0,1.12,0,"#efcc86");
    const counter=S.createNode({geometry:M.merge(...parts),position:{x:q.x,y:layout.top,z:q.z}});S.addChild(solid,counter);
    S.addChild(solid,S.createNode({geometry:BL.hubModels.postSign("TICKETS AND PRIZES",.32,1.3),position:{x:q.x,y:layout.top,z:q.z-1}}));
    for(let i=0;i<PRIZES.length;i++)S.addChild(root,S.createNode({geometry:BL.arcadeModels.prize(i),position:{x:q.x-1.5+i*.6,y:layout.top+1.2,z:q.z},scale:{x:1.4,y:1.4,z:1.4}}));
    const souvenir=S.createNode({geometry:medallion(),visible:false,position:{x:q.x,y:layout.top+1.65,z:q.z}});S.addChild(root,souvenir);
    return {root,solid,stations,souvenir};
  };
  const create=({land,crew,pilot,hud,game,layout,fx,sound})=>{
    const models=land.midway,ui={panel:document.getElementById("pier-game-panel"),title:document.getElementById("pier-game-title"),info:document.getElementById("pier-game-info"),score:document.getElementById("pier-game-score"),meter:document.getElementById("pier-game-meter"),needle:document.getElementById("pier-game-needle"),act:document.getElementById("pier-game-act"),done:document.getElementById("pier-game-done"),balance:document.getElementById("pier-tickets"),prizes:document.getElementById("pier-prizes"),list:document.getElementById("pier-prize-list"),close:document.getElementById("pier-prize-close")};
    const rows=[];for(const p of PRIZES){const li=document.createElement("li"),name=document.createElement("span"),button=document.createElement("button");name.textContent=`${p.name} · ${p.cost} tickets`;button.type="button";button.dataset.prize=p.id;li.append(name,button);ui.list.append(li);rows.push({p,button});}
    ui.claim=document.getElementById("pier-passport-claim");ui.claimInfo=document.getElementById("pier-passport-claim-info");
    const status={phase:"idle",kind:null,shots:0,hits:0,score:0,reward:0,meter:.5,aim:0,power:.5};
    let station=null,clock=0,flight=0,vx=0,vz=0,vy=0,checked=false,paid=false,prizesOpen=false,balance=-1,actor=null,stampCount=-1,passportPrize=false,streak=0;
    const near=()=>{
      const a=crew.player;if(!a||a.jet||Math.abs(a.root.position.y-a.baseY-layout.top)>.15)return null;
      for(const m of models.stations)if(Math.hypot(a.root.position.x-m.q.play.x,a.root.position.z-m.q.play.z)<2)return m;
      if(Math.hypot(a.root.position.x-layout.prizes.play.x,a.root.position.z-layout.prizes.play.z)<2)return "prizes";
      return null;
    };
    const refreshPrizes=()=>{
      for(const row of rows){const owned=game.state.arcade.prizes.includes(row.p.id);row.button.disabled=owned||game.state.arcade.tickets<row.p.cost;row.button.textContent=owned?"Owned":"Trade";}
      const p=game.state.pier;stampCount=p.stamps.length;passportPrize=p.prize;models.souvenir.visible=p.prize;
      ui.claim.disabled=p.prize||stampCount!==10;ui.claim.textContent=p.prize?"Medallion owned":stampCount===10?"Claim free medallion":"Collect 10 stamps";
      ui.claimInfo.textContent=`Pier Passport · ${stampCount}/10 · Orange Beacon medallion`;
    };
    const phase=p=>{
      status.phase=p;clock=0;status.meter=.5;
      ui.meter.hidden=p!=="aim"&&p!=="power";ui.meter.dataset.stage=p==="aim"?status.kind:"power";
      ui.act.disabled=p==="flight";ui.act.textContent=p==="aim"?"Lock aim":p==="power"?"Throw":p==="result"?"Play again":"In flight…";
      ui.info.textContent=p==="aim"?"Space or tap: lock aim in a green zone.":p==="power"?"Space or tap: release in the green power zone.":p==="flight"?"Watch your throw…":`${status.hits} hits · +${status.reward} tickets saved. Trade at the prize counter.`;
      ui.score.textContent=`${status.hits} hits · ${THROWS-status.shots} throws left`;
    };
    const reset=()=>{status.shots=status.hits=status.score=status.reward=streak=0;paid=false;for(const n of station.landed)n.visible=false;station.projectile.visible=false;phase("aim");};
    const close=()=>{
      if(ui.panel.contains(document.activeElement)||ui.prizes.contains(document.activeElement))document.activeElement.blur();
      if(station)station.projectile.visible=false;
      station=actor=null;prizesOpen=false;status.kind=null;status.phase="idle";ui.panel.hidden=ui.prizes.hidden=true;
      pilot.setActive(true);pilot.controls.reset();crew.steer(0,0,0,0,0);pilot.showAct();
    };
    const act=()=>{
      if(prizesOpen)return true;
      if(!station){
        const m=near();if(!m)return false;
        actor=crew.player;crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();
        if(m==="prizes"){prizesOpen=true;refreshPrizes();ui.prizes.hidden=false;pilot.setActive(false);ui.prizes.focus();return true;}
        if(actor.hopV>0||actor.camp.seat){hud.toast("Land on the play pad first");actor=null;return true;}
        station=m;status.kind=m.q.id;pilot.navigate({position:{x:m.q.play.x,y:layout.top,z:m.q.play.z},yaw:m.q.ry,pitch:.24,dist:6});pilot.setActive(false);
        ui.panel.hidden=false;ui.title.textContent=m.q.label;reset();return true;
      }
      if(status.phase==="result"){reset();return true;}
      if(status.phase==="aim"){status.aim=3*status.meter-1.5;phase("power");return true;}
      if(status.phase!=="power")return true;
      status.power=status.meter;status.shots++;flight=0;checked=false;
      const target=station.targets[0],height=station.q.id==="ring"?1.65:2.9;
      vy=station.q.id==="ring"?4.8:6.1;
      const t=(vy+Math.sqrt(vy*vy-2*G*(height-1.8)))/G;
      vx=status.aim/t;vz=(target.z-.8)/t*(.5+status.power);
      const p=station.projectile;p.visible=true;p.position.x=0;p.position.y=1.8;p.position.z=.8;sound.cue("whoosh",.5);phase("flight");return true;
    };
    // Let focused trade/exit buttons keep native Space activation instead of throwing again.
    const onButtonKey=e=>{if(e.key===" "&&e.target.closest("button"))e.stopPropagation();};
    const onTrade=e=>{const b=e.target.closest("button[data-prize]");if(!prizesOpen||!b||b.disabled)return;const p=PRIZES.find(p=>p.id===b.dataset.prize);if(p&&game.redeem(p.id,p.cost)){refreshPrizes();hud.toast(`${p.name} is yours!`);}};
    const onClaim=()=>{if(prizesOpen&&game.redeemPierPassport()){refreshPrizes();hud.toast("Orange Beacon medallion claimed — Passport complete!");}};
    ui.done.addEventListener("keydown",onButtonKey);ui.prizes.addEventListener("keydown",onButtonKey);
    ui.act.addEventListener("click",act);ui.done.addEventListener("click",close);ui.close.addEventListener("click",close);ui.list.addEventListener("click",onTrade);
    ui.claim.addEventListener("click",onClaim);refreshPrizes();
    const update=dt=>{
      const tickets=game.state.arcade.tickets;if(tickets!==balance){balance=tickets;ui.balance.textContent=`${tickets} tickets`;if(prizesOpen)refreshPrizes();}
      if(stampCount!==game.state.pier.stamps.length||passportPrize!==game.state.pier.prize)refreshPrizes();
      if(!station&&!prizesOpen)return;
      if(crew.player!==actor){close();return;}
      crew.steer(0,0,0,0,0);
      if(!station)return;clock+=dt;
      if(status.phase==="aim"||status.phase==="power"){
        status.meter=.5+.5*Math.sin(clock*(status.phase==="aim"?1.8:2.3));ui.needle.style.transform=NEEDLE[Math.round(status.meter*100)];return;
      }
      if(status.phase!=="flight")return;
      const old=flight;flight+=dt;const p=station.projectile.position;p.x=vx*flight;p.y=1.8+vy*flight-.5*G*flight*flight;p.z=.8+vz*flight;
      station.projectile.rotation.z=station.q.id==="ring"?Math.sin(flight*8)*.15:flight*5;
      const h=station.targets[0].y,t=(vy+Math.sqrt(vy*vy-2*G*(h-1.8)))/G;
      if(!checked&&old<=t&&flight>=t){
        checked=true;const x=vx*t,z=.8+vz*t;let hit=-1;
        for(let i=0;i<station.targets.length;i++){const q=station.targets[i];if(Math.hypot(x-q.x,z-q.z)<(station.q.id==="ring"?.28:.3)){hit=i;break;}}
        if(hit>=0){status.hits++;status.score+=station.q.id==="ring"?10:8;
          if(station.landed.length){const n=station.landed[status.shots-1],q=station.targets[hit];n.visible=true;n.position.x=q.x;n.position.y=1.15+status.shots*.07;n.position.z=q.z;station.projectile.visible=false;}
          ui.info.textContent=station.q.id==="ring"?"Ring landed! +10 tickets at round end.":"Basket! +8 tickets at round end.";
          // A hit rings and throws confetti off the peg or the hoop; hits in a row ring higher and are called out.
          streak++;sound.cue(streak>1?"coin":"good",1,1+(streak-1)*.06);if(streak>1)hud.hint(STREAKS[streak],1400);
          const q=station.targets[hit],c=Math.cos(station.q.ry),sn=Math.sin(station.q.ry),wx=station.q.x+q.x*c+q.z*sn,wz=station.q.z-q.x*sn+q.z*c;
          for(let i=0;i<6;i++){const a=i*Math.PI/3;fx.spawnParticle(BL.fx.CONFETTI[i%BL.fx.CONFETTI.length],wx,layout.top+q.y,wz,Math.cos(a)*.9,1.8,Math.sin(a)*.9,.6,5,G,layout.top);}
        }else{streak=0;sound.cue("miss");ui.info.textContent="Just missed! Try the green zones.";}
        ui.score.textContent=`${status.hits} hits · ${THROWS-status.shots} throws left`;
      }
      if(flight<1.8)return;station.projectile.visible=false;
      if(status.shots<THROWS)phase("aim");
      else {if(!paid){paid=true;status.reward=status.score;game.addTickets(status.reward);const best=game.recordPierMidway(station.q.id==="ring"?"ring":"hoops",status.hits);if(status.hits)sound.cue(best?"best":"win");if(best)hud.hint("New best!",2500);}phase("result");}
    };
    const dispose=()=>{close();ui.done.removeEventListener("keydown",onButtonKey);ui.prizes.removeEventListener("keydown",onButtonKey);ui.act.removeEventListener("click",act);ui.done.removeEventListener("click",close);ui.close.removeEventListener("click",close);ui.list.removeEventListener("click",onTrade);ui.claim.removeEventListener("click",onClaim);ui.list.replaceChildren();};
    return {act,close,update,dispose,near,status,get busy(){return !!station||prizesOpen;},get label(){const m=near();return m==="prizes"?"Trade tickets":m?m.button:"Play";}};
  };
  BL.pierGames={build,create};
})();
