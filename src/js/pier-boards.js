// Four small boards that read the chain out on the pier, set in the jumbotron's 5x7 font and merged into glowing
// quads as the Mempool chamber's paintings are (poolModels.panelFrom): the newest block and sats to the dollar by
// the arch, the next block's fee at the snack bar, the difficulty period under the wheel, and the halving by the
// Route 66 sign. A board is repainted only when what it prints changes; with no reading it says so.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models;
  const W = 132, H = 26, PX = 0.034, CLEAR = [9, 20, 24], BACK = "#091418", ORANGE = "#f7931a", CREAM = "#fff0d3", DIM = "#6f8f93", REFRESH = 2;
  // A dark backing, on two posts where the board stands on the ground.
  const backs = [false, true].map((posts) => M.cached(() => {
    const parts = [M.moved(M.bevelBox({ w: W * PX + 0.3, h: H * PX + 0.3, d: 0.12, color: "#16323a" }), 0, H * PX / 2, -0.08)];
    if (posts) for (const x of [-W * PX / 2 + 0.2, W * PX / 2 - 0.2]) parts.push(M.beam(x, -0.15, -0.08, x, -2.6, -0.08, 0.09, "#d7d7c3"));
    return M.merge(...parts);
  }));
  const number = (n) => Math.round(n).toLocaleString("en-US");
  // Each board: where it stands, which way it faces, and its two lines from the chain's readings.
  const BOARDS = (L) => {
    const up = BL.pierBeach.LAYOUT.upland;
    return [
      { id: "tip", x: 6.6, y: up + 2.6, z: 276.4, ry: -0.35, posts: true, lines: (c, s) => [c.state.height ? `BLOCK ${number(c.state.height)}` : "NO BLOCK HEARD", s.priceUsd > 0 ? `${number(1e8 / s.priceUsd)} SATS / USD` : "SATS/USD NO READING"] },
      { id: "fee", x: L.carnival[0].x + L.carnival[0].w / 2 + 0.25, y: L.top + L.carnival[0].h + 0.45, z: L.carnival[0].z, ry: Math.PI / 2, lines: (c) => ["NEXT BLOCK FEE", c.state.nextFee > 0 ? `${number(c.state.nextFee)} SAT/VB · ${["CALM", "BUSY", "CROWDED"][c.state.fee]}` : "NO READING"] },
      { id: "epoch", x: L.wheel.x + 5.2, y: L.top + 2.6, z: L.wheel.z + 5.4, ry: 0.5, posts: true, lines: (c, s) => [s.progressPercent > 0 ? `DIFFICULTY PERIOD ${Math.round(s.progressPercent)}%` : "DIFFICULTY PERIOD", s.remainingBlocks > 0 ? `${number(s.remainingBlocks)} BLOCKS LEFT` : "NO READING"] },
      { id: "halving", x: L.route66.x - 3.4, y: L.top + 2.6, z: L.route66.z + 0.2, ry: 0, posts: true, lines: (c) => ["NEXT HALVING IN", c.halving ? `${number(c.halving)} BLOCKS` : "NO READING"] }
    ];
  };
  const create = ({ root, layout: L, renderer, chain }) => {
    const group = S.createNode(), boards = [], canvas = document.createElement("canvas"), ink = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = W; canvas.height = H;
    S.addChild(root, group);
    const T = BL.jumbotron.text;
    for (const def of BOARDS(L)) {
      const frame = S.createNode({ geometry: backs[def.posts ? 1 : 0](), position: { x: def.x, y: def.y, z: def.z }, rotation: { x: 0, y: def.ry, z: 0 } }), face = S.createNode({ glow: 1.6 });
      S.addChild(group, frame); S.addChild(frame, face); face.position.x = -W * PX / 2;
      boards.push({ def, frame, face, printed: "" });
    }
    const paint = (board, lines) => {
      ink.fillStyle = BACK; ink.fillRect(0, 0, W, H);
      for (let i = 0; i < 2; i++) {
        const line = T.fitText(lines[i], W - 4, 1), dim = lines[i].includes("NO ");
        T.drawText(ink, line, Math.floor((W - T.measureText(line, 1)) / 2), 3 + i * 11, dim ? DIM : i ? CREAM : ORANGE, 1);
      }
      if (board.face.geometry) renderer.releaseGeometry(board.face.geometry);
      const g = BL.poolModels.panelFrom(ink, W, H, PX, PX, CLEAR); g.castShadow = false;
      board.face.geometry = g;
    };
    let wait = 0;
    const update = (dt) => {
      wait -= dt;
      if (wait > 0) return;
      wait = REFRESH;
      const snapshot = BL.chain.snapshot;
      for (let i = 0; i < boards.length; i++) {
        const board = boards[i], lines = board.def.lines(chain, snapshot), key = lines[0] + "|" + lines[1];
        if (key === board.printed) continue;
        board.printed = key; paint(board, lines);
      }
    };
    update(0);
    return {
      boards, update,
      text: (id) => boards.find((b) => b.def.id === id).printed,
      refresh: () => { wait = 0; update(0); },
      liveGeometry: (set) => { for (const b of boards) if (b.face.geometry) set.add(b.face.geometry); },
      dispose: () => { for (const b of boards) { if (b.face.geometry) renderer.releaseGeometry(b.face.geometry); b.face.geometry = null; } boards.length = 0; S.removeChild(root, group); }
    };
  };
  BL.pierBoards = { create };
})();
