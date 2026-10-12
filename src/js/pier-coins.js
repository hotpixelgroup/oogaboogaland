// Twenty-one orange coins hidden round the pier, for the visitor who goes looking: at the far corners of the
// decks, out along the sand, on the road under the bridge, afloat off the boardwalk and on the lighthouse rock. Each is found
// once and stays found (a bit each in the save); every one pays a few tickets and the last pays a bonus.
// They are not on the map. All twenty-one share the block coin's geometry, so they are one draw, and a coin is
// only drawn within SHOW of the eye.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, COUNT = 21, PRIZE = 5, ALL = 50, REACH = 1.5, SHOW = 110;
  // x, a height near the floor there, z; `afloat` coins sit on the water instead of a floor.
  const SPOTS = (L, landing) => {
    const top = L.top, sand = BL.pierBeach.LAYOUT.sand, up = BL.pierBeach.LAYOUT.upland;
    return [[-64, top, 90], [-60, top, 60], [-56, top, -42], [-60, top, -100], [-58, top, -132], [2, top, -134], [4.5, top, -205], [-4.5, top, -235], [16, top, -263], [25, top, -262],
      [150, sand, 70], [-180, sand, 60], [75, sand, -30], [-90, sand, -32], [200, sand, -16], [-200, sand, -16], [102, sand, 84], [0, 7, 180], [18, up, 296],
      [30, L.sea, -150, true], [landing.x + 1.6, landing.y, landing.z + 1.2]];
  };
  // Put away, no coin is drawn or found on this page. The suite puts them away so other checks' ticket counts stay exact.
  let held = false;
  const create = ({ root, layout: L, game, hud, sound, fx, floorAt, landing }) => {
    const group = S.createNode(), coins = [], spots = SPOTS(L, landing);
    S.addChild(root, group);
    for (let i = 0; i < COUNT; i++) {
      const [x, hint, z, afloat] = spots[i], y = afloat ? hint : floorAt(x, z, hint + 0.3, 0.3);
      const node = S.createNode({ geometry: BL.pierChain.coin(), position: { x, y: y + 0.95, z }, scale: { x: 0.5, y: 0.5, z: 0.5 }, visible: false });
      S.addChild(group, node); coins.push({ node, x, y, z, found: !!(game.state.pier.coins & 1 << i) });
    }
    let left = 0, away = false;
    for (const c of coins) if (!c.found) left++;
    const take = (i) => {
      const c = coins[i];
      if (!game.findPierCoin(i)) return;
      c.found = true; c.node.visible = false; left--;
      const paid = game.addTickets(PRIZE) + (left ? 0 : game.addTickets(ALL));
      for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; fx.spawnParticle(BL.fx.CONFETTI[k % BL.fx.CONFETTI.length], c.x, c.y + 1, c.z, Math.cos(t) * 1.2, 2.2, Math.sin(t) * 1.2, 0.8, 6, 9.8, c.y); }
      sound.cue(left ? "coin" : "best");
      hud.toast(left ? `Hidden coin ${COUNT - left} of ${COUNT} · +${paid} tickets` : `All ${COUNT} hidden coins found · +${paid} tickets`);
    };
    const update = (time, player, eye) => {
      if (held) { if (!away) { away = true; for (let i = 0; i < COUNT; i++) coins[i].node.visible = false; } return; }
      away = false;
      if (!left) return;
      const px = player ? player.root.position.x : 0, pz = player ? player.root.position.z : 0, feet = player ? player.root.position.y - player.baseY : 0;
      for (let i = 0; i < COUNT; i++) {
        const c = coins[i];
        if (c.found) continue;
        const dx = c.x - eye.x, dz = c.z - eye.z, shown = dx * dx + dz * dz < SHOW * SHOW;
        c.node.visible = shown;
        if (!shown) continue;
        c.node.rotation.y = time * 2.2 + i; c.node.position.y = c.y + 0.95 + Math.sin(time * 2 + i) * 0.1;
        if (player && Math.abs(px - c.x) < REACH && Math.abs(pz - c.z) < REACH && Math.hypot(px - c.x, pz - c.z) < REACH && Math.abs(feet - c.y) < 2.4) take(i);
      }
    };
    return {
      coins, update, take,
      get left() { return left; }, get found() { return COUNT - left; },
      dispose: () => { coins.length = 0; S.removeChild(root, group); }
    };
  };
  BL.pierCoins = { create, hold: (on) => { held = on; }, COUNT, PRIZE, ALL };
})();
