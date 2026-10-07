# A1 — bounded per-rebuild live overflow-cache census (covered-donation interval)

Head: `839934c` (diagnostic only; temporary patch applied, measured, reverted — clone clean).
Workload: the **original, unchanged** `wall movement performance: moving behind cave walls during a
donation` covered branch, replicated verbatim from `test/run.mjs` (1920×1080 @2x, `perf: true,
motion: true`, quality seeded high, camera pinned behind island rock, `demoTip(1200)` donation at
1 s, 5 s held-movement window). Raw data: `census-raw.json` (instrumented), `control-run.json`.

## Method and identity proof

Temporary additive instrumentation in `src/js/object-guides.js` (reverted after measurement):
per-rebuild records for every `indexTriangles` build (time, triangles, capacity, references,
aborted), a shadow demand-fill simulation of the rejected exact-overflow-index design
("demand-filled complete fine screen-cell lists reuse existing bounded typed index buffers;
incomplete/full-capacity cells retain exact BVH fallback; reprojection resets caches" — modelled as
one shared `count*16` index buffer per entry, cells demand-filled in query order, rollback on
overflow), per-cell query-reuse histograms, real BVH-walk cost capture (node visits + triangle
tests), and one always-on triangle-call counter. All state lives in probe-installed typed arrays
(`window.__census`, ~5 MB preallocated); nothing writes query-path state.

- **Outcome identity: 512/512 sampled overflow queries answered hit/miss identically by the
  completed-cell list and the real BVH walk (0 mismatches).**
- Benchmark class preserved with instrumentation: fps 29.3, p95 50 ms, quality low, 26 particles,
  147 outlined samples — control run: fps 30.4, p95 50 ms, low, 26 particles, 153 outlined
  (instrumentation frame impact below). `uncensused` 0, `staleQueries` 0.
- Counter cross-check vs the PR's own evidence: my 56.9M triangle calls / 153 covered frames and
  67.5% box rejects match `ownerBranchCensus` (57.5M / 140 frames, 66.83%); my 17.3M overflow-slice
  node visits match `ownerFallbackCensus`'s 14.5M "overflow BVH calls" scale and its two dominant
  entries (724-triangle and 132-triangle meshes).

## Headline numbers

**1. Construction cost vs frame budget.** Real grid builds: 147.7 ms over the 5 s interval
(5,182 rebuilds; 0.96 ms/frame ≈ 1.9% of the 50 ms p95 budget). Candidate demand-fill construction:
136.2 ms measured (0.89 ms/frame ≈ 1.8%) — but the fill *scan volume* is the real cost:
**60.9M triangle span visits** (≈398K/frame, 327 scans per filled cell) against a query-phase
saving of only ≈9.9 primitive tests per query. Construction wall time is not the blocker;
construction *work* is ~7× what it saves.

**2. Completed-cell reuse.** 100% of live-filled cells completed (184,204/184,204; zero capacity
fallback). Reuse per filled cell per rebuild: **3.86 average** (27.2% queried once, 22.0% twice,
29.1% 3–5×, 19.5% 6–20×, 2.2% 21+×). Break-even against construction is ≈33 queries/cell —
off by ~8.6×. The synthetic proof's 173 complete / 2,899 capacity-fallback cells were full-screen
projection scans, not the live query pattern: live demand is ~144 cells/rebuild against an
11,584–30,080-reference buffer, so the buffer never fills.

**3. Capacity-fallback share.** **0% live.** (Per-cell-cap variants evaluated offline from the fill
log: cap 8 → 56.1% fallback, cap 16 → 24.2%, cap 32 → 7.8%, cap 64 → 1.0%, cap 128 → 0% — the
shared-buffer design sits at the 0% end.)

**4. Triangle-call delta.** Overflow slice (censused overflowed entries): real BVH walk
≈ 17.27M node box tests + 2.24M pass-box triangle tests (≈6.9M calls incl. box rejects, estimated
at the global 2.96 calls/pass ratio — *estimate, per-walk reject ratio not separately recorded*)
≈ 24.2M primitive tests for 805K queries (29.7/query). Candidate: 15.73M completed-list tests
(19.8/query — the flat lists are ~33% cheaper per query) **plus 60.9M fill scans** =
**76.7M primitive ops ≈ 3.2× the real cost**. Even at infinite reuse the family's ceiling is the
query-phase factor (0.65×) over the ~42%-of-calls overflow slice ≈ 14% of total triangle calls.

## Distributions

- Rebuilds: 5,182 total (3,892 successful grid builds, 1,290 overflow aborts, 0 degenerate);
  13 entries overflowed, led by the 724-triangle mesh (204,910 queries / 101 rebuilds, 23.6M fill
  scans) and a 1,880-triangle mesh (49,987 queries / 25 rebuilds, 22.3M fill scans).
- Abort ratio: references/capacity mean 1.31, p50 1.27, max 1.82.
- Per-cell list sizes (186,333 fills): mean 14.0, p50 10, p90 29, p99 64, max 106.
- Fill time (wall): total 136.2 ms, p99 per fill below timer granularity, max 0.1 ms — lumpy but
  small; the volume, not the wall time, is what a real implementation would pay.
- Total query workload: 372K triangle calls/frame (67.5% box rejects), 26.5K active-grid
  queries/frame, 5.6K overflow-fallback queries/frame, 114K BVH node tests/frame.

## Interpretation — the census kills the exact-overflow-index family

It is not saturation (0% live fallback), not construction wall time (~1 ms/frame each way), and not
reuse alone: the slice's real BVH fallback is already effective (22 node tests + ~9 triangle tests
per query), so the candidate's query-phase win is small (0.65×) and its demand-fill construction
(60.9M scans) costs ~7× that win at the live reuse of 3.86 queries/cell. The family addresses ~42%
of triangle calls and makes them 3.2× worse; the remaining ~57% (active-grid path, ~213K
calls/frame) is untouched by it. **No native-FPS trial is justified.**

Where the covered-frame CPU actually remains, per the counts: ~372K boundary-triangle calls/frame
total, decomposing as ~57% active-grid cell-list scans (~14–20 triangles per query at 26.5K
queries/frame — grid resolution and list length), ~42% overflow BVH walks (114K node tests/frame,
dominated by the 724- and 132-triangle meshes), <1% no-grid small entries. The query *volume* itself
(union rays for contour/outline marching at ~30 ms overlay per frame) is the dominant remaining
work — any next candidate should attack ray volume or active-grid list length, not overflow indexing.

## Caveats

- Instrumentation changes elapsed performance (operation-count diagnostic): instrumented fps 29.3 vs
  control 30.4 (~1 fps ≈ 3.6% frame impact); no speedup or branch CPU-time inference from these runs.
- The 2.96 calls/pass-box ratio applied to fallback-walk triangle calls is an estimate.
- The candidate's exact buffer policy was reconstructed from the evidence text (shared bounded
  buffer); per-cell-cap variants above bound the design space.
- Fill-wall-time measurements are near timer granularity; treat per-fill times as approximate.
- One serial pair of runs on this machine; absolute ms values are machine-specific.
