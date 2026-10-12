# Santa Monica reference and Ooga Pier scale

Reference pass: 11 October 2026. One world unit represents one metre. Ground distances are recalibrated; canonical Ooga bodies, storefront heights, ride geometry, gravity, walking, jumping and flight remain at their existing DSB scale.

This is a photo-era, playable interpretation of the historic pier. It is not a survey, a traced parcel model or a reconstruction of the temporary 2026 construction layout. The beach width and path spacing vary along the real coast; the game simplifies them into a continuous section.

## Sources and confidence

- The City's [May 2023 Recirculated Final EIR/EA](https://files.ceqanet.lci.ca.gov/146342-5/attachment/3tudvDhq1iLNnRRKz_IVnbbfMuyGlBxBkP4wedrsozEzG8qERDukYutd86d_tEkgTJf4qACbC0q-XCs50) describes the existing 1939 bridge as 488 ft long and 34 ft wide, with a maximum 10.2% grade and a crest 36 ft above the pier deck. Figure 1-3, Existing Site Conditions, shows Ocean Avenue above the beach, Moomat Ahiko Way/Appian Way below the approach, and the separate Ocean Front Walk and Marvin Braude Bike Trail. Existing dimensions are used, not the alternative replacement designs elsewhere in the report.
- The [NOAA station 9410840 benchmark sheet](https://tidesandcurrents.noaa.gov/benchmarks/9410840.html) locates benchmark 0840 L 1990 near the pier end of Colorado Bridge, approximately 193 m southwest of Ocean Avenue's centreline. This is a historical overall approach reference, with different endpoints from the 148.74 m structural bridge; the two numbers are not interchangeable.
- A georeferenced export from [Esri World Imagery](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) supplies approximate pier, shoreline and road relationships. Its identify metadata names Vantor Vivid Advanced LG04, captured 9 January 2026, with 0.34 m resolution and 8.47 m stated accuracy. Small geometry and shadow edges remain ambiguous. The full pier axis measures roughly 560–580 m depending on the selected inland endpoint; the playable layout rounds to about 560 m.
- The City's [survey information](https://www.santamonica.gov/property-and-survey-information) and [2023 aerial item](https://www.arcgis.com/home/item.html?id=d3a1837c8b7141c1b88d395517a7a178) were checked, but its imagery service requires licensed access. Its pixels were not used for these measurements.
- The [City's current bridge project](https://www.santamonica.gov/programs/pier-bridge-improvements) confirms work and access changes underway in 2026. The reference photos and the City's historic site plan guide the design instead of temporary construction features.

The downloaded Esri export covers longitude -118.5055 to -118.4910 and latitude 34.0055 to 34.0155. Its 2000 × 1665 image is returned in EPSG:3857 with extent X -13191971.9162 to -13190357.7836 and Y 4029540.1438 to 4030883.9092. A pixel is about 0.8071 Web Mercator map metres; multiplying by cos(34.01°) gives approximately 0.6690 ground metres per pixel. Measuring image pixels without that correction would exaggerate lengths by about 21%.

Manual deck-join and outer-tip anchors at approximately (1194, 965) and (778, 1320) yield about 366 m. These are image estimates, not surveyed control points. Road widths, deck taper and trail offsets are rounded interpretation values; precision in the source constants only reflects exact conversion of the documented bridge dimensions.

## Applied dimensions

| Feature | Reference / game value | Confidence and adaptation |
|---|---|---|
| Historic structural bridge | 148.7424 × 10.3632 m | City: exact conversion of 488 × 34 ft |
| Crest above pier deck | 10.9728 m | City: exact conversion of 36 ft; this is a relative elevation, not a sea-level datum |
| Bridge grade | Maximum 10.2% | City maximum; game uses a straight 107.58 m descent at that grade and a level upper span, simplifying the real vertical curve |
| Ocean Avenue to deck connection | 193 m | Historical NOAA endpoint reference, rounded gameplay connection |
| Pier deck to ocean tip | 365 m | Rounded aerial estimate |
| Ocean Avenue centre to ocean tip | 558 m | 193 + 365 m; approximately 560 m |
| Inland amusement deck | 82 × 90 m | Idealized broad deck, offset west of the municipal promenade |
| Outer amusement deck | 70 × 144 m | Idealized narrower continuation; silhouettes and existing rides retained |
| Fishing pier continuation | 14 × 120 m | Rounded, narrow playable corridor |
| Terminal lookout | 38 × 11 m | Idealized widened end |
| Mean waterline to bike trail centre | About 171 m | Approximate southern beach section; real beach varies, allow roughly ±20 m |
| Pedestrian / bike trail centres | 36 m apart | Rounded aerial interpretation; pedestrian path inland of bike path |
| Ocean Front Walk | 6 m wide | Authored playable width, not a verified survey width |
| Bike trail | 4.8 m wide | Authored playable width, two clear lanes |
| Appian Way / Ocean Avenue | 10 / 22 m wide | Approximate game carriageways; not verified lane surveys |
| Explorable coast | 600 m across | Gameplay limit; 3.6 km of coastal scenery continues into haze |
| Storefront height | 4.4–5 m | Existing DSB-relative scale retained |
| Deck / mean ocean Y | 1.35 / -0.3 m | Existing DSB harbour and ocean levels retained |

## Coordinate and connection contract

The local axis is aligned to the pier: +Z inland, -Z oceanward, X along the coast. This is an axis-aligned interpretation of the aerial footprint, not real-world latitude/longitude coordinates.

- Pier tip Z -270; arrival deck ends at Z 95; Ocean Avenue centre Z 288.
- Main approach begins at the deck at Z 95. The slope reaches Y 12.3228 at Z 202.5765; the historic structural span ends at Z 243.7424. The upper connection continues to Ocean Avenue. The entrance sign is at Z 258 on an 18 × 22 m forecourt (Z 255–277), with spawn at Z 284 and the return gate beside the sidewalk at X -14, Z 274.
- Mean wet edge is about Z -48.67, bike centre Z 122, Ocean Front Walk Z 158, Appian Way Z 180. Both paths and the lower road pass beneath the elevated approach. Columns stand outside their lanes.
- Three low beach ramps leave the arrival deck: the rear ramp at X -35 ends at Z 112 before the bike lane; side ramps leave X -75 and X 7 at Z 92. Rail openings match those joins.
- The amusement deck sits west of the long municipal promenade. Shop fronts face east across it, preserving open ocean-side sightlines. Café sets remain in gaps beside the shops, clear of the promenade and train envelope.

The historic approach's small rise from Ocean Avenue to its crest, exact street curves, uneven shoreline, individual parking areas and asymmetric northern/southern trail routing are not reproduced. The current geometry expresses the documented scale, elevation separation and broad footprint while preserving established gameplay.

## Gameplay, water and presence

No canonical body, movement, jump or flight constants change. Ride speeds, track geometry, boarding controllers and the locomotive's one-second fresh-Space window remain unchanged; ride and game positions follow the new deck layout. DSB's shared ocean FFT, spectrum, level and optics are reused, with the same local simulation patch and distant water faces extending the view.

The local walking/flight bounds are X ±300, Z -280 to 310. Boats sail within X ±550, Z -800 to -65. Only `scene-pier` gets multiplayer X/Z bounds of ±900 to cover the boats; other scenes keep their existing ±160 limit and existing vertical limits. The client and Worker protocol changes must deploy together for signed-in presence across the expanded waterfront. No Worker deployment was performed in this local task.

## Validation and remaining review

The original measurement pass completed build and syntax checks only. The subsequently requested visual playthrough on 11 October 2026 walked the full approach, both trail underpasses, Appian Way and all three beach ramps in both directions with the widest Ooga, using real held keyboard input. It found an invisible collision under the open bridge sheet; closing the ramp meshes with an 18 cm underside restored access without altering the canonical collision or movement rules. The upper forecourt also now meets the road without overlapping it. The entrance was rebuilt from the official Santa Monica arch photo and inspected from both sides; inland scenery now continues behind Ocean Avenue instead of showing ocean there. The documented bridge and coastal distances remain unchanged.

`ONLY='pier boardwalk and gateway' npm test -- pier` passed **216/216** checks, including full-length trail traversal, both directions on the approach and ramps, the pier tip and both ₿IFRÖST crossings. The pier session printed SLOW at 59.7 seconds against its 25-second budget. Build/staging and syntax checks passed after the final scenery-only adjustment; that adjustment was visually rechecked in WebGL and Canvas 2D. Canvas's coarse overview face sorting remains visible. No console warnings or errors appeared in the reviewed pages. The earlier two prize-counter STOP entries remain outstanding and were excluded. The initial sandbox Chrome-launch ledger entry remains historical. See [the visual review](ooga-pier.md#waterfront-and-entrance-visual-playthrough--11-october-2026) for details and saved screenshots.

Remaining maintainer review includes every boarding/play/prize pad and safe ride exit after the relocation, storefront visibility, sunset reflections at the longer tip, phone controls, Canvas 2D sorting and signed-in peers at the new outer bounds after the client/Worker changes deploy together. Ride controllers and prize code were not changed in this visual/access pass.

## Phase 1 authored landmarks

The approved [roadmap](pier-roadmap.md) adds recognizable landmarks within the existing deck footprints. These dimensions are gameplay reservations, not new satellite measurements. The official [pier directory](https://www.santamonicapier.org/explore-the-pier) confirms the aquarium beneath the historic carousel building; the [Pacific Park directory](https://pacpark.com/visit/santa-monica-pier-directory/) locates the Hippodrome at the landward/east end. The local -X/+X coast remains an approximate interpretation of north/south, rather than a compass survey.

| Landmark | Centre X, Z | Authored footprint / height |
|---|---|---|
| Looff Hippodrome | -25, 80 | 24 × 18 m; upper floor Y 3.65; 6.8 m to roof underside, clearing the original 6.6 m carousel canopy |
| Aquarium | Same footprint beneath hall | Sand support Y 0.35; ceiling Y 3.25; 2.90 m clear height; 3 display tanks and a central open aisle |
| Carousel stair | East side, Z 86 | 3 m wide; X -6 to -13; ten 0.23 m rises from the boardwalk |
| Aquarium boardwalk entry | East side, Z 76 | 3.4 m-wide descending ramp, X -6 to -13; 1 m descent in 7 m |
| Aquarium beach entry | X -25, Z 89 to 101 | 4 m-wide lowered corridor and a matching opening in the arrival rail |
| Pirate ship | -49, -79 | 18 × 24 m reservation; approximately 10 m fixed support height |
| Scrambler | -49, -53 | 16 × 16 m reservation; 6.5 m platform radius |
| Drop tower | -49, -126 | 10 × 12 m reservation; 22 m height above deck |
| Bumper pavilion | -47, -1 | 20 × 18 m; low open sides and 4.7 m canopy |
| Park entrance | -34, -34 | 8 × 2 m reservation; crossbar above head height |
| Playland Arcade | -56, 44 | 20 × 24 m; 4.8 m building height plus low rooftop fins |
| Sunset Seafood | -59, 78 | 20 × 16 m; 4.8 m height; three café sets at X -44, Z 72/77/82 |
| Route 66 sign | -19, 63 | 4 × 4 m photo alcove; three stacked signs keep the requested text readable |
| Fishing | West side of terminal lookout | Two fishermen at (-15, -266.5), (-15, -263), replacing two promenade walkers to retain the 32-person cap |
| Muscle Beach | 90, 76 | 24 × 18 m reservation; rings and parallel bars, clear of courts and trails |

Arrival slab, plank seams and transverse bents are split around the basement and both entrances. Closed floor/wall/ramp meshes provide layered support through the existing collision engine. No artificial underground doorway remains behind a solid deck. The upper stair was moved to Z 86 and lower ramp to Z 76 to keep their entrances and headroom separate. The carousel retains its six horses, geometry, motion and 24-second circuit; only its position and floor elevation change. All other ride contracts, including the one-second Space train window, remain unchanged.

The four new park exhibits are static in this phase, as specified in the prompt pack. Their boarding/game controllers, Playland cabinets and educational interactions belong to later phases. Existing lifeguard towers, café props, shared benches/barrel bins, string-light kit and exposed pilings are reused. Distant bluffs/palms and low north/south/offshore ridge silhouettes are authored scenery inspired by the reference geography, not traced contours. Their positions live in `pierModels.LAYOUT.backdrop`; scenery stays outside walking/sailing bounds and clear of the lighthouse.

Debug cameras: `view=pier-park`, `view=pier-hippodrome`, `view=pier-tip`, and `view=pier-aquarium`, with `debug=1`. Regular arrivals still begin beneath the Bitcoin Boardwalk approach sign.

### Phase 1 verification — 11 October 2026

`ONLY='pier landmark access,pier carnival circuits,pier round trip,pier landmark review' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **243/243** checks. The widest Ooga walked the upper stairs, both lower entrances, western park aisle, arrival plaza, central promenade and boat connection in both directions. Boarding from the aquarium was rejected; upstairs boarding and the original 24-second carousel circuit returned the same upright Ooga to Y 3.65. The wheel and continuously moving train retained their boarding/exit checks, including the train's one-second fresh-Space window. A launch sailed on DSB water and returned its rider safely to the original pier dock. Two scene round trips retained the leave contract.

The first review exposed unsupported commas in the shared sign font; Route 66 now uses geometric commas and middle dots over that font's space cells. The walk then exposed an incorrectly wound roof underside, which made collision queries treat the upper hall as solid. Correcting the closed roof's winding restored both the stairs and boarding without changing collision rules or body physics. The final text punctuation refinement passed syntax/build checks.

All four review cameras were inspected at summer sunset (18.8, day 172) and night (22) in WebGL2 and Canvas 2D, with clean console/renderer-health checks. Evidence is saved locally under `untracked/pier-phase1-review/`. WebGL shows the coastal colors, separate upper/lower entrances, static park silhouettes, fish displays, fishermen, exposed structure and open water. Canvas remains usable but retains the existing painter-sort artifacts: large deck and ceiling faces can draw over smaller details in elevated views and inside the aquarium. No shared renderer change was made in this phase.

At 1440 × 900, one-second focused, vsync-enabled park samples measured **60.8 / 60.8 / 59.9 fps** at fixed low/medium/high tiers, with actual shadow resolutions 512/1024/2048 and two shared water textures throughout. Median CPU render submission was about 2.1 ms and p95 2.3–2.4 ms. These short local observations do not establish a sustained frame-rate guarantee on other hardware. The Canvas review and functional pier sessions printed SLOW at 51.6 and 48.0 seconds against the suite's 25-second session budget.

Build/staging and syntax checks passed. The two pre-existing prize-counter STOP checks were excluded and remain unresolved in the ledger; startup-only entries from the initial failed boot remain historical. No shared physics, water spectrum, saved-state schema, Worker deployment or repository commit changed. Maintainer review still includes touch/phone play, long-session performance and signed-in peers after the earlier client/Worker presence changes deploy together.

## Phase 2 interaction layer — 11 October 2026

The approved second phase adds one visit-owned interaction registry in `pier-interactions.js`. Eleven existing stations share cached, noncolliding orange prompt rings: three rides, two midway games, the prize counter, two launches, the gate and two beach vendors. E activates only a nearby eligible station and otherwise retains camera rotation. Tap prompts call those same controllers. The train prompt describes its one-second window; neither E nor tapping can bypass its fresh-Space boarding rule. No new ride, game, collision mesh, ocean simulation or population was added.

The foldable map shows the player's heading, station icons and numbered Passport landmarks. Inland is at the top and ocean at the bottom in the authored local frame; this is not a geographic compass survey. Map and ticket controls sit above the phone joysticks. World prompts are clamped inside the screen below the toolbar when nearby cart geometry pulls the shoulder camera in.

The Passport saves `{version:1, stamps:[...], prize:false}` in the existing local game state. The loader accepts known unique stamp IDs, rejects unsupported versions and permits a saved claimed prize only with all ten stamps. Nine landmarks require exploring on foot at the appropriate floor: Bitcoin Boardwalk, Hippodrome, Aquarium, Pacific Park, Playland, Route 66, Sunset Seafood, Muscle Beach and Fishing Lookout. The lighthouse stamp requires sailing within 32 m while aboard a launch. Completion unlocks one free Orange Beacon medallion at Tickets and Prizes, with saved ownership and a visible counter display.

Coral and Sunny reuse the two existing ice cream vendors. Their native modal cards show one short fact, optional Learn more detail, a source link and the existing cosmetic ice cream action. Copy lives in `pier-facts.js`, reviewed against the primary [Bitcoin developer guide: Block Chain](https://developer.bitcoin.org/devguide/block_chain.html) and [Wallets](https://developer.bitcoin.org/devguide/wallets.html). Dialogs isolate movement and Space, clear held input and return the same Ooga to walking through Escape or Back to boardwalk.

Prize redemption was fixed first. Closing a game or counter releases hidden focus; trade clicks require an open counter and an enabled button; affordability refreshes with the saved ticket balance. Shared redemption rejects invalid costs before spending. The former STOP assertions had also selected a hidden arcade prize-list row; they now target the active pier button. Their affordability and one-redemption assertions pass without changing the required balances or thresholds.

Vendor diagnostics confirmed two separate causes: the Escape fixture walked into the cart, and the nearby prompt could project outside the viewport. The fixture now walks along clear sand; pointer checks reject hidden or covered targets. Prompt clamping fixes the actual desktop/phone projection problem. Movement-distance, modal isolation and identity assertions retain their original thresholds.

The earlier Phase 1 prize STOP note above describes that phase's historical state and is superseded by this implementation. DSB metre scale, canonical character movement, gravity, step height, water spectrum and the train's boarding timing remain unchanged. Build/staging, focused verification and final counts are recorded below. No new visual reference pass, long-session performance measurement, Worker deployment or repository commit belongs to this phase.

### Phase 2 verification

`ONLY='Phase 2' LANES=1 npm test -- pier` passed **243/243** checks, including both desktop and 390 × 844 phone playthroughs. E and a real pointer click opened the two vendor cards, optional detail/source remained accessible while movement and Space were isolated, and Escape restored the same walking Ooga along clear sand. All ten stamps survived reload, the lighthouse required a boat, and the free medallion redeemed exactly once with saved ownership and a visible counter display. Navigation controls and both phone joysticks were visible and uncovered; map folding and the two-visit leave contract passed with clean console and renderer-health checks.

The earlier focused midway/carnival run passed the existing prize affordability and one-redemption checks, both five-throw game rounds/payouts, all three ride circuits and the train's one-second fresh-Space checks, including rejection of E/tap as a boarding bypass. That run exposed the Phase 2 vendor/layout failures subsequently resolved above. Final syntax checks passed on every touched JavaScript file, and `npm run site` rebuilt/staged the local preview. These are focused checks, not a claim that the unrelated full-suite failures have been resolved.

## Hash Fishing — Phase 3

The first approved Phase 3 game occupies the western fishing reservation. The play pad is (-11, -264.5) at the existing Y 1.35 deck; the sign is (-16.8, -261.4). Casts extend 14 m toward -X, past the west rail into open water. These are authored gameplay dimensions, not additional Santa Monica measurements. The sign is offset from the rod/bobber line of sight. The pad, pooled tackle and basket add no collision shell; only the fixed sign joins the existing solids. The central walking lane and +X boat approaches stay clear.

The short round illustrates proof-of-work targets through one random 32-bit draw per cast. Success earns five pending tickets; every three catches retunes toward an eight-second catch pace. The shared balance receives one payout at 75 seconds, and the validated `pier.fishing` best survives reload. Escape or Back to boardwalk exits with the same upright Ooga; abandoning a partial round does not bank pending tickets. The short lesson, optional detail and primary source live in `pier-facts.js`.

The game reuses DSB's ocean height sampling and canonical gravity for casting and splash effects. Rod, bobber, line, fish and basket geometry are cached; the fish display and three audio voices are bounded. Audio unlocks on a trusted gesture, uses the existing pier mute and disposes its context/listener on departure. The locked camera keeps the float in the seaward view. On phone, the active card sits below the casting area and unused sticks/hints are hidden until exit.

Review URL: `http://127.0.0.1:8081/oogapier?debug=1&view=pier-fishing&hour=18.8&day=172&nosim=1`. Regular arrivals and all existing ride boarding windows remain unchanged.

### Hash Fishing verification — 11 October 2026

`ONLY='Hash Fishing' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **228/228** checks after the final camera and clock refinements. Desktop used real keyboard input; the 390 × 844 phone used dispatched touch taps through a complete round. A forced miss and subsequent catches exercised the one-draw rule, repeated Space, movement isolation, water-following bobber, retargeting, exact saved ticket delta, best-score reload and one-time payout. Escape restored walking; tap entry followed by native Space casting and a focused Back button discarded an unfinished round and restored navigation immediately. The two-visit leave contract and clean console/render-health checks passed. Pure rule checks cover target equality, missed and late casts, fast/slow retargets, step-size consistency, maximum payout and malformed/older saves.

The first review found a wrapping exit label and frame-delayed phone navigation restoration. Later inspection moved the sign out of the casting sightline, raised the casting camera to clear the handrail, and placed the active phone card below the bobber while hiding unused walking controls. A variable-frame run also exposed floating-point drift in the completed clock; the terminal transition now records exactly 75 seconds. Assertions and required balances were retained.

The earlier combined run passed the existing three ride circuits, one-second fresh-Space train checks, both midway rounds and prize affordability/redemption checks. Its initial fishing UI failures were fixed in the focused runs above. Visual evidence is saved in `untracked/pier-fishing-review/`: desktop and phone casts, the sunset review camera and `performance.json`. A one-second local WebGL overlook sample ran at approximately 60 fps on the automatically selected low tier, with two shared water textures. This is a short local observation, not a sustained or all-tier frame-rate guarantee. Canvas, signed-in peers and unrelated full-suite failures were not retested in this phase. Final JavaScript syntax checks and local build/staging passed.


## Block Builder — Phase 3

The second approved Phase 3 game uses `LAYOUT.builder`: table centre (32, 76), play pad (32, 81), sand Y 0.35, sign (28.8, 74.5), reservation 7 × 11 m. These are authored gameplay dimensions. The 4.2 m square tabletop is approximately one metre above the sand. Its front remains almost three metres from the pad; it adds no structure to the pier's central lane or coastal view. The east beach ramp ends at (22, 92), the nearest volleyball court is centred at (60, 40), and both coastal trails remain well inland of the station.

Block Builder is a deliberate packing puzzle. A 75-second timer bounds a six-by-six block and three offered transactions. Two-to-four-unit shapes rotate and occupy only empty in-bounds cells. Their one-to-six-unit fee rates make space efficiency visible alongside total fees. Four invented game fees become one shared carnival ticket; a completed block cannot exceed 216 fees or 54 tickets. The deadline pays once and saves the fee best. Early exit pays nothing. Saved-state validation preserves fishing and Passport records, including older saves without the new field.

E, Space or the contextual tap prompt opens the lesson. 1–3 chooses an offer, arrows/WASD move its anchor, R rotates, X requests a new offer, and a fresh Space places it. Touch uses offer buttons and grid cells with explicit Rotate, New offer and Place controls. Escape or Back to beach restores the same upright Ooga, navigation and walking controls. Native focused buttons retain their Space activation. The result restates the block-space lesson; optional detail distinguishes the toy shapes/fees from actual Bitcoin transactions. Source review used [BIP 141's block-weight rule](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#block-size) and the [Bitcoin developer mining guide](https://developer.bitcoin.org/devguide/mining.html).

The module owns 36 reusable coloured blocks and four preview blocks, with geometry cached by fee colour. Placement raises a block briefly and emits six pooled sparks; a three-voice sound pool gives placement feedback and a closing fanfare. Its listeners, buttons and audio context dispose with the pier visit. DSB's metre scale, movement, gravity, step height and existing ocean FFT remain unchanged. Existing train, boats, shops and games retain their controllers.

Review URL: `http://127.0.0.1:8081/oogapier?debug=1&view=pier-builder&hour=18.8&day=172&nosim=1`. Screenshots in `untracked/pier-builder-review/` show the keyboard card/table, 390 × 844 touch card, close sunset view and wider coast. The first visual pass compacted the offer previews and used touch-specific control copy. The first touch playthrough also exposed audio startup before browser activation; the pier now waits for valid user activation and listens for pointer release as well as mouse press/keyboard gestures.


### Block Builder verification — 11 October 2026

`ONLY='Block Builder' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **232/232** checks. Real keyboard input and dispatched phone touch taps completed a 36-space fixture block, collected 36 game fees and saved exactly nine shared tickets once at 75 seconds. Rotation, offer selection, blocked placement, repeated Space, jetpack isolation, best-score reload, result lesson, Escape and native focused Back-button exit all passed. Both introduction and active controls were wholly visible and uncovered. The same Ooga resumed walking at the sand height with navigation restored. The two-visit leave contract and clean console/render-health checks passed.

Pure rules cover all six shapes through four rotations, exact displayed occupancy/fees, block-edge and overlap rejection, invalid coordinates, maximum 216-fee/54-ticket capacity, deadline/closed-round isolation, and malformed/older saved data. Collision queries found a clear 20 m beach circulation segment beside the table and clear segments through both coastal trails; the scene retained the same shared DSB ocean instance.

The initial combined run passed the existing three ride circuits, train one-second fresh-Space checks, both midway rounds and prize affordability/redemption checks. It finished 258/259 with only the first-touch AudioContext warning failing. The focused correction above cleared that ledger entry without weakening the clean-console check. Visual review confirmed readable cards, a low table/sign on open sand, and open shoreline/trails in the coast view. These are focused local checks; Canvas, signed-in peers, sustained performance and unrelated full-suite failures were not retested. Final syntax checks and local build/staging passed.

## Mempool Mayhem — Phase 3

The third approved game reuses the 20 × 18 m bumper pavilion at (-47, -1), with its original floor top Y 1.51 and roof Y 6.05. Car centres stay within an authored 16 × 14 m arena. The boarding and exit pad is (-34.5, -1) at deck Y 1.35; its side sign stands four metres farther along +Z. A low perimeter rail stays inside the original footprint. These are gameplay dimensions rather than new geographic measurements.

The 75-second round uses six equal-size cars, three reusable fee tokens and one admission per ten-second gate. The orange player's fee starts at one; each collected token adds two, capped at nine. Only cars past the yellow queue line are eligible. Higher fees win; arrival order breaks ties. Admission resets the car's fee and position, replenishes tokens and adds six pending tickets. The deadline banks once and saves the best ticket total, bounded at 42. Early exit pays nothing. The lesson and source link explain that actual block selection also depends on transaction size, dependencies and validity.

Keyboard uses WASD/arrows to drive and Space to brake; touch uses the existing left stick and a Brake button. A fresh Start seats the same Ooga through the canonical crew contract. Escape and the native Back button validate the exterior exit, restore upright walking, and bring back the hidden roof, navigation and unused controls. Sounds respect the shared pier mute and trusted browser activation; all owned listeners and the three-voice context dispose on departure. Geometry is warmed before gameplay; motion uses a fixed-step bounded simulation without changing any character or ocean physics.

The visual review enlarged the fee digits into contrasting vertical badges, enlarged the Next Block board and marked the exact queue line. Canvas review also found buried large deck/floor and sand faces painting over the cars. The existing pavilion floor and nearby sand now use small faces, and redundant deck slab/seam faces beneath it are omitted; terrain heights and exterior walk surfaces remain the same. The badge and gate board use short backing faces so their raised lettering stays visible in Canvas. No shared renderer was changed.

Review URL: `http://127.0.0.1:8081/oogapier?debug=1&view=pier-mayhem&hour=18.8&day=172&nosim=1`. Local screenshots and a short performance observation are in `untracked/pier-mayhem-review/`.

### Mempool Mayhem verification — 11 October 2026

The combined run, `ONLY='Mempool Mayhem,Block Builder,Hash Fishing,pier carnival circuits,pier midway rounds and prizes' DSB_REVIEW=1 LANES=1 npm test -- pier`, passed **326/326** checks. Real keyboard and dispatched phone touch input drove all four directions measured on screen; releasing or cancelling the joystick cleared steering. Fee pickups, fresh Start boarding, gesture-unlocked audio, repeated-Space and jetpack isolation, a controlled fee-gate admission, the exact six-ticket deadline payout, saved best, no repeat payout, native focused-button exit and walking restoration passed. The same canonical Ooga remained seated during the result and returned upright to the validated pad on exit. The original three rides, the train's one-second fresh-Space window, both previous Phase 3 games, midway payouts and prize affordability/redemption also passed.

After the visual refinements, `ONLY='Mempool Mayhem,pier midway rounds and prizes' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **266/266** checks, including desktop, 390 × 844 touch, Canvas gameplay, the two-visit leave contract, adjacent-lane collision queries and clean console/render-health checks. Pure rules cover fee priority and arrival ties, unqueued rejection, token reuse/capping, contact rebound, wall bounds, fixed-step agreement, braking, the seven-admission maximum and older/malformed saved data retaining all previous pier progress.

The final gate-lettering correction was reviewed in `mayhem-canvas.png`; `ONLY='Mempool Mayhem canvas' DSB_REVIEW=1 LANES=1 npm test -- pier` then passed **228/228** checks. The player, all fee digits and Next Block lettering remain visible above their backing surfaces.

Reviewed screenshots show the contrasting fee badges, yellow queue line, clear touch controls and the pavilion in sunset/night views. The one-second local WebGL sample ran at approximately 60 fps on the medium tier, with a 2.2 ms median render and two shared water textures. This is an observation rather than a sustained or all-tier performance guarantee. Signed-in peers and unrelated full-suite failures were not retested. JavaScript syntax checks and local build/staging passed.

## Double-Spend Whack — Phase 3

The fourth approved game occupies Playland's existing frontage. The cabinet centre is (-44.2, 44), with a 3.65 m width along Z and 2.65 m depth along X; the play and exit pad is (-40.8, 44), Y 1.35. The tabletop is 1.08 m above the deck. Its mounted header reaches approximately 2.85 m above the deck, below the existing awning at 3.4 m. These are authored gameplay dimensions. The building footprint and walking surfaces remain unchanged.

Three targets pop up in nine reusable slots each 2.5-second wave, with three spent-output IDs listed in the HUD. All unresolved targets use the same cyan colour; the player must compare letters against the ledger. A correct rejection adds two points, an incorrect rejection costs two, and a missed repeat spend costs one, bounded at zero. Unspent inputs pass untouched. Thirty independent snapshots fill the 75-second round, which banks at most 40 shared tickets and saves a best of at most 120 points. A repeat hit cannot resolve a target twice; Escape or Back to pier discards unfinished tickets. The source explanation distinguishes this toy whack game from actual node validation and links to [the Bitcoin developer guide](https://developer.bitcoin.org/devguide/block_chain.html#introduction).

E, Space or the shared prompt opens the lesson. Arrows/WASD or 1–9 select, and a fresh Space whacks; touch taps a slot directly. The nine-slot HUD, ledger, Start and Back remain available without walking controls over them. A brief mallet swing, bobbing targets, pooled sparks and three synthesized sound voices provide feedback. The shared pier mute and browser gesture activation apply. The controller restores the same upright Ooga, walking, navigation and controls at the exterior pad and disposes UI, listeners and its audio context on departure.

Visual review found Canvas's large-polygon painter covering some targets and parts of the header. Short faces on the cabinet tabletop and a copied header improve those occlusions. Playland's front wall is similarly divided into one-metre faces, retaining its shell dimensions, shading and collision; no shared renderer or physics changed. The header gained two short supports. DSB's character scale, body physics and existing FFT ocean remain unchanged.

Review URL: `http://127.0.0.1:8081/oogapier?debug=1&view=pier-whack&hour=18.8&day=172&nosim=1`. Local desktop, 390 × 844 touch, Canvas and sunset-frontage evidence is stored in `untracked/pier-whack-review/`.

### Double-Spend Whack verification — 11 October 2026

The first combined run, `ONLY='Double-Spend Whack,Mempool Mayhem,Block Builder,Hash Fishing,pier carnival circuits,pier midway rounds and prizes' DSB_REVIEW=1 LANES=1 npm test -- pier`, passed **364/364** checks. Keyboard, phone touch and Canvas completed a fixture round with 118 points, exactly 39 tickets banked once, and a matching saved best. Correct and wrong hits, repeat Space, empty taps, jetpack isolation, the result lesson, Escape, native focused Back-button exit and restored walking passed. Adjacent porch lanes and the play-pad approach were clear. The existing games, all three rides, the train's one-second fresh-Space window, prize redemption and the two-visit leave contract passed.

Pure checks cover spent-input classification, one resolution per target, wrong/missed penalties, invalid slots, nonnegative scores, thirty-wave timing, the 120-point/40-ticket maximum, different frame sizes, expired/closed isolation, and malformed/older saves retaining previous games and Passport progress.

The expanded mute check exposed a phone HUD overlap and reached the STOP threshold after two failed runs. The maintainer explicitly authorized the focused fix. Live phone hit-testing identified `mode-hud`, inside the equipment controls, over the mute button. Whack now saves, hides and restores the equipment HUD with the inactive walking controls. Its phone card begins below the complete wrapped toolbar; the debug snapshot stays in the unused lower area during play.

`ONLY='Double-Spend Whack phone' DSB_REVIEW=1 LANES=1 npm test -- pier` then passed **230/230** checks. Real touch Start unlocked sound; tapping the shared mute silenced and restored both Whack and the train. Mute, Start and Back remained wholly visible and uncovered in the intro and active round, as did all nine slots during play. The completed round saved exactly 39 tickets and a 118-point best once. Escape and native Space on Back restored the same upright walking Ooga, navigation and equipment HUD, with no hidden focus or early payout. Updated phone evidence shows the toolbar and game card separated, with no equipment controls over either.

`ONLY='Double-Spend Whack desktop,Double-Spend Whack canvas' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **250/250** checks after the HUD fix. Both renderers retained sound, selection, scoring, payouts, exits and clear lanes; the desktop leave contract passed. The previous failure's ledger entry was removed after all three flows completed successfully, since the runner records an outer flow failure but only individual assertion names on success. No assertion was removed or weakened.

Screenshots show the mounted header, active letter targets and ledger, clear keyboard card, revised phone grid and sunset/night frontage. No full suite or signed-in peer checks were run. The final desktop session's 28.8-second `SLOW` warning concerns test runtime, not a failed frame-rate assertion. Syntax checks and local build/staging passed.

## Seed Phrase Match — Phase 3

The next approved game occupies Playland's porch at (-43.45, 53), with a grounded play/exit pad at (-40.8, 53), deck Y 1.35. The card table's footprint is 2.4 m along X by 3.5 m along Z; its surface is one metre above the deck. Its header is at deck +2.3 m, below the existing awning and forward of the windows. The pad and table are nine metres along the frontage from Whack. These are authored gameplay measurements rather than new geographic estimates.

A 75-second round shows twelve numbered public pier words for 12 seconds. The player then swaps shuffled cards back into the observed order using arrows/WASD and Space, or two taps. Check order reports a count without exposing individual correct positions. A perfect check secures the order and locks further edits; tickets stay pending until 75 seconds. The final arrangement earns two tickets for each correct position plus a six-ticket perfect bonus. The best correct count is a validated integer from zero to twelve in `pier.seedMatch`; existing saves retain all earlier games and Passport progress. Early exit discards pending rewards.

The lesson is “Wallet recovery words need a private backup in the correct order.” Optional copy explains wallet-generated BIP 39 mnemonics, an optional separate passphrase, differing backup formats and the limitations of memorization. The primary reference is [BIP 39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki). The twelve public game words are deliberately a toy puzzle. There is no wallet creation, recovery-word entry, network request or saved card sequence.

Twelve reusable card nodes swap cached word and feedback meshes. A pooled selection ring, card lifts, six result sparks and three procedural voices provide feedback. All geometry is cached before play. The shared pier mute, trusted-gesture audio activation and hidden-page silence apply; departure closes the audio context and removes owned UI/listeners. Walking, equipment, navigation and the same upright Ooga return at the fixed pad on exit. DSB's scale, canonical body movement, existing FFT ocean and the locomotive's one-second fresh-Space boarding remain unchanged.

Review URL: `http://127.0.0.1:8081/oogapier?debug=1&view=pier-seed-match&hour=18.8&day=172&nosim=1`. Keyboard, 390 × 844 phone and Canvas evidence is stored in `untracked/pier-seed-match-review/`.

### Seed Phrase Match verification — 11 October 2026

`ONLY='Seed Phrase Match' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **269/269** checks. Real keyboard, phone touch and Canvas playthroughs restored the twelve observed words, secured the perfect order without an early payout, banked exactly 30 tickets once at 75 seconds, and saved a best of twelve. A partial round banked 20 tickets while retaining the perfect best. Repeat Space and jetpack input could not swap twice, move the Ooga or board another ride. Escape and native Space on Back restored the same upright walking Ooga, equipment and navigation; an unfinished secured order paid nothing. Both porch lanes and the pad approach remained clear. The desktop's two-visit leave contract and clean-console checks passed.

The first run found focused Check order swallowing Space after arrow selection. Keyboard cursor movement now releases that button's focus; Tab and native button activation still work. The test driver also rounded its remaining-time advance down to whole frames, sometimes stopping before the deadline. Its setup now covers the final frame while preserving the exact 75-second, payout and repeat-payout assertions. The pure rule check additionally verifies that a secured order is still pending just before the deadline. Other pure checks cover unique permutations, identity-shuffle handling, pick cancellation, invalid slots, partial scoring, coarse/fine timing, closed input and bounded saves retaining older games and Passport data without storing words.

Visual review found Canvas backings covering raised lettering. Copied short faces, raised card letters and 0.75 m more separation from the windows improve the header and cards without altering Playland's shell. The first subdivision approach caused a Canvas session timeout. Rectangular grids reduced the table from 29,304 to 8,504 faces; the final Canvas flow completed successfully in 78 seconds. Its six-step review sample took 116 ms; desktop and phone WebGL samples took 18 and 16 ms. These are diagnostic samples, not a frame-rate floor assertion. The Canvas `SLOW` notice concerns suite runtime; no full or perf suite was run.

The final phone screenshot exposed an equipment-HUD selector overriding the initial toast placement. The game-specific message-stack rule now wins, placing the payout below the panel. `ONLY='Seed Phrase Match phone' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **235/235** checks after this correction. The extended layout check includes result cards, mute, Play again, Back and a payout toast that cannot cross the result panel. Updated phone evidence shows the complete result and both actions unobscured.

The first combined run also exercised Double-Spend Whack's phone flow, all three ride circuits, the train's one-second fresh-Space boarding and midway prize redemption; their checks passed. The timed-out outer Seed Phrase Match ledger entry was cleared after the complete three-platform flow passed, because successful nested assertions do not clear an outer driver-failure name. No check or threshold was weakened. All touched JavaScript passed syntax checks, and local build/staging passed. Signed-in peer behavior was not tested.


## Lightning Volley — Phase 3

Lightning Volley reuses the existing beach court at (60, 40), sand Y 0.35. The court remains 8 × 16 m with a 2.45 m net; the play and exit pad is (60, 30), outside its southern boundary. A compact side sign at (66.5, 33) stays outside the playing width. Two existing court NPCs, the existing volleyball and the 32-person beach cap are retained. No land, bridge, trail, boardwalk or ocean footprint changes. These game placements are authored dimensions, not a new geographic survey.

The free 75-second game has fifteen five-second rallies. A ball carries one to three toy units; each directed link has a visible toy capacity. Routes pass through A, B, or both before the target. A guaranteed usable route exists at every serve. Too-small or absent channels and revisited receivers reject without moving or scoring; Restart returns to Serve while the same rally deadline continues. A completed target pass earns one delivery and four pending tickets. The final deadline saves tickets once and an improving `pier.volley` best from zero to fifteen; leaving early discards pending rewards. Older saves retain all earlier games and Passport progress.

The lesson is “Lightning payments can travel through connected payment channels via intermediate nodes.” Optional text distinguishes the visible puzzle and sequential ball passes from conditional transfers, onion routing, private channel balances, fees and time limits. The primary reference is [BOLT 4](https://github.com/lightning/bolts/blob/master/04-onion-routing.md). No wallet, payment or feed is introduced.

The four rings and six bounded channel links only annotate the court. Ground lettering identifies both teammates and the target without adding building-height boards. The ball uses an analytic arc with the shared canonical gravity; character movement and the DSB ocean are untouched. Six pooled delivery particles and three synthesized audio voices provide feedback, with the shared mute and trusted-gesture activation. Exit restores the same upright Ooga, navigation, walking and equipment at the sand pad; departure removes owned listeners, UI and audio. The train's one-second fresh-Space boarding contract is preserved.

Review URL: `http://127.0.0.1:8081/oogapier?debug=1&character=portlandhodl&view=pier-volley&hour=18.8&day=172&nosim=1`. Keyboard, 390 × 844 phone and Canvas screenshots are in `untracked/pier-volley-review/`.

### Lightning Volley verification — 11 October 2026

The focused keyboard, 390 × 844 phone and Canvas flows pass: fifteen deliveries bank exactly sixty tickets once at 75 seconds and save a best of fifteen; a partial round banks four tickets while preserving the best. Blocked links, revisits, repeat Space, jetpack isolation, early-exit reward discard, native button activation and the same upright walking Ooga's return all pass. The ball's closest far-target crossing clears the rendered net by over 0.1 m. Receiver lettering moved beside the NPCs and the phone card stays below the court. Both trails and the play-pad approach remain clear. The two-visit leave contract and clean console pass.

`ONLY='pier Phase 2 navigation,Lightning Volley,pier carnival circuits,pier midway rounds and prizes' DSB_REVIEW=1 LANES=1 npm test -- pier` finished with **316/318** checks passing. All Volley, ride circuits, the train's one-second fresh-Space boarding, prize redemption and pure rules passed. The only two failures were the desktop/phone navigation sessions' new diagnostic reading `__ooga.renderOpts`, which is not exposed for the pier. After the maintainer authorized a focused correction, the diagnostic uses the scene's actual `renderOpts`; `ONLY='pier Phase 2 navigation' DSB_REVIEW=1 LANES=1 npm test -- pier` passed **243/243** checks. No threshold was weakened. All touched JavaScript passed syntax checks; the site build and local staging passed. No full suite, new frame-rate floor or signed-in peer check was run.

### Pier navigation responsiveness — 11 October 2026

The pier had a separate `overview` flag that remained true when the shared pilot selected an Ooga by double-tap after a preset. Controls registered, but `crew.update` was skipped, freezing movement. Navigation now derives walking from the actual driven Ooga, as the shared pilot does. Walk preserves that actor; floor queries, shadow focus, fall recovery and gateway traversal use the driven body. Canonical speed, body dimensions, step height, gravity, collision queries and the DSB ocean simulation are unchanged.

A live `inMotion` accessor keeps a driven visitor at full update rate when an embedded browser reports no focus, instead of applying the director's 30 FPS idle cap. First gestures also stop initializing six unused minigame sound graphs; each game starts its audio only while its own UI is open. The locomotive starts its graph only within its existing audible range. Owned audio still closes on departure.

Before changes, a live browser CPU profile at the beach and carnival measured approximately 0.8 ms scene update and 1.4–1.6 ms render submission, with a dense-carnival mean near 16.8 ms between frames. It did not show a broad collision or renderer CPU bottleneck. The reproduced frozen overview transition and unnecessary audio startup guided the focused fix. These measurements are diagnostic samples on AC power, not a GPU frame-rate guarantee.

The complete desktop and 390 × 844 phone navigation sessions pass: real arrow keys and phone touch sticks move in all four displayed directions after either overview preset, input is consumed by the next explicit physics step, release stops without drift, dormant minigames stay silent, and a driven visitor avoids the unfocused cap. The first-tick measurement captures the position immediately before and after one explicit step, excluding intervening real frames. Walk preserves the selected Ooga, its beach-floor support and shadow focus. The earlier diagnostic-only STOP entry was removed after both sessions completed successfully; successful nested assertions do not clear an outer driver-failure name.

Saved final 1.2-second WebGL samples at the carnival use the renderer's selected low quality: desktop median/p95 frame intervals were 16.7/17.4 ms and phone 16.7/16.8 ms. Median scene updates were 0.7/0.8 ms, with 1.8/1.9 ms median render submission. These short diagnostic samples support approximately 60 FPS on this AC-powered machine; they do not establish a hardware-independent floor or a main-hub benchmark. Screenshots and timing JSON are in `untracked/pier-navigation-review/`.

The rebuilt local in-app preview was then walked with native held W through the entrance, bridge ramp and boardwalk in shoulder view at high quality. Two eight-second holds covered 62.0 and 62.1 m, consistent with canonical 7.75 m/s walking; both captures had 16.7 ms median and 17.6 ms p95 frame intervals. The capture durations include browser-command overhead, yielding 58.4/58.5 rendered frames per second over the full samples. Median scene updates were 0.8/0.7 ms and render submission 1.7 ms. Released keys stopped movement, no collision blocked the walking route, and the sunset ocean view remained clear. `live-high-performance.json` and `live-boardwalk.jpg` record this review. After final staging, the local preview was refreshed at the entrance in normal walking mode.

Final phone review found the debug panel over the toolbar and equipment over its wrapped second row. The walking debug panel now sits beside the minimap, above the sticks. A visit-owned ResizeObserver measures toolbar and equipment size only when layout changes, keeping equipment and hints below every toolbar row; departure disconnects it and removes its CSS properties. The navigation check now hit-tests all six permanent toolbar actions and uses native clicks/taps for Overview, Beach view and Walk. Desktop tests use the shared Tab cursor-release control before a toolbar click; the first expanded native test omitted that step while aim held pointer lock. Its focused correction passed **247/247** checks, and the final responsive-layout run, `ONLY='pier Phase 2 navigation,Lightning Volley desktop,Lightning Volley phone' DSB_REVIEW=1 LANES=1 npm test -- pier`, passed **280/280** checks. Keyboard/phone navigation, Volley payouts and exits, clean console and the two-visit scene-leave contract all pass. No check or threshold was weakened.
