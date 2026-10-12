// What makes the pier a place after dark and a busy one by day: strings of bulbs, lit windows, pennants and flags
// that move in the wind, paint on the deck, light on the water and foam on the sand. None of it collides. Every
// mesh is baked once a page and shared by every visit; `build` only makes the nodes and tells the light manager
// (pier-lights.js) which of them glow and where real light should fall.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models, TAU = Math.PI * 2;
  const BULBS = ["#ffd98a", "#ff9a6b", "#7fe0d6", "#f7931a"], PENNANTS = ["#f35f79", "#ffd04e", "#20c3bc", "#557cde", "#f7931a"];
  const bakes = new Map(), baked = (key, make) => { let g = bakes.get(key); if (!g) { g = make(); bakes.set(key, g); } return g; };
  const quiet = (g) => { g.castShadow = false; return g; };
  // The promenade's lamp heads, north to south (pier-models.js stands a lamp every 35 m).
  const lampZ = []; for (let z = -238; z <= 76; z += 35) lampZ.push(z);
  // A sagging string from a to b: the wire into one list, its bulbs into another.
  const string = (wire, bulbs, ax, ay, az, bx, by, bz, sag, count) => {
    let px = ax, py = ay, pz = az;
    for (let i = 1; i <= 10; i++) {
      const u = i / 10, x = ax + (bx - ax) * u, y = ay + (by - ay) * u - Math.sin(u * Math.PI) * sag, z = az + (bz - az) * u;
      wire.push(M.beam(px, py, pz, x, y, z, 0.025, "#39312b")); px = x; py = y; pz = z;
    }
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      bulbs.push(M.moved(M.box({ w: 0.13, h: 0.16, d: 0.13, color: BULBS[i % BULBS.length], emissive: 1 }), ax + (bx - ax) * u, ay + (by - ay) * u - Math.sin(u * Math.PI) * sag - 0.1, az + (bz - az) * u));
    }
  };
  // Where every storefront and hall shows a lit window: the face plane, its centre along z, and which way it looks.
  const fronts = (L) => {
    const rows = [];
    const add = (x, z, w, d) => { const direction = x < 0 ? 1 : -1; rows.push({ face: x + direction * (w / 2 + 0.025), z, d, direction }); };
    for (const q of L.shops) add(q[0], q[1], q[2], q[3]);
    for (const q of L.carnival) add(q.x, q.z, q.w, q.d);
    return rows;
  };
  const festoon = (L) => baked("festoon", () => {
    const wire = [], bulbs = [], y = L.top + 4.55;
    for (let i = 0; i + 1 < lampZ.length; i++) string(wire, bulbs, 5.5, y, lampZ[i], 5.5, y, lampZ[i + 1], 1.1, 12);
    // Across the promenade from a lamp to each shop front it stands near.
    for (const q of L.shops) {
      let near = lampZ[0];
      for (const z of lampZ) if (Math.abs(z - q[1]) < Math.abs(near - q[1])) near = z;
      string(wire, bulbs, 5.5, y, near, q[0] + q[2] / 2 + 0.4, L.top + q[4] + 0.1, q[1], 0.7, 9);
    }
    // Round the park: the arch to the wheel, the wheel to the tower, the tower back along the deck edge.
    const p = L.park, hub = L.top + 6;
    string(wire, bulbs, p.entrance.x, L.top + 4.3, p.entrance.z, p.scrambler.x + 7, hub, p.scrambler.z, 1.2, 12);
    string(wire, bulbs, p.scrambler.x + 7, hub, p.scrambler.z, p.ship.x + 8, hub, p.ship.z + 9, 1.2, 12);
    string(wire, bulbs, p.ship.x + 8, hub, p.ship.z + 9, L.wheel.x + 9, hub, L.wheel.z + 6, 1.4, 14);
    return { wire: quiet(M.merge(...wire)), bulbs: quiet(M.merge(...bulbs)) };
  });
  // Triangular pennants on a line; local y is down from the string, so the wind moves the tips most.
  const pennants = (length, key) => baked(`pennants|${key}|${length}`, () => {
    const g = { verts: [], faces: [], lines: [], castShadow: false, sway: 0.5 }, n = Math.max(2, Math.round(length / 0.55));
    for (let i = 0; i < n; i++) {
      const x = -length / 2 + (i + 0.5) * length / n, w = length / n * 0.42, at = g.verts.length / 3, color = BL.math.hexToRgb(PENNANTS[i % PENNANTS.length]);
      const dip = -Math.sin((i + 0.5) / n * Math.PI) * 0.25;
      g.verts.push(x - w, dip, 0, x + w, dip, 0, x, dip - 0.42, 0);
      g.faces.push({ i: [at, at + 1, at + 2], color }, { i: [at + 2, at + 1, at], color });
    }
    return g;
  });
  const flag = (color) => baked(`flag|${color}`, () => {
    const cloth = { verts: [], faces: [], lines: [] }, rgb = BL.math.hexToRgb(color);
    for (let i = 0; i <= 4; i++) cloth.verts.push(0.06 + i * 0.3, 4.3, 0, 0.06 + i * 0.3, 3.5, 0);
    for (let i = 0; i < 4; i++) { const a = i * 2; cloth.faces.push({ i: [a, a + 2, a + 3, a + 1], color: rgb }, { i: [a + 1, a + 3, a + 2, a], color: rgb }); }
    const g = M.merge(M.beam(0, 0, 0, 0, 4.4, 0, 0.06, "#f2ecdd"), cloth); g.castShadow = false; g.sway = 0.006; return g;
  });
  // Warm panes just in front of each arched window, drawn only after dusk.
  const panes = (L) => baked("panes", () => {
    const g = { verts: [], faces: [], lines: [], castShadow: false }, color = BL.math.hexToRgb("#ffc56b");
    const arch = (x, centre, bottom, base, r) => {
      const at = g.verts.length / 3, ids = [];
      g.verts.push(x, bottom, centre - r, x, bottom, centre + r);
      for (let i = 0; i <= 10; i++) { const a = i * Math.PI / 10; g.verts.push(x, base + r * Math.sin(a), centre + r * Math.cos(a)); }
      for (let i = 0; i < 13; i++) ids.push(at + i);
      g.faces.push({ i: ids, color, emissive: 1 }, { i: ids.slice().reverse(), color, emissive: 1 });
    };
    for (const f of fronts(L)) for (const dz of [-f.d * 0.3, 0, f.d * 0.3]) arch(f.face + f.direction * 0.052, f.z + dz, L.top + (dz === 0 ? 0.1 : 0.77), L.top + 2.2, 0.72);
    for (const id of ["playland", "restaurants"]) {
      const v = L[id], x = v.x + v.w / 2 + 0.085;
      for (let z = -v.d / 2 + 3; z < v.d / 2; z += 6) for (const dz of [-1.65, 0, 1.65]) arch(x, v.z + z + dz, L.top + (dz === 0 ? 0.1 : 0.77), L.top + 2.2, 0.72);
    }
    return g;
  });
  // A big orange Bitcoin roundel painted where the bridge meets the deck, and queue lines by each ride's pad.
  const paint = (L) => baked("paint", () => {
    const parts = [], y = L.top + 0.012;
    parts.push(M.moved(M.lathe({ profile: [[0, 0], [3.1, 0], [3.1, 0.006], [0, 0.006]], segments: 40, color: "#f7931a" }), 0, y - 0.006, 86));
    parts.push(M.moved(M.lathe({ profile: [[2.75, 0], [2.95, 0], [2.95, 0.004], [2.75, 0.004]], segments: 40, color: "#fff0d3" }), 0, y, 86));
    parts.push(M.moved(M.turnedX(BL.factoryModels.smoothBitcoin(3.6, 0.01, "#fff0d3", 0), -Math.PI / 2), 0, y + 0.006, 86));
    const lane = (x, z, dx, dz) => { for (let i = 1; i <= 4; i++) parts.push(M.moved(M.box({ w: dx ? 0.9 : 0.14, h: 0.008, d: dx ? 0.14 : 0.9, color: "#fff0d3" }), x + dx * i * 1.5, y, z + dz * i * 1.5)); };
    lane(L.wheel.board.x, L.wheel.board.z, 0, 1); lane(L.coaster.board.x, L.coaster.board.z, 1, 0);
    for (const q of L.games) lane(q.play.x, q.play.z, -1, 0);
    return quiet(M.merge(...parts));
  });
  // Light lying on the water beside what is lit: one soft streak a lamp, a fan of colours under the wheel.
  const streaks = (L) => baked("streaks", () => {
    const g = { verts: [], faces: [], lines: [], castShadow: false }, y = L.sea + 0.03;
    const streak = (x0, x1, z, width, hex) => {
      const at = g.verts.length / 3, color = BL.math.hexToRgb(hex);
      g.verts.push(x0, y, z - width / 2, x0, y, z + width / 2, x1, y, z - width * 0.2, x1, y, z + width * 0.2);
      g.faces.push({ i: [at, at + 1, at + 3, at + 2], color, emissive: 1 }, { i: [at + 2, at + 3, at + 1, at], color, emissive: 1 });
    };
    for (const z of lampZ) streak(8.2, 26, z, 1.4, "#ffd98a");
    for (let i = 0; i < 6; i++) streak(-64.5, -86 - (i % 2) * 6, L.wheel.z - 7.5 + i * 3, 1.1, BULBS[i % BULBS.length]);
    g.glass = 0.2; g.glassOpacity = 0.2; g.lightBeam = 0;
    return g;
  });
  // Foam where the sea meets the sand: broken white strips along the whole walkable shore.
  const foam = (L) => baked("foam", () => {
    const parts = [], rand = BL.math.mulberry32(480), shore = BL.pierBeach.LAYOUT;
    for (let x = -320; x < 320; x += 8) {
      const w = 5 + rand() * 3, d = 0.25 + rand() * 0.3;
      parts.push(M.moved(M.box({ w, h: 0.03, d, color: "#f4fbf6", emissive: 0.35 }), x + rand() * 2, 0, (rand() - 0.5) * 0.9));
    }
    const g = quiet(M.merge(...parts));
    // The sand the last wave left wet: a dark, glassy band up the slope from the waterline.
    const edge = shore.shore + (L.sea - shore.sand) / 0.075, wet = { verts: [-325, L.sea + 0.02, edge - 0.5, 325, L.sea + 0.02, edge - 0.5, 325, L.sea + 0.02 + 4.5 * 0.075, edge + 4, -325, L.sea + 0.02 + 4.5 * 0.075, edge + 4], faces: [], lines: [], castShadow: false };
    wet.faces.push({ i: [0, 3, 2, 1], color: BL.math.hexToRgb("#5d6f73") });
    wet.glass = 0.32; wet.glassOpacity = 0.32; wet.lightBeam = 0;
    return { strip: g, wet, edge };
  });
  const build = ({ root, layout: L, lights, land }) => {
    const group = S.createNode(), add = (geometry, position, rotation) => { const n = S.createNode({ geometry }); if (position) Object.assign(n.position, position); if (rotation) Object.assign(n.rotation, rotation); S.addChild(group, n); return n; };
    S.addChild(root, group);
    const f = festoon(L); add(f.wire); lights.glow(add(f.bulbs), 0.25, 2.2);
    for (let i = 0; i + 1 < lampZ.length; i++) lights.source(5.5, L.top + 3.6, (lampZ[i] + lampZ[i + 1]) / 2, 9, "festoon");
    // Pennants: over the foot of the bridge, across the park arch, along the arcade's porch and the bumper hall.
    const line = (x, y, z, length, yaw, key) => add(pennants(length, key), { x, y, z }, { x: 0, y: yaw, z: 0 });
    line(0, L.top + 4.4, 96, 10, 0, "bridge"); line(L.park.entrance.x, L.top + 3.5, L.park.entrance.z + 0.6, 7, 0, "arch");
    line(L.playland.x + L.playland.w / 2 + 1.7, L.top + 3.2, L.playland.z, L.playland.d - 2, Math.PI / 2, "porch");
    line(L.park.bumper.x, L.top + 4.3, L.park.bumper.z + L.park.bumper.d / 2 + 0.2, L.park.bumper.w - 1, 0, "bumper");
    // Flags on the arch's towers and, for the day's fee, on the lifeguard towers (see `fee`).
    for (const side of [-1, 1]) add(flag("#f7931a"), { x: L.entrance.x + side * 7.5, y: L.entrance.y + 6.9, z: L.entrance.z }, { x: 0, y: side * 0.4, z: 0 });
    const feeFlags = [];
    for (const q of L.coastalTowers) feeFlags.push(add(flag("#37b24d"), { x: q.x + 1.1, y: 0.35 + 3.4, z: q.z }));
    const glazing = add(panes(L)); glazing.visible = false;
    for (const q of fronts(L)) lights.source(q.face + q.direction * 1.6, L.top + 2.3, q.z, 7.5, "window");
    for (const id of ["playland", "restaurants"]) { const v = L[id]; lights.source(v.x + v.w / 2 + 2.2, L.top + 2.6, v.z - 5, 9, "window"); lights.source(v.x + v.w / 2 + 2.2, L.top + 2.6, v.z + 5, 9, "window"); }
    add(paint(L));
    const water = add(streaks(L)); water.visible = false;
    const surf = foam(L), strips = [add(surf.strip), add(surf.strip)]; add(surf.wet);
    // Every promenade lamp casts; so do the rides and the halls.
    for (const z of lampZ) lights.source(5.35, L.top + 4.5, z, 11, "lamp");
    for (let x = -280, i = 0; x <= 280; x += 40, i++) if (i % 2 === 0) lights.source(x + 4.05, 0.35 + 4.5, 152, 11, "lamp");
    lights.source(L.wheel.x, L.top + 7, L.wheel.z + 4, 20, "ride"); lights.source(L.coaster.board.x - 3, L.top + 4, L.coaster.board.z, 12, "gold");
    lights.source(L.carousel.x, L.carousel.floor + 4.6, L.carousel.z, 13, "gold"); lights.source(L.park.bumper.x, L.top + 3.6, L.park.bumper.z, 13, "teal");
    lights.source(L.park.entrance.x, L.top + 3.2, L.park.entrance.z + 1.5, 9, "ride"); lights.source(L.prizes.x, L.top + 2.6, L.prizes.z + 1.5, 7, "gold");
    lights.source(L.park.scrambler.x, L.top + 4, L.park.scrambler.z, 12, "teal"); lights.source(L.park.ship.x, L.top + 5, L.park.ship.z, 13, "gold");
    lights.source(L.park.drop.x, L.top + 5, L.park.drop.z, 12, "ride");
    // What glows by the clock: lamp heads, signs, the arch's neon, the wheel's hub, the rides' own bulbs.
    for (const node of land.lamps) lights.glow(node, 0.1, 1.9);
    for (const node of land.beach.lamps) lights.glow(node, 0.1, 1.9);
    for (const node of land.signs) lights.glow(node, 1, 3.2);
    lights.glow(land.entrance, 0.75, 1.9);
    let swash = 0, fee = 0;
    const FEE = ["#37b24d", "#f5c542", "#e8473f"];
    const update = (time, night) => {
      // The pane and the streak layers exist only after dusk; their brightness is the night's.
      const lit = night > 0.03;
      if (glazing.visible !== lit) glazing.visible = water.visible = lit;
      if (lit) { glazing.glow = 0.35 + night * 1.25; water.smokeOpacity = night; water.glow = 0.7 + 0.2 * Math.sin(time * 1.3); }
      // Two foam lines ride the swash up the sand and back, out of step.
      for (let i = 0; i < 2; i++) {
        const s = Math.sin(time * 0.42 + i * 2.1), reach = 1.4 + i * 1.3, z = surf.edge + s * reach, n = strips[i];
        n.position.z = z; n.position.y = L.sea + 0.035 + Math.max(0, z - surf.edge) * 0.075; n.position.x = i * 3.7;
        n.scale.z = 0.6 + 0.4 * Math.cos(time * 0.42 + i * 2.1) ** 2;
      }
      swash = strips[0].position.z;
    };
    // The lifeguards' flag for the cost of the next block: 0 calm, 1 busy, 2 crowded.
    const setFee = (level) => { if (level === fee) return; fee = level; for (const n of feeFlags) n.geometry = flag(FEE[level]); };
    update(0, 0);
    return {
      update, setFee, feeFlags, strips,
      get fee() { return fee; }, get swash() { return swash; },
      liveGeometry: (set) => { for (const hex of FEE) set.add(flag(hex)); },
      dispose: () => { S.removeChild(root, group); }
    };
  };
  BL.pierDressing = { build, lampZ };
})();
