// The Block Ferry. It lies at the pier tip and sails for the lighthouse only when a real block is found: the
// horn sounds, it waits a little for anyone running, crosses, lets its riders off on the lighthouse's footing,
// waits there, and comes back. It is the pier's picture of settling on the chain: shared, slow and on the
// chain's own time, with the two launches beside it as the instant, private way across. At the lighthouse a
// visitor climbs to the lantern gallery and turns a crank that checks the newest block with nobody's help; that
// lights their own lantern, once, for good. No block, no sailing: nothing here invents one. Built once; `update`
// allocates nothing.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models;
  const SPEED = 9.5, BOARDING = 25, LAYOVER = 40, CHECK = 3.6, REWARD = 21;
  const HOLD = Array.from({ length: Math.max(BOARDING, LAYOVER) + 1 }, (_, i) => `Sails in ${i}s`);
  const hull = M.cached(() => {
    const box = (w, h, d, x, y, z, color) => M.moved(M.bevelBox({ w, h, d, color }), x, y, z), parts = [];
    // Local +z is the bow. The deck's top is local y 0.
    parts.push(box(5.2, 1.5, 15, 0, -0.75, 0, "#1d4f73"), box(4.2, 1.2, 2.2, 0, -0.75, 8.2, "#1d4f73"), box(5.4, 0.14, 15.2, 0, -0.02, 0, "#eedfbe"));
    parts.push(box(3.4, 2.3, 4.6, 0, 1.2, -3.6, "#fff6e4"), box(3.6, 0.5, 4.8, 0, 1.75, -3.6, "#f7931a"), box(3.8, 0.16, 5, 0, 2.45, -3.6, "#1d4f73"));
    parts.push(M.moved(M.lathe({ profile: [[0, 0], [0.55, 0], [0.5, 1.7], [0.62, 1.7], [0.62, 2.1], [0, 2.1]], segments: 14, color: t => t > 0.7 ? "#22262b" : "#f7931a" }), 0, 2.5, -4.4));
    for (const x of [-2.5, 2.5]) { parts.push(M.beam(x, 1.0, -7.3, x, 1.0, 7.3, 0.07, "#fff6e4")); for (let z = -7.3; z <= 7.3; z += 1.46) parts.push(M.beam(x, 0, z, x, 1.0, z, 0.06, "#fff6e4")); }
    for (const z of [1.2, 3.4, 5.6]) parts.push(box(3.6, 0.12, 0.6, 0, 0.5, z, "#c98a4b"), box(3.6, 0.5, 0.1, 0, 0.72, z - 0.3, "#c98a4b"));
    parts.push(M.moved(M.turnedY(BL.hubModels.postSign("BLOCK FERRY", 0.34, 0), Math.PI / 2), 2.72, 0.2, -3.6), M.moved(M.turnedY(BL.hubModels.postSign("BLOCK FERRY", 0.34, 0), -Math.PI / 2), -2.72, 0.2, -3.6));
    return M.merge(...parts);
  });
  const pad = M.cached(() => M.box({ w: 3, h: 0.015, d: 2, color: "#f7931a" }));
  const crank = M.cached(() => M.merge(M.moved(M.bevelBox({ w: 0.5, h: 0.9, d: 0.4, color: "#244653" }), 0, 0.45, 0), M.moved(M.turnedX(M.torus(0.22, 0.035, "#f2bf38", 0, 14, 5), Math.PI / 2), 0, 0.72, 0.24), M.moved(M.box({ w: 0.3, h: 0.16, d: 0.02, color: "#f7931a", emissive: 0.8 }), 0, 0.3, 0.21)));
  const lantern = M.cached(() => { const g = M.merge(M.moved(M.lathe({ profile: [[0, 0], [0.16, 0], [0.2, 0.3], [0.1, 0.42], [0, 0.42]], segments: 10, color: "#ffd98a", emissive: 1 }), 0, 0.1, 0), M.beam(0, 0, 0, 0, 0.12, 0, 0.05, "#3a3a3a"), M.moved(M.box({ w: 0.2, h: 0.04, d: 0.2, color: "#3a3a3a" }), 0, 0.54, 0)); g.castShadow = false; return g; });
  const create = ({ root, layout: L, water, crew, pilot, hud, game, sound, solids, lighthouse, travel }) => {
    const beacon = BL.pierLighthouse.LAYOUT, group = S.createNode(), sea = L.sea;
    S.addChild(root, group);
    // The crossing: from the berth off the pier's tip to the bow touching the lighthouse's footing.
    const berth = { x: 2, z: -278.5 }, aim = Math.hypot(beacon.x - berth.x, beacon.z - berth.z), ux = (beacon.x - berth.x) / aim, uz = (beacon.z - berth.z) / aim;
    const dock = { x: beacon.x - ux * 18.6, z: beacon.z - uz * 18.6 }, crossing = Math.hypot(dock.x - berth.x, dock.z - berth.z), yaw = Math.atan2(ux, uz);
    // Places round the tower, by the angle from the side that faces the pier.
    const round = (radius, turn) => { const c = Math.cos(turn), s = Math.sin(turn); return { x: beacon.x + (c * -ux - s * -uz) * radius, z: beacon.z + (s * -ux + c * -uz) * radius }; };
    const pierPad = { x: 0, z: -268.4 }, landing = { ...round(6.4, 0), y: sea + 1.7 }, door = round(5.2, 0), gallery = { ...round(3.45, 0), y: sea + 22.9 }, arrive = round(3.45, 0.45), hatch = round(3.45, -0.95), rail = round(4.05, 0.22);
    const node = S.createNode({ geometry: hull(), rotation: { x: 0, y: yaw, z: 0 } });
    S.addChild(group, node);
    S.addChild(group, S.createNode({ geometry: pad(), position: { x: pierPad.x, y: L.top + 0.012, z: pierPad.z } }));
    S.addChild(group, S.createNode({ geometry: pad(), position: { x: landing.x, y: landing.y + 0.012, z: landing.z }, rotation: { x: 0, y: yaw, z: 0 } }));
    const box = S.createNode({ geometry: crank(), position: { x: gallery.x, y: gallery.y, z: gallery.z }, rotation: { x: 0, y: yaw + Math.PI, z: 0 } }), mine = S.createNode({ geometry: lantern(), position: { x: rail.x, y: gallery.y + 1.05, z: rail.z }, visible: false });
    S.addChild(group, box); S.addChild(group, mine);
    // Passengers who are always aboard, so the ferry never crosses empty.
    const riders = [BL.pierRides.passengers([node], [0], -1.1, 0.56, 1.2, 0, 1)[0], BL.pierRides.passengers([node], [0], 1.0, 0.56, 3.4, 0, 4)[0], BL.pierRides.passengers([node], [0], 0.2, 0.56, 5.6, 0, 2)[0]];
    // The lighthouse's own stone is what a rider lands on.
    solids.add(lighthouse.body); solids.sync();
    const seat = { x: 0, y: 0, z: 0, ry: yaw, floor: L.top, walkAt: { x: pierPad.x, z: pierPad.z }, sitter: null, allowWeapons: false, lockMovement: true };
    const state = { phase: "moored", at: 0, wait: 0, sailings: 0, checking: 0, verified: game.state.pier.lantern };
    let rider = null, pending = null, age = 0, jetBefore = false, shown = -1;
    mine.visible = state.verified;
    const place = () => {
      const x = berth.x + (dock.x - berth.x) * state.at, z = berth.z + (dock.z - berth.z) * state.at, p = node.position;
      p.x = x; p.z = z; p.y = (water.heightAt(x + ux * 5, z + uz * 5) + water.heightAt(x - ux * 5, z - uz * 5)) / 2 + 1.25;
      seat.x = x + ux * 1.2 + uz * 1.0; seat.z = z + uz * 1.2 - ux * 1.0; seat.y = p.y + 0.56;
    };
    const feet = (a) => a.root.position.y - a.baseY;
    const atPad = (q, y) => { const a = crew.player; return !!a && !a.jet && !a.camp.seat && Math.abs(feet(a) - y) < 0.6 && Math.hypot(a.root.position.x - q.x, a.root.position.z - q.z) < 2.6; };
    // The ferry can be boarded wherever it is waiting.
    const boardable = () => state.phase === "moored" || state.phase === "boarding" ? atPad(pierPad, L.top) : state.phase === "landed" ? atPad(landing, landing.y) : false;
    const board = () => {
      if (rider || pending) return true;
      if (!boardable()) return false;
      const a = crew.player;
      if (a.hopV > 0) { hud.toast("Land on the pad first"); return true; }
      pending = a; age = 0; jetBefore = !!a.jet;
      const here = state.phase === "landed" ? landing : pierPad;
      seat.walkAt.x = here.x; seat.walkAt.z = here.z; seat.floor = state.phase === "landed" ? landing.y : L.top;
      crew.setWeaponTrigger(false); crew.steer(0, 0, 0, 0, 0); pilot.controls.reset();
      return true;
    };
    const ashore = (where, y, note) => {
      seat.walkAt.x = where.x; seat.walkAt.z = where.z; seat.floor = y;
      if (!rider || !crew.standPlayer(rider)) return false;
      if (jetBefore) crew.wearJetpack(rider, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
      rider = null; pilot.controls.reset(); pilot.showAct(); hud.toast(note);
      return true;
    };
    // Stepping off is only possible where the ferry is tied up.
    const requestExit = () => {
      if (pending) { pending = null; pilot.controls.reset(); pilot.showAct(); return true; }
      if (!rider) return false;
      if (state.phase === "moored" || state.phase === "boarding") return ashore(pierPad, L.top, "Back on the pier"), true;
      if (state.phase === "landed") return ashore(landing, landing.y, "On the lighthouse landing"), true;
      hud.toast("Mid-crossing. The ferry lets you off when it ties up");
      return true;
    };
    // A block was found: the horn, then a short wait for anyone on their way.
    const depart = () => {
      if (state.phase !== "moored") return false;
      state.phase = "boarding"; state.wait = BOARDING; sound.cue("horn");
      hud.toast("The Block Ferry sails for the lighthouse. All aboard!");
      return true;
    };
    // The lantern gallery's crank: three checks a node makes for itself, then the visitor's own lantern.
    const upThere = (q, reach) => { const a = crew.player; return !!a && !a.camp.seat && Math.abs(feet(a) - gallery.y) < 0.6 && Math.hypot(a.root.position.x - q.x, a.root.position.z - q.z) < reach; };
    const nearDoor = () => { const a = crew.player; return !!a && !a.camp.seat && !a.jet && Math.abs(feet(a) - landing.y) < 0.6 && Math.hypot(a.root.position.x - door.x, a.root.position.z - door.z) < 1.5; };
    const nearCrank = () => upThere(gallery, 1.3), nearHatch = () => upThere(hatch, 1.2);
    const climb = () => nearDoor() ? (travel(arrive.x, gallery.y, arrive.z, yaw, "The lantern gallery"), true) : false;
    const descend = () => nearHatch() && state.checking <= 0 ? (travel(landing.x, landing.y, landing.z, yaw + Math.PI, "The lighthouse landing"), true) : false;
    const check = () => {
      if (!nearCrank()) return false;
      if (state.checking > 0) return true;
      state.checking = CHECK; sound.cue("tick");
      hud.hint("Checking the newest block yourself…\nIts work is under the target", 1300);
      return true;
    };
    const STEPS = ["It builds on the block before it", "Every coin it spends was unspent"];
    const update = (dt, time) => {
      if (pending) {
        age += dt;
        if (crew.player !== pending || !boardable() || age > 0.75) { pending = null; pilot.controls.reset(); }
        else if (crew.sitPlayer(seat)) { rider = pending; pending = null; pilot.showAct(); sound.cue("select"); hud.toast(state.phase === "landed" ? "Aboard. The ferry sails back shortly" : state.phase === "boarding" ? "Aboard. Sailing any second" : "Aboard. The ferry sails when the next block is found"); }
      }
      if (rider && (crew.player !== rider || rider.camp.seat !== seat)) rider = null;
      if (state.phase === "boarding" || state.phase === "landed") {
        state.wait -= dt;
        if (state.wait <= 0) { sound.cue("horn"); if (state.phase === "boarding") { state.phase = "out"; state.sailings++; } else state.phase = "back"; }
      } else if (state.phase === "out") {
        state.at = Math.min(1, state.at + dt * SPEED / crossing);
        if (state.at === 1) { state.phase = "landed"; state.wait = LAYOVER; if (rider) ashore(landing, landing.y, "The lighthouse. Climb to the lantern; the ferry waits a little"); }
      } else if (state.phase === "back") {
        state.at = Math.max(0, state.at - dt * SPEED / crossing);
        if (state.at === 0) { state.phase = "moored"; if (rider) ashore(pierPad, L.top, "Back at the pier tip"); }
      }
      place();
      if (rider) {
        const p = rider.root.position; p.x = seat.x; p.y = seat.y + rider.traits.height * 0.08; p.z = seat.z; rider.root.rotation.y = seat.ry; rider.hop = rider.hopV = 0;
        hud.setAct(state.phase === "out" || state.phase === "back" ? "CROSSING" : "STEP OFF");
      }
      if (state.checking > 0) {
        const before = state.checking; state.checking = Math.max(0, state.checking - dt);
        for (let i = 0; i < 2; i++) { const mark = CHECK - (i + 1) * 1.2; if (before > mark && state.checking <= mark) { sound.cue("tick", 1, 1.2 + i * 0.2); hud.hint(STEPS[i], 1300); } }
        if (state.checking === 0) {
          const first = game.lightPierLantern();
          state.verified = true; mine.visible = true; sound.cue("best");
          const paid = first ? game.addTickets(REWARD) : 0;
          hud.toast(first ? `Verified, and you asked nobody. Your lantern is lit · +${paid} tickets` : "Verified again. Your lantern is still burning");
        }
      }
      mine.glow = 1.2 + 0.4 * Math.sin(time * 3);
      const count = state.phase === "boarding" || state.phase === "landed" ? Math.ceil(state.wait) : -1;
      shown = count;
    };
    place();
    return {
      state, board, requestExit, depart, climb, descend, check, update, boardable, nearDoor, nearCrank, nearHatch, pierPad, landing, door, gallery, hatch, riders,
      // Standing on the lighthouse's stone, or aboard beside it, is having been there.
      visiting: () => { const a = crew.player; return !!rider || (!!a && !a.jet && feet(a) > sea + 1.2 && Math.hypot(a.root.position.x - beacon.x, a.root.position.z - beacon.z) < 9); },
      atPier: () => atPad(pierPad, L.top), atLanding: () => atPad(landing, landing.y),
      ownsSeat: (s) => s === seat,
      get riding() { return !!(rider || pending); }, get boarding() { return !!pending; },
      get label() { return state.phase === "boarding" || state.phase === "landed" ? HOLD[Math.max(0, shown)] : state.phase === "moored" ? "Board the Block Ferry" : "The ferry is crossing"; },
      recover: () => { pending = null; if (rider) { rider.camp.seat.sitter = null; rider.camp.seat = null; rider = null; } seat.sitter = null; },
      liveGeometry: (set) => { for (const c of riders) set.add(c.headOpen).add(c.headClosed); },
      dispose: () => { pending = null; if (rider) crew.standPlayer(rider); rider = null; seat.sitter = null; S.removeChild(root, group); }
    };
  };
  BL.pierFerry = { create, BOARDING, LAYOVER, REWARD };
})();
