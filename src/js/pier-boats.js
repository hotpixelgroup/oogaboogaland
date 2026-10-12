// Two DSB-sized launches: shared FFT buoyancy, fixed-step steering and validated pier-only exits.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,Q=BL.math.quat,STEP=1/120,RADIUS=2.45;
  const BOUNDS={x:550,minZ:-800,maxZ:-65};
  const BERTHS=[{name:"Satoshi",color:"#f7931a",x:29.8,z:-267,yaw:-Math.PI/2},{name:"Beacon",color:"#30b9bd",x:29.8,z:-262,yaw:-Math.PI/2}];
  const trim=BERTHS.map(q=>M.cached(()=>{
    const parts=[];
    for(const x of [-1.12,1.12])parts.push(M.moved(M.box({w:.06,h:.28,d:3.9,color:q.color}),x,-.02,0));
    parts.push(M.moved(M.bevelBox({w:1.45,h:.12,d:1.1,color:"#eee2c5"}),0,.37,-1.3),
      M.moved(M.box({w:.18,h:.58,d:.18,color:"#244653"}),0,.65,-.4),
      M.moved(M.turnedX(M.torus(.24,.035,"#244653",0,16,6),.65),0,.99,-.4),
      M.moved(M.turnedX(M.torus(.25,.085,"#fff0d6",0,16,6),Math.PI/2),0,.78,1.97));
    return M.merge(...parts);
  }));
  const wake=M.cached(()=>{
    const parts=[];for(const side of [-1,1])for(let i=0;i<5;i++)parts.push(M.moved(M.turnedY(M.box({w:.09,h:.018,d:.8,color:"#b9ded7"}),side*.2),side*(.8+i*.24),0,2.2+i*.7));
    const g=M.merge(...parts);g.castShadow=false;return g;
  });
  const intersects=(ax,az,bx,bz,r)=>{
    let lo=0,hi=1;const dx=bx-ax,dz=bz-az;
    if(Math.abs(dx)<1e-10){if(ax<r.minX||ax>r.maxX)return false;}
    else {const a=(r.minX-ax)/dx,b=(r.maxX-ax)/dx;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
    if(Math.abs(dz)<1e-10){if(az<r.minZ||az>r.maxZ)return false;}
    else {const a=(r.minZ-az)/dz,b=(r.maxZ-az)/dz;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
    return lo<=hi;
  };
  const create=({root,land,water,crew,pilot,hud})=>{
    const group=S.createNode(),dock=S.createNode(),entries=[],layout=land.layout;S.addChild(root,group);S.addChild(group,dock);
    for(let i=0;i<BERTHS.length;i++){
      const q=BERTHS[i],node=BL.dsbModels.boat(),foam=S.createNode({geometry:wake(),visible:false});
      S.addChild(node,S.createNode({geometry:trim[i]()}));S.addChild(group,node);S.addChild(group,foam);
      node.quaternion=Q.create();node.position.x=q.x;node.position.y=layout.sea+.22;node.position.z=q.z;
      const board={x:24.5,z:q.z},seat={x:q.x,y:layout.sea+.82,z:q.z+.35,ry:Math.PI,floor:layout.top,walkAt:board,sitter:null,allowWeapons:false,lockMovement:true};
      const mark=S.createNode({geometry:BL.hubModels.postSign(q.name.toUpperCase(),.28,1.3),position:{x:20.2,y:layout.top,z:q.z}});S.addChild(dock,mark);
      S.addChild(group,S.createNode({geometry:M.box({w:2.5,h:.015,d:1.9,color:q.color}),position:{x:board.x,y:layout.top+.01,z:board.z}}));
      entries.push({name:q.name,button:`Board ${q.name} · Space`,node,foam,board,seat,home:q,yaw:q.yaw,pitch:0,roll:0,speed:0});
    }
    const obstacles=layout.decks.map(q=>({minX:q.x-q.w/2-RADIUS,maxX:q.x+q.w/2+RADIUS,minZ:q.z-q.d/2-RADIUS,maxZ:q.z+q.d/2+RADIUS,boat:null}));
    // The tower's 10 m footing is protected even though it is distant scenery for walkers.
    const beacon=BL.pierLighthouse.LAYOUT;
    obstacles.push({minX:beacon.x-10-RADIUS,maxX:beacon.x+10+RADIUS,minZ:beacon.z-10-RADIUS,maxZ:beacon.z+10+RADIUS,boat:null});
    for(const b of entries)obstacles.push({minX:b.home.x-RADIUS*2,maxX:b.home.x+RADIUS*2,minZ:b.home.z-RADIUS*2,maxZ:b.home.z+RADIUS*2,boat:b});
    // A small visibility graph is rebuilt only on a return request; all scratch storage is visit-owned.
    const capacity=2+obstacles.length*4,xs=new Float64Array(capacity),zs=new Float64Array(capacity),costs=new Float64Array(capacity),previous=new Int16Array(capacity),visited=new Uint8Array(capacity),path=new Int16Array(capacity);
    const offset=new Float32Array(3),riderTurn=Q.create(),backward=Q.create();Q.fromEuler(backward,0,Math.PI,0);
    let rider=null,pending=null,current=null,jetBefore=false,returning=false,age=0,accumulator=0,pathIndex=-1;
    const clear=(ax,az,bx,bz)=>{
      if(Math.abs(bx)>BOUNDS.x-RADIUS||bz<BOUNDS.minZ+RADIUS||bz>BOUNDS.maxZ-RADIUS)return false;
      for(const r of obstacles)if(r.boat!==current&&intersects(ax,az,bx,bz,r))return false;
      return true;
    };
    const nearby=()=>{
      const a=crew.player;if(!a||a.camp.seat)return null;
      const p=a.root.position;if(Math.abs(p.y-a.baseY-layout.top)>.45)return null;
      let best=null,distance=Infinity;
      for(const b of entries){const d=Math.hypot(p.x-b.board.x,p.z-b.board.z);if(d<2.7&&d<distance){distance=d;best=b;}}
      return best;
    };
    const board=()=>{
      if(rider||pending)return true;
      const b=nearby();if(!b)return false;
      const a=crew.player;if(a.hopV>0){hud.toast("Land on the boat's boarding pad first");return true;}
      current=b;pending=a;age=0;returning=false;jetBefore=!!a.jet;
      crew.setWeaponTrigger(false);crew.steer(0,0,0,0,0);pilot.controls.reset();return true;
    };
    const planReturn=()=>{
      xs[0]=current.node.position.x;zs[0]=current.node.position.z;xs[1]=current.home.x;zs[1]=current.home.z;
      let count=2;for(const r of obstacles)for(let i=0;i<4;i++){xs[count]=i&1?r.maxX+.15:r.minX-.15;zs[count]=i&2?r.maxZ+.15:r.minZ-.15;count++;}
      costs.fill(Infinity);previous.fill(-1);visited.fill(0);costs[0]=0;
      for(let step=0;step<count;step++){
        let n=-1,best=Infinity;for(let i=0;i<count;i++)if(!visited[i]&&costs[i]<best){n=i;best=costs[i];}
        if(n<0)break;if(n===1)break;visited[n]=1;
        for(let i=0;i<count;i++)if(!visited[i]&&clear(xs[n],zs[n],xs[i],zs[i])){const cost=best+Math.hypot(xs[i]-xs[n],zs[i]-zs[n]);if(cost<costs[i]){costs[i]=cost;previous[i]=n;}}
      }
      if(!Number.isFinite(costs[1]))return false;
      let countPath=0;for(let n=1;n!==0;n=previous[n])path[countPath++]=n;pathIndex=countPath-1;return true;
    };
    const requestExit=()=>{
      if(pending){pending=current=null;pilot.controls.reset();pilot.showAct();return true;}
      if(!rider)return false;if(returning)return true;
      if(!planReturn()){hud.toast("Move into open water, then request a return to the dock");return true;}
      returning=true;current.speed=0;pilot.controls.reset();hud.toast("Returning to the pier — stay seated until docked");return true;
    };
    const pose=(b,dt)=>{
      const p=b.node.position,sy=Math.sin(b.yaw),cy=Math.cos(b.yaw),bow=water.heightAt(p.x-sy*1.7,p.z-cy*1.7),stern=water.heightAt(p.x+sy*1.7,p.z+cy*1.7),port=water.heightAt(p.x-cy,p.z+sy),starboard=water.heightAt(p.x+cy,p.z-sy),blend=1-Math.exp(-5*dt);
      p.y+=((bow+stern+port+starboard)/4+.22-p.y)*blend;
      b.pitch+=(Math.max(-.12,Math.min(.12,Math.atan2(bow-stern,3.4)))-b.pitch)*blend;
      b.roll+=(Math.max(-.12,Math.min(.12,Math.atan2(starboard-port,2)))-b.roll)*blend;
      Q.fromEuler(b.node.quaternion,b.pitch,b.yaw,b.roll);
      Q.rotateVec(offset,b.node.quaternion,0,.6,.35);b.seat.x=p.x+offset[0];b.seat.y=p.y+offset[1];b.seat.z=p.z+offset[2];b.seat.ry=b.yaw+Math.PI;
      b.foam.visible=Math.abs(b.speed)>.4;b.foam.position.x=p.x;b.foam.position.y=layout.sea+.035;b.foam.position.z=p.z;b.foam.rotation.y=b.yaw+(b.speed<0?Math.PI:0);b.foam.scale.z=Math.min(1,Math.abs(b.speed)/7);
    };
    const finish=()=>{
      if(!crew.standPlayer(rider))return false;
      if(jetBefore)crew.wearJetpack(rider,BL.hubModels.jetpack(),BL.hubModels.jetFlame());
      rider=current=null;returning=false;accumulator=0;pilot.controls.reset();pilot.showAct();hud.setAreaLabel("OOGA PIER · BOARDWALK");hud.toast("Back on the pier at the boat dock");return true;
    };
    const step=(dt,throttle,steer)=>{
      const b=current,p=b.node.position;
      if(returning){
        if(pathIndex<0){b.speed=0;const turn=Math.atan2(Math.sin(b.home.yaw-b.yaw),Math.cos(b.home.yaw-b.yaw));b.yaw+=turn*Math.min(1,dt*5);if(Math.abs(turn)<.02)finish();return;}
        const i=path[pathIndex],dx=xs[i]-p.x,dz=zs[i]-p.z,d=Math.hypot(dx,dz);
        if(d<.025){p.x=xs[i];p.z=zs[i];b.speed=0;pathIndex--;return;}
        const heading=Math.atan2(-dx,-dz),turn=Math.atan2(Math.sin(heading-b.yaw),Math.cos(heading-b.yaw));b.yaw+=Math.max(-dt*2,Math.min(dt*2,turn));
        if(Math.abs(turn)>.2){b.speed=0;return;}
        b.speed+=(Math.min(7,d*2)-b.speed)*(1-Math.exp(-dt*3));const move=Math.min(d,b.speed*dt),x=p.x+dx/d*move,z=p.z+dz/d*move;
        if(clear(p.x,p.z,x,z)){p.x=x;p.z=z;}else {b.speed=0;returning=false;hud.toast("Return paused — move into open water and try again");}
        return;
      }
      const target=throttle*(throttle<0?3:7);b.speed+=(target-b.speed)*(1-Math.exp(-dt*2));
      b.yaw-=steer*Math.min(1,Math.abs(b.speed)/3)*Math.sign(b.speed)*dt*.9;
      const x=p.x-Math.sin(b.yaw)*b.speed*dt,z=p.z-Math.cos(b.yaw)*b.speed*dt;
      if(clear(p.x,p.z,x,z)){p.x=x;p.z=z;}else b.speed=0;
    };
    const update=dt=>{
      if(pending){
        age+=dt;
        if(crew.player!==pending||nearby()!==current||age>.75){pending=current=null;pilot.controls.reset();hud.toast("Stand on the boat's boarding pad");}
        else if(crew.sitPlayer(current.seat)){rider=pending;pending=null;accumulator=0;pilot.showAct();pilot.orbit.yaw=pilot.orbit.tYaw=current.yaw;pilot.orbit.pitch=pilot.orbit.tPitch=.3;pilot.orbit.dist=pilot.orbit.tDist=9;hud.setAreaLabel(`OOGA PIER · ${current.name.toUpperCase()}`);hud.hint("W/S or ↑/↓: throttle · A/D or ←/→: steer\nSpace / Escape: return to dock · Touch: left stick to sail",10000);}
      }
      if(rider){
        const axes=pilot.controls.read();accumulator=Math.min(accumulator+dt,STEP*4);
        while(accumulator>=STEP&&rider){accumulator-=STEP;step(STEP,axes.y,axes.x);}
      }
      for(const b of entries)pose(b,dt);
      if(rider){
        const b=current,seat=b.seat,p=rider.root.position;p.x=seat.x;p.y=seat.y+rider.traits.height*.08;p.z=seat.z;
        Q.multiply(riderTurn,b.node.quaternion,backward);rider.root.quaternion=riderTurn;rider.root.rotation.y=seat.ry;rider.hop=rider.hopV=0;
        hud.setAct(returning?"RETURNING TO DOCK":"RETURN TO DOCK");
      }
    };
    // Ownership loss and scene teardown recover at the same validated dock, never in deep water.
    const recover=()=>{
      pending=null;if(rider){current.node.position.x=current.home.x;current.node.position.z=current.home.z;current.yaw=current.home.yaw;current.speed=0;pose(current,0);finish();}
      current=rider=null;returning=false;accumulator=0;for(const b of entries)b.seat.sitter=null;
    };
    return {entries,dock,board,near:()=>!!nearby(),nearest:nearby,requestExit,update,recover,
      ownsSeat:seat=>{for(const b of entries)if(b.seat===seat)return true;return false;},
      get riding(){return !!(rider||pending);},get boarding(){return !!pending;},get returning(){return returning;},
      get label(){return pending?"Boarding boat…":rider?(returning?"Returning to dock…":"Return to dock · Space"):(nearby()?.button||"Board boat · Space");},
      dispose:()=>{recover();S.removeChild(root,group);}};
  };
  BL.pierBoats={create,BOUNDS,BERTHS};
})();
