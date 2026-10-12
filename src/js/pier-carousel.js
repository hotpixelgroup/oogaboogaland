// A low, open carousel of painted wooden horses. Its platform leaves the ocean visible above the rail.
(() => {
  "use strict";
  const BL=window.BL,S=BL.scene,M=BL.models,TAU=Math.PI*2;
  const horse=M.cached(()=>{
    const box=(w,h,d,x,y,z,color)=>M.moved(M.bevelBox({w,h,d,color}),x,y,z);
    const parts=[box(.7,.7,1.7,0,.85,0,"#d5ab74"),box(.5,.75,.5,0,1.2,.75,"#d5ab74"),box(.5,.45,.75,0,1.6,.85,"#d5ab74"),box(.75,.12,.65,0,1.25,-.1,"#e57562")];
    for(const x of [-.22,.22])for(const z of [-.55,.55])parts.push(M.beam(x,.6,z,x,.05,z,.16,"#d5ab74"));
    parts.push(M.beam(0,0,-.2,0,5.4,-.2,.09,"#f2d081"));return M.merge(...parts);
  });
  const build=layout=>{
    const q=layout.carousel,floor=q.floor??layout.top,root=S.createNode({position:{x:q.x,y:floor,z:q.z}}),parts=[];
    parts.push(M.lathe({profile:[[0,0],[5.6,0],[5.6,.3],[0,.3]],segments:40,color:"#5da8ab"}));
    parts.push(M.beam(0,.3,0,0,6.3,0,.55,"#e7c27d"));
    for(let i=0;i<12;i++){
      const a=i*TAU/12,b=(i+1)*TAU/12,geo={verts:[0,6.6,0,Math.cos(a)*5.9,5.5,Math.sin(a)*5.9,Math.cos(b)*5.9,5.5,Math.sin(b)*5.9],faces:[{i:[0,2,1],color:BL.math.hexToRgb(i%2?"#f4dbab":"#e57562")},{i:[0,1,2],color:BL.math.hexToRgb(i%2?"#f4dbab":"#e57562")}],lines:[]};parts.push(geo);
    }
    const frame=S.createNode({geometry:M.merge(...parts)});S.addChild(root,frame);
    const rotor=S.createNode(),animals=[];S.addChild(root,rotor);
    for(let i=0;i<6;i++){const a=i*TAU/6,n=S.createNode({geometry:horse(),position:{x:Math.cos(a)*3.6,y:.3,z:Math.sin(a)*3.6},rotation:{x:0,y:-a,z:0}});S.addChild(rotor,n);animals.push(n);}
    const seat={x:0,y:0,z:0,ry:0,floor,walkAt:{x:q.board.x,z:q.board.z},sitter:null,allowWeapons:false,lockMovement:true};
    const pose=u=>{
      const a=2*TAU*u*u*(3-2*u);rotor.rotation.y=-a;
      for(let i=0;i<animals.length;i++)animals[i].position.y=.3+.18*Math.sin(a*2+i*TAU/6);
      seat.x=q.x+3.6*Math.cos(a);seat.z=q.z+3.6*Math.sin(a);seat.y=floor+1.55+.18*Math.sin(a*2);seat.ry=-a;
    };pose(0);
    return {id:"carousel",label:"Carousel",seconds:24,root,frame,rotor,animals,seat,board:q.board,pose,tilt:null};
  };
  BL.pierCarousel={build};
})();
