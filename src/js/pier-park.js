// Western park silhouettes; the bumper pavilion supplies a hideable roof for its own game controller.
// Each fixed exhibit is a cached, cullable venue; its complete footprint comes from the pier layout.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2,cache=new Map();
  const box=(x,y,z,w,h,d,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
  const paint=["#e77e79","#f3c84e","#41bdbb","#6e83c5"];
  const bake=(id,q)=>{
    if(cache.has(id))return cache.get(id);
    const p=[],cream="#f6e5c3",teal="#368f97";
    if(id==="ship"){
      for(const x of [-5,5]){p.push(M.beam(x,0,-8,x,10,0,.35,teal),M.beam(x,0,8,x,10,0,.35,teal));}
      p.push(M.beam(-5.4,10,0,5.4,10,0,.45,cream));
      for(const x of [-1.5,1.5])p.push(M.beam(x,10,0,x,4.1,-1,.14,cream));
      const hull={verts:[],faces:[],lines:[]},sections=[[-6,.25],[-4,2],[4,2],[6,.25]];
      for(const [z,w] of sections)hull.verts.push(-w,3.3,z,w,3.3,z,-w*.65,2.3,z,w*.65,2.3,z);
      const color=BL.math.hexToRgb("#cf6c47");
      for(let i=0;i<3;i++){const a=i*4,b=a+4;for(const ids of [[a,b,b+1,a+1],[a+2,a+3,b+3,b+2],[a,a+2,b+2,b],[a+1,b+1,b+3,a+3]])hull.faces.push({i:ids,color});}
      hull.faces.push({i:[0,1,3,2],color},{i:[12,14,15,13],color});p.push(hull);
      for(let z=-4;z<=4;z+=1.2)p.push(box(0,3.65,z,3.5,.18,.65,paint[(Math.round(z*5)+24)%4]));
      for(const x of [-1.9,1.9])p.push(M.beam(x,3.5,-4,x,3.5,4,.13,cream));
      p.push(M.beam(0,3.2,4.8,0,5.6,4.8,.12,teal),box(0,5.3,4.8,1.2,.6,.05,paint[1]));
    }else if(id==="scrambler"){
      p.push(M.lathe({profile:[[0,0],[6.5,0],[6.5,.25],[0,.25]],segments:32,color:"#91c9ca"}),box(0,1.2,0,1.2,2.2,1.2,cream));
      for(let i=0;i<3;i++){
        const a=i*TAU/3,x=Math.cos(a)*4,z=Math.sin(a)*4;
        p.push(M.beam(0,1.2,0,x,1.2,z,.28,paint[i]));
        for(const side of [-1,1]){const cx=x-Math.sin(a)*side*1.2,cz=z+Math.cos(a)*side*1.2;
          p.push(box(cx,.8,cz,1.8,.65,1.35,paint[i]),box(cx,1.3,cz-.5,1.8,.5,.15,cream),box(cx,.85,cz+.2,1.35,.12,.6,"#365b70"));
        }
      }
    }else if(id==="drop"){
      p.push(box(0,.2,0,5,.4,5,teal));
      for(const x of [-.8,.8])for(const z of [-.8,.8])p.push(M.beam(x,.4,z,x,q.height,z,.2,cream));
      for(let y=1;y<q.height;y+=1.2){p.push(box(0,y,0,1.8,.12,1.8,y%2>1?paint[1]:teal));for(const z of [-.8,.8])p.push(M.beam(-.8,y,z,.8,y+1.15,z,.08,teal));}
      p.push(box(0,3,0,4.6,.5,4.6,paint[0]));
      for(const side of [-1,1])for(let x=-1.4;x<=1.4;x+=.9)p.push(box(x,3.55,side*1.7,.75,.9,.45,paint[1]),box(x,3.12,side*1.9,.72,.12,.8,"#365b70"));
      p.push(box(0,q.height-.25,0,2.6,.5,2.6,paint[1]));
    }else if(id==="bumper"){
      // Small floor faces let Canvas depth-sort the cars above their supporting surface.
      const queue=-q.d/2+4.4;
      for(let z=-q.d/2;z<q.d/2;){const depth=Math.min(2,q.d/2-z,z<queue?queue-z:2);for(let x=-q.w/2;x<q.w/2;x+=2)p.push(M.moved(M.box({w:2,h:.16,d:depth,color:z<queue?"#689f9b":"#79aaaf"}),x+1,.08,z+depth/2));z+=depth;}
      for(const x of [-q.w/2+.25,q.w/2-.25])for(const z of [-q.d/2+.25,q.d/2-.25])p.push(M.beam(x,0,z,x,4.7,z,.23,cream));
    }else if(id==="bumper-roof"){
      for(let i=0;i<10;i++)p.push(box(-q.w/2+(i+.5)*q.w/10,4.7,0,q.w/10,.2,q.d+.2,i%2?cream:paint[2]));
      for(const z of [-q.d/2,q.d/2])p.push(box(0,4.42,z,q.w,.28,.15,paint[0]));
    }else{
      for(const x of [-3.7,3.7])p.push(M.beam(x,0,0,x,4.2,0,.25,teal),box(x,.15,0,.6,.3,.6,cream));
      p.push(box(0,4,0,8,.5,.4,paint[0]));
      for(let i=0;i<8;i++)p.push(box(-3.5+i,3.65,0,.65,.28,.12,paint[i%4]));
      p.push(M.moved(BL.hubModels.postSign("PACIFIC PARK",.7,0),0,4.3,.35));
    }
    const geometry=M.merge(...p);cache.set(id,geometry);return geometry;
  };
  const build=layout=>{
    const root=S.createNode(),solid=S.createNode(),venues=[];
    for(const id of ["ship","scrambler","drop","bumper","entrance"]){
      const q=layout.park[id],node=S.createNode({geometry:bake(id,q),position:{x:q.x,y:layout.top,z:q.z}});S.addChild(solid,node);venues.push({id,node,layout:q});
    }
    const q=layout.park.bumper,bumperRoof=S.createNode({geometry:bake("bumper-roof",q),position:{x:q.x,y:layout.top,z:q.z}});S.addChild(solid,bumperRoof);
    return {root,solid,venues,bumperRoof};
  };
  BL.pierPark={build};
})();
