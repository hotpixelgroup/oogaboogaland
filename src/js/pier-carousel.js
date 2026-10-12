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
  const arm=M.cached(()=>M.merge(M.beam(0,0,0,0,3.1,0,.12,"#e7c27d"),M.beam(0,3.05,0,-.8,2.75,0,.07,"#e7c27d"),M.moved(M.bevelBox({w:.5,h:.16,d:.5,color:"#5da8ab"}),0,.08,0)));
  const ring=M.cached(()=>M.turnedX(M.torus(.17,.035,"#f7c744",.5,16,5),Math.PI/2));
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
    // The carousel never stops: one turn every twelve seconds. A rider takes the horse passing the boarding pad
    // and steps off there after two turns, or at its next pass when asked.
    let angle=0,taken=0,ringAge=0;
    const TURN=TAU/12,ARM=Math.PI/2,RING=3;
    const post=S.createNode({geometry:arm(),position:{x:Math.cos(ARM)*5.25,y:0,z:Math.sin(ARM)*5.25},rotation:{x:0,y:-ARM,z:0}});S.addChild(root,post);
    const ringNode=S.createNode({geometry:ring(),position:{x:Math.cos(ARM)*4.45,y:2.55,z:Math.sin(ARM)*4.45}});S.addChild(root,ringNode);
    const riders=BL.pierRides.passengers(animals,[2,4],0,1.25,-.1,0);
    const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
    const follow=()=>{const a=angle+taken*TAU/6;seat.x=q.x+3.6*Math.cos(a);seat.z=q.z+3.6*Math.sin(a);seat.y=floor+1.55+.18*Math.sin(angle*2+taken*TAU/6);seat.ry=-a;};
    const pose=a=>{rotor.rotation.y=-a;for(let i=0;i<animals.length;i++)animals[i].position.y=.3+.18*Math.sin(a*2+i*TAU/6);};
    const advance=dt=>{angle=(angle+dt*TURN)%TAU;pose(angle);follow();ringAge=Math.max(0,ringAge-dt);ringNode.visible=ringAge===0;ringNode.rotation.y+=dt*2;};
    const take=()=>{let best=Infinity;for(let i=0;i<animals.length;i++){const d=Math.abs(wrap(angle+i*TAU/6));if(d<best){best=d;taken=i;}}follow();};
    // The ring hangs a quarter turn on from the pad; it is in reach for about half a second each turn.
    const inReach=()=>ringAge===0&&Math.abs(wrap(angle+taken*TAU/6-ARM))<.16;
    const grab=()=>{if(!seat.sitter||!inReach())return false;ringAge=6;ringNode.visible=false;return true;};
    advance(0);
    return {id:"carousel",label:"Carousel",seconds:24,boardingSeconds:1.4,stub:2,ring:RING,root,frame,rotor,animals,seat,board:q.board,pose,advance,take,grab,riders,tilt:null,
      get angle(){return angle;},get reach(){return !!seat.sitter&&inReach();},get boardOpen(){return Math.abs(wrap(angle+taken*TAU/6))<.35;}};
  };
  BL.pierCarousel={build};
})();
