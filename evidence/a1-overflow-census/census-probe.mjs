// A1 overflow-cache census: bounded per-rebuild demand-fill measurement during the original
// covered-donation interval. Diagnostic only; runs the wallPerformance covered branch verbatim.
// Usage: node untracked/census-probe.mjs control|census
import { launch, dispose } from "../test/browser.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] || "census";
const b = await launch({ w: 1920, h: 1080, perf: true, motion: true });
try {
  await b.open(`file://${join(root, "src", "index.html")}?debug=1&nosim=1&hour=12&day=80&bananas=1000`);
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const s = await b.evaluate('({ ooga: !!window.__ooga, scene: window.__ooga && __ooga.scene, frames: window.__ooga ? __ooga.renderedFrames : 0 })').catch(() => null);
    if (s && s.ooga && s.scene === "hub" && s.frames > 2) break;
    if (i === 89) throw new Error("page readiness deadline: " + JSON.stringify(s) + " " + b.logs.join(" | "));
  }
  await b.evaluate(`new Promise((resolve) => { const t0 = performance.now(); const tick = () => { if (window.BL.scene.tweenCount() === 0 || performance.now() - t0 > 4000) resolve(); else requestAnimationFrame(tick); }; tick(); })`);
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
  await b.focus(true);
  await b.evaluate('new Promise(r=>{const t=()=>window.__ooga&&__ooga.scene==="hub"?r():setTimeout(t,100);t()})');
  if (mode === "census") await b.evaluate(`window.__census=(()=>{
    const RB_FIELDS=24,FL_FIELDS=7,CELLS=1024,MAXTRI=4096;
    const slot=()=>({state:new Uint8Array(CELLS),qcount:new Uint32Array(CELLS),cellCount:new Uint32Array(CELLS),listOff:new Uint32Array(CELLS),listLen:new Uint32Array(CELLS),spans:new Uint8Array(MAXTRI*4),list:new Uint32Array(MAXTRI*16),pending:-1,bufUsed:0,queries:0,completeQueries:0,fallbackQueries:0,completeCells:0,fallbackCells:0,candTests:0,candNodes:0,candTriangles:0,fillScans:0,fillMs:0});
    return {RB_FIELDS,FL_FIELDS,maxTriangles:MAXTRI,frame:0,rebuilds:0,rb:new Float64Array(8192*RB_FIELDS),fills:0,fl:new Float64Array(262144*FL_FIELDS),frames:0,fr:new Float64Array(1024*10),slotOf:new Map(),slots:Array.from({length:16},slot),fallbackQueries:0,fallbackNodes:0,fallbackTriangles:0,noGridQueries:0,noGridNodes:0,noGridTriangles:0,staleQueries:0,uncensused:0,equalityLeft:512,equalityMismatches:0};
  })()`);
  const r = await b.evaluate(`(async () => {
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
        if (window.__census) {
          const C = window.__census, S = B.headquarters.objectGuides.stats;
          if (C.frames < C.fr.length / 10) {
            const o = C.frames * 10;
            C.fr[o] = C.frame; C.fr[o + 1] = S.censusTriCalls || 0; C.fr[o + 2] = S.boundaryTriangles; C.fr[o + 3] = S.boundaryNodes;
            C.fr[o + 4] = S.boundaryGridQueries; C.fr[o + 5] = C.rebuilds; C.fr[o + 6] = C.fills; C.fr[o + 7] = updateMs;
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
  const stats = await b.evaluate(`(() => { const S = __ooga.headquarters.objectGuides.stats; return { censusTriCalls: S.censusTriCalls || 0, boundaryTriangles: S.boundaryTriangles, boundaryNodes: S.boundaryNodes, boundaryGridQueries: S.boundaryGridQueries, boundaryGridBuilds: S.boundaryGridBuilds, boundaryEntries: S.boundaryEntries }; })()`);
  let census = null;
  if (mode === "census") census = await b.evaluate(`(() => {
    const C = window.__census;
    // Flush any slot still holding an unflushed rebuild: its query accumulators stay in the slot; export slot totals separately.
    const slots = C.slots.map((S, i) => ({ slot: i, used: C.slotOf.size > i, queries: S.queries, completeQueries: S.completeQueries, fallbackQueries: S.fallbackQueries, completeCells: S.completeCells, fallbackCells: S.fallbackCells, candTests: S.candTests, candNodes: S.candNodes, candTriangles: S.candTriangles, fillScans: S.fillScans, fillMs: S.fillMs, pending: S.pending }));
    return {
      rebuilds: Math.min(C.rebuilds, C.rb.length / C.RB_FIELDS), rebuildsTotal: C.rebuilds, rb: Array.from(C.rb.slice(0, Math.min(C.rebuilds, C.rb.length / C.RB_FIELDS) * C.RB_FIELDS)),
      fills: Math.min(C.fills, C.fl.length / C.FL_FIELDS), fillsTotal: C.fills, fl: Array.from(C.fl.slice(0, Math.min(C.fills, C.fl.length / C.FL_FIELDS) * C.FL_FIELDS)),
      frames: C.frames, fr: Array.from(C.fr.slice(0, C.frames * 10)),
      slots,
      fallbackQueries: C.fallbackQueries, fallbackNodes: C.fallbackNodes, fallbackTriangles: C.fallbackTriangles,
      noGridQueries: C.noGridQueries, noGridNodes: C.noGridNodes, noGridTriangles: C.noGridTriangles,
      staleQueries: C.staleQueries, uncensused: C.uncensused, equalitySampled: 512 - C.equalityLeft, equalityMismatches: C.equalityMismatches,
    };
  })()`);
  const out = join(root, "untracked", "suite-logs", "census");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, mode === "census" ? "census-raw.json" : "control-run.json"), JSON.stringify({ mode, result: r, stats, census }));
  console.log(JSON.stringify({ mode, fps: r.fps, p95: r.p95, max: r.max, outlined: r.outlined, samples: r.samples, particles: r.particles, quality: r.quality, travel: r.travel, stats, censusSummary: census && { rebuilds: census.rebuilds, fills: census.fills, frames: census.frames, fallbackQueries: census.fallbackQueries, fallbackTriangles: census.fallbackTriangles, equalitySampled: census.equalitySampled, equalityMismatches: census.equalityMismatches, staleQueries: census.staleQueries, uncensused: census.uncensused } }, null, 1));
} finally { await dispose(); }
