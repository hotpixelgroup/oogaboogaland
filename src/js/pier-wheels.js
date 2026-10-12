// Ooga Pier's wheels: beach cruisers, skateboards and (from Wave 6) carts a visitor takes anywhere a walker can go.
// A vehicle faces (sin yaw, cos yaw), as the beach cyclists' bikes do. One controller for every kind: get on where it stands, ride on a fixed 1/120 s step with the scene's own
// walkable and floor queries, get off anywhere there is room. A vehicle left behind stays where it was left for
// the visit; one that ends up in the sea goes back to its rack. Everything is built once and reused: no vehicle,
// node or closure is created after `create`.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models, STEP = 1 / 120, GRAVITY = BL.pilot.WALK.gravity;
  // top and reverse in m/s; turn in rad/s at speed; sand scales the top speed off the paving; seat is the height
  // of the saddle above the ground and how far the rider sits behind the vehicle's middle.
  const KINDS = {
    bike: { label: "beach cruiser", verb: "Ride", top: 15, reverse: 3, accel: 1.6, drag: 0.9, turn: 1.9, sand: 0.5, radius: 0.55, seat: 0.82, back: 0.3 },
    board: { label: "skateboard", verb: "Skate", top: 12.5, reverse: 2, accel: 2.2, drag: 0.5, turn: 2.6, sand: 0.22, radius: 0.45, seat: 0.12, back: 0 },
    cart: { label: "pier cart", verb: "Drive", top: 13, reverse: 5, accel: 1.4, drag: 1.4, turn: 1.5, sand: 0.6, radius: 1.05, seat: 0.55, back: 0.25 }
  };
  const board = M.cached(() => {
    const parts = [M.moved(M.bevelBox({ w: 0.26, h: 0.04, d: 0.95, color: "#f7931a" }), 0, 0.1, 0), M.moved(M.box({ w: 0.2, h: 0.02, d: 0.5, color: "#253c46" }), 0, 0.125, 0)];
    for (const z of [-0.32, 0.32]) {
      parts.push(M.moved(M.box({ w: 0.3, h: 0.03, d: 0.06, color: "#9aa3ad" }), 0, 0.07, z));
      for (const x of [-0.15, 0.15]) parts.push(M.moved(M.turnedZ(M.lathe({ profile: [[0, -0.025], [0.045, -0.025], [0.045, 0.025], [0, 0.025]], segments: 10, color: "#fff0d6" }), Math.PI / 2), x, 0.045, z));
    }
    return M.merge(...parts);
  });
  const cart = M.cached(() => {
    const box = (w, h, d, x, y, z, color) => M.moved(M.bevelBox({ w, h, d, color }), x, y, z);
    const parts = [box(1.5, 0.22, 2.5, 0, 0.42, 0, "#f3ede0"), box(1.4, 0.4, 0.5, 0, 0.72, 1.0, "#30b9bd"), box(1.3, 0.12, 0.6, 0, 0.6, -0.1, "#287b99"), box(1.3, 0.5, 0.12, 0, 0.9, -0.45, "#287b99"), box(1.6, 0.08, 2.2, 0, 2.05, -0.1, "#fff0d6")];
    for (const x of [-0.68, 0.68]) for (const z of [-1.05, 0.85]) parts.push(M.beam(x, 0.5, z, x, 2.05, z, 0.06, "#f7931a"));
    for (const x of [-0.72, 0.72]) for (const z of [-0.85, 0.85]) parts.push(M.moved(M.turnedZ(M.torus(0.24, 0.1, "#253c46", 0, 14, 6), Math.PI / 2), x, 0.3, z));
    parts.push(M.moved(M.box({ w: 0.5, h: 0.14, d: 0.04, color: "#fff1bd", emissive: 0.7 }), 0, 0.72, 1.27));
    return M.merge(...parts);
  });
  const rack = M.cached(() => {
    const parts = [M.moved(M.bevelBox({ w: 2.6, h: 0.08, d: 0.5, color: "#8e6949" }), 0, 0.04, 0)];
    for (const x of [-1.1, -0.37, 0.37, 1.1]) parts.push(M.beam(x, 0.08, -0.2, x, 0.75, -0.2, 0.05, "#3599aa"), M.beam(x, 0.75, -0.2, x, 0.75, 0.2, 0.05, "#3599aa"), M.beam(x, 0.75, 0.2, x, 0.08, 0.2, 0.05, "#3599aa"));
    return M.merge(...parts);
  });
  const create = ({ root, layout, crew, pilot, hud, fx, sound, walkable, floorAt, sea }) => {
    const group = S.createNode(), vehicles = [], probe = { bodyRadius: 0.4, camp: { seat: null } };
    S.addChild(root, group);
    for (const at of layout.wheels) {
      // A rack's height is the floor it stands on.
      at.y = floorAt(at.x, at.z, at.y + 1, 0.4);
      const kind = KINDS[at.kind], node = S.createNode({ position: { x: at.x, y: at.y, z: at.z }, rotation: { x: 0, y: at.yaw, z: 0 } }), spin = [];
      if (at.kind === "bike") {
        node.geometry = BL.pierBeach.parts.bike();
        for (const z of [-0.65, 0.65]) { const w = S.createNode({ geometry: BL.pierBeach.parts.wheel(), position: { x: 0, y: 0.36, z } }); S.addChild(node, w); spin.push(w); }
      } else node.geometry = at.kind === "board" ? board() : cart();
      S.addChild(group, node);
      vehicles.push({
        id: `${at.kind}-${vehicles.length}`, kind, type: at.kind, node, spin, home: at, x: at.x, y: at.y, z: at.z, yaw: at.yaw, speed: 0, fall: 0, roll: 0, away: 0,
        seat: { x: at.x, y: at.y + kind.seat, z: at.z, ry: at.yaw, floor: at.y, walkAt: { x: at.x, z: at.z }, sitter: null, allowWeapons: false, lockMovement: true }
      });
    }
    for (const at of layout.wheelRacks) S.addChild(group, S.createNode({ geometry: rack(), position: { x: at.x, y: floorAt(at.x, at.z, at.y + 1, 0.4), z: at.z }, rotation: { x: 0, y: at.yaw, z: 0 } }));
    let rider = null, pending = null, current = null, jetBefore = false, age = 0, accumulator = 0, topSpeed = 0, travelled = 0;
    const feetOf = (a) => a.root.position.y - a.baseY;
    const nearby = () => {
      const a = crew.player;
      if (!a || a.camp.seat || a.jet) return null;
      const p = a.root.position, feet = feetOf(a);
      let best = null, distance = 2.4;
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i], d = Math.hypot(p.x - v.x, p.z - v.z);
        if (d < distance && Math.abs(feet - v.y) < 0.6) { best = v; distance = d; }
      }
      return best;
    };
    const place = (v) => {
      const n = v.node, sy = Math.sin(v.yaw), cy = Math.cos(v.yaw);
      n.position.x = v.x; n.position.y = v.y; n.position.z = v.z; n.rotation.y = v.yaw;
      v.seat.x = v.x - sy * v.kind.back; v.seat.y = v.y + v.kind.seat; v.seat.z = v.z - cy * v.kind.back; v.seat.ry = v.yaw;
      for (let i = 0; i < v.spin.length; i++) v.spin[i].rotation.x = v.roll;
    };
    const mount = () => {
      if (rider || pending) return true;
      const v = nearby();
      if (!v) return false;
      const a = crew.player;
      if (a.hopV > 0) { hud.toast("Land first"); return true; }
      current = v; pending = a; age = 0; jetBefore = !!a.jet;
      // sitPlayer checks the spot the rider would stand back up on: where they are standing now.
      v.seat.walkAt.x = a.root.position.x; v.seat.walkAt.z = a.root.position.z; v.seat.floor = feetOf(a);
      crew.setWeaponTrigger(false); crew.steer(0, 0, 0, 0, 0); pilot.controls.reset();
      return true;
    };
    // The rider steps off to the side with room; a vehicle hemmed in on every side keeps its rider.
    const SIDES = [1.1, -1.1, 0];
    const exitSpot = (v) => {
      const sy = Math.sin(v.yaw), cy = Math.cos(v.yaw);
      probe.bodyRadius = rider.bodyRadius;
      for (let i = 0; i < SIDES.length; i++) {
        const back = SIDES[i] ? 0 : 1.4, x = v.x + cy * SIDES[i] - sy * back, z = v.z - sy * SIDES[i] - cy * back, floor = floorAt(x, z, v.y + 0.6, rider.bodyRadius);
        if (Math.abs(floor - v.y) < 0.6 && walkable(x, z, x, z, floor, rider.bodyHeight, probe)) { v.seat.walkAt.x = x; v.seat.walkAt.z = z; v.seat.floor = floor; return true; }
      }
      return false;
    };
    const finish = () => {
      const v = current;
      if (!crew.standPlayer(rider)) return false;
      if (jetBefore) crew.wearJetpack(rider, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
      v.speed = 0; rider = current = null; accumulator = 0;
      pilot.controls.reset(); pilot.showAct();
      return true;
    };
    const dismount = () => {
      if (pending) { pending = current = null; pilot.controls.reset(); pilot.showAct(); return true; }
      if (!rider) return false;
      if (current.fall !== 0 || !exitSpot(current)) { hud.toast("No room to step off here"); return true; }
      return finish();
    };
    // Ending up in the water: the rider is left swimming where they are and the vehicle goes back to its rack.
    const dunk = (v) => {
      const a = rider;
      a.camp.seat.sitter = null; a.camp.seat = null; a.root.quaternion = null; a.hop = a.hopV = 0;
      a.root.position.x = v.x; a.root.position.z = v.z; a.root.position.y = sea - 1.1 + a.baseY;
      if (jetBefore) crew.wearJetpack(a, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
      rider = current = null; accumulator = 0; pilot.controls.reset(); pilot.showAct();
      v.away = 4; v.node.visible = false; v.speed = v.fall = 0;
      sound.cue("splash"); hud.toast(`Splash! The ${v.kind.label} is back at its rack`);
    };
    const step = (dt, throttle, steer) => {
      const v = current, k = v.kind, ground = floorAt(v.x, v.z, v.y + 0.6, k.radius), airborne = v.y > ground + 0.05;
      if (!airborne) {
        const soft = ground < 0.38 && ground > sea ? k.sand : 1, target = throttle >= 0 ? throttle * k.top * soft : throttle * k.reverse;
        v.speed += (target - v.speed) * (1 - Math.exp(-dt * (throttle ? k.accel : k.drag)));
        v.yaw -= steer * Math.min(1, Math.abs(v.speed) / 4) * Math.sign(v.speed || 1) * dt * k.turn;
      }
      const move = v.speed * dt, x = v.x + Math.sin(v.yaw) * move, z = v.z + Math.cos(v.yaw) * move;
      probe.bodyRadius = k.radius;
      if (move !== 0) {
        if (walkable(v.x, v.z, x, z, v.y, 1.5, probe)) { travelled += Math.abs(move); v.roll += move / 0.34; v.x = x; v.z = z; }
        else { if (Math.abs(v.speed) > 5) sound.cue("bump"); v.speed *= -0.15; }
      }
      const floor = floorAt(v.x, v.z, v.y + 0.6, k.radius);
      if (v.y > floor + 0.02) { v.fall -= GRAVITY * dt; v.y = Math.max(floor, v.y + v.fall * dt); if (v.y === floor) v.fall = 0; }
      else { v.y = floor; v.fall = 0; }
      topSpeed = Math.max(topSpeed, Math.abs(v.speed));
      if (v.y < sea - 0.9) dunk(v);
    };
    const update = (dt) => {
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        if (v.away > 0) { v.away -= dt; if (v.away <= 0) { v.x = v.home.x; v.y = v.home.y; v.z = v.home.z; v.yaw = v.home.yaw; v.node.visible = true; place(v); } }
      }
      if (pending) {
        age += dt;
        if (crew.player !== pending || nearby() !== current || age > 0.75) { pending = current = null; pilot.controls.reset(); }
        else if (crew.sitPlayer(current.seat)) {
          rider = pending; pending = null; accumulator = 0; pilot.showAct(); sound.cue("select");
          hud.hint(`W/S or ↑/↓: go and brake · A/D or ←/→: steer\nSpace or E: step off · N: radio`, 7000);
        }
      }
      if (!rider) return;
      if (crew.player !== rider || rider.camp.seat !== current.seat) { current.speed = 0; rider = current = null; return; }
      const axes = pilot.controls.read();
      accumulator = Math.min(accumulator + dt, STEP * 4);
      while (accumulator >= STEP && rider) { accumulator -= STEP; step(STEP, axes.y, axes.x); }
      if (!rider) return;
      place(current);
      const p = rider.root.position, seat = current.seat;
      p.x = seat.x; p.y = seat.y + rider.traits.height * 0.08; p.z = seat.z; rider.root.rotation.y = seat.ry; rider.hop = rider.hopV = 0;
      hud.setAct("STEP OFF");
    };
    const recover = () => {
      pending = null;
      if (rider) { if (!(exitSpot(current) && finish())) { rider.camp.seat.sitter = null; rider.camp.seat = null; } }
      rider = current = null;
      for (let i = 0; i < vehicles.length; i++) vehicles[i].seat.sitter = null;
    };
    return {
      vehicles, mount, dismount, update, recover, near: () => !!nearby(), nearest: nearby,
      ownsSeat: (seat) => { for (let i = 0; i < vehicles.length; i++) if (vehicles[i].seat === seat) return true; return false; },
      get riding() { return !!(rider || pending); },
      get boarding() { return !!pending; },
      get vehicle() { return current; },
      get speed() { return current ? current.speed : 0; },
      get topSpeed() { return topSpeed; },
      get travelled() { return travelled; },
      dispose: () => { recover(); S.removeChild(root, group); vehicles.length = 0; }
    };
  };
  BL.pierWheels = { create, KINDS };
})();
