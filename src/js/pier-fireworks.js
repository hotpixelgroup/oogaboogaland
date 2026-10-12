// Fireworks over the water west of the park, for a new block, a donation or a party. A show is a fixed pool of
// shells: each climbs from the barge on a short trail, then bursts into the scene's particle pool (fx.js caps it
// at 240, and a shell is sized so a whole show fits). Nothing is created after `create`.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, SHELLS = 6, STARS = 24, RISE = 1.15, GAP = 0.42;
  const COLORS = ["#f7931a", "#ffd04e", "#f35f79", "#20c3bc", "#b368dc", "#fff0d3"];
  const stars = COLORS.map((color) => M.cached(() => { const g = M.box({ w: 0.6, h: 0.6, d: 0.6, color, emissive: 1 }); g.castShadow = false; return g; }));
  const trail = M.cached(() => { const g = M.box({ w: 0.28, h: 0.5, d: 0.28, color: "#ffe9b0", emissive: 1 }); g.castShadow = false; return g; });
  const create = ({ fx, sound, layout: L }) => {
    const shells = [], rand = BL.math.mulberry32(21e6);
    for (let i = 0; i < SHELLS; i++) shells.push({ age: -1, wait: 0, x: 0, z: 0, top: 0, color: 0, puff: 0 });
    let queued = 0, next = 0, launched = 0, bursts = 0;
    for (const g of stars) g();
    trail();
    // Ask for a show of `count` shells; a show already running takes the extra shells on its tail.
    const show = (count) => { queued = Math.min(SHELLS * 3, queued + count); };
    const fire = (s) => {
      s.age = 0; s.puff = 0;
      s.x = L.wheel.x - 62 - rand() * 46; s.z = L.wheel.z - 34 + rand() * 78; s.top = 44 + rand() * 26; s.color = (rand() * COLORS.length) | 0;
      launched++; sound.cue("whoosh", 0.8, 0.8 + rand() * 0.5);
    };
    const burst = (s) => {
      const geometry = stars[s.color](), speed = 13 + rand() * 6;
      for (let i = 0; i < STARS; i++) {
        // A rough sphere: rings of stars at three heights.
        const ring = i % 3, a = i / STARS * Math.PI * 6 + ring, up = (ring - 1) * 0.62, flat = Math.sqrt(1 - up * up * 0.6);
        fx.spawnParticle(geometry, s.x, s.top, s.z, Math.cos(a) * flat * speed, up * speed + 3, Math.sin(a) * flat * speed, 1.5 + rand() * 0.5, 0, 6, L.sea);
      }
      bursts++; sound.cue("boom", 1, 0.8 + rand() * 0.4); sound.cue("crackle", 0.8);
    };
    const update = (dt) => {
      if (queued > 0) {
        next -= dt;
        if (next <= 0) for (let i = 0; i < SHELLS; i++) if (shells[i].age < 0) { fire(shells[i]); queued--; next = GAP; break; }
      }
      for (let i = 0; i < SHELLS; i++) {
        const s = shells[i];
        if (s.age < 0) continue;
        s.age += dt; s.puff -= dt;
        if (s.age < RISE) {
          if (s.puff <= 0) { s.puff = 0.07; const u = s.age / RISE; fx.spawnParticle(trail(), s.x, L.sea + (s.top - L.sea) * u * (2 - u), s.z, 0, -2, 0, 0.35, 0, 2, L.sea); }
        } else { burst(s); s.age = -1; }
      }
    };
    return {
      show, update,
      get active() { if (queued > 0) return true; for (let i = 0; i < SHELLS; i++) if (shells[i].age >= 0) return true; return false; },
      get launched() { return launched; }, get bursts() { return bursts; },
      liveGeometry: (set) => { for (const g of stars) set.add(g()); set.add(trail()); },
      dispose: () => { queued = 0; for (let i = 0; i < SHELLS; i++) shells[i].age = -1; }
    };
  };
  BL.pierFireworks = { create, SHELLS, STARS };
})();
