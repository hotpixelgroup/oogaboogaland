// The pier's hall of fame: a board by the prize counter that pages through the six games, three names each.
// Offline it works as the arcade's does: each roster Ooga's score is hashed from their name, the game and the
// season, so the names are the same on every page with no server, and the visitor's own best takes its place
// among them when it earns one. A season is one difficulty period of the chain (2,016 blocks): when the period
// turns, the visitor's season bests start again and the rivals' scores are drawn afresh. With no chain reading
// there is no season and the board shows all-time bests.
// On the Cloudflare site the board is also the real thing: signed-in players' season bests come from the Worker
// (`BL.net.pierBoard`, asked when the eye comes near and at most once a minute) and take their places among the
// roster's; the visitor's own row stays the one from their save. The same answer counts the lanterns: every
// player who has checked a block at the lighthouse lights one on the sand for good, so the shore brightens as
// the pier's community grows. Offline the only lantern is the visitor's own.
// The board is the jumbotron's font merged into glowing quads (poolModels.panelFrom), repainted only when its
// page turns or a score on it changes, and only while the eye is near.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models;
  const W = 150, H = 48, PX = 0.03, NEAR = 80, TURN = 6, PERIOD = 2016, ASK = 60, LANTERNS = 48, CLEAR = [9, 20, 24], BACK = "#091418", ORANGE = "#f7931a", CREAM = "#fff0d3", DIM = "#8fb0b4";
  // title, the save's key, and the range and step the roster's scores are drawn from
  const GAMES = [["HASH FISHING", "fishing", 15, 50, 5], ["BLOCK BUILDER", "builder", 30, 66, 1], ["MEMPOOL MAYHEM", "mayhem", 12, 36, 6], ["DOUBLE-SPEND WHACK", "whack", 30, 84, 1], ["SEED PHRASE MATCH", "seedMatch", 6, 12, 1], ["LIGHTNING VOLLEY", "volley", 4, 13, 1]];
  const plain = (name) => name.toUpperCase().replace(/[^A-Z0-9 ._-]/g, "").slice(0, 13) || "OOGA";
  // The three best at one game: [name, score, is the visitor], best first. Three roster Oogas hold the board each
  // season, picked and scored by a hash of name, game and season: the champion near the top of the range and the
  // others a step or two apart, so the places are distinct. `mine` is the visitor's score, placed where it earns.
  // `online` is the Worker's rows for the game, [name, score] each, when there are any.
  const top = (kind, lo, hi, step, season, names, player, mine, online = null) => {
    const hash = (n) => BL.math.fnv1a(`${n}|${kind}|${season}`), rivals = names.filter((n) => n !== player).sort((a, b) => hash(b) - hash(a) || (a < b ? -1 : 1)).slice(0, 3), rows = [];
    let score = hi + step;
    for (const n of rivals) { score = Math.max(lo, score - step * (1 + hash(n) % 2)); rows.push([plain(n), score, false]); }
    if (online) for (const row of online) if (typeof row[0] === "string" && Number.isInteger(row[1]) && row[1] > 0) rows.push([plain(row[0]), row[1], false]);
    if (player && mine > 0) rows.push([plain(player), mine, true]);
    // Highest first; the visitor wins a tie.
    rows.sort((a, b) => b[1] - a[1] || (b[2] ? 1 : 0) - (a[2] ? 1 : 0));
    return rows.slice(0, 3);
  };
  const frame = M.cached(() => {
    const parts = [M.moved(M.bevelBox({ w: W * PX + 0.3, h: H * PX + 0.3, d: 0.14, color: "#16323a" }), 0, H * PX / 2, -0.09), M.moved(M.bevelBox({ w: W * PX + 0.5, h: 0.16, d: 0.3, color: "#f7931a" }), 0, H * PX + 0.26, -0.09)];
    for (const x of [-W * PX / 2 + 0.25, W * PX / 2 - 0.25]) parts.push(M.beam(x, -0.15, -0.09, x, -1.9, -0.09, 0.1, "#d7d7c3"));
    return M.merge(...parts);
  });
  const lantern = M.cached(() => { const g = M.merge(M.box({ w: 0.3, h: 0.36, d: 0.3, color: "#ffd98a", emissive: 1 }), M.moved(M.box({ w: 0.38, h: 0.06, d: 0.38, color: "#3a2a1c" }), 0, 0.21, 0), M.moved(M.box({ w: 0.38, h: 0.06, d: 0.38, color: "#3a2a1c" }), 0, -0.21, 0)); g.castShadow = false; return g; });
  const create = ({ root, layout: L, renderer, game, chain, player }) => {
    const q = L.fame, post = S.createNode({ geometry: frame(), position: { x: q.x, y: L.top + 1.9, z: q.z }, rotation: { x: 0, y: q.ry, z: 0 } }), face = S.createNode({ glow: 1.5 });
    S.addChild(root, post); S.addChild(post, face); face.position.x = -W * PX / 2;
    const canvas = document.createElement("canvas"), ink = canvas.getContext("2d", { willReadFrequently: true }), T = BL.jumbotron.text;
    canvas.width = W; canvas.height = H;
    const names = BL.contributors.activeRoster.map((c) => c.name);
    let page = -1, age = TURN, printed = "", wait = 0, shownPage = -1, shownSeason = -1, shownMine = -1;
    // The Worker's last answer and the season it was for; `version` moves when one lands, to repaint.
    let online = null, onlineSeason = -1, asked = -ASK, clock = 0, version = 0, shownVersion = 0, asking = false, gone = false;
    // Lanterns along the dry sand either side of the pier, lit one for each player who has checked a block.
    const sand = BL.pierBeach.LAYOUT.sand, lamps = [];
    for (let i = 0; i < LANTERNS; i++) { const node = S.createNode({ geometry: lantern(), position: { x: (i % 2 ? -1 : 1) * (14 + (i >> 1) * 5), y: sand + 0.24, z: -30 - (i % 3) }, visible: false, glow: 0.4 }); S.addChild(root, node); lamps.push(node); }
    let lit = -1;
    const light = () => { const n = Math.min(LANTERNS, Math.max(online ? online.lanterns | 0 : 0, game.state.pier.lantern ? 1 : 0)); if (n === lit) return; lit = n; for (let i = 0; i < LANTERNS; i++) lamps[i].visible = i < n; };
    const ask = (s) => {
      asked = clock; asking = true;
      BL.net.pierBoard(s).then((answer) => { asking = false; if (gone || !answer) return; online = answer; onlineSeason = s; version++; });
    };
    const season = () => chain.state.height ? Math.floor(chain.state.height / PERIOD) : 0;
    // The visitor's score for a page: this season's best while the chain names a season, else the all-time best.
    const mineOf = (index, s) => { const kind = GAMES[index][1], kept = game.state.pier.season; return s ? (kept.id === s ? kept[kind] : 0) : game.state.pier[kind]; };
    const rows = (index) => { const [, kind, lo, hi, step] = GAMES[index], s = season(); return top(kind, lo, hi, step, s, names, player, mineOf(index, s), online && onlineSeason === s && Array.isArray(online.boards[kind]) ? online.boards[kind].filter((row) => !self() || row[0] !== self()) : null); };
    // The signed-in visitor's own name on the Worker's board: their row there is the flagged one from their save.
    const self = () => BL.net.state.me ? BL.net.state.me.display || BL.net.state.me.login : "";
    const paint = (index, list, s) => {
      ink.fillStyle = BACK; ink.fillRect(0, 0, W, H);
      const head = s ? `HALL OF FAME · SEASON ${s}` : "HALL OF FAME", title = GAMES[index][0];
      T.drawText(ink, head, Math.floor((W - T.measureText(head, 1)) / 2), 2, ORANGE, 1);
      T.drawText(ink, title, Math.floor((W - T.measureText(title, 1)) / 2), 12, CREAM, 1);
      for (let i = 0; i < list.length; i++) {
        const [name, score, mine] = list[i], points = String(score), y = 22 + i * 9, color = mine ? ORANGE : DIM;
        T.drawText(ink, `${i + 1} ${name}`, 4, y, color, 1); T.drawText(ink, points, W - 4 - T.measureText(points, 1), y, color, 1);
      }
      if (face.geometry) renderer.releaseGeometry(face.geometry);
      const g = BL.poolModels.panelFrom(ink, W, H, PX, PX, CLEAR); g.castShadow = false; face.geometry = g;
    };
    const update = (dt, eye, night = 0) => {
      age += dt; wait -= dt; clock += dt;
      if (wait > 0) return;
      wait = 0.5;
      light();
      for (let i = 0; i < lit; i++) lamps[i].glow = 0.35 + night * 1.6;
      if (Math.hypot(eye.x - q.x, eye.z - q.z) > NEAR) return;
      if (BL.net.state.backend && !asking && (clock - asked >= ASK || onlineSeason !== season() && clock - asked >= 5)) ask(season());
      if (age >= TURN || page < 0) { age = 0; page = (page + 1) % GAMES.length; }
      const s = season(), mine = mineOf(page, s);
      if (page === shownPage && s === shownSeason && mine === shownMine && version === shownVersion) return;
      shownPage = page; shownSeason = s; shownMine = mine; shownVersion = version;
      const list = rows(page);
      printed = `${GAMES[page][0]}|${s}|${list.map((r) => `${r[0]}:${r[1]}${r[2] ? "*" : ""}`).join("|")}`;
      paint(page, list, s);
    };
    return {
      update, rows, season,
      get lanterns() { return lit; },
      // Hand the board an answer as the Worker would give it (the maintainer, the suite).
      answer: (data, s = season()) => { online = data; onlineSeason = s; version++; },
      get page() { return page; }, get printed() { return printed; },
      // Turn straight to one game's page (the maintainer, the suite).
      show: (index) => { page = index; age = 0; wait = 0; shownPage = -1; },
      liveGeometry: (set) => { if (face.geometry) set.add(face.geometry); },
      dispose: () => { gone = true; if (face.geometry) renderer.releaseGeometry(face.geometry); face.geometry = null; S.removeChild(root, post); for (const node of lamps) S.removeChild(root, node); lamps.length = 0; }
    };
  };
  BL.pierFame = { create, top, GAMES, PERIOD };
})();
