# PR #173 acceptance follow-up — published evidence

Branch `acceptance-repairs-evidence` (off `839934c`). Raw artifacts from the acceptance
repairs and the A1/A2/A3 diagnostics, with integrity hashes. Nothing here changes source;
this branch carries evidence only.

## Contents

| File | SHA-256 |
|---|---|
| `evidence/a1-overflow-census/REPORT.md` | `2424abc16052c448a7f2f2caaca2978a29981b26ccf73ee4c9884916067cb5e7` |
| `evidence/a1-overflow-census/census-probe.mjs` | `5358e25ac3b51098f88a42d85f0565b152fa2215d71b3081f96a6858d563b53e` |
| `evidence/a1-overflow-census/census-raw.json` | `18c759b34f901d6cc544f11079ca0e84c0ceae7d0fbc34b0e78605eff419e622` |
| `evidence/a1-overflow-census/control-run.json` | `22ac242a4514e251c6739d49237c50f5b9a2cca8003d87960fa3ebcb462c4304` |
| `evidence/a2-ray-volume/RAYVOLUME-REPORT.md` | `075207cd1788ef0ae5059060c152e857db7960c411781e5d6aea24bbc5f982a7` |
| `evidence/a2-ray-volume/rayvol-control.json` | `87b5d6f7881c84bffef4c925aebeaca674575981deab550e76cdaafdc2b1df80` |
| `evidence/a2-ray-volume/rayvol-probe.mjs` | `8a414e8e891394d44778e24918707739ef1e3599b14876e82e42ddc05ba6903f` |
| `evidence/a2-ray-volume/rayvol-raw.json` | `53958edc0c3a12c9d7ec16a93db7f78ea4d0d4ed9790e6d0d1ff407a2f3db823` |
| `evidence/a3-union-ray-memo/CANDIDATE-REPORT.md` | `1f6825cf1ab3cd9654a03452c9e3ae83c9289be437bfaf5d27b90b320a9a2af0` |
| `evidence/a3-union-ray-memo/memo-bitwise-raw.json` | `53958edc0c3a12c9d7ec16a93db7f78ea4d0d4ed9790e6d0d1ff407a2f3db823` |
| `evidence/a3-union-ray-memo/memo-probe.mjs` | `27cd632e06c868a38ecc8a1759335d14c2599895bf4527c6ca253df2d986a703` |
| `evidence/c3/c3-proof-final.log` | `8a72535fd655166677d82f880fed36c343fcc2965892f0cfe5aa4db65db985fc` |
| `evidence/suite/PROGRESS.md` | `b047d53e75f90ab865936238d0e24803686de58c5c5468382c3ee3373becb995` |
| `evidence/suite/SUMMARY.md` | `8f330cc8d29907e194a3047c2787a92215cc0262299e3cac44fc2fa9ead4f963` |
| `evidence/suite/after-test-unit.log` | `55d20c294ed180a483eb0082baca9a20632eb121eaeda25fe61adc757b7b1861` |
| `evidence/suite/before-test-unit.log` | `20bc1ca7409de02ffeeba9e9f9efbb43dd4fe2765a3a45a88c5b27bcbe5e38c8` |
| `evidence/suite/final/00-unit.log` | `0541b87669db627ea08d9a61d6d47ee581da72ee67d9e1eac2b7dd7f354d1bdc` |
| `evidence/suite/final/01-perf.log` | `c506c45d0e8ea1369f362fbcda0d5974b3288c2fb010bb5c993d1e6ca0245d34` |
| `evidence/suite/final/02-poker-protocol.log` | `2fab70f9bd9993d8f0ccbf59c3ab2331d650e87ea367088fd28459d6836a2a66` |
| `evidence/suite/final/03-hub-gorilla.log` | `c3ddf440bd60704463a979ffa2adb5a69ab63527e54de8f5310aa406b2804ccd` |
| `evidence/suite/final/04-hub-core1.log` | `d03c33d486c6f6338d0a0aecc92450ca3ba2290316a43b3d29515b2b4c8656a1` |
| `evidence/suite/final/05-hub-core2.log` | `b88b11f477db2c9edb79261ea856791e4b1d34ad5db7a738cd21d70bdb817280` |
| `evidence/suite/final/06b-hub-mirror.log` | `54e0eeeff213906b2cfc07d3709862c492fd5ba28dc91df13c125611927ac949` |
| `evidence/suite/final/06c-hub-labeled2.log` | `10a3961b29879f8cad33d4bbf5c76eab90e4a9bbd63b82f76c0f51897040e7c7` |
| `evidence/suite/final/07-dsb-a.log` | `d09c55f81369fe4ae2f4fff5d828488344f947f02e8414995be04abc671bff61` |
| `evidence/suite/final/08-dsb-b.log` | `e33c51fe3f5a37487d209a33db44f8b7ed4b847b5095aebb0a8c5947a089a9fc` |
| `evidence/suite/final/09-dsb-c.log` | `14abf4d6063b8c2225c962c99acb550526420f49535d191f3350851a7d0ae381` |
| `evidence/suite/final/10-dsb-d.log` | `c4a967f8943bce3370938f27b58b301bc17568dba648c4e6bda00ee4e257e895` |
| `evidence/suite/final/11-dsb-e.log` | `0abece23b7068f83a57f1a6406b8a50ee7dec44dd6f9c49239d299e125bc6a68` |
| `evidence/suite/final/12-lab-group.log` | `b10039646ef411a8afef5ae31f419ba4b0fdf9cdf19afd5fb4415e0127f16a33` |
| `evidence/suite/final/13-factory-bifrost.log` | `61d53c6c2432fc3915d794707f594850487febf09f40d9fb202b60390e533fbe` |
| `evidence/suite/final/14-poker-arcade.log` | `445228d20a008f115622315db38d1b8b0476e64c128ae0040032126a32df8a97` |
| `evidence/suite/final/15-smalls1.log` | `35c671676b176cd9cce33392f2b9ceec8a5314cd2fc0f24d18b8eb9386e632f7` |
| `evidence/suite/final/16-smalls2.log` | `efd2ed4f1ebe79361fb3af80bed6a7f686d487c0f70abbaba803632c81b31266` |
| `evidence/suite/final/SUMMARY.md` | `9be750672fe846f645f3119f05b58fbca424556b8a0d6458e817d777ce3c0564` |

## Layout

- `a1-overflow-census/` — A1 per-rebuild overflow-cache census and verdict (family dead).
- `a2-ray-volume/` — A2 caller-attribution census (one caller owns the boundary workload).
- `a3-union-ray-memo/` — A3 union-ray memo gate run and rejection report.
- `suite/` — terminal full-suite aggregates and chunk logs at the repaired head, plus the
  before/after unit logs for the cycle-safe runner repair.
- `c3/` — pooled-browser reset storage-race proof output.

## Recorded in `docs/acceptance-followup-evidence.json` but NOT present here

These original artifacts (the author's rejected exact-overflow-index patch, its perf logs,
proof payloads, the synced-rock logs and the earlier stall/attribution/census reports) were
searched for across both checkouts on this machine (`untracked/` in full, all worktrees,
`verification/`, `*.patch`) and were **not found**. They exist only on the original author's
machine; the recorded SHA-256s below identify them for verification when located.

| Artifact | Recorded SHA-256 | Status |
|---|---|---|
| `origin-rock-synced-20261007-perf.log` | `7f9181c2d50909711318838353f3888d2bb44defe3c637aadb3f069e103c27a8` | missing — not on this machine |
| `origin-rock-synced-20261007-dsb.log` | `3a5a48afd06850e97e92f5016535b75028f6fcd1f447706b4c9bd834c191576e` | missing — not on this machine |
| `origin-rock-synced-20261007-workload-hashes.json` | `07889a8eab8d3f8d192a9c848965df2b21442132226dd79b0d905ca52d034a57` | missing — not on this machine |
| `overflow-index-control-perf.log` | `92852482e39c317faa9821c9e1c5ae2cd1f63c388b9adc6f2feb18880fb34915` | missing — not on this machine |
| `overflow-index-candidate-perf.log` | `7356c2dbfb545b7e431f4067c9546f6bf7d7ae4aa22bad70b34f1fd655ad2a13` | missing — not on this machine |
| `overflow-index-candidate-proof.json` | `a41262ed2f27d2628c2eb8557738d610bf73de29d7dbebe01248697cb3fff8ba` | missing — not on this machine |
| `overflow-index-memory-proof.json` | `15bd355a52552551a44fae10b780ebe7a45d0129a350c87d9c42b3d6e7fe88d1` | missing — not on this machine |
| `overflow-index-candidate-outcome.json` | `73068991b2038ce327779c07ee91f9ebbde906bcd2df4692ea2401ebec7501f1` | missing — not on this machine |
| `overflow-index-rejected-candidate.patch` | `47e7b6b797550ca02313816af64b8e5bd99bebacb4285c8dfb834f8450f306f8` | missing — not on this machine |

Recorded by name in the evidence JSON, also not found on this machine (no SHA-256 recorded):

- `dsb-stall-9c74.json`
- `factory-stall-9c74.json`
- `dsb-stall-9c74-locked.json`
- `factory-stall-9c74-locked.json`
- `covered-native-attribution-5a.json`
- `covered-cpu-attribution-5a.json`
- `lifecycle-native-descriptor-preflight-5a.json`
- `lifecycle-native-descriptor-dsb-5a.json`
- `lifecycle-native-descriptor-factory-5a.json`
- `lifecycle-system-post-snapshot-5a.json`
- `lifecycle-system-async-scheduler-summary.json`
- `owner-branch-census.json`
- `owner-fallback-census.json`
- `lifecycle-awaited-scheduler-pair-summary.json`
