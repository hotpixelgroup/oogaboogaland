# PR #173 acceptance — final full-suite aggregate at 839934c

Head: `839934c` on `acceptance-repairs-followup` (merge cacf8cf + runner fix 54ebb69 + 4 repair commits).
Coverage: exactly `npm test -- full` — all 28 scenes + perf lane + unit tier + poker-protocol,
chunked per-scene/ONLY-scoped at LANES=1 with DSB_TRACE=1 (same commands as the 54ebb69 run).
Logs: this directory. Unit tier re-runs inside every scene chunk by design and is counted once.

## Aggregate: **1059/1074 checks passed (15 failures)**

| Tier | Checks | Pass | Fail |
|---|---|---|---|
| Global/unit tier | 197 | 197 | 0 |
| perf lane | 3 | 2 | 1 |
| poker-protocol | 5 | 5 | 0 |
| hub (27 tasks) | 188 | 188 | 0 |
| dsb (38 tasks) | 455 | 441 | 14 |
| lab race drop orbit mine | 81 | 81 | 0 |
| factory bifrost | 55 | 55 | 0 |
| poker arcade | 22 | 22 | 0 |
| carnival smalls 1 (skee hoops shy claw hockey billiards darts pinball) | 32 | 32 | 0 |
| carnival smalls 2 (ride invaders snake pong stampede flap breaker dash stacker) | 36 | 36 | 0 |
| **Total** | **1074** | **1059** | **15** |

Per-chunk: 00-unit 197/197 · 01-perf 2/3 · 02-poker-protocol 5/5 · 03-hub 228/228 · 04-hub 214/214 ·
05-hub 214/214 · 06b-hub 278/278 · 06c-hub 239/239 · 07-dsb 236/243 · 08-dsb 238/241 · 09-dsb 269/269 ·
10-dsb 277/281 · 11-dsb 406/406 · 12-lab 278/278 · 13-factory 252/252 · 14-poker 219/219 ·
15-smalls1 229/229 · 16-smalls2 233/233.

## Failing checks (15 instances, 13 distinct) — classification

### (a) Known documented blockers (1 instance)

1. **wall movement performance: moving behind cave walls during a donation stays responsive at a
   high-density desktop size** — fps 33.69 (renderer dropped to quality "low"), p95 50 ms, max 50.1 ms,
   worst frame overlayMs 29.3. Known covered-donation FPS target (≥55 at High).
   The other two documented blockers did NOT reproduce this run: ordinary-movement p95 passed
   (was 33.3 ms vs <25 ms at 54ebb69), and the DSB 8 s travel deadline passed (`dsb lifecycle`, 72.7 s task).

### (b) Pre-existing parent-side failures (14 instances, 12 distinct) — fail identically on 687aa53 and on rock e1ec738 where the check exists; not this pass's scope

2. **dsb zuzu agent** — `TypeError: __ooga.dsb.zuzu.snapshot` undefined (Zuzu never created in scene-dsb.js on either parent).
3. **dsb radio controls** — `TypeError: … .ready` (`__ooga.audio` undefined).
4. **dsb automatic feeds** — `TypeError: … .duration` (`__ooga.audio` undefined).
5. **dsb feeds and audio** — `TypeError: … .ready`.
6. **dsb arrival camera** — `TypeError: … .ready`.
7. **dsb ambience** — `TypeError: … .ready`.
8. **dsb shared player** — `TypeError: … .ready`. (3–8: `__ooga.audio` = `entrance?.audio`; the entrance is only created arriving from bifrost or with an `entrance` URL param, and these task URLs do neither. Fails on rock alone.)
9. **dsb phone** — same audio/entrance class.
10. **dsb character: YellowBrokeIt returns possessed** — `{"rebuilt":true}`, returned name mismatch (PR-side check, absent on rock).
11. **dsb character: rules-without-rulers returns possessed** — same.
12. **DSB weather: flash expires, exterior gate silences and resumes, tiers bound pools and clear recovers** (×2 desktop+phone) — `bounded:false`; drop counts identical to both parents (rain 291/190, storm 1062/695).
13. **DSB TV correction: copy succeeds or selects the full invoice** (×2 desktop+phone).

### (c) Anything else

**Empty.** Every failure is a documented blocker or a pre-existing parent-side failure.

## Delta vs the 54ebb69 aggregate (1041/1068)

- Total checks 1068 → 1074 (+6): tasks that previously aborted early now complete and record their
  remaining checks (+4 in the shoreline piers task, which timed out on pier-access readiness before;
  +2 in the dsb lifecycle task, which threw on the travel deadline before).
- Failures 27 → 15 (−12): the 10 fixed merge-regression instances (hub matrix, hub mirror, shoreline
  depth, pier −43, pier access, interior touch-exit ×2, studio records ×2, poker phone) plus 2 flaky
  documented blockers not reproducing (ordinary-movement p95, DSB travel deadline).
- Passes 1041 → 1059 (+18 = 12 fewer failures + 6 newly completing checks).
- Remaining 15 failures: 1 known FPS target (covered donation, reproduced) + 14 pre-existing
  parent-side failures outside this pass's scope. Both other documented blockers green this run.

## Verdict

The merged head at 839934c is strictly better than at 54ebb69 and better than either parent on this
suite: all 8 merge-induced regressions fixed with no new failures introduced; known blockers down to
the single covered-donation FPS target; pre-existing parent-side failures unchanged and untouched.
