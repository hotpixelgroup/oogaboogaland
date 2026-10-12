// The Proof-of-Work Bell: a fairground strength tester by the arch, and the first thing a new visitor can play.
// Every swing of the hammer is one try: a random number that rings the bell only if it lands at or under the
// target. It takes many swings to ring and one look to see that it rang, which is the whole idea of proof of
// work. After each ring the target moves so the pier's bell keeps ringing about once in EIGHT swings however
// lucky the last run was. `createSwinger` is the rule on its own (the suite runs it in Node); the rest is the
// tower, its puck and the prompt. No panel, no clock: walk up, swing, walk on.
(() => {
  "use strict";
  const BL = window.BL, MAX = 4294967295, EIGHT = 8, PRIZE = 3, COOLDOWN = 0.42, RISE = 0.38;
  const createSwinger = (random = () => BL.math.randomInt(4294967296)) => {
    const state = { target: Math.floor(MAX / EIGHT), swings: 0, rings: 0, last: 0, height: 0, rang: false, took: 0 };
    // One swing. The puck climbs higher the nearer the try came; at or under the target it reaches the bell.
    const swing = () => {
      const hash = random() >>> 0;
      state.swings++; state.last = hash; state.rang = hash <= state.target;
      if (!state.rang) { state.height = 0.12 + 0.8 * (1 - (hash - state.target) / (MAX - state.target)); return false; }
      state.height = 1; state.rings++; state.took = state.swings;
      // Retarget on every ring toward one ring in eight swings, by at most a factor of two either way.
      state.target = Math.floor(Math.max(MAX / 64, Math.min(MAX / 2, state.target * Math.max(0.5, Math.min(2, state.swings / EIGHT)))));
      state.swings = 0;
      return true;
    };
    return { state, swing };
  };
  const S = BL.scene, M = BL.models;
  const puckGeometry = M.cached(() => M.box({ w: 0.3, h: 0.14, d: 0.12, color: "#f7931a", emissive: 0.4 }));
  const ringGeometry = M.cached(() => { const g = M.lathe({ profile: [[0, 0], [0.5, 0], [0.5, 0.05], [0, 0.05]], segments: 16, color: "#ffe9b0", emissive: 1 }); g.castShadow = false; return g; });
  const hammerGeometry = M.cached(() => M.merge(M.beam(0, 0, 0, 0, 1.1, 0, 0.07, "#8e6949"), M.moved(M.bevelBox({ w: 0.42, h: 0.3, d: 0.3, color: "#5a5f66" }), 0, 1.15, 0)));
  const towerGeometry = M.cached(() => {
    const parts = [], box = (w, h, d, x, y, z, color) => M.moved(M.bevelBox({ w, h, d, color }), x, y, z);
    parts.push(box(1.5, 0.3, 1.5, 0, 0.15, 0, "#16478b"), box(0.5, 5.6, 0.16, 0, 3.1, -0.1, "#f8eed3"), box(0.62, 0.3, 0.3, 0, 6.05, -0.1, "#16478b"));
    // Painted marks up the board: the higher the puck, the nearer the try.
    for (let i = 1; i <= 9; i++) parts.push(M.moved(M.box({ w: i % 3 ? 0.2 : 0.34, h: 0.035, d: 0.02, color: i > 6 ? "#f7931a" : "#16478b" }), 0, 0.45 + i * 0.54, 0));
    parts.push(M.moved(M.lathe({ profile: [[0, 0], [0.34, 0], [0.36, 0.08], [0.2, 0.3], [0.08, 0.42], [0, 0.42]], segments: 16, color: "#f2bf38" }), 0, 5.86, 0.06), box(0.7, 0.16, 0.7, 0, 0.38, 0.75, "#8e6949"));
    return M.merge(...parts);
  });
  const padGeometry = M.cached(() => M.box({ w: 1.8, h: 0.015, d: 1.8, color: "#eac66f" }));
  const build = (layout) => {
    const q = layout.bell, root = S.createNode({ position: { x: q.x, y: q.y, z: q.z } });
    S.addChild(root, S.createNode({ geometry: towerGeometry() }));
    S.addChild(root, S.createNode({ geometry: BL.hubModels.postSign("PROOF OF WORK", 0.3, 1.2), position: { x: -1.6, y: 0, z: 0.2 } }));
    S.addChild(root, S.createNode({ geometry: padGeometry(), position: { x: q.play.x - q.x, y: 0.07, z: q.play.z - q.z } }));
    const puck = S.createNode({ geometry: puckGeometry(), position: { x: 0, y: 0.5, z: 0.06 } });
    const glow = S.createNode({ geometry: ringGeometry(), position: { x: 0, y: 6.3, z: 0.06 }, visible: false });
    const hammer = S.createNode({ geometry: hammerGeometry(), position: { x: 0.55, y: 0.46, z: 0.75 }, rotation: { x: -0.5, y: 0, z: 0 } });
    S.addChild(root, puck); S.addChild(root, glow); S.addChild(root, hammer);
    return { root, puck, glow, hammer };
  };
  const create = ({ models, layout, crew, hud, fx, game, sound }) => {
    const q = layout.bell, swinger = createSwinger(), state = swinger.state;
    let wait = 0, age = 9, lesson = false;
    const near = () => { const a = crew.player; return !!a && !a.jet && !a.camp.seat && Math.abs(a.root.position.y - a.baseY - q.y) < 0.4 && Math.hypot(a.root.position.x - q.play.x, a.root.position.z - q.play.z) < 2.2; };
    const act = () => {
      if (!near()) return false;
      if (wait > 0) return true;
      wait = COOLDOWN; age = 0;
      const tried = state.swings + 1;
      if (swinger.swing()) {
        const paid = game.addTickets(PRIZE); sound.cue("bell");
        for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; fx.spawnParticle(BL.fx.CONFETTI[i % BL.fx.CONFETTI.length], q.x, q.y + 6.2, q.z, Math.cos(t) * 1.6, 2.4, Math.sin(t) * 1.6, 0.9, 6, 9.8, q.y); }
        // The idea is named once, after the visitor has done it.
        hud.toast(lesson ? `It rang on swing ${tried} · +${paid} tickets` : `It rang on swing ${tried}. Proof of work: hard to do, one look to check · +${paid} tickets`);
        lesson = true;
      } else sound.cue(state.height > 0.75 ? "whack" : "bump", 0.7);
      return true;
    };
    const update = (dt) => {
      wait = Math.max(0, wait - dt); age += dt;
      // Up in a third of a second, then back down under its own weight.
      const up = Math.min(1, age / RISE), down = Math.max(0, age - RISE), reach = state.height * 5.2;
      models.puck.position.y = 0.5 + (age < RISE ? reach * (1 - (1 - up) * (1 - up)) : Math.max(0, reach - 9 * down * down));
      models.glow.visible = state.rang && age < 0.9; models.glow.glow = 2 - age * 2;
      models.hammer.rotation.x = age < 0.2 ? -0.5 - 1.3 * Math.sin(age / 0.2 * Math.PI) : -0.5;
    };
    return { near, act, update, state, swinger, dispose: () => { models.glow.visible = false; } };
  };
  BL.pierBell = { build, create, createSwinger, EIGHT, PRIZE };
})();
