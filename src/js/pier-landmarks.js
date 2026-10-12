// A raised carousel hall leaves a real, connected marine room beneath it.
// Venue-sized cached shells keep doors, stair landings and coastal views open at canonical body scale.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,cache=new Map(),TAU=Math.PI*2;
  const box=(x,y,z,w,h,d,color)=>M.moved(M.box({w,h,d,color}),x,y,z);
  const cached=(key,build)=>{if(!cache.has(key))cache.set(key,build());return cache.get(key);};
  const rail=(p,x0,y0,z0,x1,y1,z1)=>{
    p.push(M.beam(x0,y0+1.05,z0,x1,y1+1.05,z1,.1,"#e8dfc4"));
    const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/1.5);
    for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,z=z0+(z1-z0)*t;p.push(M.beam(x,y,z,x,y+1.12,z,.09,"#3f8493"));}
  };
  const arch=(p,x,z,base,r)=>{
    for(let i=0;i<12;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;p.push(M.beam(x,base+Math.sin(a)*r,z+Math.cos(a)*r,x,base+Math.sin(b)*r,z+Math.cos(b)*r,.12,"#387f8a"));}
  };
  const hall=q=>cached("hippodrome",()=>{
    const p=[],w=q.w/2,d=q.d/2,wall=q.wall,h=6.8,cream="#f1cda0",blue="#367f8a";
    // Closed strips instead of a building-sized box: every doorway really opens into the room.
    const side=(x,holes)=>{
      let at=-d;
      for(const [lo,hi,door] of [...holes,[d,d,true]]){
        if(lo>at)p.push(box(x,h/2,(at+lo)/2,wall,h,lo-at,cream));
        if(hi>lo){if(!door)p.push(box(x,.55,(lo+hi)/2,wall,1.1,hi-lo,cream));p.push(box(x,5.65,(lo+hi)/2,wall,2.3,hi-lo,cream));arch(p,x+(x>0?.18:-.18),(lo+hi)/2,3,(hi-lo)/2);}
        at=hi;
      }
    };
    side(w,[[-6.5,-3.5,false],[-1.8,1.8,false],[4.2,7.8,true]]);side(-w,[[-6,-3,false],[3,6,false]]);
    for(const z of [-d,d]){
      p.push(box(0,.55,z,q.w,1.1,wall,cream),box(0,5.65,z,q.w,2.3,wall,cream));
      for(const x of [-w+.7,-6,0,6,w-.7])p.push(box(x,2.8,z,.5,3.4,wall,cream));
      for(const y of [1.1,4.55,6.7])p.push(box(0,y,z,q.w+.3,.13,.4,blue));
    }
    // A closed roof starts above the unchanged 6.6 m carousel canopy.
    p.push(box(0,6.9,0,q.w+.6,.2,q.d+.6,"#c97b51"));
    const roof={verts:[-w-.4,7,-d-.4,w+.4,7,-d-.4,w+.4,7,d+.4,-w-.4,7,d+.4,0,q.height,0],faces:[],lines:[]};
    for(let i=0;i<4;i++)roof.faces.push({i:[i,4,(i+1)%4],color:BL.math.hexToRgb(i%2?"#b96145":"#ca7a55")});roof.faces.push({i:[0,1,2,3],color:BL.math.hexToRgb("#b96145")});p.push(roof);
    for(const x of [-w+.6,w-.6])for(const z of [-d+.6,d-.6]){
      p.push(box(x,6.9,z,1.4,.3,1.4,blue),M.moved(M.lathe({profile:[[.7,7],[.8,7.3],[.65,7.7],[.3,8],[0,8.35]],segments:12,color:"#d6ad6c"}),x,0,z));
    }
    p.push(M.moved(M.turnedY(BL.pierDetails.shopSign("LOOFF HIPPODROME",1),Math.PI/2),w+.35,5.5,0));
    return M.merge(...p);
  });
  const basement=(q,a)=>cached("aquarium-shell",()=>{
    const p=[],w=q.w/2,d=q.d/2,h=q.floor-.4-a.floor,wall=q.wall,stone="#85b8ba";
    p.push(box(0,h+.2,0,q.w,.4,q.d,"#d9b788"));
    p.push(box(-w,h/2,0,wall,h,q.d,stone),box(0,h/2,-d,q.w,h,wall,stone));
    const doorway=(axis,at,centre,length,gap)=>{
      for(const side of [-1,1]){
        const lo=side<0?-length/2:centre+gap/2,hi=side<0?centre-gap/2:length/2;
        p.push(axis==="x"?box(at,h/2,(lo+hi)/2,wall,h,hi-lo,stone):box((lo+hi)/2,h/2,at,hi-lo,h,wall,stone));
      }
      p.push(axis==="x"?box(at,(h+2.6)/2,centre,wall,h-2.6,gap,stone):box(centre,(h+2.6)/2,at,gap,h-2.6,wall,stone));
    };
    doorway("x",w,a.entry.z-q.z,q.d,a.entry.w);doorway("z",d,0,q.w,a.beach.w);
    return M.merge(...p);
  });
  const tank=(w,d)=>{
    const p=[box(0,.28,0,w,.56,d,"#3c737d"),box(0,1.45,-d/2+.08,w,1.8,.16,"#145b78"),box(0,2.4,0,w,.12,d,"#e9d5ae")];
    for(const x of [-w/2,w/2])p.push(box(x,1.45,0,.14,1.85,d,"#3b8996"));
    for(let i=0;i<5;i++){
      const x=(i-2)*w*.15,y=.95+(i%3)*.35;
      p.push(M.moved(M.lathe({profile:[[0,-.1],[.2,0],[0,.1]],segments:8,color:i%2?"#f6c456":"#df8c81"}),x,y,0),M.beam(x,.6,-d*.2,x+.12,1.3+i*.1,-d*.2,.06,"#568b66"));
    }
    const g=M.merge(...p);g.collisionGeometry=M.box({w,h:2.46,d,color:"#3c737d",offset:{x:0,y:1.23,z:0}});return g;
  };
  const access=(q,a,top)=>cached("hippodrome-access",()=>{
    const p=[],st=q.stair,n=st.steps,run=(st.x0-st.x1)/n,rise=(q.floor-top)/n;
    for(let i=0;i<n;i++)p.push(box(st.x0-(i+.5)*run,top+(i+1)*rise/2,st.z,run,(i+1)*rise,st.w,"#d2bb97"));
    for(const side of [-1,1])rail(p,st.x0,top,st.z+side*st.w/2,st.x1,q.floor,st.z+side*st.w/2);
    const e=a.entry,g={verts:[],faces:[],lines:[]};
    // Closed sloping shell, just like the canonical beach ramps, never a solid half-space.
    for(const y of [0,-.18])g.verts.push(e.x0,top+y,e.z-e.w/2,e.x0,top+y,e.z+e.w/2,e.x1,a.floor+y,e.z-e.w/2,e.x1,a.floor+y,e.z+e.w/2);
    for(const ids of [[0,2,1],[1,2,3],[4,5,6],[5,7,6],[0,1,5,4],[2,6,7,3],[0,4,6,2],[1,3,7,5]])g.faces.push({i:ids,color:BL.math.hexToRgb("#c4c8b9")});p.push(g);
    for(const side of [-1,1])rail(p,e.x0,top,e.z+side*e.w/2,e.x1,a.floor,e.z+side*e.w/2);
    const b=a.beach;
    // Guard the two lowered entrance edges; their open ends meet sand and the marine room.
    for(const side of [-1,1])rail(p,b.x+side*b.w/2,top,b.z0,b.x+side*b.w/2,top,95);
    return M.merge(...p);
  });
  const venue=(id,q)=>cached(id,()=>{
    const p=[],trim=id==="playland"?"#2a849b":"#edaa39",wall=id==="playland"?"#e18f87":"#f2dcaf",h=q.h;
    const body=box(0,h/2,0,q.w,h,q.d,wall);
    if(id==="playland"){
      // The facade stays the same solid shell; short front faces stop Canvas painting
      // a building-sized polygon across its windows and the porch game's header.
      const front=body.faces.splice(2,1)[0],x=q.w/2;
      for(let y=0;y<h;y+=1)for(let z=-q.d/2;z<q.d/2;z+=1){const y1=Math.min(h,y+1),z1=Math.min(q.d/2,z+1),n=body.verts.length/3;body.verts.push(x,y,z1,x,y,z,x,y1,z,x,y1,z1);body.faces.push({...front,i:[n,n+1,n+2,n+3]});}
    }
    p.push(body,box(0,h+.12,0,q.w+.4,.24,q.d+.4,trim));
    for(const z of [-q.d/2,q.d/2])p.push(box(0,.22,z,q.w,.44,.13,trim));
    for(let z=-q.d/2+3;z<q.d/2;z+=6)p.push(BL.pierDetails.facade(q.w/2+.03,z,5.5,1,0,trim));
    for(let z=-q.d/2+.5;z<q.d/2;z+=1)p.push(box(q.w/2+.8,3.4,z,1.6,.1,1,Math.round(z*2)%2?"#fff0d4":trim));
    p.push(M.moved(M.turnedY(BL.pierDetails.shopSign(id==="playland"?"PLAYLAND ARCADE":"SUNSET SEAFOOD",id==="playland"?5:4),Math.PI/2),q.w/2+.5,h-.4,0));
    // Low rooftop fins distinguish the arcade; the restaurant keeps a golden coastal cornice.
    if(id==="playland")for(const x of [-q.w/2+.5,q.w/2-.5])p.push(box(x,h+.8,0,.4,1.2,q.d,trim));
    return M.merge(...p);
  });
  const gym=q=>cached("muscle-beach",()=>{
    const p=[];
    for(const x of [-7,1,8]){
      for(const z of [-4,4])p.push(M.beam(x,0,z,x,3.8,z,.16,"#548faa"));
      p.push(M.beam(x,3.8,-4,x,3.8,4,.15,"#f2deba"));
      for(const z of [-1.2,1.2])p.push(M.beam(x,3.8,z,x,2.1,z,.035,"#bf9b6c"),M.moved(M.turnedZ(M.torus(.25,.035,"#caa069",0,16,5),Math.PI/2),x,1.85,z));
    }
    for(const x of [-4,-2])p.push(M.beam(x,0,-5,x,1.1,-5,.13,"#548faa"),M.beam(x,0,5,x,1.1,5,.13,"#548faa"),M.beam(x,1.1,-5,x,1.1,5,.13,"#548faa"));
    p.push(M.moved(BL.hubModels.postSign("MUSCLE BEACH",.5,1.3),0,0,7));return M.merge(...p);
  });
  const build=layout=>{
    const root=S.createNode(),solid=S.createNode(),lamps=[],venues=[];const q=layout.hippodrome,a=layout.aquarium;
    const place=(parent,geometry,x,y,z)=>{const node=S.createNode({geometry,position:{x,y,z}});S.addChild(parent,node);return node;};
    const upper=place(solid,hall(q),q.x,q.floor,q.z),lower=place(solid,basement(q,a),q.x,a.floor,q.z);
    place(solid,access(q,a,layout.top),0,0,0);
    // A thin decorative floor sits above the original sand support, avoiding coplanar faces.
    place(root,cached("aquarium-floor",()=>box(0,.004,0,q.w-.4,.006,q.d-.4,"#e4d9bd")),q.x,a.floor,q.z);
    for(const [x,z,w,d] of a.tanks){
      place(solid,cached(`tank-${w}-${d}`,()=>tank(w,d)),x,a.floor,z);
      const glass=cached(`glass-${w}-${d}`,()=>{const g=box(0,1.45,d/2,w,1.8,.025,"#b5e0dd");g.glassOpacity=.13;g.castShadow=false;return g;});place(root,glass,x,a.floor,z);
    }
    const sign=BL.hubModels.postSign("PIER AQUARIUM",.5,0);
    place(root,cached("aquarium-east-sign",()=>M.turnedY(M.merge(sign),Math.PI/2)),q.x+q.w/2+.2,a.floor+2.62,a.entry.z);
    place(root,sign,q.x,a.floor+2.62,q.z+q.d/2+.2);
    const ceilingGlow=cached("aquarium-lamps",()=>M.merge(...[-7,0,7].map(x=>box(x,2.8,0,1.4,.04,.25,"#ffdaa3"))));
    for(const f of ceilingGlow.faces)f.emissive=.8;lamps.push(place(root,ceilingGlow,q.x,a.floor,q.z));
    for(const id of ["playland","restaurants"]){const v=layout[id],node=place(solid,venue(id,v),v.x,layout.top,v.z);venues.push({id,node,layout:v});}
    for(const [x,z] of layout.restaurants.seating)place(solid,BL.pierDetails.cafe(),x,layout.top,z);
    const r=layout.route66;
    const photo=cached("route66",()=>{
      const p=[M.moved(BL.hubModels.postSign("ROUTE 66",.8,2.1),0,0,0),M.moved(BL.hubModels.postSign("END OF THE TRAIL",.65,1.25),0,0,.06),M.moved(BL.hubModels.postSign("21 000 000 2140",.5,.55),0,0,.12)];
      // Punctuation occupies the shared sign's space cells; its alphabet has no comma or middle dot.
      for(const x of [-.65625,-.13125])p.push(box(x,.74,.25,.034,.034,.035,"#f6ecd2"),box(x-.008,.712,.25,.018,.024,.035,"#f6ecd2"));
      p.push(box(1.5,1.5945,.229,.04,.04,.035,"#f6ecd2"),box(.39375,.815,.25,.034,.034,.035,"#f6ecd2"));return M.merge(...p);
    });place(solid,photo,r.x,layout.top,r.z);
    const g=layout.muscleBeach;place(solid,gym(g),g.x,BL.pierBeach.LAYOUT.sand,g.z);
    for(let i=0;i<layout.dressing.length;i++){
      const at=layout.dressing[i],bake=cached(`dressing-${i}`,()=>{
        const set=BL.dressing.set();for(const [kind,x,z,turn] of at.items)set.put(kind,x,0,z,turn);
        for(const c of at.cables)set.cable(...c,.45,[.15,.35,.55,.75,.9],"bulb",0);return set.build();
      });
      for(const node of BL.dressing.nodes(bake)){node.position.x=at.x;node.position.y=layout.top;node.position.z=at.z;S.addChild(node.geometry===bake.solid?solid:root,node);if(node.geometry!==bake.solid)lamps.push(node);}
    }
    const roomLights=new Float32Array(24);for(let i=0;i<3;i++)roomLights.set([q.x+(i-1)*7,a.floor+2.65,q.z,8,.25,.38,.4,0],i*8);
    const update=(night,lighting,eye,player)=>{
      for(const node of lamps)node.glow=.15+night*.7;
      if(!lighting?.lights)return;
      const p=player?.root.position||eye,feet=player?p.y-player.baseY:p?.y;
      const inside=p&&Math.abs(p.x-q.x)<q.w/2+2&&Math.abs(p.z-q.z)<q.d/2+2&&feet<q.floor-.4;
      lighting.lightCount=inside?6:3;if(inside)lighting.lights.set(roomLights,24);
    };update(0);
    return {root,solid,upper,lower,venues,lamps,update};
  };
  BL.pierLandmarks={build};
})();
