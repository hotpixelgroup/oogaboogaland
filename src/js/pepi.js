// Two independent, local baboon visitors roam without joining the contributor crew. Pepi offers
// fictional, free samples; both mutter unsolicited comic doom between interactions.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const { CATALOG } = BL.pepiEffects;
  const REACH = 2.75, RELEASE_REACH = 3.35, DECLINE_SECONDS = 8, COOLDOWN = 60, RADIUS = 1.3, HEIGHT = 2.6;
  const ACTION = { kind: "pepi" };
  const PEPI_QUOTES = Object.freeze([
    "The banks are doomed. My sock drawer is too big to fail.",
    "Civil society is over. Even the NPCs want managers.",
    "Nukes any minute. I brought factor fifty sun cream.",
    "Only NPCs follow crowds. Join my independent-thinker queue.",
    "Everyone's an NPC. Now, where was my next waypoint?",
    "I predicted twelve of the last two collapses.",
    "I reject authority. Please address me as Professor.",
    "The economy's a pyramid scheme. Look at the fruit pile.",
    "Cash is trash. Anyway, these samples are free.",
    "The future is bleak. My lunch is somehow bleaker."
  ]);
  const QUOTES = Object.freeze([
    "Civil society's collapsing. Will my loyalty points survive?",
    "My nuclear forecast was merely chronologically ambitious.",
    "The banks will fall! My mattress has declined to comment.",
    "NPCs everywhere. I alone choose my predetermined route.",
    "Everyone is stupider than me. Except the automatic doors.",
    "The end is nigh! I have a coupon for the apocalypse.",
    "I've escaped the system. I'm waiting for it to respawn.",
    "Only sheep need evidence. I use extremely confident noises.",
    "Financial Armageddon! Even my beans filed for bankruptcy.",
    "Think for yourselves, NPCs! In the exact order I told you."
  ]);
  const create = ({ root, pilot, crew, hud, camera, renderer, world, groundAt, clear, spotOk, paths, peers, viewClear, crashOut, speech: speechFx, eligible, busy, onRecover }) => {
    const group = createNode({ sightHidden: true });
    addChild(root, group);
    const rand = BL.math.mulberry32(0x70657069), list = [];
    const speech = { index: -1, spoken: 0, wait: 3, speaker: -1, nextSpeaker: 0, indices: [-1, -1] };
    const muttering = BL.pepiCinematic.createVoice();
    const hushSpeech = () => {
      for (let i = 0; i < list.length; i++) speechFx.hush(list[i]);
      if (speech.speaker >= 0) muttering.stop();
      speech.speaker = -1; speech.wait = Math.max(3, speech.wait);
    };
    const quiet = () => phase !== "idle" || cinematic.active || locked || busy() || !!document.querySelector("dialog[open]")
      || document.activeElement?.matches("input, textarea, [contenteditable='true']");
    const inEarshot = (entry) => entry.root.visible && !entry.root.cameraHidden
      && Math.hypot(entry.root.position.x - camera.position.x, entry.root.position.y - camera.position.y, entry.root.position.z - camera.position.z) <= 24;
    const sayNext = (index) => {
      const lines = index ? QUOTES : PEPI_QUOTES;
      const line = (speech.indices[index] + 1) % lines.length;
      hushSpeech();
      speech.indices[index] = speech.index = line; speech.speaker = index; speech.nextSpeaker = 1 - index; speech.spoken++; speech.wait = 11;
      speechFx.say(list[index], lines[line], 5.5);
      const p = list[index].root.position, eye = camera.position;
      muttering.wake(); muttering.mutter(index, Math.min(8, Math.max(4, Math.round(lines[line].length / 8))),
        Math.max(0, 1 - Math.hypot(p.x - eye.x, p.y - eye.y, p.z - eye.z) / 24));
    };
    let held = -1, heldFor = null, account = null, offered = false, near = false, suspended = false, locked = false;
    let displayed = "", displayedHeld = false, statusSecond = -1;
    let phase = "idle", dialogOwner = null, presentation = false, savedHidden = false, declinedUntil = 0, viewTime = 0, cutShot = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saved = { position: [0, 0, 0], target: [0, 0, 0], up: [0, 1, 0], orbit: [0, 0, 0, 0, 0, 0],
      actor: [0, 0, 0], body: [0, 0, 0], head: [0, 0, 0], headOffset: [0, 0, 0],
      bodyQuaternion: [0, 0, 0, 1], headQuaternion: [0, 0, 0, 1], magazines: [0, 0] };
    const shot = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, fov: 0.8 }, viewUp = { x: 0, y: 1, z: 0 };
    if (!world.pepiClaim) world.pepiClaim = { login: null, readyAt: 0 };
    const claim = world.pepiClaim;
    const own = (cave) => !!cave && cave === pilot.player && eligible(cave);
    const available = (cave = pilot.player) => own(cave) && !suspended && !busy() && !locked;
    const cooldown = () => claim.login === BL.net.state.me?.login ? Math.max(0, Math.ceil((claim.readyAt - Date.now()) / 1000)) : 0;
    const status = (text, holding = false) => {
      if (text === displayed && holding === displayedHeld) return;
      displayed = text; displayedHeld = holding;
      hud.setPepiStatus(text, holding);
    };
    const samePlace = (cave) => cave && own(cave)
      && Math.hypot(cave.root.position.x - saved.actor[0], cave.root.position.y - saved.actor[1], cave.root.position.z - saved.actor[2]) < 0.08;
    const close = () => {
      const previous = dialogOwner;
      if (!previous && phase === "idle") return;
      hud.closePepi();
      phase = "idle"; dialogOwner = null;
      if (presentation) {
        previous.root.cameraHidden = savedHidden;
        presentation = false;
        pilot.setExternalControl(false);
      }
      pilot.setMenuOpen(false, false);
      if (samePlace(previous)) pilot.restorePose(saved);
      else if (previous) { pilot.resumeHeldPose(); pilot.update(0); }
      statusSecond = -1;
    };
    const decline = () => { offered = true; declinedUntil = Date.now() + DECLINE_SECONDS * 1000; close(); };
    const beginDialog = (mode) => {
      dialogOwner = pilot.player;
      pilot.capturePose(saved);
      pilot.freeCursor(); pilot.setMenuOpen(true);
      phase = mode;
    };
    const prepareView = () => {
      const p = list[0].root.position, q = dialogOwner.root.position, heading = Math.atan2(q.x - p.x, q.z - p.z);
      const phone = renderer.size.width <= 720;
      for (let attempt = 0; attempt < 9; attempt++) {
        const yaw = heading + (attempt % 3 - 1) * 0.25, distance = (phone ? 4.6 : 4) + Math.floor(attempt / 3) * 0.5;
        const sr = Math.sin(yaw), cr = Math.cos(yaw), offset = phone ? 0.65 : 1.05;
        shot.x = p.x + sr * distance; shot.y = p.y + 1.55 + Math.floor(attempt / 3) * 0.3; shot.z = p.z + cr * distance;
        shot.tx = p.x + cr * offset; shot.ty = p.y + (phone ? 0.1 : 1.15); shot.tz = p.z - sr * offset;
        shot.fov = phone ? Math.max(1.05, pilot.eyeFov()) : 0.8;
        if (viewClear(shot.x, shot.y, shot.z, shot.tx, shot.ty, shot.tz, dialogOwner)) {
          cutShot = !viewClear(saved.position[0], saved.position[1], saved.position[2], shot.x, shot.y, shot.z, dialogOwner);
          return true;
        }
      }
      return false;
    };
    const conversationView = (dt) => {
      if (!dialogOwner) return;
      let k = 0;
      if (presentation) {
        viewTime = Math.min(0.3, viewTime + dt);
        k = reducedMotion.matches || cutShot ? 1 : viewTime / 0.3;
        k = k * k * (3 - 2 * k);
      }
      camera.position.x = saved.position[0] + (shot.x - saved.position[0]) * k;
      camera.position.y = saved.position[1] + (shot.y - saved.position[1]) * k;
      camera.position.z = saved.position[2] + (shot.z - saved.position[2]) * k;
      camera.target.x = saved.target[0] + (shot.tx - saved.target[0]) * k;
      camera.target.y = saved.target[1] + (shot.ty - saved.target[1]) * k;
      camera.target.z = saved.target[2] + (shot.tz - saved.target[2]) * k;
      viewUp.x = saved.up[0] * (1 - k); viewUp.y = saved.up[1] + (1 - saved.up[1]) * k; viewUp.z = saved.up[2] * (1 - k);
      camera.up = viewUp; camera.fov = saved.fov + (shot.fov - saved.fov) * k;
      camera.orthoMix = (saved.orthoMix || 0) * (1 - k);
    };
    const readyForOffer = () => {
      const cave = pilot.player;
      return !document.querySelector("dialog[open]") && !document.activeElement?.matches("input, textarea, [contenteditable='true']")
        && available(cave) && cave.hop < 0.03 && Math.abs(cave.hopV) < 0.03 && !cave.jet
        && !cave.camp.burning && !cave.camp.rolling && !cave.ladder?.plane && !pilot.travelRefusal();
    };
    const offer = () => {
      if (!readyForOffer() || held >= 0 || effects.active || !isNear(pilot.player) || cooldown() || Date.now() < declinedUntil) return false;
      beginDialog("offer"); offered = true;
      hushSpeech(); hud.openPepiOffer();
      return true;
    };
    const effects = BL.pepiEffects.create({ root: group, crew, pilot, eligible: own, crashOut,
      onChange: () => { statusSecond = -1; },
      onLock: (on) => { locked = on; if (on && effects.autonomous) pilot.resumeHeldPose(); pilot.setMenuOpen(on); },
      onRecover: (cave) => { if (own(cave)) onRecover(cave); }
    });
    const cinematic = BL.pepiCinematic.create({ root: group, pilot, crew, camera, hud, valid: (cave) => own(cave) && !busy(),
      onComplete: (cave, item) => {
        const index = CATALOG.indexOf(item);
        if (held !== index || heldFor !== cave || !own(cave)) return;
        if (effects.activate(index, cave)) { held = -1; heldFor = null; }
        else hud.toast("The sample is still held. Stand on the ground without a jetpack to try again.");
        statusSecond = -1;
      }, onCancel: () => { statusSecond = -1; }
    });
    // Use the Hub's swept body queries for both path lanes and local recovery. The other visitor is
    // a moving cylinder too; an existing overlap may separate, but a new step never deepens it.
    const stepClear = (actor, x, y, z, nx, ny, nz, radius = RADIUS, height = HEIGHT) => {
      if (!clear(x, y, z, nx, ny, nz, radius, height)) return false;
      const dx = nx - x, dz = nz - z, length = dx * dx + dz * dz;
      for (let i = 0; i < list.length; i++) {
        const other = list[i];
        if (other.root === actor.root || !other.root.visible) continue;
        const q = other.root.position;
        if (Math.min(y, ny) >= q.y + HEIGHT || Math.max(y, ny) + height <= q.y) continue;
        const ox = x - q.x, oz = z - q.z, width = radius + RADIUS;
        const before = ox * ox + oz * oz, after = (nx - q.x) ** 2 + (nz - q.z) ** 2;
        if (before < width * width && after > before && ox * dx + oz * dz >= 0) continue;
        const t = length ? BL.math.clamp(-(ox * dx + oz * dz) / length, 0, 1) : 0;
        if ((ox + dx * t) ** 2 + (oz + dz * t) ** 2 < width * width) return false;
      }
      const visitors = peers();
      for (let i = 0; i < visitors.length; i++) {
        const q = visitors[i];
        if (Math.min(y, ny) >= q.y + q.height || Math.max(y, ny) + height <= q.y) continue;
        const ox = x - q.x, oz = z - q.z, width = radius + q.radius;
        const before = ox * ox + oz * oz, after = (nx - q.x) ** 2 + (nz - q.z) ** 2;
        if (before < width * width && after > before && ox * dx + oz * dz >= 0) continue;
        const t = length ? BL.math.clamp(-(ox * dx + oz * dz) / length, 0, 1) : 0;
        if ((ox + dx * t) ** 2 + (oz + dz * t) ** 2 < width * width) return false;
      }
      return true;
    };
    const routePaths = paths((x, z, nx, nz, y, height, actor) => {
      const steps = Math.ceil(Math.hypot(nx - x, nz - z) / 0.2);
      if (steps > 320) return false;
      let px = x, py = y, pz = z;
      for (let n = 1; n <= Math.max(1, steps); n++) {
        const t = n / Math.max(1, steps), qx = x + (nx - x) * t, qz = z + (nz - z) * t, qy = groundAt(qx, qz);
        if (!spotOk(qx, qy, qz, RADIUS, HEIGHT) || !stepClear(actor, px, py, pz, qx, qy, qz)) return false;
        px = qx; py = qy; pz = qz;
      }
      return true;
    });
    const pickSpot = (entry, initial = false) => {
      for (let attempt = 0; attempt < 64; attempt++) {
        const angle = rand() * Math.PI * 2, radius = 12 + rand() * 13;
        const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius, y = groundAt(x, z);
        if (!Number.isFinite(y) || !spotOk(x, y, z, RADIUS, HEIGHT)) continue;
        let occupied = false;
        for (let i = 0; i < list.length; i++) if (list[i] !== entry && Math.hypot(x - list[i].root.position.x, z - list[i].root.position.z) < RADIUS * 2.2) occupied = true;
        if (occupied) continue;
        entry.tx = x; entry.tz = z; entry.wait = 2 + rand() * 4; entry.repick = false;
        if (initial) entry.gorilla.place(x, z, angle);
        entry.roaming.setDestination(x, z);
        return true;
      }
      entry.wait = 2; entry.repick = true;
      return false;
    };
    for (let i = 0; i < 2; i++) {
      const rig = BL.pepiModels.baboon({ groundAt, variant: i });
      const entry = { root: rig.root, parts: rig.parts, gorilla: rig, coat: null, roaming: null,
        index: i, tx: 0, tz: 0, wait: 0, repick: false, reveal: 0, standing: false, interaction: 0, replyCooldown: 0,
        body: { id: `pepi-local-${i}`, x: 0, y: 0, z: 0, radius: RADIUS, height: HEIGHT, player: false } };
      entry.root.sightHidden = true;
      entry.coat = BL.pepiModels.decorate(rig, i === 0 ? CATALOG : null, i);
      entry.roaming = BL.pepiRoaming.create({ root: entry.root, paths: routePaths, groundAt, spotOk,
        clear: (x, y, z, nx, ny, nz, radius, height) => stepClear(entry, x, y, z, nx, ny, nz, radius, height),
        pose: (dt, speed, heading) => rig.pose(dt, speed, heading, entry.standing, reducedMotion.matches), radius: RADIUS, height: HEIGHT, speed: BL.crew.NPC_WALK_SPEED * 0.5,
        onRepick: () => { entry.repick = true; entry.wait = 0; } });
      addChild(group, entry.root);
      list.push(entry);
      if (!pickSpot(entry, true)) { entry.root.visible = false; entry.wait = 0; }
    }
    const isNear = (cave, reach = REACH) => {
      if (!own(cave) || !list[0].root.visible) return false;
      const p = cave.root.position, q = list[0].root.position;
      return Math.hypot(p.x - q.x, p.y - cave.baseY - q.y, p.z - q.z) <= reach;
    };
    const actionAvailable = () => effects.autonomous || available() && !effects.active && (cinematic.active || held >= 0 || near);
    const use = () => {
      if (effects.autonomous) { effects.clear(); return true; }
      if (!available() || cinematic.active || effects.active) return false;
      if (held < 0 && !isNear(pilot.player)) return false;
      if (held < 0 && cooldown()) { hud.toast(`Pepi's next free sample is ready in ${cooldown()}s`); return true; }
      if (held < 0) return offer();
      beginDialog("confirm"); hud.openPepi(CATALOG, held);
      return true;
    };
    const stopAction = () => {
      if (effects.autonomous) { effects.clear(); return true; }
      return cinematic.active && cinematic.cancel();
    };
    const handleAction = (action) => {
      if (action === "act" && effects.autonomous) { effects.clear(); return true; }
      if (action === "pepi-no") { if (phase === "offer") decline(); return true; }
      if (action === "pepi-yes") {
        if (phase !== "offer" || !samePlace(dialogOwner) || !available() || !isNear(dialogOwner)) { close(); return true; }
        if (!prepareView()) { decline(); hud.toast("Pepi needs a little more room. Try talking from another side."); return true; }
        phase = "catalog"; presentation = true; viewTime = 0;
        savedHidden = dialogOwner.root.cameraHidden;
        dialogOwner.root.cameraHidden = true;
        pilot.setExternalControl(true);
        hud.openPepi(CATALOG);
        return true;
      }
      if (action === "pepi-close") { if (phase === "offer") decline(); else close(); return true; }
      if (action === "pepi-discard") {
        if (!cinematic.active) { held = -1; heldFor = null; close(); statusSecond = -1; }
        return true;
      }
      if (action.startsWith("pepi-claim-")) {
        const index = Number(action.slice(11));
        if (phase !== "catalog" || !hud.pepiOpen || held >= 0 || effects.active || !available() || !samePlace(dialogOwner) || !isNear(pilot.player) || cooldown()
          || !Number.isInteger(index) || index < 0 || index >= CATALOG.length) return true;
        held = index; heldFor = pilot.player;
        claim.login = BL.net.state.me.login; claim.readyAt = Date.now() + COOLDOWN * 1000;
        close(); statusSecond = -1;
        hud.toast(`${CATALOG[index].code} · free sample taken · Inject Yourself when ready`);
        return true;
      }
      if (action === "pepi-confirm") {
        if (phase !== "confirm" || !hud.pepiOpen || held < 0 || heldFor !== pilot.player || !available()) return true;
        close();
        statusSecond = -1;
        if (heldFor.jet || heldFor.camp.burning || heldFor.camp.rolling || heldFor.ladder?.plane) {
          hud.toast("Land, put away the jetpack and finish the current action before injecting");
          return true;
        }
        if (!cinematic.start(heldFor, CATALOG[held])) hud.toast("Stand still on the ground to use this sample");
        return true;
      }
      if (action === "act" && cinematic.active) { cinematic.cancel(); return true; }
      if (action.startsWith("pepi-")) return true;
      return false;
    };
    const tap = (index) => {
      if (index < 0 || index >= list.length || quiet()) return;
      const entry = list[index];
      entry.interaction = 3;
      if (index === 1) {
        if (entry.replyCooldown <= 0 && !speechFx.read(list[0]) && !speechFx.read(list[1]) && inEarshot(entry)) {
          sayNext(1); entry.replyCooldown = 12;
        }
        return;
      }
      if (!BL.net.state.me) hud.toast("Sign in and drive your own Ooga to browse Pepi's free samples");
      else if (!isNear(pilot.player)) hud.toast("Walk a little closer to talk to Pepi");
      else use();
    };
    const reset = () => {
      cinematic.suspend(); effects.clear(); close();
      hushSpeech(); speech.wait = 3;
      for (let i = 0; i < list.length; i++) { list[i].root.cameraHidden = false; list[i].interaction = 0; list[i].standing = false; }
      held = -1; heldFor = null; offered = near = locked = false; declinedUntil = 0;
      status("", false); statusSecond = -1;
    };
    const beforeUpdate = (dt) => {
      if (suspended) return;
      const login = BL.net.state.me?.login || null;
      if (login !== account || heldFor && !own(heldFor)) { reset(); account = login; }
      if (dialogOwner && (!hud.pepiOpen || !available() || !samePlace(dialogOwner))) close();
      if (cinematic.active && document.querySelector("dialog[open]")) cinematic.cancel();
      if (effects.active && (!own(pilot.player) || busy() || effects.autonomous && document.querySelector("dialog[open]"))) effects.clear();
      if (effects.autonomous) {
        const input = pilot.controls.read();
        if (Math.hypot(input.x, input.y) > 0.05) effects.clear();
      }
      effects.beforeUpdate(dt);
      near = available() && isNear(pilot.player);
      if (!isNear(pilot.player, RELEASE_REACH)) offered = false;
      if (near && !offered && phase === "idle" && !cinematic.active && held < 0 && !effects.active) offer();
      for (let i = 0; i < list.length; i++) {
        const entry = list[i], p = entry.root.position;
        if (!entry.root.visible) { if ((entry.wait -= dt) <= 0 && pickSpot(entry, true)) entry.root.visible = true; continue; }
        entry.interaction = Math.max(0, entry.interaction - dt); entry.replyCooldown = Math.max(0, entry.replyCooldown - dt);
        const presenting = i === 0 && (phase === "offer" || phase === "catalog");
        entry.standing = presenting || entry.interaction > 0;
        entry.reveal = BL.math.damp(entry.reveal, i === 0 && phase === "catalog" ? 1 : 0, 7, dt);
        if (entry.standing || entry.gorilla.posture > 0.05) {
          const q = pilot.player ? pilot.player.root.position : camera.position;
          entry.roaming.pause(dt, entry.standing ? Math.atan2(q.x - p.x, q.z - p.z) : entry.gorilla.heading);
        } else {
          if (entry.repick || entry.roaming.state.phase === "arrived") {
            if ((entry.wait -= dt) <= 0) pickSpot(entry);
          }
          entry.roaming.update(dt);
        }
        entry.coat.reveal(entry.reveal);
      }
    };
    const update = (dt) => {
      if (suspended) return;
      cinematic.update(dt);
      conversationView(dt);
      // Pepi's open coat can surround a nearby eye. Keep the borrowed close shot clear of these two local rigs.
      for (let i = 0; i < list.length; i++) list[i].root.cameraHidden = cinematic.active;
      effects.update(dt);
      if (quiet()) hushSpeech();
      else {
        if (speech.speaker >= 0 && !inEarshot(list[speech.speaker])) hushSpeech();
        if ((speech.wait -= dt) <= 0) {
          let index = speech.nextSpeaker;
          if (!inEarshot(list[index])) index = 1 - index;
          if (inEarshot(list[index])) sayNext(index);
          else speech.wait = 3;
        }
      }
      const second = Math.ceil(effects.status.remaining), ready = cooldown();
      const key = second * 100 + ready;
      if (statusSecond === key) return;
      statusSecond = key;
      if (phase === "offer" || phase === "catalog") status("");
      else if (cinematic.active) status("Injecting · Escape or action button cancels");
      else if (effects.active) status(`${effects.status.code} · ${effects.status.name} · ${second}s${effects.autonomous ? " · Escape or STOP to end" : ""}`);
      else if (held >= 0) status(`${CATALOG[held].code} · ${CATALOG[held].name} held · ${ready ? `next sample ${ready}s` : "ready to inject"}`, true);
      else status(ready && available() ? `Pepi · next free sample in ${ready}s` : "");
    };
    const key = (e) => {
      if (effects.autonomous && (e.key === "Escape" || e.key === " " || /^(?:w|a|s|d|q|e|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/i.test(e.key))) {
        effects.clear(); e.preventDefault(); return true;
      }
      if (cinematic.active) { if (e.key === "Escape" && !e.repeat) cinematic.cancel(); e.preventDefault(); return true; }
      if (hud.pepiOpen) {
        // Native dialog focus briefly passes through the document when Tab wraps. Keep its default traversal,
        // and handle Escape here too when the event cannot reach the dialog's own key listener.
        if (e.key === "Escape" && !e.repeat) handleAction(phase === "offer" ? "pepi-no" : "pepi-close");
        if (e.key !== "Tab") e.preventDefault();
        return true;
      }
      if (locked) { e.preventDefault(); return true; }
      return false;
    };
    // Feed the same stable outside-body records used by ordinary crew shoulder passing and gap checks.
    const appendBodies = (out) => {
      if (suspended) return;
      for (let i = 0; i < list.length; i++) {
        const entry = list[i];
        if (!entry.root.visible) continue;
        const p = entry.root.position, body = entry.body;
        body.x = p.x; body.y = p.y; body.z = p.z; out.push(body);
      }
    };
    const liveGeometry = (set) => {
      for (let i = 0; i < list.length; i++) { list[i].gorilla.liveGeometry(set); list[i].coat.liveGeometry(set); }
      effects.liveGeometry(set); cinematic.liveGeometry(set);
    };
    const suspend = () => { reset(); muttering.dispose(); suspended = true; group.visible = false; };
    const resume = () => { suspended = false; group.visible = true; statusSecond = -1; };
    const dispose = () => {
      reset(); suspended = true;
      cinematic.dispose(); effects.dispose(); muttering.dispose();
      for (let i = 0; i < list.length; i++) { list[i].roaming.dispose(); list[i].coat.dispose(); list[i].gorilla.dispose(); }
      removeChild(root, group);
    };
    return { list, appendBodies, action: ACTION, actionAvailable, use, stopAction, handleAction, tap, key, beforeUpdate, update, liveGeometry, suspend, resume, dispose,
      cinematic, effects, speech, get speechBubble() { return speech.speaker >= 0 ? speechFx.read(list[speech.speaker]) : null; }, get held() { return held; }, get near() { return near; },
      get phase() { return phase; }, get presentation() { return presentation; },
      get busy() { return locked || cinematic.active || hud.pepiOpen; },
      get label() { return effects.autonomous ? "STOP CRASH OUT" : cinematic.active ? "CANCEL INJECTION" : held >= 0 ? "Inject Yourself" : "TALK TO PEPI"; },
      get cooldown() { return cooldown(); }, get status() { return displayed; }
    };
  };
  BL.pepi = { create, REACH, RELEASE_REACH, DECLINE_SECONDS, COOLDOWN, QUOTES, PEPI_QUOTES };
})();
