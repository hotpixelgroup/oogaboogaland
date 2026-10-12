// The Surf Shop: where tickets go. Everything on its counter is a look or a show, never an advantage: a balloon
// that floats along behind the Ooga who wears it, and fireworks over the park. Three balloons are sold for
// tickets; three more cannot be bought and are earned by a streak of days played (pier-daily.js).
// It is a station like the six games (a row in the scene's MINIS), so its prompt, keys and closing are the
// scene's. One balloon node follows the visitor; a balloon's geometry is built once and shared.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models, FIREWORKS = 30, SHELLS = 4;
  // `cost` in tickets, or `streak` in days for the ones that are earned.
  const GOODS = [
    { id: "balloon-orange", name: "Orange balloon", cost: 40 },
    { id: "balloon-teal", name: "Teal balloon", cost: 40 },
    { id: "balloon-pink", name: "Pink balloon", cost: 40 },
    { id: "balloon-stripe", name: "Striped balloon", streak: 3 },
    { id: "balloon-gold", name: "Gold balloon", streak: 7 },
    { id: "balloon-block", name: "Block balloon", streak: 21 }
  ];
  const LOW = [[0, -0.3], [0.1, -0.26], [0.26, -0.08], [0.3, 0.1]], HIGH = [[0.3, 0.1], [0.24, 0.3], [0.1, 0.42], [0, 0.44]];
  const skin = (low, high, emissive = 0) => [M.lathe({ profile: LOW, segments: 12, color: low, emissive }), M.lathe({ profile: HIGH, segments: 12, color: high, emissive }),
    M.lathe({ profile: [[0, -0.37], [0.05, -0.37], [0.02, -0.3], [0, -0.3]], segments: 8, color: low })];
  const SKINS = {
    "balloon-orange": () => skin("#f7931a", "#f7931a"), "balloon-teal": () => skin("#2fb4a8", "#2fb4a8"), "balloon-pink": () => skin("#f28ab2", "#f28ab2"),
    "balloon-stripe": () => skin("#f8eed3", "#16478b"), "balloon-gold": () => skin("#f2bf38", "#ffd866", 0.3),
    "balloon-block": () => [...skin("#20242b", "#20242b"), M.moved(BL.factoryModels.smoothBitcoin(0.3, 0.04, "#f7931a", 0.7), 0, 0.06, 0.29)]
  };
  // A balloon on its string, drawn round the origin at its middle; the string ends about hand high.
  const balloons = {};
  for (const good of GOODS) balloons[good.id] = M.cached(() => { const g = M.merge(...SKINS[good.id](), M.beam(0, -0.37, 0, 0, -1.25, 0, 0.012, "#f5e7c9")); g.castShadow = false; return g; });
  const stall = M.cached(() => {
    const parts = [], box = (w, h, d, x, y, z, color) => parts.push(M.moved(M.bevelBox({ w, h, d, color }), x, y, z));
    box(1.2, 1.05, 3.4, 0, 0.525, 0, "#2f8f9d"); box(1.4, 0.12, 3.6, 0, 1.11, 0, "#f3dfb5");
    for (const z of [-1.7, 1.7]) for (const x of [-0.55, 0.55]) box(0.12, 2.7, 0.12, x, 1.35, z, "#8e6949");
    // A striped awning out over the counter.
    for (let i = 0; i < 8; i++) box(2.2, 0.08, 0.46, -0.35, 2.74, -1.61 + i * 0.46, i % 2 ? "#f8eed3" : "#f7931a");
    return M.merge(...parts);
  });
  const dressing = M.cached(() => {
    const parts = [];
    // Two boards leaning on the back posts, and a bunch of balloons tied to the front one.
    parts.push(M.moved(M.turnedX(M.bevelBox({ w: 0.1, h: 2.3, d: 0.56, color: "#f28ab2" }), 0.16), 0.9, 1.15, -1.1), M.moved(M.turnedX(M.bevelBox({ w: 0.1, h: 2.5, d: 0.6, color: "#ffd866" }), -0.12), 0.9, 1.25, 0.9));
    const tie = [-0.55, 2.7, 1.7];
    for (const [id, x, y, z] of [["balloon-orange", -0.9, 4.3, 1.9], ["balloon-teal", -0.3, 4.7, 2.1], ["balloon-pink", -0.6, 4.1, 1.4]]) {
      for (const part of SKINS[id]()) parts.push(M.moved(part, x, y, z));
      parts.push(M.beam(x, y - 0.37, z, tie[0], tie[1], tie[2], 0.012, "#f5e7c9"));
    }
    const g = M.merge(...parts); g.castShadow = false; return g;
  });
  const pad = M.cached(() => M.box({ w: 1.8, h: 0.015, d: 2.2, color: "#eac66f" }));
  const build = (layout) => {
    const q = layout.shop, root = S.createNode(), solid = S.createNode({ geometry: stall(), position: { x: q.x, y: q.floor, z: q.z } });
    S.addChild(root, solid);
    S.addChild(root, S.createNode({ geometry: dressing(), position: { x: q.x, y: q.floor, z: q.z } }));
    S.addChild(root, S.createNode({ geometry: BL.hubModels.postSign("SURF SHOP", 0.32, 1.3), position: { x: q.x - 0.4, y: q.floor, z: q.z - 2.6 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } }));
    S.addChild(root, S.createNode({ geometry: pad(), position: { x: q.play.x, y: q.floor + 0.009, z: q.play.z } }));
    const balloon = S.createNode({ visible: false });
    S.addChild(root, balloon);
    return { root, solid, balloon };
  };
  const create = ({ models, layout, crew, pilot, hud, game, sound, fireworks }) => {
    const q = layout.shop, ui = { panel: document.getElementById("pier-shop"), list: document.getElementById("pier-shop-list"), info: document.getElementById("pier-shop-info"), show: document.getElementById("pier-shop-fireworks"), close: document.getElementById("pier-shop-close") };
    // What steps aside while the counter is open, as it does for the games: the act button, the hint, the sticks and the map.
    const quiet = [hud.el.act, hud.el.hint, document.getElementById("joy-move"), document.getElementById("joy-look"), document.querySelector(".pier-navigation")], hidden = new Array(quiet.length);
    const rows = [];
    for (const good of GOODS) {
      const li = document.createElement("li"), name = document.createElement("span"), button = document.createElement("button");
      name.textContent = good.name; button.type = "button"; button.dataset.good = good.id; li.append(name, button); ui.list.append(li); rows.push({ good, button });
    }
    let actor = null, worn = "", tickets = -1, owned = -1, bx = 0, bz = 0, placed = false;
    const refresh = () => {
      const p = game.state.pier, balance = game.state.arcade.tickets;
      tickets = balance; owned = p.owned.length;
      for (const row of rows) {
        const g = row.good, has = p.owned.includes(g.id);
        row.button.disabled = !has && (g.streak ? true : balance < g.cost);
        row.button.textContent = has ? (p.balloon === g.id ? "Let go" : "Hold") : g.streak ? `${g.streak}-day streak` : `${g.cost} tickets`;
      }
      ui.show.disabled = balance < FIREWORKS;
      ui.info.textContent = `${balance} tickets · looks and shows only, never an advantage.`;
    };
    const near = () => { const a = crew.player; return !!a && !a.jet && !a.camp.seat && Math.abs(a.root.position.y - a.baseY - q.floor) < 0.2 && Math.hypot(a.root.position.x - q.play.x, a.root.position.z - q.play.z) < 2; };
    const close = () => {
      if (!actor) return;
      if (ui.panel.contains(document.activeElement)) document.activeElement.blur();
      actor = null; ui.panel.hidden = true;
      for (let i = 0; i < quiet.length; i++) quiet[i].hidden = hidden[i];
      pilot.setActive(true); pilot.controls.reset(); crew.steer(0, 0, 0, 0, 0); pilot.showAct();
    };
    const act = () => {
      if (actor) return true;
      if (!near()) return false;
      actor = crew.player; crew.setWeaponTrigger(false); crew.steer(0, 0, 0, 0, 0); pilot.controls.reset(); pilot.setActive(false);
      for (let i = 0; i < quiet.length; i++) { hidden[i] = quiet[i].hidden; quiet[i].hidden = true; }
      refresh(); ui.panel.hidden = false; ui.panel.focus();
      return true;
    };
    const onGood = (e) => {
      const button = e.target.closest("button[data-good]");
      if (!actor || !button || button.disabled) return;
      const good = GOODS.find((g) => g.id === button.dataset.good), p = game.state.pier;
      if (!p.owned.includes(good.id)) {
        if (!game.buyPier(good.id, good.cost)) return;
        game.wearPierBalloon(good.id); sound.cue("coin"); hud.toast(`${good.name}: yours to keep`);
      } else { game.wearPierBalloon(p.balloon === good.id ? "" : good.id); sound.cue("select"); }
      refresh();
    };
    const onShow = () => {
      if (!actor || !game.spendTickets(FIREWORKS)) return;
      fireworks(SHELLS); sound.cue("coin"); hud.toast("Fireworks over the park"); refresh();
    };
    // Space on a focused button is that button's; Escape leaves; nothing else reaches the Ooga while the counter is open.
    const onButtonKey = (e) => { if (e.key === " " && e.target.closest("button")) e.stopPropagation(); };
    const onKey = (e) => {
      if (!actor) return false;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
      else if (e.key !== " " && e.key !== "Tab" && e.key !== "Enter") { e.preventDefault(); e.stopImmediatePropagation(); }
      return true;
    };
    ui.list.addEventListener("click", onGood); ui.show.addEventListener("click", onShow); ui.close.addEventListener("click", close); ui.panel.addEventListener("keydown", onButtonKey);
    const update = (dt) => {
      if (actor) {
        if (crew.player !== actor) close();
        else { crew.steer(0, 0, 0, 0, 0); if (tickets !== game.state.arcade.tickets || owned !== game.state.pier.owned.length) refresh(); }
      }
      // The balloon trails its Ooga a little and leans the way it is being pulled.
      const a = crew.player, id = game.state.pier.balloon, node = models.balloon;
      if (id !== worn) { worn = id; node.geometry = id ? balloons[id]() : null; placed = false; }
      node.visible = !!id && !!a;
      if (!node.visible) return;
      const p = a.root.position, k = placed ? 1 - Math.exp(-dt * 5) : 1;
      bx += (p.x - bx) * k; bz += (p.z - bz) * k; placed = true;
      node.position.x = bx; node.position.z = bz; node.position.y = p.y - a.baseY + 2.75;
      node.rotation.z = Math.max(-0.5, Math.min(0.5, (bx - p.x) * 0.45)); node.rotation.x = Math.max(-0.5, Math.min(0.5, (p.z - bz) * 0.45));
    };
    return {
      act, close, near, onKey, update, unlock: () => {}, setMuted: () => {},
      get busy() { return !!actor; }, get worn() { return worn; },
      dispose: () => { close(); ui.list.removeEventListener("click", onGood); ui.show.removeEventListener("click", onShow); ui.close.removeEventListener("click", close); ui.panel.removeEventListener("keydown", onButtonKey); ui.list.replaceChildren(); models.balloon.visible = false; models.balloon.geometry = null; }
    };
  };
  BL.pierShop = { build, create, GOODS, FIREWORKS };
})();
