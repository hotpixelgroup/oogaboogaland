# Pepi: unfinished fork handoff

This branch is an **unfinished handoff, not ready for an upstream PR**. The latest expanded browser QA finished at **429/437 checks passing**, exit status 1, and reached the repository's mandatory STOP. Read this document before changing or running the feature. Creating a fresh checkout does not clear that stop.

## Delivery and scope

- Intended repository: `hotpixelgroup/oogaboogaland`, branch `feature/pepi-hub-npcs`.
- Starting commit: `a1100ee30e08c7931231e28800e8e8af9213192f` on upstream `rock`.
- Harry explicitly authorized an exception to the maintainer-only commit rule for committing this unfinished handoff and pushing it only to his fork. That exception does **not** authorize another attempt at stopped checks, an upstream PR, merge, deployment, or external contact.
- Source, tests and documentation are included. Generated `oogaboogaland.html`, generated character data and all `untracked/` preview helpers, logs, screenshots and ledgers are excluded from the handoff commit. Build the portable page locally when otherwise appropriate; do not hand-commit it.
- Read [AGENTS.md](../AGENTS.md), [feature documentation](pepi-hub-npcs.md) and the [latest QA report](pepi-qa-report.md). The earlier 393/393 focused result is historical and does not override the expanded failures.

## Stop inherited by the next agent

AGENTS.md, Testing, says:

> When the same check fails a second run in a row, the runner prints `STOP`. Do not try again: report the ledger entry to the maintainer and move on. A handover saying checks fail is not a request to run them.

The original executor's `untracked/test-ledger.json` is preserved locally but is deliberately not published. Its exact stopped entry is reproduced here so a remote agent cannot mistake the absence of that ignored file for permission to retry:

```json
{
  "hub pepi samples": {
    "streak": 2,
    "first": "2026-11-01T21:26:24.371Z",
    "last": "2026-11-01T21:37:37.008Z",
    "detail": "Error: Covered sample control: [data-action=\"pepi-confirm\"]\n    at <anonymous>:1:311\n    at <anonymous>:1:392"
  }
}
```

Do not make another fix attempt or replay that stopped flow without a specific maintainer decision resolving the restriction. Do not rename/filter/duplicate it, reset a ledger, weaken thresholds, skip assertions or manually replay an equivalent flow to bypass the stop. Read-only diagnosis and genuinely independent authorized work may continue. A general instruction to finish the feature or push this handoff is not a test-stop exception.

The original ledger also contains 81 pre-existing unrelated entries, including stopped full-suite/performance checks. Those checks were not rerun. Do not run the full suite indiscriminately in a new checkout.

## Current implementation and remaining gaps

Harry's latest appearance request supersedes the original gorillas: Pepi is a feeble elderly baboon in a tan trench coat. He roams on all fours at 0.8 m/s, half nominal crew speed, stands when addressed, recovers blocked paths and mutters ten ironic doomsday/NPC captions, one every 22 seconds within earshot. The unnamed navy companion baboon was removed on 2026-11-08 at Harry's request (see the last section); do not bring him back.

Pepi offers the native Yes/No dialog, “Looking for some pep?”, within 2.75 m. No returns to play unchanged, with an eight-second suppression plus exit/reentry beyond 3.35 m. Yes opens the coat, displaying twelve separated fictional-code syringes under “Pepi's Peptides.” Claim one free sample, use Inject Yourself, confirm the disclosed outcome, and complete the first-person left-palm-up/right-hand injection gag and gorilla yell. Consume once at cinematic completion. Cancel restores controls and retains the sample for a valid owner. One held sample, one active effect, no stacking; claim cooldown is 60 seconds and page-local.

The twelve current mechanics and durations are specified in the feature documentation. Feather Fall, Triple Hop and Crab Walk are documented engine-supported substitutions for the earlier Bubblehide, Pocket Tornado and Gecko Toes ideas; do not imply the original shield/pickup/climbing features were implemented. Big Oops is a reversible three-second theatrical knockout followed by safe return to the pile, not actual death or gear loss.

Crash Out lasts 15 seconds, walks toward eligible same-zone Oogas within ten metres, checks scenery line of sight before shouting, and cancels on steering, Escape, Space or the stop action. It causes no attacks, target damage or shared chat. **Its profanity captions and synthetic grunt are local, not delivered to other players.** The implementation therefore does not fully implement shared multiplayer profanity delivery.

NPC positions, coat state, mutters, foreground arms, echo, cloud and stars are local. Ordinary controlled-avatar pose broadcast remains unchanged. There is no new shared room protocol, real OAuth proof, authoritative inventory/cooldown or two-client verification. The mutter audio is synthetic gibberish, not spoken-word TTS. Physical phones, physical gamepads, screen readers, audio quality and browser zoom were not validated. Full controller dialog navigation remains unimplemented. Roaming evidence was on flat Hub ground; no slope/FPS claim is made.

## Latest failures and commands already executed

Historical commands, **not instructions to rerun them now**:

```sh
npm run build
VERBOSE=1 ONLY=pepi node test/run.mjs hub > untracked/pepi-qa-browser.log 2>&1
```

The expanded run initially returned 401/409 with a generated-probe syntax error. Its one permitted correction fixed negative-coordinate interpolation, native Space input completeness, input completion waits and synchronous movement measurement. The permitted rerun returned **429/437 in 1.6 minutes**, with the STOP above. No thresholds were lowered or removed.

Remaining records:

| Check | Last result and interpretation |
|---|---|
| `hub pepi samples` | Streak 2 STOP. One session failed with covered `pepi-confirm`; another threw `Cannot read properties of null (reading 'health')` in the post-effect lifecycle probe. The latter sequence did not complete and is not evidence of health loss. |
| `hub pepi playthrough phone` | Streak 1, first/last `2026-11-01T21:37:37.008Z`. Tess's `.greeter-menu`, titled “Tess · what's new”, covered `#act`; the real-input probe refused to click through it. |
| `Pepi samples desktop 01: full selection, one committed injection, actual effect, duration and cleanup` | Streak 1 at that timestamp. Specific mechanic, expiry and cleanup observed; composite approach assertion failed. |
| `Pepi samples desktop 03: full selection, one committed injection, actual effect, duration and cleanup` | Same approach failure. |
| `Pepi samples desktop 04: full selection, one committed injection, actual effect, duration and cleanup` | Same approach failure. |
| `Pepi samples desktop 05: full selection, one committed injection, actual effect, duration and cleanup` | Same approach failure. |
| `Pepi samples desktop 06: full selection, one committed injection, actual effect, duration and cleanup` | Same approach failure. |

For those five desktop records, measured approach distance was `2.363474713348865` m against the assertion's `>2.4` m lower bound. Actual offer range is 2.75 m. Do not lower the threshold or alter unrelated movement to force a pass. Diagnose the contract and measurement before proposing a remedy to the maintainer.

## Acceptance and evidence matrix

| Area | Recorded evidence | Still needed or limited |
|---|---|---|
| OBL-01 through OBL-12, emulated phone | All twelve complete choice/confirmation/single consumption/specific behavior/pre-expiry/expiry/cleanup records passed. | Later lifecycle failure remains separate; no physical-device claim. |
| Desktop OBL-02 | Complete expanded effect flow passed. | General unresolved suite failures still apply. |
| Desktop OBL-01, 03–06 | Effect, timer and cleanup fields observed successfully. | Composite approach check failed; do not label these full passes. |
| Desktop OBL-07–12 | Earlier focused Crash Out checks exist. | Expanded full flows were not completed. |
| Primary desktop interaction | Cancellation, discard, camera families, forced movement, Recipe interruption, mesh picking, Crash Out stop, logout and scene checks passed. | Expanded post-effect lifecycle probe is unresolved. |
| Native UI | Compared actual Recipe/Pepi styling; keyboard Tab/BODY Escape, touch mesh picking and full-card reflow checked at 320×568, 568×320, 844×390, 320×390 and 390×844. | Resolve covering Tess/confirmation controls; controller/screen-reader/zoom gaps remain. |
| Navigation and posture | Both measured about 0.800 m/s versus 1.600 m/s crew; obstacle arrival without intersections/teleports. In 300 simulated seconds, Pepi traveled 187.28 m and companion 184.54 m; minimum pair gap 2.607 m, geometry radius under 1.246 m, supported paws and positive coat clearance. | Flat Hub only. Wide-Ooga reciprocal gap queries differ, but visible interpenetration was not confirmed. No speculative rewrite or FPS claim. |
| Mutters/resources | Twenty alternating lines, one speech slot, quiet during dialogs, bounded pools and retained/rebuilt Hub observations exercised. | Auditory quality and live multiplayer unverified; expanded lifecycle failure remains. |

QA already fixed mesh registration, stale held-pose snapback, native Tab/BODY Escape, compact catalog scrolling, through-wall Crash Out yelling and injection interruption by another native dialog. Preserve those fixes and real-input preconditions.

Detailed logs, per-effect values, navigation JSON and screenshots remain only on the original executor under `untracked/pepi-qa/` and `untracked/pepi-*.png`; they are not included in this remote branch. The tracked QA report contains their summaries and limits. Do not claim to have inspected absent artifacts or invent replacement results.

The build, JavaScript syntax checks and whitespace check previously passed. No stopped tests were rerun to prepare or publish this handoff. Do not describe the feature as finished, bugless, fully verified, or ready for an upstream PR.

## Safe continuation

Read instructions and the recorded failures, inspect source/log summaries, diagnose without replaying the stopped flow, and obtain the required specific maintainer decision before another attempt. Once explicitly permitted, resolve evidence-backed faults and complete the missing desktop/lifecycle coverage with native controls, real behavior/timer/cleanup oracles and exact new results. Preserve history and thresholds. Use separate genuine sessions before making shared-state claims. Keep work on the fork until Harry authorizes any upstream publication.

## Remote session diagnosis, 2026-11-01

A cloud session continued from commit `5fc8efa`. It did not run or replay the stopped `hub pepi samples` flow, edited it only as Harry approved (below), and ran no browser suite at all: its container renders the Hub with software WebGL at well under one frame a second (about 19 s to boot, about 3 minutes before Tess greets), so any browser session would fail on the runner's two-minute cap rather than on the feature. The original ledger's seven Pepi entries were recreated in the session's ignored `untracked/test-ledger.json` from the tables above, so the runner would still print STOP.

Run and passed there: `npm run build`; `node --check` on every changed JavaScript file; `git diff --check`; `npm run test:unit`, **355/355** (the global Node tier, including Pepi's model, roaming and effect rules).

Findings, from reading the code; none was confirmed in a browser:

| Record | Cause found | Production defect? | Remedy, and who decides |
|---|---|---|---|
| `hub pepi playthrough phone` (Tess over `#act`) | On a touch screen no wider than 720 px, `.act` stands 112–156 px above the bottom and `.greeter-menu` starts at 122 px, both centred at z-index 13, the panel later in the DOM. Present on `rock` before Pepi; Pepi only keeps the button up longer. A standalone layout probe (Tess alone, no Pepi flow) found the button's centre under her panel at 390×844 and 320×568. | Yes, a small pre-existing layout overlap. | **Fixed** in `src/style.css`: while the button shows, the panel stands at 164 px on narrow touch screens at least 480 px tall. The same probe then found the button reachable at 390×844, 320×568, 568×320, 844×390 and 1280×800; 568×320, where her panel already overflowed the top before this change, is unchanged. The phone playthrough has one permitted rerun left; it was not spent here. |
| Desktop 01, 03–06 approach (2.363 m against >2.4 m) | Fixture knife-edge. The Ooga walks `PLAYER_SPEED` = `WALK.speed` = 7.75 m/s, 0.3875 m per 0.05 s test step, and the fixture puts Pepi 4.3 m ahead: exactly four steps outside the 2.75 m reach. When the fourth step lands a hair outside, the offer fires one step later, at 4.3 − 5 × 0.3875 ≈ 2.36 m. Pepi checks reach before the crew moves and the offer zeroes steering at once, so nothing overshoots after it opens. | No. At 60 fps the offer opens within 0.13 m of the reach line. | Applied with Harry's approval, not run: Pepi now stands 4.2 m ahead, so the fourth step lands near 2.65 m. The assertion and its bounds are unchanged. |
| `hub pepi samples`: covered `pepi-confirm` | The probe's `point()` reads the button's box even when the dialog is closed or not in confirm mode. A hidden button measures 0×0, so `elementFromPoint(0, 0)` hits something else and the probe reports "Covered". The dialog uses `showModal()`, so no ordinary page element (Tess's panel included) can cover an open one. Most likely the confirmation never opened: Space reached `pepi.use()` while `available()` was false (the Hub's `busy()`, possession or a lock), or the press went elsewhere. Which one is not determined. | Unknown. | Applied with Harry's approval, not run: `point()` now throws `Hidden sample control` with Pepi's phase, held sample, reach, action availability and label, the dialog's mode, the driven Ooga, the pilot's refusal, the focused element and Tess's phase, apart from `Covered sample control … by <element>`. |
| `hub pepi samples`: null `health` | Phone sessions only, after the reload or the lab round trip: the probe ignores `untilPage`'s false (timed-out) result and then reads `__ooga.pilot.player.health` while no Ooga is driven. Pepi's clean-up never touches possession, so either the Hub had not handed the Ooga back yet or it never did. | Unknown. | Applied with Harry's approval, not run: the reload, the lab round trip and signing back in after the desktop logout (the same unchecked wait) now throw `Pepi owner not driven <when>` with the scene, account and driven Ooga. |

Harry lifted the stop for these three test edits and **one** rerun on his Mac: `npm run build`, then `VERBOSE=1 ONLY=pepi node test/run.mjs hub`, which also spends the phone playthrough's permitted rerun. The check keeps its name and its ledger entry. Until that run: desktop OBL-07 to OBL-12 full flows, the desktop approach records and the lifecycle probes have no new result. Still untested: live multiplayer, real OAuth, physical phones and pads, screen readers, audio quality. Nothing was pushed, and no PR or external contact was made.

## Upstream merge and companion removal, 2026-11-08

At Harry's request a cloud session merged upstream `OogaBoogaX/oogaboogaland` `rock` (`073c5a1`, 816 commits past `a1100ee`) into this branch, then removed the navy companion. Nothing was run in a browser.

- **Merge (`dc109ac`):** conflicts in `AGENTS.md`, `controls.js`, `crew.js`, `hud.js`, `pilot.js`, `scene-hub.js` and `test/run.mjs` were resolved by keeping upstream and re-adding Pepi's pieces. Upstream removed the HALLOWEEN ghost hunt, so Pepi's busy check no longer asks it (that reference would have thrown). Upstream rewrote the touch action button's position (`--act-inset`, `--home-chrome`) and lifts Tess's tour panel over the sticks; the Tess offer fix is restated in those variables (164 px in an ordinary phone browser, as measured on 2026-11-01) and leaves the tour panel alone.
- **Companion removed:** `pepi.js` builds one visitor (the `list` stays, with one entry), drops the companion's lines (`BL.pepi.QUOTES`), his tap reply and the visitor-pair clearance, and keeps Pepi's own rate at one line every 22 s (`MUTTER_GAP`). `pepi-models.js` loses the navy coat and fur and its `variant` parameter; `pepi-cinematic.js`'s `mutter(count, volume)` loses its speaker pitch; the Hub's tooltip names Pepi alone.
- **Checks changed with it** (a removed feature takes its checks with it): the posture unit check builds one rig; the playthrough's signed-out count, mutter check (ten lines in order, nothing new 11 s after a line, a tap stands Pepi without speech), mesh-picking check (Pepi's head, then he goes back to −18, −12), roaming count, offer and catalogue checks and the return check expect one visitor. In the stopped `hub pepi samples` step only the companion's placements and its pair count were removed; nothing else there changed, and it was not run.
- Verified here: `npm run build`, `node --check` on every changed file, `git diff --check`, every browser snippet in the Pepi tests compiled in Node, and `npm run test:unit`, **486/486**, including the Pepi posture, roaming and effects checks. Harry's one approved rerun on his Mac (`VERBOSE=1 ONLY=pepi node test/run.mjs hub`) now also covers these changes.
