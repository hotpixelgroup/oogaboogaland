// The radio in every vehicle: three short chip tunes on the pier's own audio graph (pier-sound.js), heard only
// while the visitor rides wheels. N turns the dial: the next station, then off. Like the carousel's waltz, a tune
// keeps time from the audio clock a few notes ahead, and nothing is built after the context opens.
(() => {
  "use strict";
  const BL = window.BL, hz = (semitone) => 261.63 * Math.pow(2, semitone / 12);
  // A station: its name, the seconds a step lasts, and the lead and the bass by step as semitones above C4 (null rests).
  const STATIONS = [
    { name: "Boardwalk FM", step: 0.15, lead: [7, null, 12, 14, 16, null, 14, 12, 9, null, 12, 14, 16, 19, 16, null, 7, null, 12, 14, 16, null, 19, 21, 19, 16, 14, 12, 14, null, 12, null],
      bass: [-12, null, null, -12, -5, null, null, -5, -15, null, null, -15, -8, null, null, -8, -12, null, null, -12, -5, null, null, -5, -10, null, null, -10, -7, null, -7, null] },
    { name: "Low Fee Radio", step: 0.24, lead: [4, null, 7, null, 11, null, 9, 7, 2, null, 5, null, 9, null, 7, 5, 0, null, 4, null, 7, null, 5, 4, 2, null, null, 5, 4, null, null, null],
      bass: [-20, null, null, null, -13, null, null, null, -22, null, null, null, -15, null, null, null, -24, null, null, null, -17, null, null, null, -22, null, null, null, -17, null, null, null] },
    { name: "Block Rock", step: 0.125, lead: [0, 0, 12, 0, 10, 0, 7, 0, 0, 0, 12, 0, 10, 7, 5, 7, 3, 3, 15, 3, 12, 3, 10, 3, 5, 5, 17, 5, 15, 12, 10, 12],
      bass: [-24, null, -24, null, -24, null, -24, null, -24, null, -24, null, -24, null, -24, null, -21, null, -21, null, -21, null, -21, null, -19, null, -19, null, -19, null, -19, null] }
  ];
  const create = (sound) => {
    let ctx = null, out = null, lead = null, bass = null, station = 0, beat = 0, beatAt = 0, heard = false;
    sound.attach((context, master) => {
      ctx = context;
      out = ctx.createGain(); out.gain.value = 0; out.connect(master);
      const voice = (type) => { const gain = ctx.createGain(), osc = ctx.createOscillator(); gain.gain.value = 0; gain.connect(out); osc.type = type; osc.connect(gain); osc.start(); return { osc, gain }; };
      lead = voice("square"); bass = voice("triangle");
    });
    const note = (voice, frequency, at, peak, release) => {
      voice.osc.frequency.setValueAtTime(frequency, at);
      voice.gain.gain.cancelScheduledValues(at); voice.gain.gain.setValueAtTime(0, at);
      voice.gain.gain.linearRampToValueAtTime(peak, at + 0.01); voice.gain.gain.exponentialRampToValueAtTime(0.0001, at + release);
    };
    // `riding`: the visitor is on wheels this frame.
    const update = (riding) => {
      const on = riding && station >= 0;
      if (!ctx || !sound.running) return;
      const now = ctx.currentTime;
      if (on !== heard) { heard = on; out.gain.setTargetAtTime(on ? 1 : 0, now, 0.08); }
      if (!on) return;
      const tune = STATIONS[station];
      if (beatAt < now) beatAt = now + 0.05;
      while (beatAt < now + 0.25) {
        const i = beat % tune.lead.length;
        if (tune.lead[i] !== null) note(lead, hz(tune.lead[i]), beatAt, 0.032, tune.step * 1.7);
        if (tune.bass[i] !== null) note(bass, hz(tune.bass[i]), beatAt, 0.06, tune.step * 2.6);
        beat++; beatAt += tune.step;
      }
    };
    // The next station, then off, then round again. Answers what the dial now reads.
    const next = () => { station = station + 1 < STATIONS.length ? station + 1 : station < 0 ? 0 : -1; beat = 0; beatAt = 0; return station < 0 ? "Radio off" : `Radio: ${STATIONS[station].name}`; };
    return { update, next, get station() { return station; }, get name() { return station < 0 ? "" : STATIONS[station].name; }, get playing() { return heard; } };
  };
  BL.pierRadio = { create, STATIONS };
})();
