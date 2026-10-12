// Pooled procedural locomotive sound; one context per pier visit, opened by a real gesture.
(() => {
  "use strict";
  const STORAGE="oogaboogaland.audio",MASTER=.3;
  const create=()=>{
    let ctx=null,master=null,chuff=null,rumble=null,whistleGain=null,engine=null,muted=false,whistleAge=2,previousPhase=-1,disposed=false,audible=false;
    try{muted=localStorage.getItem(STORAGE)==="off";}catch{}
    const volume=()=>{if(master)master.gain.setTargetAtTime(muted||document.hidden?0:MASTER,ctx.currentTime,.03);};
    const unlock=e=>{
      if(disposed||!audible||!e?.isTrusted)return;
      if(!ctx){
        const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
        ctx=new Audio();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
        const gain=level=>{const g=ctx.createGain();g.gain.value=level;g.connect(master);return g;};
        chuff=gain(0);rumble=gain(0);whistleGain=gain(0);
        const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0),rand=BL.math.mulberry32(731);
        for(let i=0;i<data.length;i++)data[i]=rand()*2-1;
        const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter();noise.buffer=buffer;noise.loop=true;filter.type="lowpass";filter.frequency.value=850;noise.connect(filter);filter.connect(chuff);noise.start();
        engine=ctx.createOscillator();engine.type="triangle";engine.frequency.value=55;engine.connect(rumble);engine.start();
        for(const frequency of [392,493.88,587.33]){const tone=ctx.createOscillator(),level=ctx.createGain();tone.type="sine";tone.frequency.value=frequency;level.gain.value=.22;tone.connect(level);level.connect(whistleGain);tone.start();}
        volume();
      }
      if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    };
    const whistle=()=>{if(whistleAge<1.4)return false;whistleAge=0;return true;};
    const update=(dt,model,listener)=>{
      if(previousPhase>=0&&previousPhase<model.seconds-1.5&&model.phase>=model.seconds-1.5)whistle();previousPhase=model.phase;
      whistleAge+=dt;if(document.hidden)return;
      const p=model.train.position,r=model.root.position,distance=Math.hypot(r.x+p.x-listener.x,r.y+p.y-listener.y,r.z+p.z-listener.z);
      // A gesture far from the engine need not start a silent audio graph.
      const near=Math.max(0,Math.min(1,(55-distance)/45));audible=near>0;if(!ctx)return;
      const now=ctx.currentTime,beat=model.chug%1;
      // Four exhaust beats per driving-wheel rhythm; fixed voices follow the shared steam phase.
      const pulse=Math.exp(-beat*12);
      chuff.gain.setTargetAtTime(near*(.015+.45*pulse),now,.008);
      rumble.gain.setTargetAtTime(near*(.045+.05*pulse),now,.015);engine.frequency.setTargetAtTime(45+model.speed*5,now,.08);
      const envelope=whistleAge<.12?whistleAge/.12:whistleAge<.8?1:Math.max(0,(1.4-whistleAge)/.6);
      whistleGain.gain.setTargetAtTime(near*envelope*.55,now,.025);
    };
    const setMuted=on=>{muted=!!on;volume();try{localStorage.setItem(STORAGE,muted?"off":"on");}catch{}};
    document.addEventListener("visibilitychange",volume);
    return {unlock,update,whistle,setMuted,get muted(){return muted;},dispose(){disposed=true;document.removeEventListener("visibilitychange",volume);if(ctx)ctx.close().catch(()=>{});ctx=master=chuff=rumble=whistleGain=engine=null;}};
  };
  const BL=window.BL;BL.pierTrainAudio={create};
})();
