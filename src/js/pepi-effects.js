// Pepi's fictional game effects. One local owner, one timer, no saved inventory,
// health, damage, loot, score or room messages. Leaving the hub clears the slot.
(() => {
  "use strict";
  const BL = window.BL, { createNode, addChild, removeChild } = BL.scene;
  const { box, merge, cached } = BL.models;
  const movement = (speed = 1, jump = 1, gravity = 1, jumps = 2, forward = 1, side = 1, locked = false) =>
    Object.freeze({ speed, jump, gravity, jumps, forward, side, locked });
  const NORMAL = movement();
  const CATALOG = Object.freeze([
    { code: "OBL-01", name: "Moon Knees", color: "#82c9ff", duration: 30,
      description: "Jump with 30% more launch speed.", caution: "Higher jumps still meet ceilings and cliffs.", movement: movement(1, 1.3) },
    { code: "OBL-02", name: "Rocket Socks", color: "#ff916e", duration: 30,
      description: "Walk and run 40% faster.", caution: "Mind the island's edges.", movement: movement(1.4) },
    { code: "OBL-03", name: "Feather Fall", color: "#d8bcff", duration: 30,
      description: "Half gravity makes jumps floatier and falls slower.", caution: "You remain airborne longer. The abyss still sends you home.", movement: movement(1, 1, 0.5) },
    { code: "OBL-04", name: "Triple Hop", color: "#a4e579", duration: 30,
      description: "Add a third jump before landing.", caution: "Press jump again in the air; solid ceilings still block you.", movement: movement(1, 1, 1, 3) },
    { code: "OBL-05", name: "Crab Walk", color: "#ffbc75", duration: 30,
      description: "Strafe 60% faster, but walk forward or backward 35% slower.", caution: "The benefit depends on moving sideways.", movement: movement(1, 1, 1, 2, 0.65, 1.6) },
    { code: "OBL-06", name: "Echo Buddy", color: "#7de2d1", duration: 30,
      description: "A harmless echo of your Ooga follows close behind.", caution: "A cosmetic echo in your view only; it cannot block, fight or collect.", movement: NORMAL },
    { code: "OBL-07", name: "Jelly Legs", color: "#ed95c2", duration: 20,
      description: "Your jump launch speed falls to 55%.", caution: "An impairment: stairs and paths are easier than jumping gaps.", movement: movement(1, 0.55) },
    { code: "OBL-08", name: "Squeaky Sneakers", color: "#f6dd68", duration: 30,
      description: "Move 20% faster with squeaky footsteps.", caution: "The squeaks follow your environment-sound setting.", movement: movement(1.2) },
    { code: "OBL-09", name: "Personal Raincloud", color: "#8da5cf", duration: 20,
      description: "A tiny raincloud follows above your head.", caution: "A cosmetic nuisance visible in your view only.", movement: NORMAL },
    { code: "OBL-10", name: "Magnet Mittens", color: "#b8b4ad", duration: 20,
      description: "Heavy mittens slow walking and running to 60%.", caution: "An impairment: your jumps keep their ordinary height.", movement: movement(0.6) },
    { code: "OBL-11", name: "Crash Out", color: "#c5e86c", duration: 15,
      description: "Approach nearby Oogas in your zone and shout comic profanities for 15 seconds.",
      caution: "Contains profanity. Takes over walking; steer, press Escape or use the action button to stop. Shouts are local speech bubbles and grunts, not messages or voice chat.", movement: NORMAL },
    { code: "OBL-12", name: "Big Oops", color: "#ff6f79", duration: 3,
      description: "A three-second cartoon knockout, then a return to a safe hub spot.", caution: "WARNING: briefly freezes your controls and returns you to the hub. No health or gear is lost.", movement: movement(1, 1, 1, 2, 1, 1, true) }
  ].map(Object.freeze));
  const BODY = ["torso", "head", "armR", "armL", "legR", "legL"];
  const CRASH_LINES = ["What the hell?!", "This is bullshit!", "Move your damn feet!", "Who the hell put that there?!", "Damn it, Oogas!"];
  const CRASH_RANGE = 10, CRASH_STOP = 1.8, CRASH_TARGET_TIME = 3, CRASH_MAX_TARGETS = 24;
  const EMPTY = Object.freeze([]);
  const geometries = cached(() => ({
    cloud: merge(
      box({ w: 0.44, h: 0.18, d: 0.33, color: "#92a7c1" }),
      box({ w: 0.28, h: 0.25, d: 0.28, offset: { x: -0.2, y: 0.035 }, color: "#b1bfd0" }),
      box({ w: 0.27, h: 0.22, d: 0.3, offset: { x: 0.2, y: 0.015 }, color: "#a0b1c9" })
    ),
    drop: box({ w: 0.018, h: 0.09, d: 0.018, color: "#85c6f5", emissive: 0.12 }),
    star: merge(
      box({ w: 0.13, h: 0.045, d: 0.045, color: "#ffda69", emissive: 0.3 }),
      box({ w: 0.045, h: 0.13, d: 0.045, color: "#ffda69", emissive: 0.3 })
    )
  }));
  const copyVector = (to, from) => { to.x = from.x; to.y = from.y; to.z = from.z; };
  const create = ({ root, crew, pilot, eligible = () => false, onChange = null, onLock = null, onRecover = null, onCue = null, crashOut = null }) => {
    const geo = geometries(), group = createNode({ visible: false, sightHidden: true });
    const echo = createNode({ visible: false, sightHidden: true }), cloud = createNode({ geometry: geo.cloud, visible: false, sightHidden: true });
    const stars = createNode({ visible: false, sightHidden: true }), echoes = [], drops = [];
    const poseBack = new Float64Array(7);
    for (let i = 0; i < BODY.length; i++) {
      const part = createNode({ sightHidden: true, highlight: 0.4 });
      echoes.push(part); addChild(echo, part);
    }
    for (let i = 0; i < 12; i++) {
      const drop = createNode({ geometry: geo.drop, position: { x: (i % 4 - 1.5) * 0.13, y: 0, z: (Math.floor(i / 4) - 1) * 0.12 }, sightHidden: true });
      drops.push(drop); addChild(cloud, drop);
    }
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;
      addChild(stars, createNode({ geometry: geo.star, position: { x: Math.sin(angle) * 0.28, y: 0, z: Math.cos(angle) * 0.28 }, sightHidden: true }));
    }
    addChild(group, echo, cloud, stars); addChild(root, group);
    const status = { index: -1, code: "", name: "", remaining: 0, duration: 0, caution: "", locked: false, autonomous: false };
    // Remote actor records are recycled by their pool. Keep the id as well as
    // the record, so a slot reused for another visitor never inherits a target.
    const crash = { target: null, targetId: null, phase: "idle", yells: 0 };
    const visited = new Array(CRASH_MAX_TARGETS), waypoint = { x: 0, z: 0 };
    let visitedCount = 0, targetTime = 0, stalled = 0, previousDistance = Infinity, wait = 0, shout = 0, shoutYaw = 0;
    let routeValid = false, routeStopX = 0, routeStopZ = 0, routeX = 0, routeZ = 0;
    let owner = null, age = 0, footDistance = 0, lastX = 0, lastZ = 0, disposed = false;
    let audio = null, oscillator = null, voice = null;
    const closeSound = () => {
      if (!audio) return;
      oscillator.stop();
      audio.close().catch(() => {});
      audio = oscillator = voice = null;
    };
    const openSound = (growl = false) => {
      if (audio || typeof AudioContext === "undefined" || navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      try {
        audio = new AudioContext(); oscillator = audio.createOscillator(); voice = audio.createGain();
        oscillator.type = growl ? "sawtooth" : "sine"; oscillator.frequency.value = growl ? 105 : 900; voice.gain.value = 0;
        const throat = audio.createBiquadFilter(); throat.type = "lowpass"; throat.frequency.value = growl ? 620 : 2200; throat.Q.value = 0.8;
        oscillator.connect(throat); throat.connect(voice); voice.connect(BL.sound.output(audio)); oscillator.start();
        if (audio.state === "suspended") audio.resume().catch(() => {});
      } catch (_) { if (audio) audio.close().catch(() => {}); audio = oscillator = voice = null; }
    };
    const squeak = () => {
      if (audio && audio.state === "running") {
        const t = audio.currentTime;
        oscillator.frequency.cancelScheduledValues(t); voice.gain.cancelScheduledValues(t);
        oscillator.frequency.setValueAtTime(730, t); oscillator.frequency.exponentialRampToValueAtTime(1450, t + 0.035);
        oscillator.frequency.exponentialRampToValueAtTime(620, t + 0.085);
        voice.gain.setValueAtTime(0, t); voice.gain.linearRampToValueAtTime(0.045, t + 0.01); voice.gain.linearRampToValueAtTime(0, t + 0.1);
      }
      if (onCue) onCue("squeak", owner);
    };
    const growl = () => {
      if (!audio || audio.state !== "running") return;
      const t = audio.currentTime;
      oscillator.frequency.cancelScheduledValues(t); voice.gain.cancelScheduledValues(t);
      oscillator.frequency.setValueAtTime(135, t); oscillator.frequency.exponentialRampToValueAtTime(72, t + 0.35);
      voice.gain.setValueAtTime(0, t); voice.gain.linearRampToValueAtTime(0.075, t + 0.025); voice.gain.linearRampToValueAtTime(0, t + 0.38);
    };
    const allowed = (cave) => !!cave && cave === crew.player && cave === pilot.player && cave.humanControlled
      && cave.root.visible && !cave.remoteControlled && !cave.health.stunned && !cave.grabbedBy
      && !cave.bedTravel.mode && !cave.bedTravel.manual && !cave.camp.seat && !cave.camp.rolling && !cave.camp.burning
      && !cave.jet && !cave.ladder?.plane && eligible(cave);
    const clear = () => {
      if (!owner) { closeSound(); return; }
      const cave = owner, wasLocked = status.locked, wasAutonomous = status.autonomous;
      crew.setMovementEffect(cave, null);
      if (wasLocked) {
        cave.parts.torso.rotation.z = poseBack[0]; cave.parts.head.rotation.z = poseBack[1];
        cave.parts.armR.rotation.x = poseBack[2]; cave.parts.armL.rotation.x = poseBack[3];
        cave.parts.legR.rotation.x = poseBack[4]; cave.parts.legL.rotation.x = poseBack[5];
      }
      if (wasAutonomous) {
        if (cave === crew.player) crew.steer(0, 0, 0, 0, 0);
        cave.parts.armR.rotation.x = poseBack[2]; cave.parts.armL.rotation.x = poseBack[3];
        cave.parts.head.rotation.x = poseBack[6];
        if (crashOut?.hush) crashOut.hush(cave);
      }
      owner = null; status.index = -1; status.code = status.name = status.caution = "";
      status.remaining = status.duration = 0; status.locked = status.autonomous = false;
      crash.target = crash.targetId = null; crash.phase = "idle";
      for (let i = 0; i < visitedCount; i++) visited[i] = null;
      visitedCount = 0; shout = 0; routeValid = false;
      group.visible = echo.visible = cloud.visible = stars.visible = false;
      for (let i = 0; i < echoes.length; i++) echoes[i].geometry = null;
      closeSound();
      if ((wasLocked || wasAutonomous) && onLock) onLock(false, cave);
      if (onChange) onChange(status);
    };
    const activate = (index, cave = crew.player) => {
      if (disposed || owner || !Number.isInteger(index) || index < 0 || index >= CATALOG.length || !allowed(cave)) return false;
      const entry = CATALOG[index];
      if (!crew.setMovementEffect(cave, entry.movement)) return false;
      owner = cave; age = 0; footDistance = 0;
      lastX = cave.root.position.x; lastZ = cave.root.position.z;
      status.index = index; status.code = entry.code; status.name = entry.name; status.caution = entry.caution;
      status.remaining = status.duration = entry.duration; status.locked = entry.movement.locked; status.autonomous = index === 10;
      group.visible = index === 5 || index === 8 || index === 11;
      echo.visible = index === 5; cloud.visible = index === 8; stars.visible = index === 11;
      if (index === 5) for (let i = 0; i < BODY.length; i++) echoes[i].geometry = cave.parts[BODY[i]].geometry;
      if (index === 7) openSound();
      if (status.autonomous) {
        crash.target = crash.targetId = null; crash.phase = "idle"; crash.yells = 0;
        visitedCount = 0; targetTime = stalled = wait = shout = 0; previousDistance = Infinity; routeValid = false;
        openSound(true);
      }
      if (status.locked || status.autonomous) {
        poseBack[0] = cave.parts.torso.rotation.z; poseBack[1] = cave.parts.head.rotation.z;
        poseBack[2] = cave.parts.armR.rotation.x; poseBack[3] = cave.parts.armL.rotation.x;
        poseBack[4] = cave.parts.legR.rotation.x; poseBack[5] = cave.parts.legL.rotation.x;
        poseBack[6] = cave.parts.head.rotation.x;
        crew.steer(0, 0, 0, 0, 0); crew.stopBurst(cave); crew.stopReload(cave, true); crew.releaseSwing(cave, true);
        if (onLock) onLock(true, cave);
      }
      if (onChange) onChange(status);
      return true;
    };
    const actorsFrom = (source) => typeof source === "function" ? source() : source || EMPTY;
    const visitedBefore = (actor) => {
      const key = actor.root ? actor : actor.id;
      for (let i = 0; i < visitedCount; i++) if (visited[i] === key) return true;
      return false;
    };
    const targetAllowed = (actor, zone) => {
      if (!actor || actor === owner || !crashOut || !zone || crashOut.zoneOf(actor) !== zone) return false;
      const p = owner.root.position, q = actor.root ? actor.root.position : actor;
      if (actor.root) {
        if (!actor.root.visible || actor.remoteControlled || actor.grabbedBy || actor.health?.stunned
          || actor.state !== "working" && actor.state !== "chilling") return false;
      } else if (!actor.player || !Number.isFinite(q.x) || !Number.isFinite(q.y) || !Number.isFinite(q.z)) return false;
      const feet = q.y - (actor.root ? actor.baseY : 0);
      return Math.abs(feet - p.y + owner.baseY) <= 1.25 && Math.hypot(q.x - p.x, q.z - p.z) <= CRASH_RANGE;
    };
    const chooseTarget = (zone) => {
      if (!crashOut || visitedCount >= CRASH_MAX_TARGETS) { crash.phase = "done"; return; }
      let nearest = null, distance = Infinity;
      for (let pool = 0; pool < 2; pool++) {
        const actors = actorsFrom(pool ? crashOut.remotes : crashOut.actors), p = owner.root.position;
        for (let i = 0; i < actors.length; i++) {
          const actor = actors[i];
          if (!targetAllowed(actor, zone) || visitedBefore(actor)) continue;
          const q = actor.root ? actor.root.position : actor, d = Math.hypot(q.x - p.x, q.z - p.z);
          if (d < distance) { distance = d; nearest = actor; }
        }
      }
      if (!nearest) { wait = 0.4; crash.phase = "idle"; return; }
      crash.target = nearest; crash.targetId = nearest.root ? null : nearest.id;
      visited[visitedCount++] = nearest.root ? nearest : nearest.id;
      targetTime = stalled = 0; previousDistance = Infinity; routeValid = false; crash.phase = "approach";
    };
    const skipTarget = () => {
      crash.target = crash.targetId = null; crash.phase = "idle"; wait = 0.15;
      targetTime = stalled = 0; previousDistance = Infinity; routeValid = false;
    };
    // Called after the human pilot reads input, before ordinary crew physics.
    // The root holds human input and clears this effect on any request to steer.
    // This writes only the owner's normal collision-checked walk; no attack,
    // player action, chat, microphone or remote pose API is invoked here.
    const beforeUpdate = (dt) => {
      if (!owner || !status.autonomous) return;
      if (!allowed(owner)) { clear(); return; }
      crew.steer(0, 0, 0, 0, 0);
      if (!crashOut) return;
      if (wait > 0) { wait = Math.max(0, wait - dt); return; }
      const zone = crashOut.zoneOf(owner);
      if (!crash.target) chooseTarget(zone);
      const target = crash.target;
      if (!target) return;
      if (!targetAllowed(target, zone) || !target.root && target.id !== crash.targetId) { skipTarget(); return; }
      if (!target.root) {
        const remotes = actorsFrom(crashOut.remotes);
        let present = false;
        for (let i = 0; i < remotes.length; i++) if (remotes[i] === target && remotes[i].id === crash.targetId) { present = true; break; }
        if (!present) { skipTarget(); return; }
      }
      const p = owner.root.position, q = target.root ? target.root.position : target;
      const dx = q.x - p.x, dz = q.z - p.z, distance = Math.hypot(dx, dz);
      const spacing = Math.max(CRASH_STOP, owner.bodyRadius + (target.bodyRadius || target.radius || 0.3) + 0.6);
      if (distance <= spacing + 0.15) {
        if (crashOut.canYell && !crashOut.canYell(owner, target)) { skipTarget(); return; }
        shoutYaw = distance > 0.001 ? Math.atan2(dx, dz) : owner.root.rotation.y;
        owner.root.rotation.y = shoutYaw;
        const line = CRASH_LINES[crash.yells % CRASH_LINES.length];
        crash.yells++; shout = 0.65; crash.phase = "shout";
        if (crashOut.yell) crashOut.yell(owner, line);
        growl();
        crash.target = crash.targetId = null; wait = 1.5;
        return;
      }
      targetTime += dt;
      if (distance < previousDistance - 0.005) stalled = 0;
      else stalled += dt;
      previousDistance = distance;
      if (targetTime >= CRASH_TARGET_TIME || stalled >= 0.8) { skipTarget(); return; }
      const stopX = q.x - dx / distance * spacing, stopZ = q.z - dz / distance * spacing;
      const feet = p.y - owner.baseY;
      const movedX = stopX - routeStopX, movedZ = stopZ - routeStopZ;
      // The host samples support along the whole approach. Keep that result
      // until the target moves 25 cm or the current graph waypoint is reached;
      // moving obstacles are still caught by the short-step test every frame.
      if (!routeValid || movedX * movedX + movedZ * movedZ > 0.0625 || Math.hypot(routeX - p.x, routeZ - p.z) < 0.2) {
        routeStopX = stopX; routeStopZ = stopZ; routeX = stopX; routeZ = stopZ;
        if (!crashOut.walkable(p.x, p.z, routeX, routeZ, feet, owner.bodyHeight, owner)) {
          if (!crashOut.guide || !crashOut.guide(owner, routeX, routeZ, waypoint)) { skipTarget(); return; }
          routeX = waypoint.x; routeZ = waypoint.z;
          if (!Number.isFinite(routeX) || !Number.isFinite(routeZ)
            || !crashOut.walkable(p.x, p.z, routeX, routeZ, feet, owner.bodyHeight, owner)) { skipTarget(); return; }
        }
        routeValid = true;
      }
      const mx = routeX - p.x, mz = routeZ - p.z, length = Math.hypot(mx, mz);
      if (length < 0.01) { skipTarget(); return; }
      // Check a short step as well as the approach route. The host's predicate
      // includes support, so autonomy never deliberately walks off an edge.
      const step = Math.min(length, BL.pilot.WALK.speed * dt);
      if (!crashOut.walkable(p.x, p.z, p.x + mx / length * step, p.z + mz / length * step, feet, owner.bodyHeight, owner)) { skipTarget(); return; }
      crew.steer(mx / length, mz / length, 0, 1, 0, Math.min(1, length / Math.max(0.001, BL.pilot.WALK.speed * dt)));
    };
    const update = (dt) => {
      if (!owner) return;
      if (!allowed(owner)) { clear(); return; }
      age += dt; status.remaining = Math.max(0, status.duration - age);
      if (status.remaining === 0) {
        const cave = owner, recover = status.locked;
        clear();
        if (recover && onRecover) onRecover(cave);
        return;
      }
      const cave = owner, p = cave.root.position, h = cave.traits.height;
      if (status.index === 5) {
        const yaw = cave.root.rotation.y;
        echo.position.x = p.x - Math.sin(yaw) * h * 0.8 + Math.cos(yaw) * h * 0.5;
        echo.position.y = p.y; echo.position.z = p.z - Math.cos(yaw) * h * 0.8 - Math.sin(yaw) * h * 0.5;
        copyVector(echo.rotation, cave.root.rotation); copyVector(echo.scale, cave.root.scale);
        for (let i = 0; i < BODY.length; i++) {
          const from = cave.parts[BODY[i]], to = echoes[i];
          copyVector(to.position, from.position); copyVector(to.rotation, from.rotation); copyVector(to.scale, from.scale);
        }
      } else if (status.index === 7) {
        const moved = Math.hypot(p.x - lastX, p.z - lastZ);
        if (moved < 1 && cave.hop < 0.01 && Math.abs(cave.hopV) < 0.01) footDistance += moved;
        lastX = p.x; lastZ = p.z;
        if (footDistance >= 0.65) { footDistance %= 0.65; squeak(); }
      } else if (status.index === 8) {
        cloud.position.x = p.x; cloud.position.y = p.y - cave.baseY + cave.bodyHeight + h * 0.36; cloud.position.z = p.z;
        for (let i = 0; i < drops.length; i++) drops[i].position.y = -0.15 - ((age * 0.8 + i * 0.11) % 0.8);
      } else if (status.autonomous && shout > 0) {
        shout = Math.max(0, shout - dt);
        // First-person/shoulder camera posing can turn the driven body after
        // physics; keep the visible shout addressed to the approached Ooga.
        cave.root.rotation.y = shoutYaw;
        const raised = Math.sin(Math.min(1, shout / 0.65) * Math.PI);
        cave.parts.armR.rotation.x = -raised * 1.8;
        cave.parts.armL.rotation.x = -raised * 0.8;
        cave.parts.head.rotation.x = -raised * 0.15;
      } else if (status.index === 11) {
        const tilt = Math.min(1, age / 0.25) * Math.min(1, status.remaining / 0.25);
        cave.parts.torso.rotation.z = poseBack[0] + tilt * 0.75;
        cave.parts.head.rotation.z = poseBack[1] - tilt * 0.5;
        cave.parts.armR.rotation.x = cave.parts.armL.rotation.x = -tilt;
        cave.parts.legR.rotation.x = tilt * 0.3; cave.parts.legL.rotation.x = -tilt * 0.3;
        stars.position.x = p.x; stars.position.y = p.y - cave.baseY + cave.bodyHeight + h * 0.1; stars.position.z = p.z;
        stars.rotation.y = age * 5;
      }
    };
    const liveGeometry = (set) => {
      set.add(geo.cloud); set.add(geo.drop); set.add(geo.star);
      for (let i = 0; i < echoes.length; i++) if (echoes[i].geometry) set.add(echoes[i].geometry);
    };
    const dispose = () => { if (disposed) return; clear(); disposed = true; removeChild(root, group); };
    return { activate, beforeUpdate, update, clear, dispose, liveGeometry, status, crash,
      debug: Object.freeze({ group, echo, cloud, stars, drops, echoes }),
      get active() { return !!owner; }, get owner() { return owner; }, get locked() { return status.locked; },
      get autonomous() { return status.autonomous; } };
  };
  BL.pepiEffects = { CATALOG, create };
})();
