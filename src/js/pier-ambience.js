// The pier's sound bed, a layer of the shared graph in pier-sound.js: surf and wind everywhere near the water, a
// crowd where the park and the plaza are, a waltz from the carousel, bleeps from the arcade porch, gulls by day,
// and the visitor's own footsteps on timber or sand. Every node is built once when the context opens; `update`
// only eases gains toward where the listener stands, at most fifteen times a second, and schedules single notes
// on pooled voices. Places are plain data so a new district is one row.
(() => {
  "use strict";
  const BL = window.BL;
  // Where each bed is loudest (x, z), how far it carries, and its level at the middle.
  const CROWDS = [[-39, -67, 75, 0.085], [-34, 50, 60, 0.06], [0, 150, 90, 0.035]];
  const ORGAN = { x: -25, z: 80, reach: 46 }, ARCADE = { x: -44, z: 48, reach: 30 };
  // A music-box waltz in C: melody and bass by beat, as semitones above C4 (null rests).
  const TUNE = [12, 16, 19, 16, 19, 24, 23, 19, 16, 14, 17, 21, 17, 21, 24, 23, 19, 14], BASS = [-12, null, null, -5, null, null, -12, null, null, -7, null, null, -10, null, null, -5, null, null];
  const BEAT = 0.3, hz = (semitone) => 261.63 * Math.pow(2, semitone / 12);
  const create = (sound) => {
    let ctx = null, surf = null, swell = null, wind = null, crowd = null, organGain = null, lead = null, bass = null, gull = null, gullGain = null, blip = null, blipGain = null, step = null, stepBand = null, rainGain = null;
    let pace = 0, beat = 0, beatAt = 0, gullIn = 5, blipIn = 1, stride = 0, organLevel = 0;
    const rand = BL.math.mulberry32(2140);
    sound.attach((context, master, buffer) => {
      ctx = context;
      const gain = (level, into = master) => { const g = ctx.createGain(); g.gain.value = level; g.connect(into); return g; };
      const noise = (type, frequency, q, into) => {
        const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
        source.buffer = buffer; source.loop = true; source.playbackRate.value = 0.7 + rand() * 0.6;
        filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
        source.connect(filter); filter.connect(into); source.start(rand());
        return filter;
      };
      const tone = (type, into) => { const o = ctx.createOscillator(); o.type = type; o.connect(into); o.start(); return o; };
      surf = gain(0); noise("lowpass", 520, 0.4, surf);
      // The swell: a slow oscillator breathes the surf up and down without a per-frame write.
      const slow = ctx.createOscillator(); slow.frequency.value = 0.13; swell = ctx.createGain(); swell.gain.value = 0; slow.connect(swell); swell.connect(surf.gain); slow.start();
      wind = gain(0); noise("bandpass", 280, 0.6, wind);
      crowd = gain(0); noise("bandpass", 620, 1.1, crowd); noise("bandpass", 980, 1.6, crowd);
      organGain = gain(0);
      const leadGain = gain(0, organGain), bassGain = gain(0, organGain);
      lead = { osc: tone("square", leadGain), gain: leadGain }; bass = { osc: tone("triangle", bassGain), gain: bassGain };
      gullGain = gain(0); gull = tone("sine", gullGain);
      blipGain = gain(0); blip = tone("square", blipGain);
      step = gain(0); stepBand = noise("bandpass", 240, 1.4, step);
      rainGain = gain(0); noise("highpass", 2600, 0.5, rainGain);
    });
    const falloff = (x, z, px, pz, reach) => Math.max(0, 1 - Math.hypot(x - px, z - pz) / reach);
    const note = (voice, frequency, at, peak, release) => {
      voice.osc.frequency.setValueAtTime(frequency, at);
      voice.gain.gain.cancelScheduledValues(at); voice.gain.gain.setValueAtTime(0, at);
      voice.gain.gain.linearRampToValueAtTime(peak, at + 0.012); voice.gain.gain.exponentialRampToValueAtTime(0.0001, at + release);
    };
    // listener: where the visitor's ears are. night: 0 by day to 1 after dark. walking: on foot and moving.
    // floor: the height the visitor's feet are at. sea: the waterline.
    // rain: 0 dry to 1 a downpour.
    const update = (dt, listener, night, walking, floor, sea, rain = 0) => {
      if (!ctx || !sound.running) return;
      const now = ctx.currentTime, x = listener.x, z = listener.z;
      // The waltz keeps time from the audio clock, a few notes ahead.
      const near = falloff(x, z, ORGAN.x, ORGAN.z, ORGAN.reach);
      organLevel = near;
      if (near > 0) {
        if (beatAt < now) beatAt = now + 0.05;
        while (beatAt < now + 0.25) {
          const i = beat % TUNE.length;
          note(lead, hz(TUNE[i]), beatAt, 0.045, BEAT * 1.6);
          if (BASS[i] !== null) note(bass, hz(BASS[i]), beatAt, 0.07, BEAT * 2.4);
          beat++; beatAt += BEAT;
        }
      }
      // Footsteps: a short knock on timber, a softer hiss on sand, none while swimming.
      if (walking && floor > sea) {
        stride -= dt;
        if (stride <= 0) {
          stride = 0.3;
          const sand = floor < 0.5;
          stepBand.frequency.setValueAtTime(sand ? 1500 : 210 + rand() * 60, now);
          step.gain.cancelScheduledValues(now); step.gain.setValueAtTime(0, now);
          step.gain.linearRampToValueAtTime(sand ? 0.05 : 0.11, now + 0.006); step.gain.exponentialRampToValueAtTime(0.0001, now + (sand ? 0.16 : 0.09));
        }
      } else stride = 0.12;
      gullIn -= dt;
      if (gullIn <= 0) {
        gullIn = 5 + rand() * 9;
        // Gulls keep to the daylight and to the water side.
        if (night < 0.6 && z < 200) {
          const calls = 2 + (rand() * 3 | 0), level = 0.035 * (1 - night);
          for (let i = 0; i < calls; i++) {
            const at = now + i * 0.24, top = 1500 + rand() * 500;
            gull.frequency.setValueAtTime(top, at); gull.frequency.exponentialRampToValueAtTime(top * 0.62, at + 0.17);
            gullGain.gain.setValueAtTime(0, at); gullGain.gain.linearRampToValueAtTime(level, at + 0.03); gullGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
          }
        }
      }
      const arcade = falloff(x, z, ARCADE.x, ARCADE.z, ARCADE.reach);
      blipIn -= dt;
      if (blipIn <= 0) {
        blipIn = 0.35 + rand() * 1.1;
        if (arcade > 0) {
          blip.frequency.setValueAtTime(440 * Math.pow(2, (rand() * 14 | 0) / 12), now);
          blipGain.gain.cancelScheduledValues(now); blipGain.gain.setValueAtTime(0, now);
          blipGain.gain.linearRampToValueAtTime(0.02 * arcade, now + 0.005); blipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
        }
      }
      pace += dt;
      if (pace < 1 / 15) return;
      pace = 0;
      // Surf is full over the water and the sand, and fades up the bridge to the avenue.
      const shore = Math.max(0.18, Math.min(1, (230 - z) / 130));
      surf.gain.setTargetAtTime(0.16 * shore, now, 0.4); swell.gain.setTargetAtTime(0.07 * shore, now, 0.4);
      wind.gain.setTargetAtTime(0.03 + 0.04 * Math.min(1, Math.max(0, listener.y - 2) / 14), now, 0.5);
      let people = 0;
      for (let i = 0; i < CROWDS.length; i++) people = Math.max(people, falloff(x, z, CROWDS[i][0], CROWDS[i][1], CROWDS[i][2]) * CROWDS[i][3]);
      // The crowd thins after dark but never quite leaves.
      crowd.gain.setTargetAtTime(people * (1 - night * 0.45) * (1 - rain * 0.5), now, 0.6);
      rainGain.gain.setTargetAtTime(rain * 0.12, now, 0.8);
      organGain.gain.setTargetAtTime(near, now, 0.3);
    };
    return {
      update,
      // The bed is always there to hear, so the first real gesture opens the graph.
      unlock: (e) => sound.unlock(e),
      get organ() { return organLevel; },
      dispose() { ctx = surf = swell = wind = crowd = organGain = lead = bass = gull = gullGain = blip = blipGain = step = stepBand = rainGain = null; }
    };
  };
  BL.pierAmbience = { create };
})();
