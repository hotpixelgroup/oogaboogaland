// The pier's one audio graph: a context opened by a real gesture, a master gain under the page's shared mute key,
// four pooled tone voices and one noise voice for cues, and any number of attached layers (the locomotive, the
// ambient bed) that build their own nodes once the context exists. Nothing here allocates after the graph is
// built; a cue only schedules automation on a pooled voice. `create` returns the engine; a game takes a
// `channel()` from it, which is the engine's cues behind that game's own "has my sound been started" flag.
(() => {
  "use strict";
  const BL = window.BL, STORAGE = "oogaboogaland.audio", MASTER = 0.3, VOICES = 4;
  // A cue is a list of notes: voice, delay, start frequency, end frequency, peak gain, attack, release, wave.
  // Voice 4 is the noise voice; its frequencies set the band-pass centre.
  const TRI = "triangle", SINE = "sine", SQUARE = "square";
  const CUES = {
    tick: [[0, 0, 660, 660, 0.05, 0.004, 0.05, SQUARE]],
    select: [[0, 0, 520, 560, 0.06, 0.006, 0.07, TRI]],
    swap: [[0, 0, 440, 500, 0.1, 0.01, 0.12, TRI], [1, 0, 660, 700, 0.03, 0.01, 0.1, SINE]],
    place: [[0, 0, 330, 360, 0.1, 0.012, 0.16, TRI], [1, 0, 660, 700, 0.03, 0.012, 0.14, TRI]],
    good: [[0, 0, 660, 880, 0.11, 0.01, 0.16, TRI], [1, 0.07, 990, 1320, 0.07, 0.01, 0.2, SINE]],
    catch: [[0, 0, 440, 494, 0.12, 0.012, 0.22, TRI], [1, 0, 880, 988, 0.04, 0.012, 0.2, SINE], [2, 0.09, 1320, 1480, 0.04, 0.012, 0.2, SINE]],
    boost: [[0, 0, 660, 990, 0.12, 0.012, 0.18, TRI], [1, 0.05, 990, 1480, 0.05, 0.01, 0.16, SINE]],
    coin: [[0, 0, 1180, 1180, 0.08, 0.004, 0.08, SQUARE], [1, 0.07, 1570, 1570, 0.08, 0.004, 0.22, SQUARE]],
    cast: [[0, 0, 220, 80, 0.12, 0.015, 0.22, TRI], [4, 0, 900, 300, 0.05, 0.01, 0.25]],
    splash: [[4, 0, 1400, 500, 0.12, 0.006, 0.3], [0, 0, 180, 90, 0.05, 0.01, 0.16, SINE]],
    bump: [[0, 0, 100, 55, 0.14, 0.008, 0.18, TRI], [4, 0, 500, 200, 0.07, 0.004, 0.12]],
    whack: [[0, 0, 150, 70, 0.14, 0.004, 0.14, TRI], [4, 0, 1800, 600, 0.08, 0.003, 0.09]],
    bad: [[0, 0, 160, 110, 0.11, 0.012, 0.22, SQUARE], [1, 0.02, 120, 82, 0.06, 0.012, 0.24, TRI]],
    miss: [[0, 0, 160, 140, 0.07, 0.015, 0.2, TRI]],
    bell: [[0, 0, 1046, 1046, 0.16, 0.004, 1.4, SINE], [1, 0, 2093, 2093, 0.07, 0.004, 0.9, SINE], [2, 0, 3140, 3120, 0.035, 0.004, 0.5, SINE], [3, 0, 523, 523, 0.06, 0.004, 1.1, TRI]],
    win: [[0, 0, 523.25, 523.25, 0.12, 0.015, 0.38, TRI], [1, 0.12, 659.25, 659.25, 0.12, 0.015, 0.38, TRI], [2, 0.24, 783.99, 783.99, 0.12, 0.015, 0.42, TRI], [3, 0.36, 1046.5, 1046.5, 0.1, 0.015, 0.6, SINE]],
    best: [[0, 0, 659.25, 659.25, 0.12, 0.012, 0.3, TRI], [1, 0.1, 783.99, 783.99, 0.12, 0.012, 0.3, TRI], [2, 0.2, 1046.5, 1046.5, 0.12, 0.012, 0.36, TRI], [3, 0.3, 1318.5, 1318.5, 0.11, 0.012, 0.8, SINE]],
    whoosh: [[4, 0, 300, 2400, 0.1, 0.12, 0.5]],
    boom: [[4, 0, 220, 60, 0.3, 0.004, 0.9], [0, 0, 90, 40, 0.16, 0.004, 0.7, SINE]],
    crackle: [[4, 0, 5200, 3000, 0.07, 0.002, 0.35]],
    horn: [[0, 0, 196, 196, 0.12, 0.05, 0.9, SQUARE], [1, 0, 247, 247, 0.09, 0.05, 0.9, SQUARE]]
  };
  // The games' older event names keep working.
  const ALIAS = { blocked: "bad", rejected: "whack", empty: "miss", wrong: "bad", missed: "miss", check: "select", delivered: "good", serve: "tick" };
  const create = () => {
    let ctx = null, master = null, muted = false, disposed = false, noise = null, noiseGain = null, noiseBand = null;
    const voices = [], layers = [];
    try { muted = localStorage.getItem(STORAGE) === "off"; } catch { /* Storage can be blocked; sound stays on. */ }
    const volume = () => { if (master) master.gain.setTargetAtTime(muted || document.hidden ? 0 : MASTER, ctx.currentTime, 0.03); };
    // Shared by every layer: one second of seeded white noise, looped.
    const noiseBuffer = () => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), data = buffer.getChannelData(0), rand = BL.math.mulberry32(731);
      for (let i = 0; i < data.length; i++) data[i] = rand() * 2 - 1;
      return buffer;
    };
    const unlock = (e) => {
      if (disposed || !e?.isTrusted) return;
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        ctx = new Audio();
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        for (let i = 0; i < VOICES; i++) {
          const tone = ctx.createOscillator(), gain = ctx.createGain();
          tone.type = TRI; gain.gain.value = 0; tone.connect(gain); gain.connect(master); tone.start();
          voices.push({ tone, gain });
        }
        const buffer = noiseBuffer();
        noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        noiseBand = ctx.createBiquadFilter(); noiseBand.type = "bandpass"; noiseBand.Q.value = 0.9;
        noiseGain = ctx.createGain(); noiseGain.gain.value = 0;
        noise.connect(noiseBand); noiseBand.connect(noiseGain); noiseGain.connect(master); noise.start();
        for (const layer of layers) layer(ctx, master, buffer);
        volume();
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    // A layer builds its nodes once, when the context opens (or at once if it already has).
    const attach = (layer) => { layers.push(layer); if (ctx) layer(ctx, master, noise.buffer); };
    const cue = (name, level = 1, pitch = 1) => {
      if (!ctx || muted || document.hidden || ctx.state !== "running") return;
      const notes = CUES[name] || CUES[ALIAS[name]] || CUES.tick, now = ctx.currentTime;
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i], at = now + n[1], peak = n[4] * level;
        if (n[0] === VOICES) {
          noiseBand.frequency.cancelScheduledValues(now); noiseGain.gain.cancelScheduledValues(now);
          noiseBand.frequency.setValueAtTime(n[2] * pitch, at); noiseBand.frequency.exponentialRampToValueAtTime(n[3] * pitch, at + n[6]);
          noiseGain.gain.setValueAtTime(0, at); noiseGain.gain.linearRampToValueAtTime(peak, at + n[5]); noiseGain.gain.exponentialRampToValueAtTime(0.0001, at + n[6]);
          continue;
        }
        const v = voices[n[0]];
        if (v.tone.type !== n[7]) v.tone.type = n[7];
        v.tone.frequency.cancelScheduledValues(now); v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(0, now);
        v.tone.frequency.setValueAtTime(n[2] * pitch, at); v.tone.frequency.exponentialRampToValueAtTime(n[3] * pitch, at + n[6]);
        v.gain.gain.setValueAtTime(0, at); v.gain.gain.linearRampToValueAtTime(peak, at + n[5]); v.gain.gain.exponentialRampToValueAtTime(0.0001, at + n[6]);
      }
    };
    const setMuted = (on) => { muted = !!on; volume(); try { localStorage.setItem(STORAGE, muted ? "off" : "on"); } catch { /* The choice holds for this visit. */ } };
    // A game's own view of the engine: its sound counts as running once a gesture reached it while it was open.
    const channel = (level = 1) => {
      let opened = false;
      return {
        unlock: (e) => { if (!e?.isTrusted) return; opened = true; unlock(e); },
        cue: (name, gain = 1, pitch = 1) => cue(name, gain * level, pitch),
        setMuted, dispose: () => { opened = false; },
        get running() { return opened && ctx?.state === "running"; },
        get muted() { return muted; }
      };
    };
    document.addEventListener("visibilitychange", volume);
    return {
      unlock, attach, cue, channel, setMuted,
      get muted() { return muted; },
      get running() { return ctx?.state === "running"; },
      get now() { return ctx ? ctx.currentTime : 0; },
      dispose() {
        disposed = true; document.removeEventListener("visibilitychange", volume);
        layers.length = voices.length = 0;
        if (ctx) ctx.close().catch(() => {});
        ctx = master = noise = noiseGain = noiseBand = null;
      }
    };
  };
  BL.pierSound = { create, CUES };
})();
