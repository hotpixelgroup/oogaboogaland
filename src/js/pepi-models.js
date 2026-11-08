// Pepi is an elderly baboon in a long, split trench coat. His narrow rig has a long muzzle, grey cheek whiskers, a
// tail and an asymmetric bent-knee hobble. One coat leaf opens to show twelve
// fictional OBL codes; all the body, cloth, label and syringe meshes are shared, only nodes move.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { box, bevelBox, lathe, merge, cached, moved, turnedZ, along, characterGeometry } = BL.models;
  const { createNode, addChild, removeChild } = BL.scene;
  const { clamp } = BL.math;
  const CLOTH = { body: "#9d754a", light: "#bd9668", dark: "#6a4b32", lining: "#322937" };
  const COLORS = ["#82c9ff", "#ff916e", "#d8bcff", "#a4e579", "#ffbc75", "#7de2d1",
    "#ed95c2", "#f6dd68", "#8da5cf", "#b8b4ad", "#c5e86c", "#ff6f79"];
  const DEFAULTS = COLORS.map((color, i) => ({ code: `OBL-${String(i + 1).padStart(2, "0")}`, color }));
  const EMPTY = { verts: [], faces: [], lines: [] };
  const syringes = new Array(12);
  let clothing = null, baboonGeo = null;
  const character = (geo) => {
    characterGeometry(geo);
    // The dedicated NPC navigation owns collision, including the open coat's full clearance.
    geo.collisionGeometry = EMPTY;
    return geo;
  };
  const baboonGeometry = () => {
    if (baboonGeo) return baboonGeo;
    const fur = "#71695c", shadow = "#514b43";
    const skin = "#8c6d61", muzzle = "#a07a69", grey = "#aaa89a", dark = "#302c2a";
    const torso = characterGeometry(merge(
      bevelBox({ w: 0.57, h: 0.9, d: 0.37, color: fur, bevel: 0.045, offset: { y: 0.45 } }),
      bevelBox({ w: 0.63, h: 0.17, d: 0.4, color: shadow, bevel: 0.035, offset: { y: 0.87, z: -0.015 } }),
      box({ w: 0.36, h: 0.58, d: 0.035, color: grey, offset: { y: 0.43, z: 0.192 } })
    ));
    const headParts = [
      bevelBox({ w: 0.44, h: 0.4, d: 0.37, color: fur, bevel: 0.05, offset: { y: 0.22, z: -0.015 } }),
      box({ w: 0.3, h: 0.19, d: 0.026, color: skin, offset: { y: 0.245, z: 0.183 } }),
      // A baboon's long, narrow doglike muzzle projects well beyond its brow; no gorilla shades or broad flat jaw.
      bevelBox({ w: 0.255, h: 0.2, d: 0.22, color: skin, bevel: 0.035, offset: { y: 0.1, z: 0.235 } }),
      bevelBox({ w: 0.205, h: 0.145, d: 0.39, color: muzzle, bevel: 0.035, offset: { y: 0.055, z: 0.43 } }),
      bevelBox({ w: 0.18, h: 0.09, d: 0.075, color: dark, bevel: 0.018, offset: { y: 0.075, z: 0.651 } }),
      box({ w: 0.19, h: 0.015, d: 0.29, color: "#4e3430", offset: { y: -0.014, z: 0.447 } }),
      bevelBox({ w: 0.18, h: 0.05, d: 0.37, color: "#92665c", bevel: 0.015, offset: { y: -0.04, z: 0.425 } }),
      // Balding crown and scruffy silver cheeks make the age legible even under the small coat's collar.
      box({ w: 0.25, h: 0.035, d: 0.22, color: "#9b8c7d", offset: { y: 0.419, z: -0.005 } }),
      bevelBox({ w: 0.095, h: 0.25, d: 0.29, color: grey, bevel: 0.018, offset: { x: -0.215, y: 0.115, z: 0.065 } }),
      bevelBox({ w: 0.095, h: 0.25, d: 0.29, color: grey, bevel: 0.018, offset: { x: 0.215, y: 0.115, z: 0.065 } }),
      box({ w: 0.11, h: 0.09, d: 0.12, color: grey, offset: { y: -0.057, z: 0.267 } })
    ];
    for (const side of [-1, 1]) {
      headParts.push(
        bevelBox({ w: 0.1, h: 0.15, d: 0.085, color: skin, bevel: 0.02, offset: { x: side * 0.267, y: 0.245 } }),
        box({ w: 0.045, h: 0.09, d: 0.02, color: "#b7907f", offset: { x: side * 0.278, y: 0.24, z: 0.043 } }),
        box({ w: 0.06, h: 0.055, d: 0.018, color: "#d2b77a", offset: { x: side * 0.09, y: 0.245, z: 0.207 } }),
        box({ w: 0.021, h: 0.032, d: 0.012, color: "#211d18", offset: { x: side * 0.09, y: 0.238, z: 0.222 } }),
        box({ w: 0.07, h: 0.028, d: 0.023, color: skin, offset: { x: side * 0.09, y: 0.272, z: 0.214 } }),
        moved(turnedZ(box({ w: 0.13, h: 0.027, d: 0.055, color: grey }), side * 0.18), side * 0.115, 0.303, 0.208),
        moved(turnedZ(box({ w: 0.065, h: 0.1, d: 0.15, color: grey }), side * 0.28), side * 0.165, 0.425, -0.04)
      );
    }
    const arm = characterGeometry(bevelBox({ w: 0.16, h: 0.45, d: 0.18, color: fur, bevel: 0.025, offset: { y: -0.225 } }));
    const forearm = characterGeometry(bevelBox({ w: 0.15, h: 0.45, d: 0.16, color: shadow, bevel: 0.02, offset: { y: -0.225 } }));
    const handParts = [bevelBox({ w: 0.17, h: 0.09, d: 0.235, color: dark, bevel: 0.02, offset: { y: -0.045, z: 0.04 } })];
    for (let i = 0; i < 4; i++) handParts.push(box({ w: 0.032, h: 0.065, d: 0.105, color: dark,
      offset: { x: (i - 1.5) * 0.037, y: -0.0575, z: 0.16 } }));
    const thigh = characterGeometry(bevelBox({ w: 0.175, h: 0.34, d: 0.19, color: fur, bevel: 0.025, offset: { y: -0.17 } }));
    const shin = characterGeometry(bevelBox({ w: 0.09, h: 0.34, d: 0.1, color: shadow, bevel: 0.018, offset: { y: -0.17 } }));
    const foot = characterGeometry(bevelBox({ w: 0.185, h: 0.1, d: 0.285, color: dark, bevel: 0.02, offset: { y: 0, z: 0.065 } }));
    const points = [[0, 0.06, -0.2], [0, 0.15, -0.43], [0, 0.13, -0.64], [0.04, -0.02, -0.79],
      [0.08, -0.22, -0.84], [0.1, -0.42, -0.8], [0.1, -0.51, -0.72]], tailParts = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
      tailParts.push(along(lathe({ profile: [[0, 0], [0.052 - i * 0.005, 0], [0.047 - i * 0.005, len], [0, len]],
        segments: 6, color: i > 3 ? grey : fur }), a[0], a[1], a[2], dx, dy, dz));
    }
    baboonGeo = { torso, head: characterGeometry(merge(...headParts)), arm, forearm, hand: characterGeometry(merge(...handParts)), thigh, shin, foot, tail: characterGeometry(merge(...tailParts)) };
    return baboonGeo;
  };
  // Navigation owns the root's supported world position and swept movement. This rig poses only: no jump, combat,
  // gallop or Agent control state is borrowed by this elderly character.
  const baboon = ({ groundAt, x = 0, z = 0, heading = 0 }) => {
    const geo = baboonGeometry(), root = createNode({ position: { x, y: groundAt(x, z), z }, rotation: { x: 0, y: heading, z: 0 }, matrixNative: true });
    const hips = createNode(), chest = createNode();
    const parts = {
      torso: createNode({ geometry: geo.torso }),
      head: createNode({ geometry: geo.head, position: { x: 0, y: 1.025, z: 0.135 } }),
      armR: createNode({ geometry: geo.arm, position: { x: -0.38, y: 0.89, z: 0.015 } }),
      armL: createNode({ geometry: geo.arm, position: { x: 0.38, y: 0.89, z: 0.015 } }),
      legR: createNode({ geometry: geo.thigh, position: { x: -0.18, y: 0, z: 0 } }),
      legL: createNode({ geometry: geo.thigh, position: { x: 0.18, y: 0, z: 0 } }),
      forearmR: createNode({ geometry: geo.forearm, position: { x: 0, y: -0.45, z: 0 } }),
      forearmL: createNode({ geometry: geo.forearm, position: { x: 0, y: -0.45, z: 0 } }),
      handR: createNode({ name: "pepi-forehand-right", geometry: geo.hand, position: { x: 0, y: -0.45, z: 0 } }),
      handL: createNode({ name: "pepi-forehand-left", geometry: geo.hand, position: { x: 0, y: -0.45, z: 0 } }),
      footR: createNode({ name: "pepi-hindfoot-right", geometry: geo.foot, position: { x: 0, y: -0.34, z: 0 } }),
      footL: createNode({ name: "pepi-hindfoot-left", geometry: geo.foot, position: { x: 0, y: -0.34, z: 0 } })
    };
    const shinR = createNode({ geometry: geo.shin, position: { x: 0, y: -0.34, z: 0 } }), shinL = createNode({ geometry: geo.shin, position: { x: 0, y: -0.34, z: 0 } });
    const tail = createNode({ geometry: geo.tail });
    addChild(parts.legR, shinR); addChild(parts.legL, shinL); addChild(shinR, parts.footR); addChild(shinL, parts.footL);
    addChild(parts.armR, parts.forearmR); addChild(parts.armL, parts.forearmL);
    addChild(parts.forearmR, parts.handR); addChild(parts.forearmL, parts.handL);
    addChild(chest, parts.torso, parts.head, parts.armR, parts.armL);
    addChild(hips, parts.legR, parts.legL, chest, tail); addChild(root, hips);
    let phase = 0, age = 0, pace = 0, posture = 0, disposed = false;
    // Solve each two-bone limb in the root's sagittal frame. The paw cancels both joint turns and stays flat on
    // its support. Unlike a rigid shoulder-to-fist swing, a forehand really bears weight at the ground plane.
    const reach = (upper, lower, paw, originY, originZ, parentPitch, length, targetY, targetZ, bend) => {
      const dy = targetY - originY, dz = targetZ - originZ, distance = Math.min(length * 2 - 1e-7, Math.max(1e-7, Math.hypot(dy, dz)));
      const angle = Math.atan2(-dz, -dy) + bend * Math.acos(clamp(distance / (length * 2), -1, 1));
      const elbowY = originY - Math.cos(angle) * length, elbowZ = originZ - Math.sin(angle) * length;
      const lowerAngle = Math.atan2(elbowZ - targetZ, elbowY - targetY);
      upper.rotation.x = angle - parentPitch; upper.rotation.y = upper.rotation.z = 0;
      lower.rotation.x = lowerAngle - angle;
      paw.rotation.x = -lowerAngle;
    };
    const floorAt = (px, pz, sr, cr) => groundAt(root.position.x + cr * px + sr * pz, root.position.z - sr * px + cr * pz) - root.position.y;
    const pose = (dt, speed = 0, facing = root.rotation.y, upright = false, reducedMotion = false) => {
      age += dt;
      const desired = upright ? 1 : 0;
      posture = reducedMotion ? desired : desired + (posture - desired) * Math.exp(-8 * dt);
      if (Math.abs(posture - desired) < 0.0001) posture = desired;
      pace += (Math.min(1, Math.abs(speed) / 0.8) - pace) * (1 - Math.exp(-9 * dt));
      phase = (phase + Math.abs(speed) * dt / 0.72) % 1;
      const step = Math.sin(phase * Math.PI * 2), quad = 1 - posture;
      const lean = 0.32 + 0.76 * quad + (Math.sin(age * 1.3) * 0.007 + step * 0.02 * pace) * quad;
      const hipY = 0.725 - 0.295 * quad, back = -0.43 * quad, cp = Math.cos(lean), sp = Math.sin(lean);
      const shoulderY = hipY + 0.89 * cp - 0.015 * sp, shoulderZ = back + 0.89 * sp + 0.015 * cp;
      const sr = Math.sin(facing), cr = Math.cos(facing);
      root.rotation.y = facing;
      hips.position.y = hipY; hips.rotation.z = 0;
      chest.position.z = back; chest.rotation.x = lean; chest.rotation.z = 0;
      // Keep the long muzzle level as the trunk lowers, rather than swinging it beyond the swept body.
      parts.head.rotation.x = 0.14 - lean; parts.head.rotation.z = -step * 0.008 * pace;
      parts.armR.position.z = parts.armL.position.z = 0.015;
      parts.legR.position.y = parts.legL.position.y = 0;
      for (let side = 0; side < 2; side++) {
        const cycle = (phase + side * 0.5) % 1, swing = cycle >= 0.62, t = swing ? (cycle - 0.62) / 0.38 : cycle / 0.62;
        const offset = (swing ? -0.2232 * Math.cos(t * Math.PI) : 0.2232 * (1 - t * 2)) * pace;
        const lift = swing ? Math.sin(t * Math.PI) * (side ? 0.045 : 0.065) * pace : 0;
        const handX = side ? 0.38 : -0.38, handZ = (0.56 + offset) * quad + (shoulderZ + 0.1) * posture;
        // Lift the paws before the trunk finishes rising; interpolating only the two endpoints would ask the
        // forearms to stretch through the middle of the transition. On the way down they reach forward to plant.
        const handY = (floorAt(handX, handZ, sr, cr) + 0.09 + lift) * quad + (shoulderY - 0.87) * posture + posture * quad * 1.12;
        reach(side ? parts.armL : parts.armR, side ? parts.forearmL : parts.forearmR, side ? parts.handL : parts.handR,
          shoulderY, shoulderZ, lean, 0.45, handY, handZ, 1);
        // Opposing diagonal pairs take turns: each swing keeps the other forehand and its opposite hindfoot down.
        const footX = side ? -0.18 : 0.18, footZ = (-0.24 + offset) * quad + 0.04 * posture;
        reach(side ? parts.legR : parts.legL, side ? shinR : shinL, side ? parts.footR : parts.footL,
          hipY, 0, 0, 0.34, floorAt(footX, footZ, sr, cr) + 0.05 + lift * quad, footZ, -1);
      }
      tail.scale.y = 0.55 + posture * 0.45;
      tail.position.y = 0.02 * quad;
      tail.rotation.y = Math.sin(age * 0.8) * 0.035 + step * 0.025 * pace;
    };
    const place = (px, pz, facing = root.rotation.y) => {
      root.position.x = px; root.position.z = pz; root.position.y = groundAt(px, pz); root.rotation.y = facing;
    };
    const liveGeometry = (set) => { for (const name in geo) set.add(geo[name]); };
    const dispose = () => { if (disposed) return; disposed = true; if (root.parent) removeChild(root.parent, root); };
    pose(0);
    return { root, parts, hips, chest, tail, pose, place, liveGeometry, dispose,
      contacts: [parts.handR, parts.handL, parts.footR, parts.footL],
      get posture() { return posture; }, get heading() { return root.rotation.y; } };
  };
  const cloth = () => {
    if (clothing) return clothing;
    const C = CLOTH;
    const torso = character(merge(
      bevelBox({ w: 0.77, h: 1.05, d: 0.06, color: C.body, bevel: 0.015, offset: { y: 0.49, z: -0.245 } }),
      box({ w: 0.055, h: 1.03, d: 0.48, color: C.dark, offset: { x: -0.36, y: 0.48 } }),
      box({ w: 0.055, h: 1.03, d: 0.48, color: C.body, offset: { x: 0.36, y: 0.48 } }),
      // A narrow, slightly oversized old coat hangs off drooping shoulders rather than a gorilla's broad chest.
      moved(turnedZ(bevelBox({ w: 0.12, h: 0.49, d: 0.055, color: C.light, bevel: 0.012 }), -0.25), -0.19, 0.85, 0.255),
      moved(turnedZ(bevelBox({ w: 0.12, h: 0.49, d: 0.055, color: C.light, bevel: 0.012 }), 0.25), 0.19, 0.85, 0.255)
    ));
    const skirt = character(merge(
      bevelBox({ w: 0.77, h: 0.56, d: 0.06, color: C.body, bevel: 0.015, offset: { y: -0.27, z: -0.245 } }),
      box({ w: 0.055, h: 0.56, d: 0.48, color: C.dark, offset: { x: -0.36, y: -0.27 } }),
      box({ w: 0.055, h: 0.56, d: 0.48, color: C.body, offset: { x: 0.36, y: -0.27 } })
    ));
    const sleeve = character(bevelBox({ w: 0.23, h: 0.43, d: 0.25, color: C.body, bevel: 0.025, offset: { y: -0.225 } }));
    const foreSleeve = character(merge(
      bevelBox({ w: 0.2, h: 0.37, d: 0.21, color: C.body, bevel: 0.025, offset: { y: -0.21 } }),
      box({ w: 0.215, h: 0.055, d: 0.22, color: C.dark, offset: { y: -0.4025 } })
    ));
    const front = character(merge(
      bevelBox({ w: 0.4, h: 1.25, d: 0.045, color: C.body, bevel: 0.012, offset: { x: -0.19, y: 0.19, z: 0.265 } }),
      box({ w: 0.38, h: 0.075, d: 0.025, color: C.dark, offset: { x: -0.19, y: 0.1, z: 0.298 } }),
      ...[0.3, 0.53].map((y) => bevelBox({ w: 0.055, h: 0.055, d: 0.022, color: "#d4b273", bevel: 0.008,
        offset: { x: -0.07, y, z: 0.303 } }))
    ));
    const panel = character(merge(
      bevelBox({ w: 0.67, h: 1.44, d: 0.045, color: C.body, bevel: 0.012, offset: { x: -0.335, y: 0.25 } }),
      box({ w: 0.64, h: 1.39, d: 0.009, color: C.lining, offset: { x: -0.335, y: 0.25, z: -0.029 } }),
      box({ w: 0.65, h: 0.075, d: 0.018, color: C.dark, offset: { x: -0.335, y: 0.1, z: 0.028 } })
    ));
    clothing = { torso, skirt, sleeve, foreSleeve, front, panel };
    return clothing;
  };
  // Solid carved glyphs stay readable on Canvas 2D too. Labels are not textures, DOM elements or external fonts.
  const codeLabel = (code) => {
    const cell = 0.0044, width = (code.length * 4 - 1) * cell, parts = [
      box({ w: width + 0.012, h: 0.034, d: 0.008, color: "#f0ead8" })
    ];
    let left = -width / 2;
    for (const ch of code) {
      const glyph = BL.hubModels.SIGN_GLYPHS[ch];
      if (!glyph) throw new Error(`pepi: unknown code glyph ${ch}`);
      for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) if (glyph[row][col] === "1") {
        parts.push(box({ w: cell * 0.9, h: cell * 0.9, d: 0.002, color: "#27282b", emissive: 0.18,
          offset: { x: left + (col + 0.5) * cell, y: (2 - row) * cell, z: 0.0055 } }));
      }
      left += 4 * cell;
    }
    return character(merge(...parts));
  };
  const syringeBody = cached(() => character(merge(
    lathe({ profile: [[0, -0.146], [0.032, -0.146], [0.036, -0.12], [0.036, 0.115], [0.032, 0.13], [0, 0.13]],
      segments: 8, color: "#c6ded8" }),
    lathe({ profile: [[0, -0.173], [0.019, -0.173], [0.022, -0.145], [0, -0.145]], segments: 8, color: "#9da8b0" }),
    box({ w: 0.005, h: 0.109, d: 0.005, color: "#d9e1e5", offset: { y: -0.2275 } }),
    bevelBox({ w: 0.12, h: 0.014, d: 0.052, color: "#e7e5da", bevel: 0.004, offset: { y: 0.128 } }),
    ...[-0.1, -0.065, -0.03, 0.005, 0.04].map((y) => box({ w: 0.013, h: 0.004, d: 0.004, color: "#424c52",
      offset: { x: -0.019, y, z: 0.034 } }))
  )));
  const plungerGeometry = cached(() => character(merge(
    box({ w: 0.012, h: 0.09, d: 0.012, color: "#e7e5da", offset: { y: 0.035 } }),
    bevelBox({ w: 0.09, h: 0.014, d: 0.05, color: "#eee9db", bevel: 0.004, offset: { y: 0.087 } })
  )));
  const syringeGeometry = (index, catalog) => {
    if (syringes[index]) return syringes[index];
    const entry = catalog ? catalog[index] : DEFAULTS[index];
    const liquid = character(box({ w: 0.031, h: 0.15, d: 0.012, color: entry.color, emissive: 0.2,
      offset: { x: 0.008, y: -0.055, z: 0.034 } }));
    syringes[index] = { liquid, label: codeLabel(entry.code) };
    return syringes[index];
  };
  // Origin is the middle of the grip; the needle points down local -Y with its tip at -0.282 m. The plunger starts
  // at +0.14 m and presses to +0.05 m. setIndex swaps pooled meshes; it does not build a second item during a shot.
  const syringe = (index = 0, catalog = null) => {
    const root = createNode(), body = createNode({ geometry: syringeBody() });
    const plunger = createNode({ position: { x: 0, y: 0.14, z: 0 }, geometry: plungerGeometry() });
    const liquid = createNode(), label = createNode({ position: { x: 0, y: 0.072, z: 0.042 } });
    addChild(root, body, liquid, label, plunger);
    const setIndex = (next) => {
      const geometry = syringeGeometry(next, catalog);
      liquid.geometry = geometry.liquid; label.geometry = geometry.label;
    };
    setIndex(index);
    const liveGeometry = (set) => {
      set.add(body.geometry); set.add(plunger.geometry); set.add(liquid.geometry); set.add(label.geometry);
    };
    return { root, node: root, plunger, liquid, label, setIndex, liveGeometry };
  };
  const decorate = (actor, catalog = null) => {
    const C = cloth(), P = actor.parts, attached = [], armZ = P.armL.position.z;
    const mount = (parent, geometry) => {
      const node = createNode({ geometry }); addChild(parent, node); attached.push(node); return node;
    };
    mount(P.torso, C.torso);
    const skirt = mount(actor.hips, C.skirt), front = mount(P.torso, C.front);
    mount(P.armR, C.sleeve); mount(P.armL, C.sleeve);
    mount(P.forearmR, C.foreSleeve); mount(P.forearmL, C.foreSleeve);
    // A slightly inset hinge lets the wider leaf open toward the viewer while staying inside the 1.3 m clearance.
    const panel = createNode({ position: { x: 0.34, y: 0, z: 0.24 }, geometry: C.panel });
    addChild(P.torso, panel); attached.push(panel);
    const items = [];
    if (catalog) for (let i = 0; i < 12; i++) {
      const item = syringe(i, catalog);
      item.root.position.x = -0.108 - (i % 3) * 0.227;
      item.root.position.y = 0.81 - Math.floor(i / 3) * 0.34;
      item.root.position.z = -0.074;
      item.root.rotation.y = Math.PI;
      item.root.scale.x = item.root.scale.y = item.root.scale.z = 0.62;
      addChild(panel, item.root); items.push(item);
    }
    const reveal = (amount) => {
      const upright = actor.posture, quad = 1 - upright;
      const t = clamp(amount, 0, 1) * clamp((upright - 0.65) / 0.35, 0, 1);
      // The long hems fold under the belly on all fours, then drop as the animal stands. Sleeves follow actual
      // elbow joints, leaving the planted forepaws and their wrist creases bare instead of dragging cloth below them.
      skirt.scale.y = 0.48 + upright * 0.52;
      front.scale.y = panel.scale.y = 0.7 + upright * 0.3;
      front.position.y = panel.position.y = 0.06 * quad;
      panel.rotation.y = t * 2.6;
      // Called after the normal pose. Straighten before the long leaf swings out, then keep the sleeve
      // and forearm behind its outer cloth: the old raised forearm crossed the middle of the twelve-item display.
      P.armL.position.z = armZ - 0.25 * t;
      if (t > 0) {
        actor.chest.rotation.x *= 1 - 0.87 * Math.min(1, t * 1.5);
        P.head.rotation.x += (0.02 - P.head.rotation.x) * t;
        P.armL.rotation.x += (-0.2 - P.armL.rotation.x) * t;
        P.armL.rotation.y *= 1 - t;
        P.armL.rotation.z += (0.4 - P.armL.rotation.z) * t;
      }
    };
    const liveGeometry = (set) => {
      set.add(C.torso); set.add(C.skirt); set.add(C.sleeve); set.add(C.foreSleeve); set.add(C.front); set.add(C.panel);
      for (const item of items) item.liveGeometry(set);
    };
    const dispose = () => {
      P.armL.position.z = armZ;
      for (const node of attached) if (node.parent) removeChild(node.parent, node);
    };
    reveal(0);
    // The stock shot can frame this point in the panel's local coordinates, through panel.world.
    return { panel, stockCenter: { x: -0.335, y: 0.3, z: -0.1 }, syringes: items, reveal, liveGeometry, dispose };
  };
  BL.pepiModels = { baboon, decorate, syringe, COLORS };
})();
