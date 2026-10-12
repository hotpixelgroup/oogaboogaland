// Captures the link preview cards: every route in src/js/routes.js at 1200x630, opened from disk through
// `?scene=` and, for a place, the hub's `view=`, saved as cards/<image>.jpg for scripts/site.mjs to deploy. Run after `npm run build`; replace
// any card with hand-made art under the same name. Needs Chrome, as the suite does.
// `npm run cards -- oogapier` captures only the routes named (home is `home`), leaving every other card as it is.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { dispose, launch } from "../test/browser.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {} };
vm.runInNewContext(readFileSync(join(root, "src", "js", "routes.js"), "utf8"), context);
const { list } = context.window.BL.routes;
mkdirSync(join(root, "cards"), { recursive: true });

// Midday on a fixed day with the clock frozen at noon UTC, no rain, no simulator and no position readout,
// so every run frames the same scene and no card shows when or in which timezone it was taken. The Mempool
// cave is its live feed, so its card keeps the feeds on and waits for a real chain snapshot; the Timechain
// Sphere's walls load their feed under `timechain=1`.
process.env.TZ = "UTC";
const page = (when) => `file://${join(root, "oogaboogaland.html")}?debug=1&pos=0&${when}&day=80&rain=0&timechain=1`;
const LIVE = new Set(["mempool"]);
// Ooga Pier is a place of lights: its card is the park after dark, from the park's own camera.
const NIGHT = { oogapier: "pier-park" };
const only = process.argv.slice(2);
const b = await launch({ w: 1200, h: 630 });
try {
  for (const entry of list) {
    if (!entry.image || only.length && !only.includes(entry.path || "home")) continue;
    const view = NIGHT[entry.path] || entry.place;
    await b.open(`${page(NIGHT[entry.path] ? "hour=20.5&time=2030" : "hour=12&time=1200")}&scene=${entry.scene}${view ? `&view=${view}` : ""}${LIVE.has(entry.path) ? "" : "&nosim=1"}`);
    const t0 = Date.now();
    while (!(await b.evaluate(`!!window.__ooga && __ooga.renderedFrames >= 2 && !document.getElementById("curtain")`).catch(() => false))) {
      if (Date.now() - t0 > 30000) throw new Error(`${entry.path || "home"}: the page did not draw`);
      await b.sleep(50);
    }
    await b.evaluate(`new Promise((resolve) => { const t0 = performance.now(); const tick = () => { if (window.BL.scene.tweenCount() === 0 || performance.now() - t0 > 6000) resolve(); else requestAnimationFrame(tick); }; tick(); })`);
    if (LIVE.has(entry.path)) {
      const t1 = Date.now();
      while (!(await b.evaluate(`BL.chain.snapshot.height > 0 && BL.chain.snapshot.count > 0`))) {
        if (Date.now() - t1 > 30000) throw new Error(`${entry.path}: no live chain snapshot`);
        await b.sleep(250);
      }
      // The hub shows the simulator's first donation a few seconds in. Its toast is waited in and out, and its
      // ticker after it, so the card is taken in the quiet before the next one.
      for (const showing of [true, false]) {
        const t2 = Date.now();
        while ((await b.evaluate(`!document.getElementById("toast").hidden`)) !== showing && Date.now() - t2 < 12000) await b.sleep(250);
      }
      await b.sleep(2500);
    }
    // The pier's card is the place itself, lit: its title card is closed, and its hint is given time to go.
    if (NIGHT[entry.path]) { await b.evaluate(`document.querySelector('[data-intro="${entry.scene}"] .game-intro-go').click(); __ooga.hud.hint("", 1); __ooga.advance(2, 1 / 30)`); await b.sleep(1500); }
    await b.sleep(1500);
    // JPEG at 85 keeps a card near a fifth of its PNG with no visible loss at preview sizes.
    const shot = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
    writeFileSync(join(root, "cards", `${entry.image}.jpg`), Buffer.from(shot.result.data, "base64"));
    console.log(`cards/${entry.image}.jpg`);
  }
} finally {
  b.close();
  await dispose();
}
