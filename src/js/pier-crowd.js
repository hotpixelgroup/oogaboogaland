// The people on the deck. The beach has its own visitors (pier-beach.js); these are the ones that make the
// boardwalk itself feel open for business: strollers on the promenade and in the park, a queue at the wheel and
// the train, tables taken at the cafes, a few leaning on the rail. Contributors who are off duty today take the
// first places in their own looks and say their own lines to a visitor who walks up; the rest are anonymous
// beach visitors. They are scenery: fixed in number, moved by direct transforms, no collision, and not drawn
// beyond FAR of the eye or past the quality tier's share. A vehicle at speed bowls them over all the same
// (`bump`): a person hit sits down hard for a couple of seconds, sees stars, says so, and carries on from where
// they fell. Slapstick only; nobody is hurt and nothing is scored against them.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models, FAR = 170, GREET = 4.5, DOWN = 2.4, OUCH = ["Hey!", "Watch it!", "Ooga?!", "My ice cream!"];
  // role, then where: a stroller walks x from z0 to z1 and back; the others stand, sit or lean at a spot.
  const PLACES = (L) => {
    const top = L.top, rows = [];
    const stroll = (x, z0, z1, speed) => rows.push({ role: "stroll", x, z: z0, z1, y: top, speed });
    stroll(-2.6, 86, -128, 1.25); stroll(2.4, 70, -250, 1.5); stroll(-0.9, -12, -254, 1.15); stroll(0.8, 82, -58, 1.65);
    stroll(-3.4, -140, -252, 1.3); stroll(3.3, 30, -180, 1.4); stroll(-1.8, 60, -110, 1.55); stroll(1.6, -60, -240, 1.2);
    stroll(-37.6, -14, -96, 1.2); stroll(-40.4, -90, -18, 1.45); stroll(-30, 24, 62, 1.1);
    for (let i = 0; i < 3; i++) rows.push({ role: "queue", x: L.wheel.board.x + (i % 2 ? 0.25 : -0.2), z: L.wheel.board.z + 3 + i * 1.25, y: top, ry: Math.PI });
    for (let i = 0; i < 2; i++) rows.push({ role: "queue", x: L.coaster.board.x + 2.8 + i * 1.3, z: L.coaster.board.z + (i ? 0.3 : -0.2), y: top, ry: -Math.PI / 2 });
    for (const [x, z] of [[-16, 19], [-16, 23], [-16, -112], [-16, -108]]) rows.push({ role: "sit", x: x + (z % 2 ? 0.95 : -0.95), z, y: top + 0.45, ry: z % 2 ? -Math.PI / 2 : Math.PI / 2 });
    for (const z of [-58, -151, -222]) rows.push({ role: "lean", x: 6.05, z, y: top, ry: Math.PI / 2 });
    return rows;
  };
  const create = ({ root, layout: L, renderer, fx, exclude }) => {
    const group = S.createNode(), people = [], places = PLACES(L);
    S.addChild(root, group);
    // Off-duty contributors first, in a stable order, never the Ooga the visitor is driving.
    const resting = BL.contributors.roster.filter((c) => c.name !== exclude && BL.contributors.stateFor(c) === "chilling").slice(0, 10);
    for (let i = 0; i < places.length; i++) {
      const place = places[i], contributor = i % 2 === 0 ? resting[i / 2] : null, name = contributor ? contributor.name : `beach-visitor-${i % 6}`;
      const cave = M.caveman(BL.contributors.traitsFor(name)), baseY = cave.root.position.y;
      for (const key of ["club", "snack", "gun", "jetpack", "jetFlame"]) if (cave.parts[key]) cave.parts[key].visible = false;
      S.addChild(group, cave.root);
      const person = { cave, place, baseY, name: contributor ? contributor.name : null, voice: contributor ? BL.contributors.voiceFor(contributor.name) : null, phase: i * 37.7, side: 0, hidden: false, said: -60, line: 0, down: 0 };
      const p = cave.root.position;
      p.x = place.x; p.z = place.z;
      if (place.role === "sit") { p.y = place.y + cave.traits.height * 0.08; cave.parts.legL.rotation.x = cave.parts.legR.rotation.x = -Math.PI / 2; cave.parts.armL.rotation.x = -0.9; cave.parts.armR.rotation.x = -0.6; }
      else p.y = place.y + baseY;
      if (place.ry !== undefined) cave.root.rotation.y = place.ry;
      if (place.role === "lean") cave.parts.armL.rotation.x = cave.parts.armR.rotation.x = -1.15;
      people.push(person);
    }
    let lastSaid = -10;
    const update = (dt, time, eye, player) => {
      const cap = renderer.kind === "canvas2d" || renderer.quality === "low" ? 9 : renderer.quality === "medium" ? 16 : people.length;
      const px = player ? player.root.position.x : 1e9, pz = player ? player.root.position.z : 1e9;
      for (let i = 0; i < people.length; i++) {
        const person = people[i], c = person.cave, p = c.root.position, place = person.place;
        const shown = !person.hidden && i < cap && Math.abs(p.x - eye.x) < FAR && Math.abs(p.z - eye.z) < FAR;
        if (c.root.visible !== shown) c.root.visible = shown;
        if (person.down > 0) {
          // Sat down hard: flat on their back, then up again. A stroller's lane time is held back by as long as
          // they were down, so they walk on from where they fell.
          person.down -= dt;
          if (place.role === "stroll") person.phase -= dt * place.speed;
          const up = person.down <= 0;
          c.root.rotation.x = up ? 0 : -1.45; p.y = up ? place.y + person.baseY : place.y + 0.35;
          if (!up) continue;
        }
        if (place.role === "stroll") {
          // There and back along the lane; a visitor walking up gets a step of room.
          const span = Math.abs(place.z1 - place.z), t = (time * place.speed + person.phase) % (span * 2), along = t < span ? t : span * 2 - t, heading = (t < span) === (place.z1 < place.z) ? Math.PI : 0;
          p.z = place.z + Math.sign(place.z1 - place.z) * along;
          const close = Math.abs(px - p.x) < 1.6 && Math.abs(pz - p.z) < 3.2;
          person.side += ((close ? (px > p.x ? -1.1 : 1.1) : 0) - person.side) * (1 - Math.exp(-dt * 6));
          p.x = place.x + person.side;
          if (!shown) continue;
          c.root.rotation.y = heading;
          const swing = Math.sin(time * place.speed * 5 + person.phase) * 0.45;
          c.parts.legL.rotation.x = swing; c.parts.legR.rotation.x = -swing; c.parts.armL.rotation.x = -swing * 0.5; c.parts.armR.rotation.x = swing * 0.5;
        } else if (shown) {
          if (place.role === "queue") { c.root.rotation.y = place.ry + Math.sin(time * 0.6 + person.phase) * 0.25; c.parts.armR.rotation.x = -0.15 + Math.max(0, Math.sin(time * 0.4 + person.phase)) * -0.5; }
          else if (place.role === "sit") c.parts.armR.rotation.x = -0.6 - Math.max(0, Math.sin(time * 0.5 + person.phase)) * 0.9;
          else c.root.rotation.y = place.ry + Math.sin(time * 0.3 + person.phase) * 0.12;
        }
        // A contributor says one of their own lines to a visitor who comes close, not too often.
        if (shown && person.voice && time - person.said > 40 && time - lastSaid > 6 && Math.hypot(px - p.x, pz - p.z) < GREET) {
          const lines = person.voice.idle;
          if (lines && lines.length) { fx.say(c, lines[person.line++ % lines.length], 3.5); person.said = lastSaid = time; }
        }
      }
    };
    // Whatever is moving fast at (x, z) knocks over the people it touches. Answers how many went down.
    const bump = (x, z, reach) => {
      let hits = 0;
      for (let i = 0; i < people.length; i++) {
        const person = people[i], p = person.cave.root.position;
        if (person.down > 0 || person.hidden || person.place.role === "sit" || !person.cave.root.visible || Math.abs(p.x - x) > reach || Math.abs(p.z - z) > reach) continue;
        person.down = DOWN; hits++;
        fx.say(person.cave, OUCH[(i + hits) % OUCH.length], 1.8);
        for (let k = 0; k < 5; k++) { const t = k * Math.PI * 0.4; fx.spawnParticle(BL.fx.CONFETTI[4], p.x, person.place.y + 1.9, p.z, Math.cos(t) * 1.1, 1.6, Math.sin(t) * 1.1, 0.9, 9, 4, person.place.y); }
      }
      return hits;
    };
    return {
      people, update, bump,
      // A contributor another visitor is driving here is that visitor's, not ours.
      hide: (name, on) => { for (let i = 0; i < people.length; i++) if (people[i].name === name) people[i].hidden = on; },
      liveGeometry: (set) => { for (let i = 0; i < people.length; i++) set.add(people[i].cave.headOpen).add(people[i].cave.headClosed); },
      dispose: () => { S.removeChild(root, group); people.length = 0; }
    };
  };
  BL.pierCrowd = { create, FAR };
})();
