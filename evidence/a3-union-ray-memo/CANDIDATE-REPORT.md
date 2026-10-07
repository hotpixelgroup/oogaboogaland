# A3 candidate — memoized union-ray cache + within-frame dedupe: REJECTED

Head: clean `839934c` (implementation reverted in full; nothing committed; `test/run.mjs` untouched).
Task gate outcome: **fails gate 2 by construction** — zero per-query mismatches and a nonzero hit
rate are mutually exclusive for this workload. Evidence: `memo-bitwise-raw.json`, `memo-probe.mjs`;
numbers below are from three instrumented runs of the original covered benchmark (verbatim covered
branch, 1920×1080 @2x, camera pinned behind rock, donation at 1 s, 5 s window, LANES=1-equivalent
serial probes).

## What was built (then reverted)

A memo inside `objectGuides.ownerBoundaryAt`: open-addressed bounded typed-array table
(2^17 slots, 8 probes), key = ray args quantized (origin 1e-2, direction 1e-3), serve only when
registry epoch (bumped on `refresh`/`dispose`), the owner group's existing `revision` authority
(exact: world-matrix/shown/geometry/clip/provider changes — the same authority the `perceived`
cache uses) and a quantized camera context (position 1e-2, view matrix 1e-3, tanX/tanY/near/far)
all match. A permanent `memoVerify` flag ran the direct march alongside every serve and counted
mismatches, returning the direct answer so rendering stayed identical while measuring.
Implementation was deliberately complete before measurement, so the serve/error rates below are
the real candidate's, not a model's.

## Measured (three runs, memoVerify on, exhaustive per-query equivalence across the window)

| Variant | Queries | Served (hit rate) | Mismatches on serves | Serve error |
|---|---|---|---|---|
| Ray key 1e-2/1e-3, camera 1e-3 | 4,033,657 | 606,931 (15.0%) | 123,918 | **20.4%** |
| Ray key 1e-2/1e-3, camera 1e-4 | 4,346,066 | 718,033 (16.5%) | 134,017 | **18.7%** |
| Ray key ~bitwise (1e9), camera 1e-3 | 4,504,730 | **0 (0.0%)** | 0 | — |

Also recorded: memoBusts 2.78M (key hit, version bust — versions worked), memoEvictions 519K;
fps in verify mode 20.7–22.9 on a loaded machine (verify doubles query cost; not an FPS number).

## Why it fails (decomposition)

- **Serve error is ray-quantization-driven, not version- or camera-driven.** Tightening the camera
  epsilon 10× (1e-3 → 1e-4) moved serve error only 20.4% → 18.7%. The version authorities
  (registry epoch, group revision) caught their share — 2.78M busts — and are not the problem.
- The contour march's union rays are continuous: with the camera head-tracking a walking actor,
  the march's sample points (perspective-correct `pixelLength` steps over animated geometry) never
  repeat bitwise, within a frame or across frames. **Exact keys: 0 hits in 4.5M queries.**
- At the loosest useful key (1 cm / 1e-3 rad — A2's "result-verifiable" bucket), one served answer
  in five is wrong: boundary box paddings are ~1e-5 and the cave walls are dense triangles, so a
  1 cm/0.06° neighborhood flips hit/miss far more often than A2's cross-frame key-repeat agreement
  (98.9%) suggested. A2's 0.77% "break" was the rate among *repeated keys*; a quantized cache
  *assigns* results to genuinely different rays inside the bucket — a different, much worse number
  (20.4%), measurable only by an exhaustive serve-time equivalence check like this one.
- Therefore no quantization point exists with both zero mismatches (gate 2) and a nonzero hit rate
  (needed for any FPS gain). Exact keys are the only zero-mismatch option, and they hit 0% of
  4.5M queries — a 0 ms/frame saving.

## Gate verdict

- Gate 1 (`node --check`, `test:unit`): not reached as a ship gate — reverted before the permanent
  unit proof, since gate 2 fails by construction.
- Gate 2 (exhaustive browser equivalence, zero mismatches required): **FAILED** — 123,918–134,017
  mismatches at any hit-yielding quantization.
- Gate 3 (matched FPS pairs): moot — exact keys save nothing (0% hit rate), epsilon keys are
  incorrect. Not run.
- Verdict: **REJECTED. Reverted to clean 839934c; nothing committed.** The A2-supported design
  family (memoize union-ray results keyed by ray identity + versions) is dead for the covered
  workload: results are too sensitive to sub-epsilon input changes, and exact rays never repeat.

## Where this leaves the covered-FPS blocker (evidence-backed)

- A1: the overflow-index family is dead (construction 7× its query-phase saving; 0% live fallback).
- A2: 70% cross-frame ray repetition *looked* cacheable; A3 shows serving it is 20% wrong.
- The remaining headroom is the march's *structure*, not result caching: 80.8% of union rays are
  pure negative scans and ~5 samples share one coarse ray identity (A2) — i.e., the march tests
  ~5× more points than the contour's information content needs. A candidate that changes *how many
  rays are marched* (cheaper miss certification per cell, or a coarser march with proven
  outline-equivalence) attacks the 24 ms/frame directly; both need their own outcome-identity
  proofs, and the outline-equality bar for a coarser march is a separate measurement.
