// Santa Monica-inspired coastal architecture, white street lamps and the blue arrival arch.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models;
  // Short copied faces preserve the shell while keeping Canvas backings behind their detail.
  const smallFaces=(source,size)=>{
    const g={...source,verts:source.verts.slice(),faces:[]},v=g.verts;
    const length=(a,b)=>Math.hypot(v[a*3]-v[b*3],v[a*3+1]-v[b*3+1],v[a*3+2]-v[b*3+2]);
    const triangle=(a,b,c,f)=>{const ab=length(a,b),bc=length(b,c),ca=length(c,a);if(Math.max(ab,bc,ca)<=size){g.faces.push({...f,i:[a,b,c]});return;}if(bc>ab&&bc>=ca){triangle(b,c,a,f);return;}if(ca>ab){triangle(c,a,b,f);return;}const m=v.length/3;for(let k=0;k<3;k++)v.push((v[a*3+k]+v[b*3+k])*.5);triangle(a,m,c,f);triangle(m,b,c,f);};
    for(const f of source.faces){
      if(f.i.every((a,i)=>length(a,f.i[(i+1)%f.i.length])<=size)){g.faces.push(f);continue;}
      if(f.i.length===4){
        const [a,b,c,d]=f.i,nx=Math.ceil(Math.max(length(a,b),length(d,c))/size),ny=Math.ceil(Math.max(length(a,d),length(b,c))/size);
        for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const n=v.length/3;for(const [u,t] of [[x/nx,y/ny],[(x+1)/nx,y/ny],[(x+1)/nx,(y+1)/ny],[x/nx,(y+1)/ny]])for(let k=0;k<3;k++)v.push(v[a*3+k]*(1-u)*(1-t)+v[b*3+k]*u*(1-t)+v[c*3+k]*u*t+v[d*3+k]*(1-u)*t);g.faces.push({...f,i:[n,n+1,n+2,n+3]});}continue;
      }
      const center=v.length/3;for(let k=0;k<3;k++)v.push(f.i.reduce((sum,i)=>sum+v[i*3+k],0)/f.i.length);
      for(let i=0;i<f.i.length;i++)triangle(center,f.i[i],f.i[(i+1)%f.i.length],f);
    }return g;
  };
  const entrance=M.cached(()=>{
    const parts=[],blue="#16478b",gold="#f2bf38",cream="#f8eed3";
    const panel=(points,color,depth=.36)=>{
      const g={verts:[],faces:[],lines:[]},n=points.length,paint=BL.math.hexToRgb(color);
      for(const z of [-depth/2,depth/2])for(const p of points)g.verts.push(p[0],p[1],z);
      g.faces.push({i:points.map((_,i)=>n-1-i),color:paint},{i:points.map((_,i)=>n+i),color:paint});
      for(let i=0;i<n;i++){const j=(i+1)%n;g.faces.push({i:[i,j,j+n,i+n],color:paint});}parts.push(g);
    };
    // Segment the curved band into convex closed strips: no fan triangles fill its walk-through opening.
    const band=(half,bottom,top,bend,color,depth,segments)=>{
      for(let i=0;i<segments;i++){
        const a=-half+i*half*2/segments,b=-half+(i+1)*half*2/segments,ay=bend*(a/half)**2,by=bend*(b/half)**2;
        panel([[a,bottom-ay],[b,bottom-by],[b,top-by],[a,top-ay]],color,depth);
        for(const z of [-depth/2-.015,depth/2+.015])for(const y of [bottom,top])parts.push(M.beam(a,y-ay,z,b,y-by,z,.055,cream));
      }
    };
    band(7.2,5.25,7.6,1.4,blue,.36,24);band(3.55,7.45,8.5,.45,cream,.48,16);
    for(const x of [-7.5,7.5]){
      parts.push(M.moved(M.bevelBox({w:.95,h:.28,d:.7,color:blue}),x,.14,0));
      for(const side of [-1,1])parts.push(M.beam(x+side*.28,.28,0,x+side*.28,3.8,0,.12,blue));
      for(let y=.3;y<3.5;y+=.7){parts.push(M.beam(x-.28,y,0,x+.28,y+.7,0,.055,cream),M.beam(x+.28,y,0,x-.28,y+.7,0,.055,cream));}
      parts.push(M.moved(M.box({w:1.3,h:2.65,d:.42,color:blue}),x,5.13,0));
      for(const z of [-.245,.245])for(const dx of [-.4,0,.4])parts.push(M.beam(x+dx,4.05,z,x+dx,6.23,z,.13,gold));
      for(const y of [3.65,3.94,6.42,6.7])parts.push(M.moved(M.box({w:1.6,h:.14,d:.5,color:gold}),x,y,0));
    }
    panel([[-1.45,4.6],[1.45,4.6],[1.65,4.75],[1.55,5.4],[-1.55,5.4],[-1.65,4.75]],blue,.52);
    const front=[];
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5+Math.PI/2,b=a+Math.PI/5,c=a+Math.PI*2/5,x=side*6.45,y=6.9-1.4*(x/7.2)**2;
      front.push(M.beam(x+Math.cos(a)*.2,y+Math.sin(a)*.2,.25,x+Math.cos(b)*.085,y+Math.sin(b)*.085,.25,.045,cream),M.beam(x+Math.cos(b)*.085,y+Math.sin(b)*.085,.25,x+Math.cos(c)*.2,y+Math.sin(c)*.2,.25,.045,cream));
    }
    for(const z of [-.29,.29])for(const [a,b] of [[[-1.45,4.65],[1.45,4.65]],[[1.45,4.65],[1.57,4.78]],[[1.57,4.78],[1.49,5.3]],[[-1.45,4.65],[-1.57,4.78]],[[-1.57,4.78],[-1.49,5.3]]])parts.push(M.beam(a[0],a[1],z,b[0],b[1],z,.045,cream));
    // Slim painted strokes echo the arch's curved vintage lettering without a font asset.
    const font={
      A:[[[0,0],[.5,1],[1,0]],[[.2,.38],[.8,.38]]],B:[[[0,0],[0,1],[.7,1],[1,.8],[.85,.55],[0,.55]],[[.7,.55],[1,.35],[1,.16],[.7,0],[0,0]]],
      C:[[[1,.85],[.75,1],[.2,1],[0,.8],[0,.2],[.2,0],[.75,0],[1,.15]]],D:[[[0,0],[0,1],[.65,1],[1,.75],[1,.25],[.65,0],[0,0]]],E:[[[1,1],[0,1],[0,0],[1,0]],[[0,.5],[.8,.5]]],
      F:[[[0,0],[0,1],[1,1]],[[0,.5],[.8,.5]]],G:[[[1,.85],[.75,1],[.2,1],[0,.8],[0,.2],[.2,0],[.8,0],[1,.2],[1,.48],[.6,.48]]],H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.5],[1,.5]]],
      I:[[[.1,1],[.9,1]],[[.5,1],[.5,0]],[[.1,0],[.9,0]]],K:[[[0,0],[0,1]],[[1,1],[0,.45],[1,0]]],L:[[[0,1],[0,0],[1,0]]],N:[[[0,0],[0,1],[1,0],[1,1]]],
      O:[[[.2,0],[0,.2],[0,.8],[.2,1],[.8,1],[1,.8],[1,.2],[.8,0],[.2,0]]],P:[[[0,0],[0,1],[.75,1],[1,.8],[1,.65],[.75,.5],[0,.5]]],R:[[[0,0],[0,1],[.75,1],[1,.8],[1,.65],[.75,.5],[0,.5]],[[.5,.5],[1,0]]],
      S:[[[1,.85],[.8,1],[.2,1],[0,.8],[.15,.6],[.85,.4],[1,.2],[.8,0],[.2,0],[0,.15]]],T:[[[0,1],[1,1]],[[.5,1],[.5,0]]],W:[[[0,1],[.2,0],[.5,.5],[.8,0],[1,1]]]
    };
    const word=(text,width,height,baseline,bend,z,stroke,color,emissive=0)=>{
      const advance=width/text.length,glyph=advance*.7;
      for(let i=0;i<text.length;i++){
        if(text[i]===" ")continue;const paths=font[text[i]];if(!paths)throw new Error(`Missing entrance stroke: ${text[i]}`);
        const x=-width/2+(i+.5)*advance,y=baseline-bend*x*x,angle=Math.atan(-2*bend*x),c=Math.cos(angle),s=Math.sin(angle);
        const point=p=>{const dx=(p[0]-.5)*glyph,dy=p[1]*height;return [x+dx*c-dy*s,y+dx*s+dy*c,z];};
        for(const path of paths)for(let j=1;j<path.length;j++)front.push(M.beam(...point(path[j-1]),...point(path[j]),stroke,color,emissive));
      }
    };
    word("BITCOIN",5.4,.7,7.66,.035,.285,.145,"#50371f");
    word("BITCOIN",5.4,.7,7.66,.035,.38,.1,"#f7931a",.72);
    word("BOARDWALK",11.7,1.02,6.28,1.4/7.2**2,.25,.082,cream);
    word("SPORT FISHING   BOATING",12.5,.33,5.65,1.4/7.2**2,.25,.035,cream);
    word("CAFES",2.5,.38,4.78,0,.315,.036,cream);
    const face=M.merge(...front);parts.push(face,M.turnedY(M.merge(face),Math.PI));
    return M.merge(...parts);
  });
  const facade=(face,z,d,direction,top,trim)=>{
    const parts=[],g={verts:[],faces:[],lines:[]},x=face+direction*.045;
    for(const dz of [-d*.3,0,d*.3]){
      const center=z+dz,r=.75,base=top+2.2,bottom=top+(dz===0?.08:.75),points=[[-r,bottom],[r,bottom]];
      for(let i=0;i<=16;i++){const a=i*Math.PI/16;points.push([r*Math.cos(a),base+r*Math.sin(a)]);}
      const at=g.verts.length/3;for(const p of points)g.verts.push(x,p[1],center+p[0]);
      const ids=points.map((_,i)=>at+i);g.faces.push({i:ids,color:BL.math.hexToRgb("#b6dce6")},{i:ids.slice().reverse(),color:BL.math.hexToRgb("#b6dce6")});
      for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];parts.push(M.beam(x+direction*.035,p[1],center+p[0],x+direction*.035,q[1],center+q[0],.105,trim));}
      parts.push(M.beam(x+direction*.06,bottom,center,x+direction*.06,base+r,center,.055,trim),M.beam(x+direction*.06,base,center-r,x+direction*.06,base,center+r,.055,trim));
      for(const a of [Math.PI/4,Math.PI*3/4])parts.push(M.beam(x+direction*.06,base,center,x+direction*.06,base+r*Math.sin(a),center+r*Math.cos(a),.045,trim));
    }
    return M.merge(g,...parts);
  };
  const lamp=M.cached(()=>M.merge(M.beam(0,0,0,0,4.6,0,.13,"#f5eee0"),M.beam(0,4.6,0,.75,4.9,0,.1,"#f5eee0"),M.moved(M.bevelBox({w:1.05,h:.16,d:.35,color:"#f5eee0",emissive:.45}),.95,4.9,0),M.moved(M.box({w:.9,h:.045,d:.25,color:"#ffe4a1",emissive:.8}),.95,4.8,0)));
  // Local x faces the promenade; each kit stays inside the existing awning's reach and roof height.
  const shopDetail=(kind,d,h,trim)=>{
    const parts=[],box=(x,y,z,w,height,depth,color)=>parts.push(M.moved(M.box({w,h:height,d:depth,color}),x,y,z));
    box(.085,1.12,0,.035,2.16,1.03,"#284c58");
    for(const z of [-.56,.56])box(.12,1.15,z,.08,2.3,.1,trim);
    box(.14,1.06,.28,.09,.07,.18,"#e8be62");
    box(.22,.04,0,.44,.08,1.25,"#e4d8bd");
    if(kind===0){
      // Peach surf shop: teal stepped cornice, recessed upper panels and paired shutters.
      for(const z of [-d*.3,d*.3]){
        box(.075,3.86,z,.07,.95,1.65,"#dab58d");
        box(.13,3.85,z,.05,.72,.9,"#a8ced8");
        for(const side of [-1,1]){box(.17,3.85,z+side*.61,.1,.8,.26,trim);for(let j=0;j<5;j++)box(.23,3.55+j*.14,z+side*.61,.035,.035,.22,"#215c72");}
      }
      box(.12,h-.18,0,.24,.19,d+.16,trim);box(.06,h-.4,0,.12,.08,d+.08,"#f7e4c7");
    }else if(kind===1){
      // Cream restaurant: golden balcony, pilasters and a small sunburst over the door.
      box(.38,3.6,0,.78,.12,d*.72,trim);
      for(const z of [-d*.36,d*.36])box(.72,3.95,z,.08,.65,.1,trim);
      parts.push(M.beam(.72,4.25,-d*.36,.72,4.25,d*.36,.07,trim));
      for(let z=-d*.34;z<=d*.34;z+=.28)parts.push(M.beam(.72,3.67,z,.72,4.25,z,.045,trim));
      for(const z of [-d*.43,d*.43]){box(.13,1.8,z,.24,3.6,.22,"#fff6dd");box(.17,3.64,z,.34,.13,.42,trim);}
      for(let i=0;i<7;i++){const a=i*Math.PI/6;parts.push(M.beam(.14,2.25,0,.14,2.25+Math.sin(a)*.55,Math.cos(a)*.55,.055,trim));}
    }else{
      // Pale blue confectioner: pointed upper windows and gold scalloped fascia.
      for(const z of [-d*.3,d*.3]){
        const pane={verts:[.13,3.55,z-.62,.13,3.55,z+.62,.13,3.9,z+.62,.13,4.5,z,.13,3.9,z-.62],faces:[],lines:[]},color=BL.math.hexToRgb("#c4e3e7");
        pane.faces.push({i:[0,1,2,3,4],color},{i:[4,3,2,1,0],color});parts.push(pane);
        parts.push(M.beam(.16,3.55,z-.62,.16,3.9,z-.62,.08,trim),M.beam(.16,3.9,z-.62,.16,4.5,z,.08,trim),M.beam(.16,4.5,z,.16,3.9,z+.62,.08,trim),M.beam(.16,3.9,z+.62,.16,3.55,z+.62,.08,trim),M.beam(.16,3.55,z-.62,.16,3.55,z+.62,.08,trim),M.beam(.16,3.55,z,.16,4.5,z,.05,trim));
      }
      box(.13,h-.3,0,.24,.12,d+.1,trim);
      for(let z=-d/2+.25;z<d/2;z+=.5)box(.17,h-.48,z,.16,.21,.27,"#fff0cf");
    }
    return M.merge(...parts);
  };
  const cafe=M.cached(()=>{
    const canopy=M.lathe({profile:[[1.55,2.35],[1.55,2.48],[.65,2.8],[0,2.92]],segments:12,color:"#fff0d7"}),gold=BL.math.hexToRgb("#e5ab47");
    for(let i=0;i<canopy.faces.length;i++)if(i%2)canopy.faces[i].color=gold;
    const parts=[M.lathe({profile:[[0,.73],[.62,.73],[.62,.8],[0,.8]],segments:12,color:"#f2dcc0"}),M.beam(0,0,0,0,.73,0,.12,"#327b8f"),M.beam(-.35,.03,0,.35,.03,0,.08,"#327b8f"),M.beam(0,.03,-.35,0,.03,.35,.08,"#327b8f"),M.beam(0,0,0,0,2.85,0,.065,"#e8d9bc"),canopy];
    for(const side of [-1,1]){
      const x=side*.95;parts.push(M.moved(M.bevelBox({w:.5,h:.09,d:.5,color:"#327b8f"}),x,.45,0),M.moved(M.box({w:.08,h:.57,d:.5,color:"#327b8f"}),x+side*.23,.72,0));
      for(const dx of [-.19,.19])for(const z of [-.19,.19])parts.push(M.beam(x+dx,0,z,x+dx,.43,z,.045,"#276075"));
    }
    for(const x of [-.24,.24])parts.push(M.moved(M.lathe({profile:[[0,0],[.065,0],[.055,.12],[0,.12]],segments:8,color:"#fff5e4"}),x,.8,0));
    return M.merge(...parts);
  });
  const piling=M.cached(()=>M.merge(M.lathe({profile:[[.28,-5.8],[.28,-1.85],[.24,-1.8],[.24,-.22]],segments:8,color:t=>t<.34?"#4a4940":"#856747"}),M.moved(M.box({w:.59,h:.12,d:.59,color:"#4a514e"}),0,-1.15,0),M.moved(M.box({w:.56,h:.1,d:.56,color:"#4a514e"}),0,-.55,0)));
  const signCache=new Map(),signPaint=[
    ["#217c91","#fff3d5"],["#184b70","#efb94f"],["#b94469","#fff2dd"],["#246cb1","#94e4d5"],
    ["#fff0d5","#256b70"],["#c74e3e","#ffd36f"],["#198d86","#ffe5a0"]
  ];
  const shopSign=(text,style)=>{
    const key=`${style}:${text}`;if(signCache.has(key))return signCache.get(key);
    const width=BL.hubModels.caveSign(text).signWidth,half=width/2,h=BL.hubModels.CAVE_SIGN_HEIGHT/2,
      paint=signPaint[style],parts=[],outline=[],panel={verts:[],faces:[],lines:[]};
    if(style===0){for(let i=0;i<24;i++){const a=i*Math.PI/12;outline.push([Math.cos(a)*half,Math.sin(a)*h]);}}
    else if(style===1)outline.push([-half,-h*.65],[-half*.94,-h],[-half*.7,-h],[-half*.65,-h*.8],[half*.65,-h*.8],[half*.7,-h],[half*.94,-h],[half,-h*.65],[half,h*.65],[half*.94,h],[half*.7,h],[half*.65,h*.8],[-half*.65,h*.8],[-half*.7,h],[-half*.94,h],[-half,h*.65]);
    else if(style===2)outline.push([-half,-h*.7],[-half*.94,-h],[half*.94,-h],[half,-h*.7],[half,h*.7],[half*.94,h],[-half*.94,h],[-half,h*.7]);
    else if(style===3)outline.push([-half,0],[-half+.3,-h],[half-.3,-h],[half,0],[half-.3,h],[-half+.3,h]);
    else if(style===4)outline.push([-half,-h*.6],[-half+.18,-h],[half-.18,-h],[half,-h*.6],[half,h*.6],[half-.18,h],[-half+.18,h],[-half,h*.6]);
    else if(style===5)outline.push([-half,-h],[half,-h],[half,h],[-half,h]);
    else outline.push([-half,-h],[half,-h],[half,h*.6],[half-.25,h*.6],[half-.4,h],[0,h*.8],[-half+.4,h],[-half+.25,h*.6],[-half,h*.6]);
    for(const z of [-.07,.07])for(const p of outline)panel.verts.push(p[0],p[1],z);
    // Outward caps: the positive-z face must face the lettering, otherwise the rear cap
    // shows and façade details in front of that cap bleed through the painted board.
    const n=outline.length,color=BL.math.hexToRgb(paint[0]);panel.faces.push({i:Array.from({length:n},(_,i)=>n-1-i),color},{i:Array.from({length:n},(_,i)=>n+i),color});
    for(let i=0;i<n;i++){const j=(i+1)%n;panel.faces.push({i:[i,j,j+n,i+n],color});parts.push(M.beam(outline[i][0]*.97,outline[i][1]*.9,.09,outline[j][0]*.97,outline[j][1]*.9,.09,.045,paint[1]));}parts.push(panel);
    const box=(x,y,w,height,ink)=>parts.push(M.moved(M.box({w,h:height,d:.035,color:ink,emissive:.22}),x,y,.13));
    // Same glyph cell and line height as the former signs; the node's .87 scale is exactly 3 × .29.
    const glyphs=BL.hubModels.SIGN_GLYPHS,m=["10001","11011","10101","10001","10001"],cell=.075;
    let cells=-1;for(const ch of text)cells+=ch===" "?2:(ch==="M"?m:glyphs[ch])[0].length+1;
    let cursor=-cells*cell/2;
    for(const ch of text){if(ch===" "){cursor+=cell*2;continue;}const glyph=ch==="M"?m:glyphs[ch];
      for(let r=0;r<5;r++)for(let c=0;c<glyph[r].length;c++)if(glyph[r][c]==="1"){let run=1;while(glyph[r][c+run]==="1")run++;box(cursor+(c+run/2)*cell,(2-r)*cell,run*cell,cell,style===4?paint[1]:"#fff8e4");c+=run-1;}
      cursor+=(glyph[0].length+1)*cell;
    }
    if(style===0){for(let i=0;i<3;i++)parts.push(M.beam(-half*.65+i*.3,-.32,.13,-half*.35+i*.3,-.27,.13,.025,paint[1]));}
    else if(style===1){for(const side of [-1,1])for(let i=0;i<5;i++){const a=i*Math.PI*2/5;parts.push(M.beam(side*(half-.24),0,.13,side*(half-.24)+Math.cos(a)*.12,Math.sin(a)*.12,.13,.025,paint[1]));}}
    else if(style===2){for(let x=-half+.22;x<half-.15;x+=.24){box(x,.34,.1,.06,"#f8c7d6");box(x,-.34,.1,.06,"#f8c7d6");}}
    else if(style===3){for(const side of [-1,1]){parts.push(M.beam(side*(half-.2),-.1,.13,side*(half-.2),.1,.13,.025,paint[1]),M.beam(side*(half-.2)-.1,0,.13,side*(half-.2)+.1,0,.13,.025,paint[1]));}}
    else if(style===4){box(0,-.33,width*.7,.025,paint[1]);for(const side of [-1,1])parts.push(M.beam(side*(half-.22),-.08,.13,side*(half-.22),.13,.13,.035,paint[1]));}
    else if(style===5){for(let x=-half+.14;x<half;x+=.22){box(x,.39,.055,.055,"#fff7c7");box(x,-.39,.055,.055,"#fff7c7");}}
    else {for(let x=-half+.25;x<half-.2;x+=.32)parts.push(M.beam(x,-.3,.13,x+.1,-.39,.13,.03,paint[1]),M.beam(x+.1,-.39,.13,x+.2,-.3,.13,.03,paint[1]));}
    const geometry=M.merge(...parts);geometry.signWidth=width;signCache.set(key,geometry);return geometry;
  };
  BL.pierDetails={entrance,facade,lamp,shopDetail,cafe,piling,shopSign,smallFaces};
})();
