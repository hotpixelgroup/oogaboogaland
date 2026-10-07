# Ray-volume attribution census — covered-donation interval (A1 follow-up)

Head: `839934c` (diagnostic only; temporary instrumentation reverted — clone clean).
Workload: the original `wall movement performance: moving behind cave walls during a donation`
covered branch, verbatim (1920×1080 @2x, camera pinned behind rock, `demoTip(1200)` at 1 s, 5 s
held-movement window). Raw data: `rayvol-raw.json` (instrumented), `rayvol-control.json` (control),
probe `rayvol-probe.mjs`. Two instrumented passes were taken; both agree within noise — the second
pass's raw file is archived (first pass's headline values noted where they differ).

## Method and identity

Temporary patches (reverted): caller tags on every public object-guides query (metered
`ownerBoundaryAt`, `cameraClear`, `perceptionClear`, `perceived`, `concealed`, `distance`, `inView`,
`ownerClear`, `actorVisible`, `cameraBoundsState`, `collect`), tags set by sight-guides
(contour-structure=1, contour-objects=2, perceive=3), scene-hub (crew-visibility=4,
rock-outlines=5, pile-guides=6, cameraCover=7), terrain-ray metering on `guideSegmentClear`, and a
bounded quantized-ray coherence table (exact 1e-2 pos / 1e-3 dir and coarse 2e-1 pos / 2e-2 dir,
2^16 slots each, 8-probe open addressing). All state lives in probe-installed typed arrays; query
results are untouched (metering is read-only deltas of the existing stats counters + wall time).

- Query-path identity: instrumentation records only; no query semantics touched (the A1 census
  proved the underlying boundary outcomes byte-stable; here the benchmark class is preserved:
  26 particles, low quality, outlined ≈100% of samples, same evidence class as the unpatched
  final/01-perf run).
- Frame impact of instrumentation (measured, machine was loaded): control 24.9 fps vs instrumented
  15.3–16.1 fps — metering every call plus hashing ~52K rays/frame costs ~35–40% elapsed time.
  **All wall-time figures below are from the instrumented pass and include this overhead; ratios and
  shares are the evidence, absolute ms are machine-specific. No FPS claims from VM/counter math.**

## 1. Caller attribution (5 s covered interval, 80 frames)

| Caller | Query fn | Calls | Wall ms | triCalls | % of triCalls | Hit rate |
|---|---|---|---|---|---|---|
| **contour-objects** (sight-guides `filter(objects,1)` march) | `ownerBoundaryAt` | 4,150,577 | 1,918.7 | 42,343,819 | **~100%** | 19.2% |
| — (per-frame registry/projection) | `collect` | 82 | 235.1 | 0 | 0% | — |
| rock-outlines (`rockGuides.updateSurfaces`) | `perceptionClear` | 14,066 | 30.2 | 0 | 0% | 16.9% |
| perceive (`perceiveObjects`) | `perceived` / `inView` / terrain clears | 3,815 | 36.8 | 0 | 0% | 68–99% |
| crew-visibility | `actorVisible` | 104 | 6.8 | 0 | 0% | 100% |
| contour-structure, pile-guides, cameraCover, cameraBoundsState, perceived-adjacent | — | 0 | 0 | 0 | 0% | — |

Per frame: **51.9K `ownerBoundaryAt` calls, 529K triangle calls, ~24 ms wall** — the union-ray
volume from the object-contour march is the entire boundary workload. `collect` costs ~2.9 ms/frame
(projection/rebuild, consistent with A1's 0.96 ms/frame grid builds plus entry projection);
everything else is under 0.5 ms/frame. Donation particles, mirror/ripple systems, picking, and
NPC/crew visibility make no measurable guide-query contribution in this interval.

## 2. Dominant caller's pattern (`contour-objects` union rays, 4.16M probes)

- **Negative scans: 80.8% of union rays return no hit** (hit rate 19.2%) — the march spends most of
  its volume verifying empty space. (The per-ray length metric captured edge-direction magnitude,
  not marched distance; the miss RATE is the solid number.)
- **Within-frame duplicates: 79.9%** of queries repeat an earlier same-frame ray at coarse
  quantization (2e-1 pos / 2e-2 dir); **12.6%** at exact quantization (1e-2 pos / 1e-3 dir). The
  march samples neighboring points along the same contour lines; ~5 samples share one coarse ray
  identity. Result agreement for same-frame duplicates was not separately recorded — bounded below
  by cross-frame agreement (98.9% exact / 93.9% coarse); treat the 79.9% as an upper bound, the
  12.6% as verifiable.
- **Frame-to-frame coherence: 70.1%** of queries repeat the previous frame's exact ray with the
  **same result (98.9% agreement on repeats; 0.77% would break a naive cache)**; 18.2% at coarse
  quantization (93.9% agreement, 1.18% break). With the camera pinned and only the walked actor
  moving, most rays anchor to static structure.
- Spatial clustering: A1 already measured 3.86 queries/cell/rebuild on the demand path; the coarse
  duplicate rate is consistent with tight clustering along contour lines.
- Distinct rays: ≥65,536 exact (table saturated — a lower bound; 14.7% of probes collided out,
  reported), 24,156 coarse (0.6% of volume). The workload re-marchs a small, stable ray set.

## 3. Hypothesis hit rates (counters only, no behavior change)

| Hypothesis | Measured |
|---|---|
| Frame-to-frame exact-ray cache | **70.1% of queries answerable; 98.9% observed result agreement, 0.77% break** |
| Within-frame exact dedupe | **12.6% of queries** (result-verifiable) |
| Within-frame coarse dedupe | 79.9% upper bound (agreement unverified, bounded by 93.9% cross-frame) |
| Coarse first-pass grid skip | **Killed**: redundancy is in marched rays, not cell coverage; empty cells are already free and box rejects already cheapen misses (67.5% of calls reject at the triangle box — A1) |
| collect/projection optimization | **Killed as primary**: ~2.9 ms/frame of a ~24+ ms caller |

## 4. Ceiling estimate (counter math, not FPS)

The dominant caller costs ~24 ms/frame instrumented wall (~30 ms overlay class uninstrumented from
the benchmark's overlayMs) inside a 50 ms p95 frame budget.

- Within-frame exact dedupe (result-checked): eliminates ≤12.6% of query volume → ~3 ms/frame.
- Frame-to-frame exact-ray memo with boundary/projection version tags: eliminates ≤70% of query
  volume → ~17 ms/frame, but with 1.1% measured result drift — a versioned memo must treat any
  camera/observer/projection change past the quantization epsilon as invalidation; the measured
  break rate bounds the residual error at ≤0.77% of queries.
- Combined ceiling: ~74% of the dominant caller's volume (~18 ms/frame) before cache overhead.

## Designs the data supports

1. **Frame-to-frame memoized union-ray cache** keyed by the exact ray identity plus the
   boundary/projection version, limited to frames where camera and observer are still within the
   quantization epsilon (the covered workload is exactly that: pinned camera, slow actor).
   Ceiling ~70% of the dominant caller; the 0.77% break fraction is the error bound if stale keys
   are versioned out rather than trusted.
2. **Within-frame exact-ray dedupe** (first query pays, exact duplicates answer free, result
   checked): safe 12.6% ceiling, no correctness risk beyond the measured repeat agreement (98.9%).

## Designs the data kills

- **Coarse first-pass grid / cell-level pre-pass**: the redundancy is in marched rays along contour
  lines, not in cell coverage; cells are already reused (~4 queries/cell) and box rejects already
  filter 67.5% of calls cheaply. A coarser cell layer removes nothing.
- **Overflow-index family** (already killed by A1): this data re-confirms the cost is query volume
  (52K rays/frame from one caller), not index structure.
- **Optimizing `collect`/projection first**: 2.9 ms/frame of a 24+ ms/frame caller; secondary.

## Caveats

- Two instrumented passes agree (4.15M/4.29M calls, 19.2%/19.4% hit, 24.0/24.3 ms/frame).
- The machine was under heavy load (16 fps instrumented, 25 fps control); wall-ms are
  machine-specific; shares/ratios are the evidence.
- Same-frame duplicate result agreement was not separately recorded (bounded by cross-frame
  agreement); the exact coherence table saturated (distinct-ray count is a lower bound).
- The ownerBoundaryAt per-ray length field recorded edge-direction magnitude, not marched distance;
  only hit/miss rates are used in conclusions.
- One serial pair per pass; no FPS claims from VM timings.
