// Pepi's voluntary, non-graphic first-person gag. The ordinary Ooga arms are rigid from shoulder to fist, so this
// close shot uses a small articulated foreground rig, coloured from that Ooga's own skin. It has a palm-up left
// forearm and a right hand which brings in the selected fictional syringe and presses its plunger. The real body,
// weapons and health are never changed by the shot. Only a completed shot calls the host's effect callback.
(() => {
  "use strict";
  const BL = window.BL, { createNode, addChild, removeChild } = BL.scene;
  const { box } = BL.models, { clamp, hexToRgb, quat } = BL.math;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const darker = (color) => `#${hexToRgb(color).map(v => Math.round(v * 0.58).toString(16).padStart(2, "0")).join("")}`;
  const pose = () => ({
    position: [0, 0, 0], target: [0, 0, 0], up: [0, 1, 0], orbit: [0, 0, 0, 0, 0, 0],
    actor: [0, 0, 0], body: [0, 0, 0], head: [0, 0, 0], headOffset: [0, 0, 0],
    bodyQuaternion: [0, 0, 0, 1], headQuaternion: [0, 0, 0, 1], magazines: [0, 0]
  });

  // One reusable voice: a low rasp, breath and throat resonance. Cues only schedule its existing AudioParams.
  // The page's environment mute gates its output independently of voice chat.
  const voice = () => {
    let context = null, level = null, breath = null, tone = null, throat = null;
    const wake = () => {
      if (context) { if (context.state === "suspended") context.resume().catch(() => {}); return; }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio || navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      try {
        context = new Audio();
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -12; limiter.knee.value = 9; limiter.ratio.value = 8;
        limiter.attack.value = 0.005; limiter.release.value = 0.12;
        limiter.connect(BL.sound.output(context));
        level = context.createGain(); level.gain.value = 0; level.connect(limiter);
        throat = context.createBiquadFilter(); throat.type = "lowpass"; throat.frequency.value = 1100; throat.Q.value = 1.8;
        throat.connect(level);
        tone = context.createOscillator(); tone.type = "sawtooth"; tone.frequency.value = 95; tone.connect(throat); tone.start();
        const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate), samples = buffer.getChannelData(0);
        let seed = 0x70657069;
        for (let i = 0; i < samples.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; samples[i] = seed / 0x80000000 - 1; }
        const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        breath = context.createGain(); breath.gain.value = 0.13; noise.connect(breath); breath.connect(throat); noise.start();
      } catch (_) {
        if (context) context.close().catch(() => {});
        context = level = breath = tone = throat = null;
      }
    };
    const stop = () => {
      if (!context || !level) return;
      const now = context.currentTime;
      level.gain.cancelScheduledValues(now); level.gain.setValueAtTime(0, now);
    };
    const roar = () => {
      if (!context || !level) return;
      const now = context.currentTime;
      breath.gain.setValueAtTime(0.13, now);
      level.gain.cancelScheduledValues(now); level.gain.setValueAtTime(0, now);
      level.gain.linearRampToValueAtTime(0.2, now + 0.055);
      level.gain.linearRampToValueAtTime(0.12, now + 0.25);
      level.gain.linearRampToValueAtTime(0.23, now + 0.35);
      level.gain.linearRampToValueAtTime(0.09, now + 0.64);
      level.gain.linearRampToValueAtTime(0, now + 0.88);
      tone.frequency.cancelScheduledValues(now); tone.frequency.setValueAtTime(160, now);
      tone.frequency.exponentialRampToValueAtTime(78, now + 0.85);
      throat.frequency.cancelScheduledValues(now); throat.frequency.setValueAtTime(1450, now);
      throat.frequency.linearRampToValueAtTime(620, now + 0.85);
    };
    // Quiet comic babble under the readable bubble, rather than a second voice-chat or spoken-word stream.
    // Both baboons share this one throat; replacing a cue cancels its remaining syllables first.
    const mutter = (speaker = 0, count = 6, volume = 1) => {
      if (!context || !level) return;
      stop();
      const now = context.currentTime, syllables = clamp(count | 0, 4, 8), blue = speaker === 1;
      const base = blue ? 111 : 79, loud = 0.028 * clamp(Number.isFinite(volume) ? volume : 0, 0, 1);
      tone.frequency.cancelScheduledValues(now); throat.frequency.cancelScheduledValues(now);
      breath.gain.setValueAtTime(0.045, now);
      for (let i = 0; i < syllables; i++) {
        const at = now + 0.025 + i * 0.2, pitch = base * (1 + Math.sin(i * 2.3 + speaker) * 0.07);
        const peak = loud * (0.8 + (i % 3) * 0.1), length = i % 2 ? 0.135 : 0.15;
        tone.frequency.setValueAtTime(pitch, at);
        tone.frequency.exponentialRampToValueAtTime(pitch * 0.86, at + length);
        throat.frequency.setValueAtTime((blue ? 620 : 470) + (i % 3) * 125, at);
        level.gain.setValueAtTime(0, at);
        level.gain.linearRampToValueAtTime(peak, at + 0.025);
        level.gain.linearRampToValueAtTime(peak * 0.55, at + 0.075);
        level.gain.linearRampToValueAtTime(0, at + length);
      }
    };
    const dispose = () => { stop(); if (context) context.close().catch(() => {}); context = level = breath = tone = throat = null; };
    return { wake, roar, mutter, stop, dispose };
  };

  const create = ({ root, pilot, crew, camera, hud, valid = null, onComplete = null, onCancel = null, onCue = null }) => {
    const saved = pose(), audio = voice(), from = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }, eyes = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
    const foreground = createNode({ name: "pepi-first-person", visible: false, sightHidden: true });
    const left = createNode({ name: "pepi-left-palm-up" }), right = createNode({ name: "pepi-right-hand" }), rightFore = createNode({ quaternion: quat.create() });
    let skinKey = crew.player ? crew.player.traits.skin : "#b58057";
    let skin = box({ color: skinKey }), crease = box({ color: darker(skinKey) });
    skin.castShadow = crease.castShadow = false;
    const skinNodes = [], creaseNodes = [];
    const leftUpper = createNode({ geometry: skin, quaternion: quat.create() });
    const leftFore = createNode({ geometry: skin, quaternion: quat.create() });
    rightFore.geometry = skin;
    skinNodes.push(leftUpper, leftFore, rightFore);
    const syringe = BL.pepiModels.syringe(0, BL.pepiEffects?.CATALOG || null);
    syringe.root.scale.x = syringe.root.scale.y = syringe.root.scale.z = 0.6;
    // Its label faces the eyes; its needle still points down into the upward-facing forearm.
    syringe.root.rotation.y = Math.PI;
    const part = (parent, x, y, z, w, h, d, geometry = skin) => {
      const n = createNode({ position: { x, y, z }, scale: { x: w, y: h, z: d }, geometry });
      (geometry === skin ? skinNodes : creaseNodes).push(n);
      addChild(parent, n); return n;
    };
    const segment = (n, ax, ay, az, bx, by, bz, width, depth = width) => {
      const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz), q = n.quaternion;
      n.position.x = (ax + bx) * 0.5; n.position.y = (ay + by) * 0.5; n.position.z = (az + bz) * 0.5;
      n.scale.x = width; n.scale.y = len; n.scale.z = depth;
      // The shortest rotation from the segment's local +Y to its end point.
      q[0] = dz / len; q[1] = 0; q[2] = -dx / len; q[3] = 1 + dy / len;
      const inv = 1 / Math.hypot(q[0], q[2], q[3]);
      q[0] *= inv; q[2] *= inv; q[3] *= inv;
    };
    segment(leftUpper, 0.4, -0.88, 0.02, 0.3, -0.51, 0.2, 0.15);
    segment(leftFore, 0.3, -0.51, 0.2, 0.1, -0.32, 0.55, 0.12, 0.13);
    addChild(left, leftUpper, leftFore);
    part(left, 0.075, -0.297, 0.596, 0.15, 0.06, 0.145);
    // Four block fingers extend away from the wrist. Their creases and the thumb make the palm-up side readable.
    for (let i = 0; i < 4; i++) part(left, 0.018 + i * 0.036, -0.295, 0.697, 0.029, 0.052, 0.092 - Math.abs(i - 1.5) * 0.012);
    const thumbL = part(left, 0.179, -0.292, 0.58, 0.08, 0.05, 0.05); thumbL.rotation.y = -0.45;
    for (let i = 0; i < 2; i++) part(left, 0.075, -0.265, 0.57 + i * 0.045, 0.08, 0.003, 0.005, crease);
    part(right, -0.057, -0.018, 0.015, 0.1, 0.09, 0.11);
    for (let i = 0; i < 3; i++) part(right, -0.005, -0.049 + i * 0.03, 0.022, 0.075, 0.025, 0.054);
    const thumbR = part(right, 0, 0.11, 0.018, 0.052, 0.04, 0.075);
    addChild(right, syringe.root);
    addChild(foreground, left, rightFore, right);
    addChild(root, foreground);
    const hiddenNodes = new Array(4), hiddenValues = new Array(4);
    let cave = null, item = null, time = 0, reduced = false, cued = false, hidden = false, disposed = false, returning = false;
    let oldNear = 0, returnAt = 0, finishAt = 0, raiseAt = 0, approachAt = 0, pressAt = 0, withdrawAt = 0, roarAt = 0;
    const readPose = (out) => {
      const p = camera.position, t = camera.target, dx = t.x - p.x, dy = t.y - p.y, dz = t.z - p.z;
      out.x = p.x; out.y = p.y; out.z = p.z;
      out.yaw = Math.hypot(dx, dz) > 1e-6 ? Math.atan2(dx, dz) : cave.root.rotation.y;
      out.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    };
    const cameraPose = (a, b, k) => {
      const e = smooth(k), yaw = a.yaw + wrap(b.yaw - a.yaw) * e, pitch = a.pitch + (b.pitch - a.pitch) * e, cp = Math.cos(pitch);
      const p = camera.position, t = camera.target;
      p.x = a.x + (b.x - a.x) * e; p.y = a.y + (b.y - a.y) * e; p.z = a.z + (b.z - a.z) * e;
      t.x = p.x + Math.sin(yaw) * cp; t.y = p.y + Math.sin(pitch); t.z = p.z + Math.cos(yaw) * cp;
      camera.up = null;
    };
    const hide = (on) => {
      if (hidden === on) return;
      hidden = on;
      for (let i = 0; i < hiddenNodes.length; i++) hiddenNodes[i].cameraHidden = on ? true : hiddenValues[i];
    };
    const stationary = () => Math.hypot(cave.root.position.x - saved.actor[0], cave.root.position.y - saved.actor[1], cave.root.position.z - saved.actor[2]) < 0.08;
    const restore = (complete) => {
      const previous = cave, selected = item;
      foreground.visible = false; hide(false); audio.stop(); camera.near = oldNear;
      cave = item = null;
      pilot.setExternalControl(false);
      pilot.controls.reset();
      crew.steer(0, 0, 0, 0, 0); crew.thrust(false);
      // Never replay a stale body's position over a stun, a changed owner or a forced movement.
      if (crew.player === previous && !previous.health.stunned && (!valid || valid(previous)) &&
          Math.hypot(previous.root.position.x - saved.actor[0], previous.root.position.y - saved.actor[1], previous.root.position.z - saved.actor[2]) < 0.08) pilot.restorePose(saved);
      else { pilot.resumeHeldPose(); pilot.update(0); }
      pilot.showAct();
      if (complete) { if (onComplete) onComplete(previous, selected); }
      else if (onCancel) onCancel(previous, selected);
    };
    const refusal = (actor) => {
      if (disposed || cave) return "Finish the current interaction first";
      if (!actor || actor !== crew.player || actor !== pilot.player || valid && !valid(actor)) return "Choose your own Ooga first";
      return pilot.travelRefusal();
    };
    const start = (actor, selected) => {
      if (refusal(actor) || !selected) return false;
      cave = actor; item = selected; time = 0; cued = returning = false;
      reduced = REDUCED.matches;
      raiseAt = reduced ? 0.05 : 0.65;
      approachAt = raiseAt + (reduced ? 0.25 : 0.4);
      pressAt = approachAt + (reduced ? 0.5 : 0.75);
      withdrawAt = pressAt + (reduced ? 0.6 : 0.75);
      roarAt = withdrawAt + (reduced ? 0.3 : 0.45);
      returnAt = roarAt + 1.05; finishAt = returnAt + (reduced ? 0.05 : 0.65);
      pilot.capturePose(saved); readPose(from); oldNear = camera.near;
      hiddenNodes[0] = cave.parts.head; hiddenNodes[1] = cave.parts.armL; hiddenNodes[2] = cave.parts.armR; hiddenNodes[3] = cave.parts.gun;
      for (let i = 0; i < hiddenNodes.length; i++) hiddenValues[i] = hiddenNodes[i].cameraHidden;
      // A different Ooga swaps immutable geometry. Editing colours already uploaded to GL would keep the old skin.
      if (skinKey !== cave.traits.skin) {
        skinKey = cave.traits.skin;
        skin = box({ color: skinKey }); crease = box({ color: darker(skinKey) });
        skin.castShadow = crease.castShadow = false;
        for (const n of skinNodes) n.geometry = skin;
        for (const n of creaseNodes) n.geometry = crease;
      }
      const catalog = BL.pepiEffects?.CATALOG, index = Number.isInteger(selected.index) ? selected.index : catalog ? catalog.indexOf(selected) : 0;
      syringe.setIndex(Math.max(0, index));
      syringe.plunger.position.y = 0.14; syringe.liquid.scale.y = 1;
      pilot.freeCursor(); pilot.setExternalControl(true);
      crew.steer(0, 0, 0, 0, 0); crew.thrust(false);
      crew.stopBurst(cave); crew.releaseSwing(cave, true);
      if (document.pointerLockElement) document.exitPointerLock();
      if (hud) hud.tooltip.hide();
      audio.wake();
      return true;
    };
    const update = (dt) => {
      if (!cave) return;
      if (crew.player !== cave || pilot.player !== cave || cave.health.stunned || !stationary() || valid && !valid(cave)) { restore(false); return; }
      time = Math.min(finishAt, time + dt);
      if (time >= finishAt) { restore(true); return; }
      crew.steer(0, 0, 0, 0, 0); crew.thrust(false);
      const p = cave.root.position, yaw = cave.root.rotation.y, h = cave.traits.height;
      const ey = p.y - cave.baseY + cave.headOffset * 0.95 + cave.viewLift;
      eyes.x = p.x + Math.sin(yaw) * 0.16 * h; eyes.y = ey; eyes.z = p.z + Math.cos(yaw) * 0.16 * h;
      eyes.yaw = yaw + 0.11; eyes.pitch = -0.42;
      foreground.position.x = eyes.x; foreground.position.y = eyes.y; foreground.position.z = eyes.z;
      foreground.rotation.y = yaw; foreground.scale.x = foreground.scale.y = foreground.scale.z = h;
      if (time >= returnAt) {
        if (!returning) { readPose(eyes); returning = true; }
        const back = (time - returnAt) / (finishAt - returnAt);
        cameraPose(eyes, from, back);
        foreground.visible = false;
        if (back > 0.5) hide(false);
        camera.fov = pilot.eyeFov() + (saved.fov - pilot.eyeFov()) * smooth((time - returnAt) / (finishAt - returnAt));
        return;
      }
      cameraPose(from, eyes, reduced ? 1 : time / raiseAt);
      camera.fov = saved.fov + (pilot.eyeFov() - saved.fov) * (reduced ? 1 : smooth(time / raiseAt));
      if (time >= raiseAt * 0.6) hide(true);
      if (time < raiseAt) return;
      hide(true); foreground.visible = true; camera.near = Math.min(oldNear, 0.035 * h); camera.orthoMix = 0;
      const lift = smooth((time - raiseAt) / (approachAt - raiseAt));
      left.position.y = -0.6 * (1 - lift);
      const approach = smooth((time - approachAt) / (pressAt - approachAt));
      const withdrawal = smooth((time - withdrawAt) / (roarAt - withdrawAt));
      right.position.x = 0.14 - (1 - approach) * 0.42;
      right.position.y = -0.145 + (1 - approach) * 0.13 + withdrawal * 0.22;
      right.position.z = 0.49 - (1 - approach) * 0.14;
      segment(rightFore, -0.43, -0.57, 0.13, right.position.x - 0.07, right.position.y - 0.015, right.position.z + 0.02, 0.12);
      const press = smooth((time - pressAt) / (withdrawAt - pressAt));
      syringe.plunger.position.y = 0.14 - press * 0.09;
      syringe.liquid.scale.y = Math.max(0.05, 1 - press);
      thumbR.position.y = 0.11 - press * 0.054;
      if (time >= roarAt && !cued) {
        cued = true; audio.roar();
        if (hud) hud.toast("OOOOGA! 🦍");
        if (onCue) onCue("roar", cave, item);
      }
    };
    const cancel = () => { if (!cave) return false; restore(false); return true; };
    const suspend = () => { cancel(); audio.dispose(); };
    const liveGeometry = (set) => { set.add(skin); set.add(crease); syringe.liveGeometry(set); };
    const dispose = () => { suspend(); disposed = true; removeChild(root, foreground); };
    return { start, refusal, update, cancel, suspend, dispose, liveGeometry, debug: { foreground, left, right, syringe },
      get active() { return !!cave; }, get elapsed() { return time; } };
  };
  BL.pepiCinematic = { create, createVoice: voice };
})();
