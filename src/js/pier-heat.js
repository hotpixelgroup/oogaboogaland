// Heat: the pier's wanted meter, in the cartoon register. Bowling people over with a vehicle raises it a step a
// person, to five. From two up, a lifeguard comes running from the nearest post. Caught means a dunking off the
// pier and a small fine in tickets; nothing else is lost. It is shaken off by getting away (it cools once nobody
// has been knocked down for a few seconds, faster in the water), and a ride on the train loses the lifeguard at
// once. The lifeguard is one caveman built once, moved by direct transforms with the scene's own walkable
// query, so they keep to the deck and go round what stands in the way.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models, MOST = 5, CHASE = 2, CALM = 5, COOL = 9, CATCH = 1.7, FINE = 10, RUN = 7.2, FAR = 16;
  const PIPS = Array.from({ length: MOST + 1 }, (_, n) => `Heat ${"●".repeat(n)}${"○".repeat(MOST - n)}`);
  // Where a lifeguard can set out from.
  const POSTS = [[0, 60], [0, -20], [-34, -29], [0, -150], [-40, 30], [-30, -100], [0, -250]];
  const hat = M.cached(() => M.merge(M.box({ w: 0.42, h: 0.1, d: 0.42, color: "#d6402f" }), M.moved(M.box({ w: 0.3, h: 0.16, d: 0.3, color: "#f3efe4" }), 0, 0.12, 0)));
  const create = ({ root, layout: L, crew, hud, fx, sound, game, walkable, onBust }) => {
    const ui = document.getElementById("pier-heat"), top = L.top;
    const cave = M.caveman(BL.contributors.traitsFor("pier-lifeguard")), baseY = cave.root.position.y, probe = { bodyRadius: 0.4, camp: { seat: null } };
    for (const key of ["club", "snack", "gun", "jetpack", "jetFlame"]) if (cave.parts[key]) cave.parts[key].visible = false;
    const cap = S.createNode({ geometry: hat(), position: { x: 0, y: cave.traits.height * 2 - baseY + 0.02, z: 0 } });
    S.addChild(cave.root, cap); cave.root.visible = false; S.addChild(root, cave.root);
    const state = { level: 0, chasing: false, busts: 0, calm: 0, x: 0, z: 0 };
    let shown = -1, stride = 0;
    const pips = () => { const n = Math.ceil(state.level - 1e-6); if (n === shown) return; shown = n; ui.hidden = n <= 0; ui.textContent = PIPS[Math.max(0, n)]; };
    // One more person bowled over.
    const add = (n) => { state.level = Math.min(MOST, state.level + n); state.calm = CALM; pips(); };
    const clear = (note) => { state.level = 0; state.chasing = false; cave.root.visible = false; pips(); if (note) hud.toast(note); };
    const setOut = (px, pz) => {
      // The nearest post that is not on top of the visitor.
      let best = POSTS[0], distance = 1e9;
      for (const post of POSTS) { const d = Math.hypot(post[0] - px, post[1] - pz); if (d > FAR && d < distance) { best = post; distance = d; } }
      state.x = best[0]; state.z = best[1]; state.chasing = true; cave.root.visible = true;
      sound.cue("horn", 0.7, 1.6); hud.toast("A lifeguard is after you. Lose them, or it is a dunking.");
    };
    // One step toward (tx, tz) at `speed`, straight if the way is clear, else the clearest way round.
    const TURNS = [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9];
    const chase = (dt, tx, tz, speed) => {
      const heading = Math.atan2(tx - state.x, tz - state.z), move = speed * dt;
      for (let i = 0; i < TURNS.length; i++) {
        const a = heading + TURNS[i], x = state.x + Math.sin(a) * move, z = state.z + Math.cos(a) * move;
        if (!walkable(state.x, state.z, x, z, top, 1.5, probe)) continue;
        state.x = x; state.z = z; cave.root.rotation.y = a;
        break;
      }
      stride += dt * 11;
      const swing = Math.sin(stride) * 0.7, p = cave.root.position;
      cave.parts.legL.rotation.x = swing; cave.parts.legR.rotation.x = -swing; cave.parts.armL.rotation.x = -swing * 0.7; cave.parts.armR.rotation.x = -2.4;
      p.x = state.x; p.z = state.z; p.y = top + baseY + Math.abs(Math.sin(stride)) * 0.05;
    };
    // player: the driven Ooga or null. swimming, onTrain: where they are. safe: in a game, a ride or a boat,
    // where nobody is caught.
    const update = (dt, player, swimming, onTrain, safe) => {
      if (state.level <= 0) return;
      if (onTrain) { clear(state.chasing ? "You lost the lifeguard on the train" : ""); return; }
      state.calm -= dt;
      if (state.calm <= 0) state.level = Math.max(0, state.level - dt / COOL * (swimming ? 4 : 1));
      pips();
      if (!player) { if (state.chasing) clear(""); return; }
      const px = player.root.position.x, pz = player.root.position.z;
      if (!state.chasing) { if (state.level >= CHASE) setOut(px, pz); return; }
      if (state.level < CHASE - 0.6) { state.chasing = false; cave.root.visible = false; hud.toast("You lost the lifeguard"); return; }
      chase(dt, px, pz, RUN + state.level * 0.35);
      if (safe || swimming || Math.hypot(px - state.x, pz - state.z) > CATCH || Math.abs(player.root.position.y - player.baseY - top) > 2) return;
      // Caught: off the pier with you.
      const fine = Math.min(FINE, game.state.arcade.tickets);
      if (fine > 0) game.spendTickets(fine);
      state.busts++; sound.cue("bad");
      clear(""); onBust(fine);
    };
    return {
      state, add, update, cave,
      get level() { return Math.ceil(state.level - 1e-6); },
      liveGeometry: (set) => { set.add(cave.headOpen).add(cave.headClosed); },
      dispose: () => { ui.hidden = true; S.removeChild(root, cave.root); }
    };
  };
  BL.pierHeat = { create, MOST, CHASE, FINE };
})();
