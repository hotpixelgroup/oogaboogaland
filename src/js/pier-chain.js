// The chain is the pier's clock. This module listens to the page's two Bitcoin feeds (mempool.js for blocks as
// they are found, chain.js for the backlog, fees and the chain tip) and turns them into what a visitor can feel:
//  - a new block rings the pier (the scene's `onBlock` hook sets off the bell, the wheel, the lighthouse and the
//    fireworks), starts a ninety-second Block Party in which tickets pay double, and drops one orange coin at a
//    place worked out from the block's height, so every visitor sees it in the same spot with no server;
//  - the time since the last block is kept for the wheel's rim, which fills over ten minutes as a clock;
//  - the paying backlog sets the swell and the arriving transactions set the cloud and the rain;
//  - the fee for the next block picks the colour of the lifeguards' flag.
// Offline, or under ?nosim=1, no block rings and the sea stays calm: nothing here invents a block. Tests and the
// maintainer drive it through `block()` and `set()`. Everything is built once; `update` allocates nothing.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models;
  const PARTY = 90, CLOCK = 600, COIN = 21, BURST = 8, RAIN = 320, HALVING = 210000, PERIOD = 2016;
  // The block that turns a difficulty period, and the one that halves the reward, get a longer party of their own.
  const FESTIVALS = ["Block Party", "Adjustment Party", "Halving Party"], LONGER = [1, 2, 4];
  // Next-block fee in sat/vB at which the flag goes yellow, then red.
  const FEE_BUSY = 8, FEE_CROWDED = 30;
  const AGO = Array.from({ length: 3600 }, (_, i) => `${Math.floor(i / 60)}:${String(i % 60).padStart(2, "0")} ago`);
  const LEFT = Array.from({ length: PARTY * LONGER[2] + 1 }, (_, i) => `${i}s`);
  const coinGeometry = M.cached(() => M.merge(M.turnedX(M.lathe({ profile: [[0, -0.06], [0.55, -0.06], [0.6, 0], [0.55, 0.06], [0, 0.06]], segments: 24, color: "#f7931a", emissive: 0.6 }), Math.PI / 2), BL.factoryModels.smoothBitcoin(0.72, 0.15, "#fff0d3", 0.9)));
  const beamGeometry = M.cached(() => { const g = M.lathe({ profile: [[0.5, 0], [0.16, 26]], segments: 12, color: "#f7931a", emissive: 1 }); g.glass = 0.12; g.glassOpacity = 0.12; g.lightBeam = 60; g.castShadow = false; return g; });
  const dropGeometry = M.cached(() => { const g = M.box({ w: 0.025, h: 0.8, d: 0.025, color: "#cfe4ea", emissive: 0.35 }); g.castShadow = false; return g; });
  // Where a block's coin can land: open spots on the deck, in the park, on the sand and at the tip.
  const spots = (L) => {
    const sand = BL.pierBeach.LAYOUT.sand, top = L.top;
    return [[0, top, 60], [0, top, 20], [3, top, -40], [-3, top, -90], [0, top, -150], [2, top, -210], [-12, top, -264], [12, top, -264], [-30, top, 26], [-22, top, 60], [-40, top, 66],
      [-39, top, -20], [-39, top, -66], [-56, top, -96], [-30, top, -128], [-58, top, -40], [40, sand, 100], [-60, sand, 108], [80, sand, 60], [-120, sand, 40], [120, sand, 20], [0, BL.pierBeach.LAYOUT.upland, 262]];
  };
  const create = ({ root, layout: L, renderer, camera, sound, hud, hooks }) => {
    const places = spots(L), group = S.createNode();
    S.addChild(root, group);
    const coin = S.createNode({ geometry: coinGeometry(), visible: false }), beam = S.createNode({ geometry: beamGeometry(), visible: false });
    S.addChild(group, coin); S.addChild(group, beam);
    const rainNode = S.createNode({ geometry: dropGeometry(), instanceData: new Float32Array(RAIN * 20), instanceCount: 0, instanceVersion: 0 });
    S.addChild(group, rainNode);
    const dx = new Float32Array(RAIN), dz = new Float32Array(RAIN), fall = new Float32Array(RAIN), rand = BL.math.mulberry32(912);
    for (let i = 0; i < RAIN; i++) { dx[i] = (rand() - 0.5) * 44; dz[i] = (rand() - 0.5) * 44; fall[i] = rand() * 20; }
    const ui = { block: document.getElementById("pier-block-height"), age: document.getElementById("pier-block-age"), party: document.getElementById("pier-party"), left: document.getElementById("pier-party-left"), name: document.getElementById("pier-party-name") };
    const state = { height: 0, txCount: 0, since: -1, party: 0, burst: 0, surf: 0, rain: 0, fee: 0, nextFee: 0, blocks: 0, coin: false, coinAt: places[0], collected: 0, live: false, festival: 0 };
    let forced = null, think = 0, shownAge = -1, shownLeft = -1, shownParty = false;
    const text = (el, value) => { if (el.textContent !== value) el.textContent = value; };
    const place = (height) => {
      const at = places[BL.math.fnv1a(`ooga-pier-block-${height}`) % places.length];
      state.coin = true; state.coinAt = at;
      coin.position.x = beam.position.x = at[0]; coin.position.z = beam.position.z = at[2]; coin.position.y = at[1] + 1.3; beam.position.y = at[1];
      coin.visible = beam.visible = true;
    };
    // A block was found. Heights only move forward; a repeat or an older height is ignored.
    const block = (height, txCount = 0, quiet = false) => {
      if (!(height > state.height)) return false;
      state.height = height; state.txCount = txCount;
      text(ui.block, `Block ${height.toLocaleString("en-US")}`);
      // The tip the page already knew on arrival is not news: adopt it quietly.
      if (quiet) return false;
      state.festival = height % HALVING === 0 ? 2 : height % PERIOD === 0 ? 1 : 0;
      state.since = 0; state.party = PARTY * LONGER[state.festival]; state.burst = 1; state.blocks++;
      text(ui.name, FESTIVALS[state.festival]);
      place(height);
      hooks.onBlock(height, state.txCount);
      return true;
    };
    const adopt = (snapshot) => {
      if (!snapshot.height) return;
      if (state.height === 0) {
        block(snapshot.height, snapshot.lastTxCount || 0, true);
        if (snapshot.lastBlockAt) state.since = Math.max(0, (Date.now() - snapshot.lastBlockAt) / 1000);
      } else if (snapshot.height > state.height) block(snapshot.height, snapshot.lastTxCount || 0);
    };
    const onMempool = (event) => { if (event.type === "block") block(event.height, event.txCount || 0); };
    text(ui.block, "No block heard yet"); text(ui.age, ""); ui.party.hidden = true;
    const unsubscribeMempool = BL.mempool.subscribe(onMempool), unsubscribeChain = BL.chain.subscribe(adopt);
    // Pin the weather and the fee by hand (tests, the maintainer); null hands them back to the feed.
    const set = (values) => { forced = values; };
    const read = () => {
      const s = forced || BL.chain.snapshot;
      state.live = forced ? true : BL.chain.snapshot.live;
      state.nextFee = s.nextFee || s.fastestFee || 0;
      const fee = state.nextFee >= FEE_CROWDED ? 2 : state.nextFee >= FEE_BUSY ? 1 : 0;
      if (fee !== state.fee) { state.fee = fee; hooks.onFee(fee); }
      return s;
    };
    let targetSurf = 0, targetRain = 0;
    const update = (dt, time, player) => {
      think -= dt;
      if (think <= 0) { think = 0.5; const s = read(); targetSurf = Math.max(0, Math.min(1, s.soak || 0)); targetRain = Math.max(0, Math.min(1, ((s.gale || 0) - 0.3) / 0.6)); }
      state.surf += (targetSurf - state.surf) * (1 - Math.exp(-dt * 0.25)); state.rain += (targetRain - state.rain) * (1 - Math.exp(-dt * 0.2));
      if (state.since >= 0) state.since += dt;
      state.burst = Math.max(0, state.burst - dt / BURST);
      if (state.party > 0) { state.party = Math.max(0, state.party - dt); if (state.party === 0 && state.coin) { state.coin = false; coin.visible = beam.visible = false; } }
      // The coin turns on its post of light until someone walks into it or the party ends.
      if (state.coin) {
        coin.rotation.y = time * 2.4; coin.position.y = state.coinAt[1] + 1.3 + Math.sin(time * 2.2) * 0.12;
        if (player && !player.camp.seat && Math.hypot(player.root.position.x - state.coinAt[0], player.root.position.z - state.coinAt[2]) < 1.6 && Math.abs(player.root.position.y - player.baseY - state.coinAt[1]) < 2.2) {
          state.coin = false; state.collected++; coin.visible = beam.visible = false;
          hooks.onCoin(COIN);
        }
      }
      // Rain: a fixed field of streaks carried with the eye, as many as the storm and the tier allow.
      const drops = state.rain <= 0.01 || renderer.kind === "canvas2d" ? 0 : Math.floor(RAIN * state.rain * (renderer.quality === "low" ? 0.35 : renderer.quality === "medium" ? 0.65 : 1));
      if (drops || rainNode.instanceCount) {
        const data = rainNode.instanceData, ex = camera.position.x, ey = camera.position.y, ez = camera.position.z;
        for (let i = 0; i < drops; i++) {
          const o = i * 20, y = ey + 12 - ((time * 19 + fall[i]) % 20);
          data[o] = 1; data[o + 1] = 0; data[o + 2] = 0; data[o + 3] = 0; data[o + 4] = 0.07; data[o + 5] = 1; data[o + 6] = 0; data[o + 7] = 0;
          data[o + 8] = 0; data[o + 9] = 0; data[o + 10] = 1; data[o + 11] = 0; data[o + 12] = ex + dx[i]; data[o + 13] = y; data[o + 14] = ez + dz[i]; data[o + 15] = 1;
          data[o + 16] = 1; data[o + 17] = 0; data[o + 18] = 0; data[o + 19] = 0;
        }
        rainNode.instanceCount = drops; rainNode.instanceVersion++;
      }
      // The pill and the party banner change once a second at most.
      const age = state.since < 0 ? -1 : Math.min(AGO.length - 1, Math.floor(state.since));
      if (age !== shownAge) { shownAge = age; text(ui.age, age < 0 ? "" : AGO[age]); }
      const party = state.party > 0;
      if (party !== shownParty) { shownParty = party; ui.party.hidden = !party; }
      const left = Math.ceil(state.party);
      if (party && left !== shownLeft) { shownLeft = left; text(ui.left, LEFT[left]); }
    };
    adopt(BL.chain.snapshot);
    return {
      state, block, set, update, places,
      // Tickets pay double while the party lasts.
      get multiplier() { return state.party > 0 ? 2 : 1; },
      // The wheel's rim as a clock: the share of ten minutes since the last block, or -1 with no block to count from.
      get fill() { return state.since < 0 ? -1 : Math.min(1, state.since / CLOCK); },
      get halving() { return state.height ? Math.ceil((state.height + 1) / HALVING) * HALVING - state.height : 0; },
      liveGeometry: (set) => { set.add(coinGeometry()).add(beamGeometry()); },
      dispose: () => { unsubscribeMempool(); unsubscribeChain(); ui.party.hidden = true; text(ui.block, ""); text(ui.age, ""); S.removeChild(root, group); }
    };
  };
  BL.pierChain = { create, coin: coinGeometry, FESTIVALS, PERIOD, PARTY, CLOCK, COIN, FEE_BUSY, FEE_CROWDED, HALVING };
})();
