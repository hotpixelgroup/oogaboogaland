# Pepi automated browser QA

The latest expanded QA run is **not green: 429/437 checks passed in 1.6 minutes**. It ran with two baboons; the navy companion has since been removed (2026-11-08, see the handoff), and the results below are kept as they were. It ended with the repository's required STOP for `hub pepi samples` after two consecutive failing runs. No further fix or rerun of that stopped flow was attempted.

The initial expanded run ended at 401/409. Its gauntlets stopped on a generated-script syntax error involving negative coordinates. The one permitted fixture correction also supplied complete native Space events, waited for native input completion, and measured movement in a single synchronous game interval. The rerun progressed through all twelve emulated-mobile effects and desktop effects 1–6, exposing the remaining failures below. No check thresholds were lowered or removed.

## Remaining failures and stop

- `hub pepi samples`: streak **2**. The latest ledger detail is `Covered sample control: [data-action="pepi-confirm"]`. Another instance failed in the post-effect Hub lifecycle probe with `Cannot read properties of null (reading 'health')`; that assertion sequence did not complete. These are not evidence of health loss.
- `hub pepi playthrough phone`: streak **1**. Tess's “what's new” greeting covered the real Inject Yourself action button. The probe refused to click through the covering UI.
- Desktop OBL-01, 03, 04, 05 and 06: streak **1** each. Their actual effects, timer boundaries, cleanup and restored controls were observed successfully, but the composite assertion rejected the 2.363474713 m approach distance against its `>2.4 m` lower bound. The implementation's offer range is 2.75 m; no threshold change or unrelated movement change was made to force these checks green.
- Desktop OBL-07 through OBL-12 were not completed in the new full selection/injection gauntlet. Prior focused Crash Out and Moon Knees checks remain recorded, but do not substitute for these missing flows.

[AGENTS.md](../AGENTS.md), Testing, says: “When the same check fails a second run in a row, the runner prints `STOP`. Do not try again: report the ledger entry to the maintainer and move on.” The exact current entries remain in `untracked/test-ledger.json`. The existing 81 unrelated ledger entries were not retried or discarded.

## Per-effect result

“Pass” means the real catalog choice and confirmation started one cinematic, the effect committed once, its specific behavior was observed, it stayed active immediately before expiry, expired across its boundary, and its movement/visual/audio state cleaned up. Native pointer/keyboard or touch events drove the controls. Fixed simulation time advanced timers; screenshots were not used as a completion oracle.

| Code | Effect | Emulated phone | Desktop |
|---|---|---|---|
| OBL-01 | Moon Knees | Pass | Effect/timer/cleanup observed; approach assertion failed |
| OBL-02 | Rocket Socks | Pass | Pass |
| OBL-03 | Feather Fall | Pass | Effect/timer/cleanup observed; approach assertion failed |
| OBL-04 | Triple Hop | Pass | Effect/timer/cleanup observed; approach assertion failed |
| OBL-05 | Crab Walk | Pass | Effect/timer/cleanup observed; approach assertion failed |
| OBL-06 | Echo Buddy | Pass | Effect/timer/cleanup observed; approach assertion failed |
| OBL-07 | Jelly Legs | Pass | Not completed |
| OBL-08 | Squeaky Sneakers | Pass | Not completed |
| OBL-09 | Personal Raincloud | Pass | Not completed |
| OBL-10 | Magnet Mittens | Pass | Not completed |
| OBL-11 | Crash Out | Pass | Not completed |
| OBL-12 | Big Oops | Pass | Not completed |

The complete per-effect values, specific observations and cleanup fields are in `untracked/pepi-qa/effect-ledger.json`. The detailed passing and failing records are in `untracked/pepi-qa/browser-attempt2.log`.

## Production fixes made during QA

- Registered the actual baboon meshes with one shared, non-weapon interaction owner per character. Real pointer and touch mesh interaction passed in both layouts.
- Released stale held pilot poses before invalidation fallback, preventing forced movement during injection from snapping the Ooga back. Independent post-fix verification and the latest desktop regression passed.
- Allowed native Tab traversal through the temporary document-body focus step. Added Escape handling for that body-focus step. Native repeated Tab cycles, deliberate selection and body-focus Escape passed.
- Changed compact/mobile catalog scrolling so fixed introduction/footer panels do not leave a tiny reading strip. The latest run passed full-card readability at 320×568, 568×320, 844×390, 320×390 and 390×844.
- Added a scenery line-of-sight check before close-range Crash Out shouting. Its blocked-wall rejection and clear-target approach/yell passed on emulated mobile; the separate existing desktop Crash Out movement/stop regression passed.
- Cancelled injection when another native dialog opens, preserving the sample and the newly opened dialog. Independent post-fix Recipe interruption and the desktop regression passed.

## Additional evidence

- A 300-simulated-second Hub roaming observation measured Pepi at 187.28 m and the companion at 184.54 m, including route searches, recovery and arrivals. No unsupported root height or terrain-crossing step was observed; minimum pair separation was 2.607 m. Geometry remained within a 1.246 m radius, paws contacted the ground and coat clearance stayed positive. See `untracked/pepi-qa/pepi-navigation-qa.json`.
- Both NPCs measured approximately 0.800 m/s against an awake Ooga's 1.600 m/s in the automated desktop comparison. Both reached the far side of registered solid scenery without intersections or teleports.
- Twenty distinct alternating mutters, one ambient bubble, dialog silence, all-fours posture, standing/reversal, No/exit/reentry, cancellation, stale duplicate events and stable fixed node/target pools were exercised. Retained and rebuilt Hub observations cleared state and resources; the new post-effect lifecycle gauntlet still has the failure noted above.
- Actual Recipe and Pepi computed dialog styling matched; native pointer/touch scrolling, close, backdrop, No focus and deliberate choice were checked. Keyboard and compact-screen regressions passed after their fixes.
- Clean builds, JavaScript syntax checks and `git diff --check` passed. Browser console checks that completed were clean. No console-clean claim is made for an aborted step whose final console assertion did not run.

## Explicit limits

- These were headless Chrome desktop and emulated mobile sessions. Physical phones, physical gamepads, assistive screen readers and auditory quality were not validated. Narrow reflow was checked; browser zoom was not separately exercised.
- Fixture accounts and inert sockets do not validate real OAuth or live multiplayer. NPCs, mutters and cosmetic effects remain local; no shared-state success is claimed.
- Existing stopped repository-wide/FPS checks were not run. Recorded navigation call timings and resource observations are descriptive, not an FPS pass or a new performance threshold. Flat-ground roaming does not establish slope coverage.
- Different reciprocal body-gap queries were observed for wide Oogas; visible mesh interpenetration was not confirmed. No speculative collision rewrite was made.
- At the end of this QA pass, no commit, push, PR, deployment or external message had been made. Subsequent fork-handoff authorization and the inherited test stop are recorded in [the handoff](pepi-handoff.md); the QA result above remains unchanged.
