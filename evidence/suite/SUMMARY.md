# PR #173 acceptance — full-suite run at merged head

Head: `54ebb69` ("Make runner placement signatures cycle-safe") on `acceptance-repairs-followup`
(= merge `cacf8cf` of rock `e1ec738` + the Task-1 runner fix). Tree clean. LANES=1, DSB_TRACE=1.
Runner: `node scripts/build.mjs` once, then `node test/run.mjs <chunk>` per row below — the union of
chunks is exactly what `npm test -- full` runs (all 28 scenes + perf lane + unit tier + poker-protocol).
No deadline, threshold, quality or flag was changed. The timed-out chunk 06 was fully re-run as 06b+06c.

## Aggregate (each check counted once)

| Tier | Checks | Pass | Fail |
|---|---|---|---|
| Global/unit tier (`test:unit`) | 197 | 197 | 0 |
| perf lane | 3 | 1 | 2 |
| poker-protocol | 5 | 5 | 0 |
| hub (27 tasks + perf above) | 188 | 186 | 2 |
| dsb (38 tasks) | 449 | 427 | 22 |
| lab race drop orbit mine | 81 | 81 | 0 |
| factory bifrost | 55 | 55 | 0 |
| poker arcade | 22 | 21 | 1 |
| skee hoops shy claw hockey billiards darts pinball | 32 | 32 | 0 |
| ride invaders snake pong stampede flap breaker dash stacker | 36 | 36 | 0 |
| **Total** | **1068** | **1041** | **27** |

## Per-command record

| Log | Command (all `LANES=1 DSB_TRACE=1 node test/run.mjs …`) | Result | Exit | Wall |
|---|---|---|---|---|
| after-test-unit.log | `unit` | 197/197 | 0 | 0.4 min |
| 01-perf.log | `perf` | 1/3 | 1 | 22 s |
| 02-poker-protocol.log | `poker-protocol` | 5/5 | 0 | 43 s |
| 03-hub-gorilla.log | `ONLY=gorilla hub` | 228/228 | 0 | 162 s |
| 04-hub-core1.log | `ONLY="work movement,hub donation,hub walking,hub map navigation,rainforest bridge" hub` | 214/214 | 0 | 90 s |
| 05-hub-core2.log | `ONLY="hub routes,hub fall,hub grounding,hub round trip,factory contribution,hub phone" hub` | 214/214 | 0 | 74 s |
| 06-hub-labeled.log | `ONLY="room sign,timechain,chilling,flask,work rotation,mirror,weapons,birds-eye,side panel,clock,canvas2d" hub` | killed at 295 s — superseded by 06b+06c (same 14 tasks) | — | 295 s |
| 06b-hub-mirror.log | `ONLY="mirror,weapons,birds-eye" hub` | 276/278 | 1 | 215 s |
| 06c-hub-labeled2.log | `ONLY="room sign,timechain,chilling,flask,work rotation,side panel,clock,canvas2d" hub` | 239/239 | 0 | 251 s |
| 07-dsb-a.log | `ONLY="zuzu,radio controls,automatic feeds,feeds and audio,arrival camera,ambience,shared player" dsb` | 236/243 | 1 | 57 s |
| 08-dsb-b.log | `ONLY="character continuity,dsb phone,lifecycle,SVRN" dsb` | 235/239 | 1 | 118 s |
| 09-dsb-c.log | `ONLY="vacancy,shoreline" dsb` | 262/265 | 1 | 54 s |
| 10-dsb-d.log | `ONLY="water checkpoint,weather checkpoint,radio TV,harbor" dsb` | 277/281 | 1 | 80 s |
| 11-dsb-e.log | `ONLY="interior checkpoint,venue menus,nature checkpoint,studio checkpoint,integration checkpoint" dsb` | 402/406 | 1 | 71 s |
| 12-lab-race-drop-orbit-mine.log | `lab race drop orbit mine` | 278/278 | 0 | 127 s |
| 13-factory-bifrost.log | `factory bifrost` | 252/252 | 0 | 186 s |
| 14-poker-arcade.log | `poker arcade` | 218/219 | 1 | 59 s |
| 15-smalls1.log | `skee hoops shy claw hockey billiards darts pinball` | 229/229 | 0 | 113 s |
| 16-smalls2.log | `ride invaders snake pong stampede flap breaker dash stacker` | 233/233 | 0 | 119 s |

Scene-chunk totals include the 197-check unit tier each (it re-runs per invocation by design);
the scene column of the aggregate subtracts it. Main-suite wall time ≈ 31 min + one timed-out 295 s attempt.
Diagnostic runs (not counted in the aggregate): `pre-*.log` at pre-merge PR head `687aa53`, `rock-*.log` at rock `e1ec738`.

## Failing checks (27 instances, 17 distinct)

### A. Known documented blockers (3 instances) — matches the PR's documented known list

1. **wall movement performance: moving behind cave walls during a donation stays responsive** — fps 30.99 (renderer dropped to quality "low"), p95 50 ms, worst frame 66.6 ms. Known FPS target (≥55 at High).
2. **wall movement performance: ordinary movement stays responsive** — fps 54.42, p95 33.3 ms vs the <25 ms target, worst 33.5 ms. Known p95 target.
3. **dsb lifecycle** — `Scene travel did not settle` at the 8 s deadline: hub→dsb swap never happened (framesTotal 4, swap 0). Known DSB travel deadline. The Factory 8 s travel deadline did **not** reproduce — `factory lifecycle` passed (69 s task) at this head.

### B. Pre-existing on BOTH parents — not merge regressions (14 instances, 10 distinct)

Identical failures at pre-merge PR head `687aa53`; where the check exists on rock `e1ec738` it fails there
identically too (verified: rock runs `rock-07-dsb-a.log`, `rock-10-dsb-d.log`). These sit outside the
documented 271/273 targeted baseline (presumably outside that run's scope), but the merge did not introduce them.

4. **dsb zuzu agent** — `TypeError: __ooga.dsb.zuzu.snapshot` undefined; scene-dsb.js never creates the Zuzu agent on either parent (also fails on rock alone).
5. **dsb radio controls** — `TypeError: … .ready` (`__ooga.audio` undefined).
6. **dsb automatic feeds** — `TypeError: … .duration` (`__ooga.audio` undefined).
7. **dsb feeds and audio** — `TypeError: … .ready`.
8. **dsb arrival camera** — `TypeError: … .ready`.
9. **dsb ambience** — `TypeError: … .ready`.
10. **dsb shared player** — `TypeError: … .ready`. Root cause of 5–10: `__ooga.audio` is `entrance?.audio` and scene-dsb.js creates the entrance only when arriving from bifrost or with an `entrance` URL param; these task URLs do neither. **Fails identically on rock e1ec738 alone — not a merge regression.**
11. **dsb phone** — same `__ooga.audio.ready` entrance class.
12. **dsb character: YellowBrokeIt returns possessed** — `{"rebuilt":true}`, returned name mismatches. PR-side check (absent on rock); fails at 687aa53 too.
13. **dsb character: rules-without-rulers returns possessed** — same.
14. **DSB weather: flash expires, exterior gate silences and resumes, tiers bound pools and clear recovers** (×2 desktop+phone) — `bounded:false`; identical drop counts (291/190, 1062/695) on both parents.
15. **DSB TV correction: copy succeeds or selects the full invoice** (×2 desktop+phone) — fails on both parents.

### C. NEW merge-induced regressions (10 instances, 8 distinct) — fail at 54ebb69, pass at 687aa53

16. **hub matrix: pushing the glyphed room lever up lights its green accents, raises the mirror's bars and spreads the glyph wave; pulling it down reverses each change** — glyph wave already active before the press (`before.wave:1`, `glyphs:1`, radius 36→38); check requires wave off until pressed. Reproduced twice (chunks 06, 06b); passes pre-merge.
17. **hub mirror: 499 damage leaves it whole and locked, 500 shatters it open with its gate unlocked and the glyph hint stopped, and it is still broken after a trip away** — `before.hint:false` (glyph doorway hint expected on). Same glyph-state theme as 16; passes pre-merge.
18. **DSB shoreline browser: keyboard reaches safe head depth with ripples and responsive surface camera** — deep wade reaches depth 0.566 (camera 1.115) vs 1.20 (camera 0.30) pre-merge; the merge changed wading/shoreline behavior.
19. **DSB pier browser -43: shore input reaches the deck end with dry footing above deep harbor water** — post-merge: z 61.40, feet 1.55, support **−5** (nothing underfoot); pre-merge: z 57.76, feet 1.35, support 1.35.
20. **dsb shoreline pier access** — `Shoreline lifecycle did not become ready within 20 simulated seconds`.
21. **DSB interior: touch exit restores the same player/building and current night rain, not entry weather** (×2 desktop+phone) — exit weather "rain" but `night:0` (night expected).
22. **Studio: warmed room records remain bounded** (×2 desktop+phone) — renderer records grew 423→424 (must not grow).
23. **poker phone: the title card reads in touch words … every control is under a thumb** — `covered #joy-move by #position-debug at 70,756` (debug overlay over the joystick).

### Fixed by the merge (failed at 687aa53, pass at 54ebb69)

- `SVRN browser: shared seat interaction locks the lounge pose` and `dsb SVRN checkpoint` (TypeError `reading 'room'`) — both pass at the merged head.
- On rock alone, `DSB water trip: Portara crossing preserves identity and releases textures` (×4), `dsb zuzu conversation` and `dsb compatibility: built CSP …` fail; all pass at the merged head.

## Verdict vs the documented 271/273 targeted baseline

Worse. Of the 27 failures, 3 are the documented known blockers (2 FPS targets + DSB 8 s travel; the Factory
travel deadline did not reproduce), 14 are pre-existing failures present identically on one or both parents
(and on rock alone where the check exists), and **10 instances across 8 distinct checks are new
merge-induced regressions** (hub matrix/mirror glyph state, DSB shoreline depth/pier ×3, DSB interior night
rain ×2, Studio records bound ×2, poker phone overlay). The two merge side-effects worth noting in the other
direction: the SVRN seat/checkpoint failures the PR head had are fixed, and the Factory travel deadline is green.

Footnote: `untracked/test-ledger.json` (gitignored) now records streak ≥2 for the pre-existing weather/TV
failures because the diagnostic runs repeated them; future runs in this clone will print the runner's STOP
notice for those. Delete the ledger if a clean slate is wanted.
