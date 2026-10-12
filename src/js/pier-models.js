// Coastal boardwalk: one authored layout owns deck geometry, support and storefront proportions.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models;
  const coast=BL.pierBeach.LAYOUT;
  // Ground distances use one unit per metre; body, prop and ride geometry keep DSB's scale.
  // The map estimates and historic bridge dimensions are recorded in docs/ooga-pier-survey.md.
  // Arrive far enough back to see the complete arch; the return portal stays off the walking axis.
  const LAYOUT={top:1.35,sea:-.3,spawn:{x:0,y:coast.upland,z:284},gate:{x:-14,y:coast.upland,z:274},entrance:{x:0,y:coast.upland,z:258},
    bounds:{x:300,minZ:-372,maxZ:310},bridge:coast.bridge,tip:-270,
    decks:[{id:"arrival",x:-34,z:50,w:82,d:90},{id:"boardwalk",x:0,z:-199,w:14,d:120},{id:"carnival",x:-28,z:-67,w:70,d:144},{id:"lookout",x:0,z:-264.5,w:38,d:11},{id:"boats",x:22.5,z:-264.5,w:9,d:11}],
    shops:[[-10,64,6,7,4.6,"#edc99e","#287b99"],[-10,34,6,8,4.4,"#f3ede0","#efa928"],[-10,5,6,8,5,"#a6d9e4","#eeb02f"],[-10,-28,6,7,4.8,"#79c5d6","#f3ede0"],[-10,-121,6,8,4.5,"#f4d7b0","#287b99"]],
    wheel:{x:-48,z:-110,board:{x:-48,z:-106}},
    coaster:{x:-24,z:-76,board:{x:-13,z:-76}},
    hippodrome:{x:-25,z:80,w:24,d:18,floor:3.65,height:7.8,wall:.3,
      stair:{x0:-6,x1:-13,z:86,w:3,steps:10},
      hole:{x0:-37.2,x1:-12.8,z0:70.8,z1:89.2}},
    aquarium:{floor:.35,entry:{x0:-6,x1:-13,z:76,w:3.4},
      beach:{x:-25,z0:89,z1:101,w:4},tanks:[[-32,74,6,2],[-32,85,6,2],[-18,84,3,2]]},
    park:{ship:{x:-49,z:-79,w:18,d:24},scrambler:{x:-49,z:-53,w:16,d:16},drop:{x:-49,z:-126,w:10,d:12,height:22},bumper:{x:-47,z:-1,w:20,d:18},entrance:{x:-34,z:-34,w:8,d:2}},
    playland:{x:-56,z:44,w:20,d:24,h:4.8},restaurants:{x:-59,z:78,w:20,d:16,h:4.8,seating:[[-44,72],[-44,77],[-44,82]]},
    route66:{x:-19,z:63,w:4,d:4},fishing:{x:-13,z:-264.5,w:8,d:7,people:[[-15,-266.5],[-15,-263]],play:{x:-11,z:-264.5},sign:{x:-16.8,z:-261.4},ry:Math.PI/2,castDistance:14,camera:{back:9,height:9.5,look:6}},
    builder:{x:32,z:76,w:7,d:11,floor:coast.sand,play:{x:32,z:81},sign:{x:28.8,z:74.5}},
    whack:{x:-44.2,z:44,floor:1.35,play:{x:-40.8,z:44}},
    // The Surf Shop's counter on the plaza and the hall of fame board by the prize counter.
    shop:{x:-21.5,z:46,floor:1.35,play:{x:-24.6,z:46}},fame:{x:-37,z:21,ry:0},jobs:{x:-8,z:52,floor:1.35,play:{x:-8,z:54.6}},
    seedMatch:{x:-43.45,z:53,floor:1.35,play:{x:-40.8,z:53}},
    volley:{x:coast.courts[3],z:coast.courtZ,floor:coast.sand,play:{x:coast.courts[3],z:coast.courtZ-10}},
    muscleBeach:{x:90,z:76,w:24,d:18},
    coastalTowers:[{x:-200,z:-22,variant:0},{x:200,z:-22,variant:1}],
    dressing:[{x:-60,z:-38,items:[["bench",0,0,0],["barrel",0,3,0]],cables:[[-1,4.7,-2,18,4.7,-2]]},
      {x:-46,z:24,items:[["bench",0,0,1],["barrel",0,3,0]],cables:[[-20,4.7,0,5,4.7,0]]},
      {x:-55,z:67,items:[["bench",0,0,0],["barrel",3,0,0]],cables:[[-14,4.7,0,12,4.7,0]]},
      {x:9,z:-266,items:[["barrel",0,0,0]],cables:[]}],
    backdrop:{bluff:{x:0,z:330,w:600,d:18,h:3.2},palms:[[-300,324],[-240,324],[-180,324],[-120,324],[-60,324],[60,324],[120,324],[180,324],[240,324],[300,324]],
      ridges:[{id:"mountains",x:-700,z:450,w:750,d:280,h:95,color:"#9e9bb0"},{id:"palos",x:760,z:-270,w:400,d:300,h:45,color:"#a2a3b2"},{id:"catalina",x:480,z:-1200,w:430,d:130,h:24,color:"#acacbd"}]},
    views:{"pier-park":{yaw:.65,pitch:.65,dist:115,target:{x:-39,y:1.35,z:-67}},"pier-hippodrome":{yaw:1.05,pitch:.45,dist:60,target:{x:-25,y:3.65,z:80}},"pier-tip":{yaw:.65,pitch:.45,dist:70,target:{x:0,y:1.35,z:-264.5}},"pier-aquarium":{yaw:Math.PI/2,pitch:.14,dist:7,target:{x:-27,y:1.15,z:80}}},
    games:[{id:"ring",label:"Ring toss",x:-24,z:2,ry:-Math.PI/2,play:{x:-28,z:2}},{id:"basket",label:"Basketball",x:-24,z:-18,ry:-Math.PI/2,play:{x:-28,z:-18}}],
    prizes:{x:-42,z:14,play:{x:-45,z:14}},
    carnival:[{x:-50,z:-34,w:6,d:5,h:4.4},{x:-50,z:-16,w:6,d:5,h:4.4}]};
  const bumper=LAYOUT.park.bumper;
  // The Proof-of-Work Bell stands on the forecourt, beside the lane a new visitor walks down.
  LAYOUT.bell={x:-6.9,y:coast.upland+.06,z:266,play:{x:-5.2,z:267.2}};
  // Racks of wheels a visitor may take: by the arch, where the bridge meets the deck, on the bike trail and in
  // the park. A rack runs along its local x; what stands in it faces the rack's yaw. Heights are found at build.
  LAYOUT.wheelRacks=[{x:7.4,y:coast.upland,z:268.5,yaw:-Math.PI/2,kinds:["bike","bike","board"]},{x:5.4,y:LAYOUT.top,z:83,yaw:-Math.PI/2,kinds:["bike","board"]},
    {x:26,y:coast.sand,z:127.6,yaw:Math.PI,kinds:["bike","bike"]},{x:-22,y:LAYOUT.top,z:-41,yaw:Math.PI/2,kinds:["bike","board"]}];
  // Two pier carts stand on their own, on the plaza and at the far end of the park.
  LAYOUT.wheels=[{kind:"cart",x:-40,y:LAYOUT.top,z:33,yaw:Math.PI},{kind:"cart",x:-10,y:LAYOUT.top,z:-128,yaw:-Math.PI/2}];
  for(const r of LAYOUT.wheelRacks)for(let i=0;i<r.kinds.length;i++){const lx=(i-(r.kinds.length-1)/2)*.74;LAYOUT.wheels.push({kind:r.kinds[i],x:r.x+Math.cos(r.yaw)*lx,y:r.y,z:r.z-Math.sin(r.yaw)*lx,yaw:r.yaw});}
  LAYOUT.mayhem={x:bumper.x,z:bumper.z,halfX:bumper.w/2-2,halfZ:bumper.d/2-2,play:{x:bumper.x+bumper.w/2+2.5,z:bumper.z},sign:{x:bumper.x+bumper.w/2+2.5,z:bumper.z+4}};
  LAYOUT.views["pier-mayhem"]={yaw:.6,pitch:.55,dist:40,target:{x:bumper.x,y:LAYOUT.top+1,z:bumper.z}};
  LAYOUT.carousel={x:LAYOUT.hippodrome.x,z:LAYOUT.hippodrome.z,floor:LAYOUT.hippodrome.floor,board:{x:LAYOUT.hippodrome.x+7,z:LAYOUT.hippodrome.z}};
  LAYOUT.views["pier-fishing"]={yaw:2.15,pitch:.4,dist:25,target:{x:LAYOUT.fishing.play.x,y:LAYOUT.top,z:LAYOUT.fishing.play.z}};
  LAYOUT.views["pier-builder"]={yaw:-.55,pitch:.6,dist:27,target:{x:LAYOUT.builder.x,y:coast.sand+1,z:LAYOUT.builder.z}};
  LAYOUT.views["pier-whack"]={yaw:Math.PI/2+.2,pitch:.4,dist:22,target:{x:LAYOUT.whack.x,y:LAYOUT.top+1.5,z:LAYOUT.whack.z}};
  LAYOUT.views["pier-seed-match"]={yaw:Math.PI/2+.15,pitch:.45,dist:19,target:{x:LAYOUT.seedMatch.x,y:LAYOUT.top+1.4,z:LAYOUT.seedMatch.z}};
  LAYOUT.views["pier-volley"]={yaw:Math.PI,pitch:.6,dist:28,target:{x:LAYOUT.volley.x,y:coast.sand+1,z:LAYOUT.volley.z}};
  // Subtract the basement and its two entrances from the actual deck, seams and bents.
  // Closed slab pieces still use solid-props' normal layered support; no movement rule changes.
  const a=LAYOUT.aquarium,e=a.entry,b=a.beach;
  const cuts=[LAYOUT.hippodrome.hole,{x0:e.x1-.2,x1:e.x0,z0:e.z-e.w/2,z1:e.z+e.w/2},{x0:b.x-b.w/2,x1:b.x+b.w/2,z0:b.z0,z1:95},
    {x0:bumper.x-bumper.w/2,x1:bumper.x+bumper.w/2,z0:bumper.z-bumper.d/2,z1:bumper.z+bumper.d/2}];
  const pieces=(x0,x1,z0,z1)=>{
    let rows=[{x0,x1,z0,z1}];
    for(const c of cuts){const next=[];for(const r of rows){
      const l=Math.max(c.x0,r.x0),h=Math.min(c.x1,r.x1),lo=Math.max(c.z0,r.z0),hi=Math.min(c.z1,r.z1);
      if(l>=h||lo>=hi){next.push(r);continue;}
      if(r.x0<l)next.push({x0:r.x0,x1:l,z0:r.z0,z1:r.z1});if(h<r.x1)next.push({x0:h,x1:r.x1,z0:r.z0,z1:r.z1});
      if(r.z0<lo)next.push({x0:l,x1:h,z0:r.z0,z1:lo});if(hi<r.z1)next.push({x0:l,x1:h,z0:hi,z1:r.z1});
    }rows=next;}return rows;
  };
  // Static scenery is baked once a page: one mesh per kind of thing on each deck and a pair per storefront,
  // so a deck's rail posts are one draw and one collision entry instead of one for each post.
  const bakes=new Map(),baked=(key,make)=>{let g=bakes.get(key);if(!g){g=make();bakes.set(key,g);}return g;};
  const boxGeo=(w,h,d,color)=>baked(`box|${w}|${h}|${d}|${color}`,()=>M.box({w,h,d,color}));
  const part=(x,y,z,w,h,d,color)=>M.moved(M.box({w,h,d,color}),x,y,z);
  const exposed=(x,z,own)=>!(own.id==="arrival"&&z>=89&&z<=95&&(x<own.x-own.w/2+1||x>own.x+own.w/2-1))&&!LAYOUT.decks.some(q=>q!==own&&x>q.x-q.w/2&&x<q.x+q.w/2&&z>q.z-q.d/2&&z<q.z+q.d/2);
  const deck=q=>baked(`deck|${q.id}`,()=>{
    const slab=[],seams=[],rails=[],posts=[],supports=[],piles=[];
    // The pavilion's existing 16 cm floor replaces the slab beneath it; avoid buried Canvas faces.
    for(const p of pieces(q.x-q.w/2,q.x+q.w/2,q.z-q.d/2,q.z+q.d/2))slab.push(part((p.x0+p.x1)/2,LAYOUT.top-.2,(p.z0+p.z1)/2,p.x1-p.x0,.4,p.z1-p.z0,"#b99062"));
    // Plank seams do not change the support surface.
    for(let z=q.z-q.d/2+.8;z<q.z+q.d/2;z+=1.6){const runs=pieces(q.x-q.w/2+.05,q.x+q.w/2-.05,z-.0125,z+.0125);for(const p of runs)seams.push(part((p.x0+p.x1)/2,LAYOUT.top+.003,(p.z0+p.z1)/2,p.x1-p.x0,.006,p.z1-p.z0,"#74583d"));}
    for(const x of [q.x-q.w/2+.3,q.x+q.w/2-.3]){
      let start=null;
      for(let z=q.z-q.d/2;z<=q.z+q.d/2;z+=.5){
        const open=z<q.z+q.d/2&&exposed(x,z+.25,q);
        if(open&&start===null)start=z;
        if(!open&&start!==null){rails.push(part(x,LAYOUT.top+1,(start+z)/2,.14,.16,z-start,"#dac6a0"));start=null;}
      }
      for(let z=q.z-q.d/2+.5;z<q.z+q.d/2;z+=4){
        if(!exposed(x,z,q))continue;
        posts.push(part(x,LAYOUT.top+.6,z,.2,1.2,.2,"#8e6949"));
        // Weathered, banded piles and diagonal braces stay entirely below the walk surface.
        piles.push(x,z);
        if(z+4<q.z+q.d/2&&exposed(x,z+4,q)){
          supports.push(M.beam(x,LAYOUT.top-.42,z,x,LAYOUT.top-.42,z+4,.22,"#96734f"),M.beam(x,LAYOUT.top-1.5,z,x,LAYOUT.top-.42,z+4,.15,"#74573e"),M.beam(x,LAYOUT.top-.42,z,x,LAYOUT.top-1.5,z+4,.15,"#74573e"));
        }
      }
    }
    // Transverse bents reveal the structure beneath the wider decks from the water and rides.
    for(let z=q.z-q.d/2+2;z<q.z+q.d/2;z+=8){const runs=q.id==="arrival"?pieces(q.x-q.w/2+.3,q.x+q.w/2-.3,z-.14,z+.14):[{x0:q.x-q.w/2+.3,x1:q.x+q.w/2-.3}];for(const p of runs)supports.push(M.beam(p.x0,LAYOUT.top-.32,z,p.x1,LAYOUT.top-.32,z,.28,"#73583e"));}
    // End rails follow the footprint union. The bridge and beach ramp cut open the arrival edge.
    for(const side of [-1,1]){
      const z=q.z+side*q.d/2;let start=null;
      for(let x=q.x-q.w/2;x<=q.x+q.w/2;x+=.5){
        const rear=q.id==="arrival"&&side===1,opening=rear&&(Math.abs(x+.25)<LAYOUT.bridge.width/2+.1||Math.abs(x+.25+35)<3.5||Math.abs(x+.25-b.x)<b.w/2+.2);
        const open=x<q.x+q.w/2&&!opening&&exposed(x+.25,z+side*.05,q);
        if(open&&start===null)start=x;
        if(!open&&start!==null){rails.push(part((start+x)/2,LAYOUT.top+1,z,x-start,.16,.14,"#dac6a0"));for(let p=start+.2;p<x;p+=4)posts.push(part(p,LAYOUT.top+.6,z,.2,1.2,.2,"#8e6949"));start=null;}
      }
    }
    const one=parts=>parts.length?M.merge(...parts):null;
    return {slab:one(slab),seams:one(seams),rails:one(rails),posts:one(posts),supports:one(supports),piles};
  });
  const store=(index,x,z,w,d,h,color,trim,label,kind,signStyle)=>baked(`store|${index}`,()=>{
    const direction=x<0?1:-1,face=x+direction*(w/2+.025),solid=[],decor=[];
    solid.push(part(x,LAYOUT.top+h/2,z,w,h,d,color),part(x,LAYOUT.top+h+.12,z,w+.4,.24,d+.4,trim));
    for(const y of [.4,h-.12])decor.push(part(x,LAYOUT.top+y,z,w+.18,.13,d+.18,trim));
    decor.push(BL.pierDetails.facade(face,z,d,direction,LAYOUT.top,trim));
    // The ends face approaching walkers: repeat the coastal arches around the corners.
    for(const side of [-1,1])decor.push(M.moved(M.turnedY(BL.pierDetails.facade(0,0,w*.92,1,LAYOUT.top,trim),side<0?Math.PI/2:-Math.PI/2),x,0,z+side*(d/2+.03)));
    for(let dz=-d/2+.45;dz<d/2;dz+=.85)decor.push(part(face+direction*.08,LAYOUT.top+h-.3,z+dz,.23,.24,.13,trim));
    for(const dz of [-d/2+.15,d/2-.15])decor.push(part(face+direction*.035,LAYOUT.top+1.7,z+dz,.16,3.4,.18,trim));
    if(kind>=0)solid.push(M.moved(M.turnedY(BL.pierDetails.shopDetail(kind,d,h,trim),direction<0?Math.PI:0),face,LAYOUT.top,z));
    // Striped canvas is a roof and valance, above the shared head-clearance limit.
    for(let i=0;i<8;i++){
      const stripe=i%2?trim:"#fff0d6",sz=z-d/2+(i+.5)*d/8;
      solid.push(M.moved(M.turnedZ(M.box({w:1.4,h:.1,d:d/8,color:stripe}),-direction*.12),face+direction*.55,LAYOUT.top+3.45,sz));
      decor.push(part(face+direction*1.23,LAYOUT.top+3.28,sz,.05,.22,d/8,stripe));
    }
    const sign=BL.pierDetails.shopSign(label,signStyle),signY=LAYOUT.top+Math.max(4.1,h-.65),signOut=kind===1?.95:.48;
    // The board's rear clears the full cornice/bracket depth, or the balcony rail.
    // Short stand-offs terminate behind the opaque face and stay above the awning.
    for(const side of [-1,1])decor.push(part(face+direction*(signOut-.16),signY,z+side*sign.signWidth*.87*.35,.22,.14,.1,trim));
    return {solid:M.merge(...solid),decor:M.merge(...decor),sign,at:{x:face+direction*signOut,y:signY,z},yaw:direction*Math.PI/2};
  });
  const build=()=>{
    const root=S.createNode(),solid=S.createNode();S.addChild(root,solid);
    const box=(parent,x,y,z,w,h,d,color)=>{const n=S.createNode({geometry:boxGeo(w,h,d,color),position:{x,y,z}});S.addChild(parent,n);return n;};
    const sea=box(root,0,LAYOUT.sea-.2,0,650,.4,650,"#398f9f");sea.sightHidden=true;
    for(const q of LAYOUT.decks){
      const g=deck(q);
      for(const geometry of [g.slab,g.rails,g.posts])if(geometry)S.addChild(solid,S.createNode({geometry}));
      for(const geometry of [g.seams,g.supports])if(geometry)S.addChild(root,S.createNode({geometry}));
      for(let i=0;i<g.piles.length;i+=2)S.addChild(root,S.createNode({geometry:BL.pierDetails.piling(),position:{x:g.piles[i],y:LAYOUT.top,z:g.piles[i+1]}}));
    }
    let stores=0;const signs=[],lamps=[];
    const storefront=(x,z,w,d,h,color,trim,label,kind=-1,signStyle=0)=>{
      const g=store(stores++,x,z,w,d,h,color,trim,label,kind,signStyle);
      S.addChild(solid,S.createNode({geometry:g.solid}));S.addChild(root,S.createNode({geometry:g.decor}));
      const sign=S.createNode({geometry:g.sign,position:{x:g.at.x,y:g.at.y,z:g.at.z},rotation:{x:0,y:g.yaw,z:0},scale:{x:.87,y:.87,z:.87}});S.addChild(root,sign);signs.push(sign);
    };
    const labels=["SURF SHOP","SALT WATER","SWEET TREATS","PIER GIFTS","OCEAN CAFE"];
    LAYOUT.shops.forEach((q,i)=>storefront(...q,labels[i],i<3?i:-1,i));
    LAYOUT.carnival.forEach((q,i)=>storefront(q.x,q.z,q.w,q.d,q.h,i?"#30b9bd":"#f47e69",i?"#ffd050":"#387aa8",i?"CARNIVAL GIFTS":"MIDWAY SNACKS",-1,i?6:5));
    // Furniture stays west of the shop row, clear of the coastal promenade and train envelope.
    for(const [x,z] of [[-16,19],[-16,23],[-16,-112],[-16,-108]])S.addChild(solid,S.createNode({geometry:BL.pierDetails.cafe(),position:{x,y:LAYOUT.top,z}}));
    const ferris=BL.pierRides.build(LAYOUT);S.addChild(root,ferris.root);
    const coaster=BL.pierCoaster.build(LAYOUT),carousel=BL.pierCarousel.build(LAYOUT);S.addChild(root,coaster.root);S.addChild(root,carousel.root);
    const midway=BL.pierGames.build(LAYOUT);S.addChild(root,midway.root);
    // Clearly marked boarding pads share the deck height and remain outside each ride frame.
    for(const [q,label] of [[LAYOUT.wheel,"OCEAN WHEEL"],[LAYOUT.coaster,"NOTHING STOPS THIS TRAIN"],[LAYOUT.carousel,"CAROUSEL"]]){
      const floor=q.floor??LAYOUT.top;box(root,q.board.x,floor+.009,q.board.z,3.5,.015,2.4,"#eac66f");
      const mark=S.createNode({geometry:BL.hubModels.postSign(label,.32,1.3),position:{x:q.board.x+(q===LAYOUT.coaster?2.3:q===LAYOUT.carousel?2.3:q.x<0?-2.3:2.3),y:floor,z:q.board.z+2.4}});S.addChild(solid,mark);
    }
    // Only fixed supports collide; the moving vehicles carry their seated rider explicitly.
    const entrance=S.createNode({geometry:BL.pierDetails.entrance(),position:LAYOUT.entrance});S.addChild(solid,entrance);
    for(let z=-238;z<=76;z+=35){const lamp=S.createNode({geometry:BL.pierDetails.lamp(),position:{x:6.3,y:LAYOUT.top,z},rotation:{x:0,y:Math.PI,z:0}});S.addChild(solid,lamp);lamps.push(lamp);}
    const beach=BL.pierBeach.build(LAYOUT);S.addChild(root,beach.root);
    const park=BL.pierPark.build(LAYOUT),landmarks=BL.pierLandmarks.build(LAYOUT);S.addChild(root,park.root);S.addChild(root,landmarks.root);S.addChild(solid,park.solid);S.addChild(solid,landmarks.solid);
    // Each game builds its collision node under its own root; a node has one parent, so move it under the pier's.
    const adopt=game=>{S.removeChild(game.root,game.solid);S.addChild(root,game.root);S.addChild(solid,game.solid);return game;};
    const bell=BL.pierBell.build(LAYOUT);S.addChild(root,bell.root);
    const fishing=adopt(BL.pierFishing.build(LAYOUT));
    const builder=adopt(BL.pierBuilder.build(LAYOUT));
    const mayhem=adopt(BL.pierMayhem.build(LAYOUT));
    const whack=adopt(BL.pierWhack.build(LAYOUT));
    const shop=adopt(BL.pierShop.build(LAYOUT));
    const jobs=adopt(BL.pierJobs.build(LAYOUT));
    const seedMatch=adopt(BL.pierSeedMatch.build(LAYOUT));
    const volley=adopt(BL.pierVolley.build(LAYOUT,beach));
    return {root,solid,sea,ferris,coaster,carousel,midway,entrance,beach,park,landmarks,signs,lamps,bell,fishing,builder,mayhem,whack,shop,jobs,seedMatch,volley,layout:LAYOUT};
  };
  BL.pierModels={LAYOUT,build};
})();
