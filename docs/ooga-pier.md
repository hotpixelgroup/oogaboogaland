# Ooga Pier — carnival, ocean and coastal approach

Enter through the **Ooga Pier** window in ₿IFRÖST, or open `?scene=pier` / `#/oogapier` from disk. The served route is `/oogapier`. The former west mirror is now this travel window; the east mirror remains.

The boardwalk has sand, pale blue and cream coastal storefronts with teal and gold cornices, arched windows, fanlights and striped awnings, based on the Santa Monica references. Arched glazing wraps onto the ends facing approaching walkers, with cornice brackets and continuous trim. White lamps line the promenade, and a blue arrival arch reads **BITCOIN BOARDWALK** on both sides. Its curved band, raised cream name panel, gold-fluted towers and exposed lattice supports stand on the upper Ocean Avenue forecourt at Z 258, with an open path underneath. The carnival includes a rideable Ocean Wheel, Nothing Stops This Train and carousel, playable ring toss and basketball, and a ticket prize counter. Storefronts remain exterior scenery; shop interiors are future work. The waterfront is connected and explorable through the arrival ramps.

The sky follows the shared local clock and date, with coral and gold sunsets, a purple upper sky and drifting coral cloud ribbons at golden hour, then moonlight and stars after dark. A broad connected sandy shoreline and hazy mountains frame the coast. Beach and trail scenery continue into the distance beyond the explorable waterfront. `?debug=1&hour=18.8&day=172` restores the original summer sunset preview; `?debug=1&hour=12` shows daytime and `?debug=1&hour=22` shows night. The ocean directly reuses DSB's water simulation, spectrum, normals and reflections; its physics and the shared walking scale remain unchanged.

## Dimensions

| Reference | Current value / decision |
|---|---|
| DSB sampled geography | 198 × 198 units; grid step 1.5 |
| Pier / approach extent | Deck Z -270 to 95: 365 m; Ocean Avenue centre Z 288: 558 m from the tip |
| Historic bridge | 148.7424 × 10.3632 m; crest 10.9728 m above the deck; maximum 10.2% grade |
| Deck top | 1.35, matching DSB harbor decks |
| Water level | -0.3, matching DSB water |
| Main promenade | Ocean-side route X 0; all shops face it from the west; 14 m-wide fishing pier continuation |
| Storefront heights | 4.4–5.0, within DSB's 4–6.5 property range |
| Amusement decks | Inland 82 × 90 and outer 70 × 144, west of the ocean-side promenade |
| Ocean Wheel | Radius 10; hub 13.7 above deck, ten upright gondolas; 48-second circuit |
| Nothing Stops This Train | West-side 20 × 46 deck; closed 16 × 40 oval with hills about 11 above deck; 28-second circuit |
| Carousel | Radius 5.9 canopy, 6.6 above deck; six wooden horses, two turns over 24 seconds |
| Outer lookout | 38 × 11 |
| Boat dock / launches | 9 × 11 east-side extension at the tip; two canonical DSB 2.2 × 4 m hulls |
| Sailing area | X ±550, Z -800 to -65; hull clearance stays inside these limits |
| Waterfront | 600 m explorable coast; bike/pedestrian centres 36 m apart; about 171 m from mean waterline to bike centre |
| Movement | Canonical crew/pilot: walk 7.75, run 1.5×, gravity 9.8, step 0.6, jump impulse from crew |
| Character / camera | Canonical contributor body, DSB follow and close-view settings |

`pier-models.js` owns the layout. The rendered solids are registered with `solid-props`; support remains layered above the seabed. The ocean reuses `dsb-water.js` for its animated spectrum, normals and reflections. Drifting crest geometry makes wave motion visible on Canvas 2D only; WebGL draws DSB's own animated normals and sunset glints without the decorative long white stripes. `pier-life.js` owns twelve gulls (six on low/Canvas, nine on medium), animated with node transforms and shared geometry. Water does not move the deck or change walking physics. Falling below water returns the visitor to arrival. Flight collision uses the same swept body queries as DSB. A jetpack can be toggled with J or its standard HUD control; walking starts without it equipped.

The [measurement reference](ooga-pier-survey.md) distinguishes documented historic bridge dimensions from approximate aerial measurements and idealized playable footprints. One unit represents one metre; the real vertical curve and uneven coast are simplified.

Travel keeps `world.pilot`; returning lands before the pier window in ₿IFRÖST. Presence uses `scene-pier` and its existing voice peer rule. Client and Worker protocol bounds allow ±900 m only in that zone, supporting offshore launches; coastal walking/flight bounds remain X ±300, Z -280 to 310, and other zones retain ±160 m. Deploy both together for signed-in presence. No new feeds or Worker deployment were added.

## Riding the carnival

Walk down the pier to a gold boarding pad: Ocean Wheel (-48, -106), Nothing Stops This Train (-13, -76), or carousel (-26, 47). For the wheel and carousel, press Space or the nearby **Ride** button, whose label names the closest ride. Nothing Stops This Train is a steam locomotive with a cylindrical boiler, brass bands, chimney, open cab, headlamp, six rotating driving wheels and cowcatcher. It runs continuously on a 28-second lap, including while the gateway menu is open. Its boarding display counts down to **SPACE · BOARD NOW**: a fresh Space press is accepted only within a one-second window centred on the platform pass. Holding Space or clicking the ride button cannot board it; missed presses are not queued. Boarding stops walking input and waits for the canonical grounded check, so the walking animation's small bob no longer rejects Space. Land from a jump before boarding.

The wheel keeps its gondolas upright, the coaster follows its rails with a pitched train, and the carousel turns its bobbing horses. Each brings the same seated Ooga back to its platform after its full circuit. The train keeps moving when the Ooga boards or exits; an exit request returns at the next platform pass after leaving the station. Space, Escape or **Exit at platform** requests a safe exit; no airborne disembarkation occurs. The ₿IFRÖST button waits for the platform before travel. A worn jetpack is restored after the ride. Space during the brief boarding wait cancels it.

Fixed ride frames use their rendered meshes for collision. Moving vehicles carry their seated rider through the ride controller; they are not free-flight landing platforms. Shared walking, jumping and flight physics are unchanged. The coaster occupies the west edge, the low carousel sits left of the central promenade, and slender supports leave ocean views open. Rails stop at overlapping deck joins so the west platform is accessible on foot.

## Sailing to the lighthouse

Walk onto the east-side boat dock at the pier tip. **Satoshi** (orange) and **Beacon** (turquoise) have boarding pads at (24.5, -267) and (24.5, -262). Press a fresh Space or **Board** while grounded; a second press during the brief settling wait cancels boarding. Both bows face east into open water, clear of the other berth. Use W/S or up/down for forward/reverse throttle and A/D or left/right to steer. The phone's left stick supplies the same controls. Camera look remains the shared pilot's controls.

The launches directly reuse DSB's cached 2.2 × 4 m hull. Helm, foredeck, contrasting stripes and lifebuoy details keep the silhouette low. Four samples of the existing DSB FFT drive damped bob, pitch and roll, using a read-only bilinear `heightAt` query with the same 32 m repeat. The spectrum, FFT, mean waterline, sea rendering and canonical Ooga gravity/walking/jumping/flight constants remain unchanged. Boat steering uses 1/120 s substeps, forward speed up to 7 m/s and reverse up to 3 m/s, with gradual acceleration and drag. Two reused foam nodes provide small wakes.

Sail around the pier or out to the Bitcoin lighthouse at (160, -350). Swept hull clearance protects all deck footprints, the other moored launch, the lighthouse's 10 m footing and the sea limits. The lighthouse can be circled from the water; it has no disembarkation platform. Space, Escape or **Return to dock** plots a route around those obstacles, guides the launch to its original berth, then uses the canonical `standPlayer` clearance check to place the same Ooga on its boarding pad. Walk/overview and gateway requests also return to the dock; ₿IFRÖST travel waits until the Ooga is ashore. Jetpack state is restored after disembarking. Ownership loss and scene teardown recover at the dock and clear seated state; boats and routes are local to each visit.

The 9 × 11 m dock overlaps the outer lookout by 1 m; the shared footprint-union rail logic opens the join. Its name boards and boarding pads sit on the extension, leaving the original promenade and lookout clear. No tall masts obstruct ocean views.

Validation for this implementation follows [AGENTS.md](../AGENTS.md)'s default wait mode: build/staging and touched-file syntax checks only. Pending maintainer play-test: board both launches with Space and touch; try walking, jumping and an equipped jetpack during boarding; sail forward/reverse and around the lighthouse, deck corners and other boat; return from both sides of the pier and the sea limits; verify repeated Space, Escape, Walk and ₿IFRÖST requests retain the rider until docked; walk away after each exit; inspect the widest Ooga, camera angles, wakes, sunset/night, Canvas, signed-in offshore poses and repeated scene visits. Earlier prize-counter STOP checks remain outstanding.

## Midway games

Walk onto the gold play pads at (-28, 2) for ring toss or (-28, -18) for basketball. Space or **Play** starts a free five-throw round. Lock aim in a green zone, then release in the green power zone using Space or the panel button. Projectiles use the canonical walking gravity. Each ring earns 10 tickets; each basket earns 8. Tickets save once at the end of the round. Escape or **Done** leaves; abandoning a partial round awards nothing.

The prize counter's play pad at (-45, 14) trades saved tickets for the same six prizes as Ooga Arcade, with shared ownership and prices. Already owned or unaffordable prizes cannot be traded. Both games keep the same Ooga on the boardwalk and leave the central ocean view open.

## Maintainer play-test

- Walk the same Ooga through ₿IFRÖST's pier window, down every deck, and back through the arrival gate (Dial gate, choose ₿IFRÖST, then walk through the field).
- Walk the elevated approach in both directions, all three beach ramps, both paths and Appian Way under the bridge; inspect lane and column clearance.
- Check W/A/S/D from several camera angles, run, jump, J flight, rails and storefront collision with the widest character.
- Inspect deck joints, roof/awning camera clearance, the outer ocean view and recovery after falling over a rail.
- Check Pier overview, Walk, Escape, direct entry, reload and Back/Forward.
- Press Space while walking onto the wheel pad. Board all three rides with the widest Ooga, inspect seated pose and canopy clearance, orbit the camera, try movement/Space/Escape during the ride, and verify safe disembarkation and restored jetpack state.
- Inspect ocean animation and gull wingbeats from the outer deck and wheel, including lower quality tiers.
- Inspect both faces of the Bitcoin Boardwalk arch, coastal facades, sunset and daytime views.
- Play five throws at each midway game, check misses and hits, round-end tickets, cancellation, prize affordability and owned prizes; revisit to check persistence.
- Check phone controls, Canvas 2D, signed-in presence/voice and repeat visits.

Browser checks cover physical travel, full boardwalk traversal, Space boarding while walking, complete circuits of all three rides, midway rounds and the repeated-visit contract. The requested `npm test -- pier` playthrough passed: 216/216 checks including the global tier. Midway checks use Space and panel buttons, ignore held-key repeats, verify five-hit payouts (50 ring toss, 40 basketball) and saved tickets, reject duplicate payouts and prize redemptions, check affordability and saved ownership, and restore walking with Space on Done or Back. Focused trade and exit buttons retain native Space activation without triggering another throw. The return gate sits 1.9 above the deck so the widest Ooga passes its existing swept aperture check without changing collision rules.

## Historical implementation reviews

The following reviews record earlier layouts and their validation, including unresolved prize-counter failures. Their original coordinates and clearance observations predate the measured 11 October layout above and are not validation of that new layout. Build and touched-file syntax checks are the only validation for the latest changes; maintainer runtime review remains pending.

### Visual refinement review

Walked beneath the arrival arch and along the storefront row in the local app; inspected the ocean-facing overview and the noon view. Added arches on storefront end walls, continuous trim and cornice brackets, a lighter timber deck, ivory arch edging and larger BOARDWALK lettering. Lower arrival camera pitch and the arch at Z 54 frame the complete sign. The sunset uses warmer fill, more cloud cover and bounded drifting coral cloud ribbons; distant fog softens the mean ocean surface edge. WebGL uses DSB optics directly, with the decorative crest ribbons retained only on Canvas 2D. Building/deck dimensions, character bodies, canonical movement and DSB water simulation are unchanged.

Build and syntax checks passed. The visual refinement regression run finished **214/216**, with two prize-counter failures repeating after the one permitted fix attempt: `pier prizes: unaffordable and owned buttons are disabled` and `pier prizes: shared counter enforces affordability and one redemption`. The counter now focuses its panel instead of Back on opening, but this did not resolve those checks. Stopped as required by AGENTS.md; the streak-2 entries and details are in `untracked/test-ledger.json`. No further gameplay changes or test retries were made. The final fog-only adjustment was checked visually and by build/syntax checks after that run.


## Storefront, café and structural detail pass

The first three shops now have distinct photo-inspired details: peach and teal shutters with a stepped cornice at Surf Shop, cream pilasters and a golden balcony at Salt Water, and pale blue upper windows with pointed gold frames and scalloped fascia at Sweet Treats. Door panels, handles and thresholds add depth without opening new interiors. Original shop footprints and heights remain fixed; the balcony sits above the existing awning.

Four shared café sets (round tables, two teal chairs, cups and cream/gold parasols) occupy shop-side gaps at (7, 43), (7, 47), (-7, -7) and (-7, -3). Each stays at least 5.45 metres from the centreline, leaving the central eight-metre lane, ride/game approaches and ocean-side rail clear. Their meshes use the existing solid-prop collision system. Weathered round piles with dark waterline sections and bands, longitudinal X-braces and transverse bents are below deck; overlapping deck joins receive no duplicate edge piles. The decorative structure changes no walk support or water level.

Golden-hour reflections use the existing DSB water environment API: roughness rises to 0.85 with sunset warmth, broadening the sun glint, while wave energy, spectrum, mean level and foam settings remain unchanged. A warmer golden direct-light tint supplies the reflected light; it fades with the existing sun strength. No shared DSB water or movement code changed. All new geometry is static and merged or shared, and the ocean mood object is reused in the update loop.

Validation follows the default wait mode: build and syntax checks only. Found for maintainer play-test: inspect the three façades from both approach directions, walk around café furniture with the widest Ooga, view the pilings from a ride or free flight, compare noon and sunset reflections in WebGL, and inspect Canvas 2D and repeat visits. The earlier prize-counter STOP entries remain outstanding.


## Visual playthrough of the detail pass

Inspected the full Surf Shop, Salt Water and Sweet Treats façades in the local WebGL app, café furniture from the promenade, banded pilings and X-braces from outside the deck, and golden reflections looking toward the actual sunset. Refined Sweet Treats' empty triangular upper frames into fully glazed pointed windows, placed Salt Water's sign on the front of the balcony so its lettering is readable, and changed parasols from horizontal color bands to alternating cream/gold panels. Rechecked all three changes visually after rebuilding. Pilings and reflections needed no further change.

Used portlandhodl, the widest Ooga fixture, with real held W input: passed the arrival café pair at X 4 and X 9.5 (rail side), from Z 51 to 38.86; passed the Ocean Café pair at X -4 from Z -0.5 to -9.79; walked the central route at X 0 from Z 51 to -88.5 without an obstruction. Feet remained at the authored deck height. The lookout and café-side ocean rail retain open views. Inspection used temporary debug camera placement; the browser was restored to the normal /oogapier route afterward.

Build and syntax checks passed; the reviewed debug page reported no warnings or errors. This was a visual and walking review, not an automated rides/midway regression run. Earlier prize-counter STOP entries remain outstanding.


## Larger individual storefront signs

All seven shop signs use three times the former node scale (0.87 instead of 0.29), retaining the original letter-cell size before scaling. Each now has its own painted coastal design: a teal surfboard oval for Surf Shop, a navy/gold scalloped plaque with sunbursts for Salt Water, a rose candy panel for Sweet Treats, a blue diamond-ended souvenir board for Pier Gifts, an ivory/teal café plaque for Ocean Café, a coral bulb-bordered marquee for Midway Snacks, and a turquoise pennant-edged board for Carnival Gifts. Raised ivory lettering stays readable against each face; the café uses dark teal lettering.

Signs are mounted above the awnings, with the restaurant sign still on its balcony face. Building proportions, walk surfaces, ocean simulation and movement physics are unchanged. Sign meshes are cached per authored shop and generated only when built. Build and syntax checks are the validation for this pass; inspect the enlarged plaques from walking height during the next maintainer play-test.


## Enlarged sign visual review and opaque-board fix

Reproduced the reported Sweet Treats defect: the custom sign's cap winding was reversed, so its rear cap faced the viewer and cornice brackets could draw in front of it. Corrected both cap windings, moved wall boards out to 0.48 from the façade and the restaurant board to 0.95 beyond its balcony face, and added short mounting stand-offs behind the opaque boards. The rear surfaces now clear the decorative building depth. Raised the minimum sign centre to 4.1 above deck so the lower edges leave an air gap above the sloping awnings. Three-times lettering and each shop's individual palette, outline and decorations are retained.

Visually inspected all seven final signs straight on and reviewed oblique views of the shop row, including the reported Sweet Treats view. All names read clearly; no façade parts show through the painted faces. With real held W input, the widest Ooga walked the central lane from Z 51 to -88.50, reaching the open ocean lookout without an obstruction. Existing building/deck sizes and DSB movement/water physics remain unchanged. Build and syntax checks passed. This review did not rerun the automated midway checks; their earlier prize-counter STOP entries remain outstanding. The temporary debug camera inspection was reset to the normal /oogapier route.


## Continuous locomotive boarding

Renamed the coaster and its platform sign to Nothing Stops This Train. Its locomotive retains the existing rail curve and west-deck footprint. Boarding uses the shared grounded/seated check and exits use the shared platform-clearance check; DSB movement, gravity, scale and water are unchanged. The boarding window spans exactly one second of simulation time per lap. Validation for this change uses the default wait mode: build and touched-file syntax checks only. Maintainer play-test should check early/late Space presses, held Space, button clicks, boarding while walking, an uninterrupted empty lap, and safe exits while the locomotive keeps rolling. Earlier prize-counter STOP entries remain outstanding.


## Locomotive visual playthrough

Inspected the steam engine from the platform, its open cab with portlandhodl seated, and the ocean-facing hills. Moved the train's platform sign to the promenade side of the gold pad: its old position intersected the passing locomotive. Widened the rail gauge to match the driving wheels, with matching ties; the centre curve, hill heights, deck footprint and canonical DSB movement physics remain unchanged. The cab clears the widest Ooga and the sign now stays clear of the moving engine.

Real keyboard input rejected early Space held through arrival and late Space, accepted a fresh Space during arrival, retained the rider under held W, and queued Escape's exit until the platform. Mouse boarding was rejected. Checked the open interval immediately before and after both boundaries (27.499/27.501 and 0.499/0.501 seconds on the 28-second lap), confirming exactly one second across the lap seam. Both requested and automatic exits restored the same upright Ooga at deck height, with an equipped jetpack restored. Real W input then walked from X -17 to -3.05 at Z -47 without blocking. The empty locomotive travelled 3.27 metres over 1.22 seconds while the gateway menu was open.

Build and touched-file syntax checks passed. `ONLY='pier carnival circuits' npm test -- pier` passed **219/219** checks, including the global tier and all three ride circuits. The pier session took 29.9 seconds against the 25-second budget and printed SLOW. No console warnings or errors appeared in the visual review. The earlier prize-counter STOP checks were excluded and remain outstanding. Saved proof: `ooga-train-review.png` in this chat's visualization directory. Temporary debug camera and simulation placement were cleared by returning the browser to the normal /oogapier route.


## Locomotive steam and sound

Added eight reused chimney puffs, rising and drifting with a light sea breeze before shrinking away after 1.35 seconds. Emissions and procedural exhaust chuffs share a speed-dependent phase; the engine has a low rolling rumble and sounds its three-tone whistle on approach to the platform. Riders can also use Whistle (H). Sound opens only after a trusted keyboard/pointer gesture, fades with distance, respects the shared saved mute setting, becomes silent when the page is hidden, and closes on leaving the pier. No audio assets, dependencies or per-frame geometry/voice allocations were added. The rail curve, constant 28-second lap, one-second Space window, boarding and safe-exit controller, collisions and canonical DSB physics are unchanged. The small exhaust plume stays immediately above and behind the locomotive.

Validation follows the default wait mode: build and syntax checks only; listening and visual play-testing remain for the maintainer.


## Connected coastal waterfront

Studied the Santa Monica Travel & Tourism beachfront aerial at [Original Muscle Beach](https://www.santamonica.com/stakeholder/original-muscle-beach-venue/), plus the official [Ocean Front Walk](https://www.santamonica.com/things-to-do/ocean-front-walk/) and city [North Beach Trail](https://www.santamonica.gov/press/2019/09/25/construction-begins-to-bring-improvements-to-north-beach-trail) references. The palette follows pale sand, gray paved paths with white and green markings, warm street lamps and palms along the inland edge.

The original waterfront pass spanned 300 metres; the measured layout now spans 600 metres across the pier entrance, with X ±300 walking/flight bounds and pier-only ±320 m multiplayer limits. Sand and coastal scenery continue for 3.6 km into the haze; those distant extensions are scenery. A 6 m-wide, 17 m-long rear ramp at X -35 descends from the unchanged 1.35 m arrival deck to 0.35 m sand and ends before the bike trail. Two 6 m-wide side ramps join at Z 92. Arrival rail openings match the ramps. Walk along the coast or onto the sand using the same Ooga and canonical crew/pilot physics.

Ocean Front Walk is a 6 m pedestrian path at Z 158, with a separate 4.8 m two-way bike trail at Z 122, sidewalks and a 10 m Appian Way at Z 180. Ocean Avenue is a separate 22 m upper road at Z 288, connected by the elevated pier approach. The trails and lower road pass underneath it. Benches, barrel bins, lamps, vendor umbrellas and slender palm trunks stay outside the walking lanes. Six 8 × 16 m volleyball courts lie between the trail and water, with animated NPC rallies and balls passing over the nets. Only the net posts collide. Six cyclists pedal with rotating wheels on a closed two-lane route, making rounded turns at the trail ends and stopping for a visitor ahead. Eight walkers move along the promenade and step aside on approach. Four kite flyers hold swaying colorful diamond kites with sagging strings and fluttering ribbon tails. Two pale blue lifeguard towers, café parasols and beach towels complete the shore. The cast is capped at 32 anonymous canonical Ooga bodies over six shared cosmetic templates, without adding contributor likenesses or roster entries.

Two ice cream cart vendors now stand at (-110, 152) and (48, 152). Space or the nearby Ice cream button gives a free cosmetic strawberry cone, held for eight seconds, with a vendor greeting. No tickets, purchases or saved inventory are involved. One reused cone node, a three-second serving cooldown and complete leave cleanup keep this interaction bounded. Beach view frames the waterfront; Walk returns control of the visitor where they left it.

A single gentle sand profile supplies both the collision/support mesh and DSB optical depth. The pier-only ocean surface is clipped to the exact mean shore waterline during construction so Canvas cannot paint water over the dry trails. DSB's shared FFT, spectrum, water level, wave energy and movement constants are unchanged. Existing deep-water recovery still returns to pier arrival. Nothing Stops This Train retains its constant motion, one-second Space boarding window and safe-exit controller. All geometry is cached or built once; animations reuse existing nodes and scratch values.

Validation follows AGENTS.md's default wait mode: build and touched-file syntax checks only. Found for maintainer play-test: walk both side ramps and the rear ramp in both directions with the widest Ooga; traverse both trails and all courts; approach cyclists and walkers; visit both vendors with Space and the button, including while a cone is already held; inspect strings, bicycle seating, sunset waterline and open ocean views; check phone controls, Canvas 2D and repeated scene visits. Earlier prize-counter STOP entries remain outstanding.

## Waterfront and entrance visual playthrough — 11 October 2026

Compared the entrance against the official [Santa Monica arch photograph](https://www.santamonica.com/wp-content/uploads/2022/06/santa-monica-pier-1.jpg). Rebuilt the sign as a genuinely curved blue band with a raised cream BITCOIN cap, large vintage BOARDWALK strokes following the curve, sport-fishing/boating lettering, stars and a hanging CAFES plaque. Gold flutes and stepped caps dress the blue towers; exposed blue lattice posts leave the opening clear. Opaque closed panels and raised lettering face both ways. The complete frame is 16.6 m wide and 8.5 m tall, with the lowest central plaque above 4.6 m. It uses cached procedural geometry without font assets.

Arrival moves to Z 284 so the full arch clears the HUD in the normal walking view. The return portal sits beside the sidewalk at X -14, Z 274; the arch sits at Z 258. The 18 × 22 m forecourt meets Ocean Avenue's edge at Z 277 without coplanar pavement over the carriageway. Inland scenery continues from Z 325 into the haze so the Pacific no longer appears behind the upper road. This scenery does not extend walking bounds or change ground support.

Found and reproduced an invisible obstruction under the sloped bridge: its single open surface made the shared solid-prop winding query classify the air underneath as solid. Closed the approach and beach ramp meshes with an 18 cm underside and outward-facing side/bottom caps. The same collision system now leaves the underpass empty. Bridge dimensions, elevations, lane widths, shoreline, canonical Ooga body/step/gravity/walking/jumping/flight constants and DSB water remain unchanged.

With real held keyboard input, portlandhodl walked the full approach from Z 284 to 90.24 and back to 284.12, passing beneath the sign. Crossed the bike trail, Ocean Front Walk and Appian Way beneath the bridge in both directions (X -30 to about 32 and back). Feet remained at each rendered path's 0.41 m surface. Walked all three beach ramps down to 0.35 m sand and back up to the 1.35 m deck; the rear ramp ended clear of the bike lane. Inspected the arch from both sides, lane and column clearance, the broad beach, coastal road separation and open ocean views. Inspected the arch and waterfront overview in Canvas 2D; its existing coarse face-sorting artifacts remain visible in the overview. No console warnings or errors appeared in the reviewed WebGL or Canvas pages.

`ONLY='pier boardwalk and gateway' npm test -- pier` passed **216/216** checks after correcting the new coastal fixture's sideways key selection. The check now faces each route and uses real held W/S; its original distance and height thresholds are retained. It traverses the full bike and pedestrian trails, the approach, lower-road underpass and all three ramps in both directions, plus the pier tip and both ₿IFRÖST crossings. The pier session took 59.7 seconds against the 25-second budget and printed SLOW. Chrome required running outside the sandbox; the initial launch-failure ledger entry remains historical because assertions use different names. The two earlier prize-counter STOP checks were excluded and remain outstanding. Build/staging and syntax checks passed after the final scenery-only adjustment, which was visually rechecked in both renderers.

Saved proof in `untracked/pier-review/bitcoin-boardwalk-entrance.jpg` and `untracked/pier-review/waterfront-approach.jpg`. Temporary debug placement was cleared and the user's browser returned to the playable `/oogapier` route.

## Bitcoin neon and offshore lighthouse

The arch's BITCOIN lettering now uses emissive Bitcoin orange (`#f7931a`) on both faces, with a narrow dark backing for contrast on the cream cap. The lettering retains its shape and placement; the existing bloom supplies the neon halo. A small warm light spills onto the front of the cap.

A 31 m lighthouse stands in the sea at X 160, Z -350, east of and beyond the pier tip. It has a broad stone footing, tapered ivory tower, orange bands, four Bitcoin medallions, slit windows, a gallery with slender railings, glazed lantern and an orange conical roof. It is distant scenery; it adds no collision surfaces or walking routes and changes no DSB movement, water simulation, ride envelope or coastal bounds.

The lantern sweeps back and forth over a 52-degree seaward sector on a two-minute cycle. A translucent low beam, the renderer's existing spotlight and a soft animated orange sea glint accompany a raised atmospheric beam carrying a large orange Bitcoin symbol inside a faint circular halo. The projected image follows the beam's world position and faces the viewer. Both beams use the existing glass/light-beam path in WebGL and Canvas; high/medium WebGL bloom enhances the glow, and the emissive geometry remains visible without bloom on low/Canvas.

The pier now uses `daylight.createClock`'s real local time and date rather than a pinned summer sunset. The existing `lampFactor`, supplemented by a gentle golden-hour fade, eases the lighthouse's illumination in at sunset and out at dawn. Orange tower accents remain subtle while the lamp and projection are brighter. Fog eases to 580–1500 m by sunset from daytime's 360–900 m so it does not wash out the entrance's distant signal. No shared renderer or daylight code changed. Cached geometry, fixed node/light counts and reused typed arrays keep the animation allocation-free; leaving removes the tower, projected image, sea glint and light references.

Initial validation used build/staging and syntax checks only. The requested visual review is recorded below. Earlier prize-counter STOP checks remain outstanding.

## Neon and lighthouse visual playthrough — 11 October 2026

Reviewed the entrance, beach and pier tip in the summer golden-hour preview (18.8) and at night (22), plus an entrance check after sunset (19.4). The first signal drew two transparent, oppositely readable glyphs on top of each other, filling its letter openings and producing a yellow blob. Replaced those copies with one camera-facing front cap, softened the orange halo and beam opacity, and kept longitudinal beam fading out of the flat glyph. The symbol now retains its open bowls and Bitcoin-orange colour from either sweep limit. Its raised beam clears the tower; the narrower sweep keeps the closest projected symbol below the walking-view HUD. The tower remains 31 m tall in the same offshore position.

Thickened the arch's orange tubes with a wider dark backing and reduced their emission slightly so they read orange rather than yellow. Both faces remain opaque and clear of the cream cap. The distant signal is subtle in the bright coral sky and becomes stronger as dusk advances; the nighttime beam and orange tower trim are visible from all three reviewed locations. The shared DSB ocean shader, spectrum, movement constants, collisions, bridge and boardwalk dimensions are unchanged.

Real held keyboard input walked portlandhodl beneath the arch from Z 284 to 256.875, across 9.43 m of beach with feet at 0.35 m, and 6.32 m along the pier tip with feet at 1.35 m. Reviewed both sweep limits and stepped the production frame loop through a complete 120-second sweep. Checked the signal in WebGL high and low quality, and in Canvas 2D; it remains readable without bloom. Canvas retains its coarse translucent-face seams on the light cones. Two visits through ₿IFRÖST cleared the light arrays and spotlight on leaving and restored three lights on return, with the same 1,927 scene nodes. Reviewed pages produced no console warnings or errors.

Build/staging and syntax checks passed for all four changed JavaScript files. This request used manual visual playthroughs, not an automated scene-suite run; the earlier prize-counter STOP entries were not exercised. Saved entrance, beach and tip proofs in `untracked/pier-review/`, including `lighthouse-night-tip-east.jpg`, `bitcoin-neon-night-entrance.jpg` and `lighthouse-sunset-tip.jpg`. Temporary camera/time fixtures were cleared, the Canvas review tab was closed, and the user's browser returned to the playable `/oogapier` route.
