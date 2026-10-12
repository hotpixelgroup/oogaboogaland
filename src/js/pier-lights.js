// Night on the pier. Two jobs, both allocation-free after `create`:
//  1. Dusk glow: every lamp head, bulb string, lit window, sign and neon tube is a node whose `glow` follows the
//     clock, so the pier comes on at sunset and bloom does the rest on every tier that has it.
//  2. Real light: the renderer draws at most 32, 20 or 10 point lights by tier and every one costs every pixel, so
//     the pier keeps a list of places that should cast light and hands the renderer only the nearest few to where
//     the visitor is, brightest first, each fading out before it would be dropped. The first FIXED slots belong to
//     the lighthouse (pier-lighthouse.js); a room's own lights come next while the visitor is inside it.
(() => {
  "use strict";
  const BL = window.BL;
  const FIXED = 3, MAX = 14, REACH = 78, FADE = 22, RETHINK = 0.2;
  // Warm lamp, shop window, string of bulbs, ride, cool accent: r, g, b at full night.
  const TONES = { lamp: [1.15, 0.92, 0.6], window: [1.0, 0.68, 0.36], festoon: [0.95, 0.72, 0.42], ride: [1.0, 0.55, 0.75], teal: [0.35, 0.9, 0.95], gold: [1.1, 0.8, 0.3] };
  const create = ({ lighting, layout }) => {
    const sources = [], glowers = [];
    let count = 0, xs = null, ys = null, zs = null, radii = null, tones = null, order = null, distance = null;
    let think = RETHINK, chosen = 0, lastNight = -1, room = null;
    // A place that casts light after dark.
    const source = (x, y, z, radius, tone) => { sources.push(x, y, z, radius, TONES[tone][0], TONES[tone][1], TONES[tone][2]); };
    // A node whose emissive faces follow the clock: `day` by day, `night` after dark.
    const glow = (node, day, night) => { glowers.push({ node, day, night }); node.glow = day; };
    const ready = () => {
      count = sources.length / 7;
      xs = new Float32Array(count); ys = new Float32Array(count); zs = new Float32Array(count); radii = new Float32Array(count); tones = new Float32Array(count * 3);
      order = new Int16Array(MAX); distance = new Float32Array(MAX);
      for (let i = 0; i < count; i++) { xs[i] = sources[i * 7]; ys[i] = sources[i * 7 + 1]; zs[i] = sources[i * 7 + 2]; radii[i] = sources[i * 7 + 3]; tones[i * 3] = sources[i * 7 + 4]; tones[i * 3 + 1] = sources[i * 7 + 5]; tones[i * 3 + 2] = sources[i * 7 + 6]; }
      sources.length = 0;
    };
    // The nearest few sources within reach, nearest first, by insertion into a fixed list.
    const choose = (fx, fz) => {
      chosen = 0;
      for (let i = 0; i < count; i++) {
        const d = Math.hypot(xs[i] - fx, zs[i] - fz);
        if (d > REACH) continue;
        if (chosen === MAX) { if (d >= distance[MAX - 1]) continue; } else chosen++;
        let at = chosen - 1;
        while (at > 0 && distance[at - 1] > d) { order[at] = order[at - 1]; distance[at] = distance[at - 1]; at--; }
        order[at] = i; distance[at] = d;
      }
    };
    // night: 0 by day, 1 after dark. focus: where the visitor is. inside: the room they stand in, or null.
    const update = (dt, night, focus, inside) => {
      if (Math.abs(night - lastNight) > 0.004) {
        lastNight = night;
        for (let i = 0; i < glowers.length; i++) { const g = glowers[i]; g.node.glow = g.day + (g.night - g.day) * night; }
      }
      const lights = lighting.lights;
      let slot = FIXED;
      room = inside;
      if (inside) { lights.set(inside, slot * 8); slot += inside.length / 8; }
      if (night > 0.02) {
        think += dt;
        if (think >= RETHINK) { think = 0; choose(focus.x, focus.z); }
        for (let k = 0; k < chosen; k++) {
          const i = order[k], d = Math.hypot(xs[i] - focus.x, zs[i] - focus.z), level = night * Math.max(0, Math.min(1, (REACH - d) / FADE)), at = slot * 8;
          lights[at] = xs[i]; lights[at + 1] = ys[i]; lights[at + 2] = zs[i]; lights[at + 3] = radii[i];
          lights[at + 4] = tones[i * 3] * level; lights[at + 5] = tones[i * 3 + 1] * level; lights[at + 6] = tones[i * 3 + 2] * level; lights[at + 7] = 0;
          slot++;
        }
      }
      lighting.lightCount = slot;
    };
    return {
      source, glow, ready, update,
      get sources() { return count; }, get lit() { return lighting.lightCount; }, get glowing() { return glowers.length; },
      dispose() { glowers.length = 0; count = chosen = 0; lighting.lightCount = FIXED; }
    };
  };
  BL.pierLights = { create, FIXED, MAX, TONES };
})();
