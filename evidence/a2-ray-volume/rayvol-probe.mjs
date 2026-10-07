// Ray-volume caller attribution: every guide query in the covered interval attributed to its
// caller, with ray coherence histograms. Diagnostic only; wallPerformance covered branch verbatim.
// Usage: node untracked/rayvol-probe.mjs control|rayvol
import { launch, dispose } from "../test/browser.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] || "census";
console.error("STEP launch");const b = await launch({ w: 1920, h: 1080, perf: true, motion: true });
try {
  await b.open(`file://${join(root, "src", "index.html")}?debug=1&nosim=1&hour=12&day=80&bananas=1000`);
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const s = await b.evaluate('({ ooga: !!window.__ooga, scene: window.__ooga && __ooga.scene, frames: window.__ooga ? __ooga.renderedFrames : 0 })').catch(() => null);
    if (s && s.ooga && s.scene === "hub" && s.frames > 2) break;
    if (i === 89) throw new Error("page readiness deadline: " + JSON.stringify(s) + " " + b.logs.join(" | "));
  }
  await b.evaluate(`new Promise((resolve) => { const t0 = performance.now(); const tick = () => { if (window.BL.scene.tweenCount() === 0 || performance.now() - t0 > 4000) resolve(); else requestAnimationFrame(tick); }; tick(); })`);
  console.error("STEP ready");
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
  await b.focus(true);
  const variant = process.argv[3] || "";
  if (variant === "raw") await b.evaluate('window.__rkmode = 1');
  if (variant === "nokeys") await b.evaluate('window.__rkmode = 2');
  if (mode === "rayvol") { await b.evaluate(`window.__rayvol=(()=>({raw:window.__rkmode===1,noKeys:window.__rkmode===2,attr:new Float64Array(10*16*12),keysA:new Int32Array((1<<16)*4),keysB:new Int32Array((1<<16)*4),cohA:new Float64Array(8),cohB:new Float64Array(8),frame:0,frames:0,fr:new Float64Array(1024*8)}))()`); console.error("STEP installed"); }
  console.error("STEP benchmark");
  const benchPromise = b.evaluate(`(async () => {
    const B = window.__ooga, actor = B.cavemen.get("portlandhodl");
    B.renderer.setQuality("high");
    if (B.crew.player !== actor) B.pilot.possess(actor);
    B.pilot.navigate({ position: { x: 10, y: B.island.surfaceAt(10, 0), z: 0 }, yaw: 0, pitch: 0.4, dist: 55 });
    let start = null, first = 0;
    const p = actor.root.position, originX = p.x, originZ = p.z, frames = [];
    let previous = 0, held = "", outlined = 0, travel = 0, donated = false, particles = 0;
    const scene = window.BL.scenes.hub, update = scene.update, overlay = scene.overlay, render = B.renderer.render;
    let updateMs = 0, overlayMs = 0, renderMs = 0, wall = 0, worst = null;
    scene.update = function(...args) {
      const t = performance.now();
      try {
        const result = update.apply(this, args);
        Object.assign(B.camera.position, { x: 0, y: 0, z: 10 });
        Object.assign(B.camera.target, { x: p.x, y: p.y + 0.7, z: p.z });
        if (window.__rayvol) {
          const C = window.__rayvol, S = B.headquarters.objectGuides.stats;
          if (C.frames < C.fr.length / 8) {
            const o = C.frames * 8;
            C.fr[o] = C.frame; C.fr[o + 1] = S.triCalls || 0; C.fr[o + 2] = S.boundaryTriangles; C.fr[o + 3] = S.boundaryNodes;
            C.fr[o + 4] = S.boundaryGridQueries; C.fr[o + 5] = updateMs; C.fr[o + 6] = overlayMs;
          }
          C.frames++; C.frame++;
        }
        return result;
      } finally { updateMs = performance.now() - t; }
    };
    scene.overlay = function(...args) { const t = performance.now(); try { return overlay.apply(this, args); } finally { overlayMs = performance.now() - t; } };
    B.renderer.render = function(...args) { const t = performance.now(); try { return render.apply(this, args); } finally { renderMs = performance.now() - t; } };
    const key = (name, down) => window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key: name }));
    try {
      await new Promise((resolve, reject) => {
        const first = B.renderedFrames, began = performance.now();
        const warm = now => {
          if (B.renderedFrames >= first + 2) resolve();
          else if (now - began > 4000) reject(new Error("Performance setup did not draw"));
          else requestAnimationFrame(warm);
        };
        requestAnimationFrame(warm);
      });
      await new Promise(resolve => {
        const tick = now => {
          if (start === null) {
            start = previous = now; first = B.renderedFrames; wall = performance.now();
            held = "d"; key(held, true); requestAnimationFrame(tick); return;
          }
          frames.push(now - previous); previous = now;
          const completed = performance.now(), gap = completed - wall; wall = completed;
          if (!worst || gap > worst.gap) worst = { gap, at: now - start, updateMs, renderMs, overlayMs, donated };
          if (B.headquarters.sightGuides.objectsEnabled) outlined++;
          travel = Math.max(travel, Math.hypot(p.x - originX, p.z - originZ));
          const next = Math.floor((now - start) / 420) % 2 ? "a" : "d";
          if (next !== held) { if (held) key(held, false); key(next, true); held = next; }
          if (!donated && now - start >= 1000) { B.demoTip(1200); donated = true; particles = B.stats().particles; }
          if (now - start < 5000) requestAnimationFrame(tick); else resolve();
        };
        requestAnimationFrame(tick);
      });
    } finally { if (held) key(held, false); scene.update = update; scene.overlay = overlay; B.renderer.render = render; }
    frames.sort((a, b) => a - b);
    return { fps: (B.renderedFrames - first) * 1000 / (previous - start), p95: frames[Math.floor(frames.length * 0.95)], max: frames.at(-1), worst, outlined, samples: frames.length, travel, donated, particles, quality: B.renderer.quality };
  })()`);
  const probeTick = async () => { for (let i = 0; i < 8; i++) { await new Promise(rr => setTimeout(rr, 10000)); try { const st = await Promise.race([b.evaluate('({f: __ooga.renderedFrames, upd: __ooga.headquarters.objectGuides.stats.triCalls || 0})'), new Promise((_, rej) => setTimeout(() => rej(new Error("poll-timeout")), 8000))]); console.error("POLL", JSON.stringify(st)); } catch (e) { console.error("POLL-FAIL", e.message); } } };
  const r = await Promise.race([benchPromise, (async () => { await probeTick(); return new Promise(() => {}); })()]);
  console.error("STEP stats");
  const stats = await b.evaluate(`(() => { const S = __ooga.headquarters.objectGuides.stats; return { triCalls: S.triCalls || 0, boundaryTriangles: S.boundaryTriangles, boundaryNodes: S.boundaryNodes, boundaryGridQueries: S.boundaryGridQueries, boundaryGridBuilds: S.boundaryGridBuilds, boundaryEntries: S.boundaryEntries, scene: __ooga.scene }; })()`);
  console.log("PAGE LOGS:", JSON.stringify(b.logs.slice(0, 8)));
  console.error("STEP dump");
  let census = null;
  if (mode === "rayvol") census = await b.evaluate(`(() => {
    const C = window.__rayvol;
    return { attr: Array.from(C.attr), cohA: Array.from(C.cohA), cohB: Array.from(C.cohB), frames: C.frames, fr: Array.from(C.fr.slice(0, C.frames * 8)) };
  })()`);
  const out = join(root, "untracked", "suite-logs", "census");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, mode === "rayvol" ? "rayvol-raw.json" : "rayvol-control.json"), JSON.stringify({ mode, result: r, stats, census }));
  console.log(JSON.stringify({ mode, fps: r.fps, p95: r.p95, max: r.max, outlined: r.outlined, samples: r.samples, particles: r.particles, quality: r.quality, travel: r.travel, stats, rayvolSummary: census && { frames: census.frames, cohA: census.cohA, cohB: census.cohB } }, null, 1));
} finally { await dispose(); }
