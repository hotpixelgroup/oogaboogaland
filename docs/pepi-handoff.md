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

Harry's latest appearance request supersedes the original gorillas: tan Pepi and an unnamed navy companion are feeble elderly baboons in trench coats. They roam on all fours at 0.8 m/s, half nominal crew speed, stand when addressed, recover blocked paths and alternate twenty ironic doomsday/NPC captions. Only Pepi has a shop role. Do not invent a name or commercial role for the companion.

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
