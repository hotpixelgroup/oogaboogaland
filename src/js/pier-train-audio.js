// Pooled procedural locomotive sound; one context per pier visit, opened by a real gesture.
(() => {
  "use strict";
  const create=sound=>{
    let ctx=null,chuff=null,rumble=null,whistleGain=null,engine=null,whistleAge=2,previousPhase=-1,audible=false,pace=0;
    // The locomotive is one layer of the pier's shared graph; it builds its nodes when that context opens.
    sound.attach((context,master,buffer)=>{
      ctx=context;
      const gain=level=>{const g=ctx.createGain();g.gain.value=level;g.connect(master);return g;};
      chuff=gain(0);rumble=gain(0);whistleGain=gain(0);
      const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter();noise.buffer=buffer;noise.loop=true;filter.type="lowpass";filter.frequency.value=850;noise.connect(filter);filter.connect(chuff);noise.start();
      engine=ctx.createOscillator();engine.type="triangle";engine.frequency.value=55;engine.connect(rumble);engine.start();
      for(const frequency of [392,493.88,587.33]){const tone=ctx.createOscillator(),level=ctx.createGain();tone.type="sine";tone.frequency.value=frequency;level.gain.value=.22;tone.connect(level);level.connect(whistleGain);tone.start();}
    });
    // A gesture far from the engine need not start a silent audio graph.
    const unlock=e=>{if(audible)sound.unlock(e);};
    const whistle=()=>{if(whistleAge<1.4)return false;whistleAge=0;return true;};
    const update=(dt,model,listener)=>{
      if(previousPhase>=0&&previousPhase<model.seconds-1.5&&model.phase>=model.seconds-1.5)whistle();previousPhase=model.phase;
      whistleAge+=dt;if(document.hidden)return;
      const p=model.train.position,r=model.root.position,distance=Math.hypot(r.x+p.x-listener.x,r.y+p.y-listener.y,r.z+p.z-listener.z);
      const near=Math.max(0,Math.min(1,(55-distance)/45));audible=near>0;if(!ctx||!sound.running)return;
      // Thirty updates a second carry the exhaust rhythm; scheduling more only queues automation.
      pace+=dt;if(pace<1/30)return;pace=0;
      const now=ctx.currentTime,beat=model.chug%1;
      // Four exhaust beats per driving-wheel rhythm; fixed voices follow the shared steam phase.
      const pulse=Math.exp(-beat*12);
      chuff.gain.setTargetAtTime(near*(.015+.45*pulse),now,.008);
      rumble.gain.setTargetAtTime(near*(.045+.05*pulse),now,.015);engine.frequency.setTargetAtTime(45+model.speed*5,now,.08);
      const envelope=whistleAge<.12?whistleAge/.12:whistleAge<.8?1:Math.max(0,(1.4-whistleAge)/.6);
      whistleGain.gain.setTargetAtTime(near*envelope*.55,now,.025);
    };
    return {unlock,update,whistle,setMuted:sound.setMuted,get muted(){return sound.muted;},dispose(){ctx=chuff=rumble=whistleGain=engine=null;}};
  };
  const BL=window.BL;BL.pierTrainAudio={create};
})();
