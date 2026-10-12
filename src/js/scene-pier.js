// Coastal boardwalk and carnival; movement belongs to the canonical crew and pilot.
// The scene owns the visit and routes input. Every station game sits in one list (`minis`), so a new game is one
// row in MINIS, its module, and a prompt the interaction registry reads from the same list.
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, L = BL.pierModels.LAYOUT;
  const params = new URLSearchParams(location.search), DEBUG = params.has("debug");
  // Station games in prompt order: the module, the layout entry holding its play pad, and its floor.
  const MINIS = [
    { id: "fishing", label: "Hash Fishing", module: "pierFishing", at: "fishing" },
    { id: "builder", label: "Block Builder", module: "pierBuilder", at: "builder" },
    { id: "mayhem", label: "Mempool Mayhem", module: "pierMayhem", at: "mayhem" },
    { id: "whack", label: "Double-Spend Whack", module: "pierWhack", at: "whack" },
    { id: "seed-match", label: "Seed Phrase Match", module: "pierSeedMatch", at: "seedMatch" },
    { id: "volley", label: "Lightning Volley", module: "pierVolley", at: "volley" },
    { id: "shop", label: "Surf Shop", module: "pierShop", at: "shop", icon: "S", verb: "SHOP" },
    { id: "jobs", label: "Jobs board", module: "pierJobs", at: "jobs", icon: "J", verb: "JOBS" }
  ];
  // Each game's saved result, as the day's challenges and the season's bests count it: the save's method, the
  // challenge's id, the season's key, and what one point of the challenge is worth in the game's score.
  const ROUNDS = [["recordPierFishing", "fishing", "fishing", 5], ["recordPierBuilder", "builder", "builder", 1], ["recordPierMayhem", "mayhem", "mayhem", 1],
    ["recordPierWhack", "whack", "whack", 1], ["recordPierSeedMatch", "seed", "seedMatch", 1], ["recordPierVolley", "volley", "volley", 1]];
  // What an Ooga says with each gesture (remotePlayers.EMOTES: wave, cheer, dance), and the keys that make them.
  const SAYS = ["Ooga!", "Ooga booga!", "♪ ♪"], EMOTE_KEYS = { g: 0, v: 1, z: 2 };
  // Days worth a word on arrival: month, day, name.
  const DAYS = [[1, 3, "the Genesis Block's birthday"], [5, 22, "Bitcoin Pizza Day"], [10, 31, "White Paper Day"]];
  // The shadow box moves in steps, so the renderer's bake of static casters survives a walk (see Wave 0 in
  // untracked/ooga-pier-plan.md): a centre that follows every frame redraws every caster every frame.
  const SHADOW_STEP = 12, SHADOW_RISE = 6;
  // A swimmer's feet hang this far under the waterline: the sea holds an Ooga up wherever the sand falls away.
  const SWIM = 1.1;
  // Ways out of the water onto the deck: the foot of each ladder and where it lets a climber off.
  const LADDERS = [{ x: -20.2, z: -264.5, up: { x: -17.6, z: -264.5 } }, { x: 8.2, z: -200, up: { x: 5.4, z: -200 } }, { x: -64.2, z: -100, up: { x: -61.4, z: -100 } }, { x: 8.2, z: -40, up: { x: 5.4, z: -40 } }];
  const renderOpts = {
    clear: new Float32Array(3), horizon: new Float32Array(3), zenith: new Float32Array(3), sky: new Float32Array(3), ground: new Float32Array(3),
    sun: new Float32Array(3), direct: new Float32Array(3), light: { x: 0, y: 1, z: 0 }, sunDirection: { x: 0, y: 1, z: 0 }, moon: { x: 0, y: 1, z: 0 },
    celestialPole: { x: 0, y: 1, z: 0 }, starMatrix: new Float32Array(9), shadowCenter: { x: 0, y: 2, z: 0 }, shadowExtent: 110, fogNear: 360, fogFar: 900, time: 0
  };
  renderOpts.fog = renderOpts.horizon;
  renderOpts.clouds = 0.68; renderOpts.sea = L.sea;
  const SUNSET_HORIZON = [1, 0.53, 0.32], SUNSET_ZENITH = [0.51, 0.43, 0.64], SUNSET_FILL = [0.76, 0.68, 0.6], SUNSET_GROUND = [0.43, 0.35, 0.28];
  const SUNSET_GLINT = [1, 0.67, 0.36], GREYED = ["horizon", "zenith", "sky", "ground"];
  const scene = { id: "pier", voiceZone: "scene-pier", renderOpts };
  let root, camera, input, hud, pilot, crew, avatar, fx, solids, land, gate, clock, world, go, game, remotes, unsubscribe, life, rides, games, boats, wheels, ferry, interactions;
  let daily, coins, fame, heat, radio, lights, decor, crowd, fireworks, chain, boards, bell, purse, picture, photoBar, photoSave, photoDone, photoUrl = null, photoSnap = false, photoBytes = 0, sound, trainAudio, ambience, menuButton, whistleButton, muteButton, navigationLayout = null;
  let returnAfterRide = false, leaving = false, wet = false, ripple = 0, heard = 0, skew = 0, gesture = -1, gestureAge = 0, rang = 0, unhear = null;
  const minis = [];
  const before = { x: 0, y: 0, z: 0 }, after = { x: 0, y: 0, z: 0 }, tally = { rings: 0, rides: 0, brass: 0, metres: 0 };
  const mayPossess = (c) => BL.net.mayDrive(c.traits.name, BL.contributors.stateFor(c.contributor) === "working");
  // Indexed loops: these run every frame.
  const busyMini = () => { for (let i = 0; i < minis.length; i++) if (minis[i].game.busy) return minis[i].game; return null; };
  const nearMini = () => { for (let i = 0; i < minis.length; i++) if (minis[i].game.near()) return minis[i].game; return null; };
  const closeMinis = () => { for (let i = 0; i < minis.length; i++) if (minis[i].game.busy) minis[i].game.close(); };
  const ownsSeat = (seat) => {
    if (rides?.ownsSeat(seat) || boats?.ownsSeat(seat) || wheels?.ownsSeat(seat) || ferry?.ownsSeat(seat)) return true;
    for (let i = 0; i < minis.length; i++) if (minis[i].game.ownsSeat?.(seat)) return true;
    return false;
  };
  // Anything that holds the visitor in place: a ride, a boat, a station game, a dialog.
  const engaged = () => !!rides?.riding || !!games?.busy || !!boats?.riding || !!wheels?.riding || !!ferry?.riding || !!interactions?.busy || !!busyMini();
  const groundAt = (x, z, feet, _top, a) => a?.camp.seat && ownsSeat(a.camp.seat) && Math.hypot(x - a.camp.seat.x, z - a.camp.seat.z) < 0.1
    ? a.camp.seat.y + a.traits.height * 0.08 - a.baseY
    : Math.max(L.sea - SWIM, solids.supportAt(x, z, Number.isFinite(feet) ? feet : L.top, BL.pilot.WALK.step, a?.bodyRadius || 0));
  const jetState = { owned: false, equipped: false, fuel: 1, blocked: false };
  const jetpackStatus = (c) => { jetState.owned = !!c?.jetpackOwned; jetState.equipped = !!c?.jet; jetState.fuel = c?.jetFuel ?? 1; jetState.blocked = engaged(); return jetState; };
  const toggleJetpack = () => {
    const c = crew.player;
    if (!c || engaged()) return false;
    if (c.jet) crew.removeJetpack(c); else crew.wearJetpack(c, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
    pilot.showAct(); return true;
  };
  const nearGate = () => crew.player && Math.hypot(crew.player.root.position.x - L.gate.x, crew.player.root.position.z - L.gate.z) < 7;
  // One verb: whatever holds the visitor takes the press, else the nearest thing starts.
  const act = () => {
    const playing = busyMini();
    if (playing) return playing.act();
    if (interactions?.busy) return true;
    if (games?.busy) return games.act();
    if (boats?.riding) return boats.requestExit();
    if (rides?.riding) return rides.requestExit();
    if (wheels?.riding) return wheels.dismount();
    if (ferry?.riding) return ferry.requestExit();
    if (!crew.player) return false;
    if (interactions?.activate()) return true;
    if (boats?.near()) return boats.board();
    if (games?.near()) return games.act();
    if (rides?.near()) return rides.tapBoard();
    if (wheels?.near()) return wheels.mount();
    if (ferry && (ferry.board() || ferry.climb() || ferry.check() || ferry.descend())) return true;
    if (bell?.near()) return bell.act();
    const mini = nearMini();
    if (mini) return mini.act();
    if (land?.beach.act(crew.player, hud, fx)) return true;
    if (nearGate()) { gate.open(); return true; }
    return false;
  };
  // Let go of a dialog or a station game; a ride or a boat brings its rider back first (true while it does).
  const settle = () => {
    interactions?.close(); closeMinis();
    if (wheels?.riding) wheels.recover();
    if (ferry?.riding) { ferry.requestExit(); if (ferry.riding) return true; }
    if (boats?.riding) { boats.requestExit(); return true; }
    if (rides?.riding) { rides.requestExit(); return true; }
    if (games?.busy) games.close();
    return false;
  };
  // Put the driven Ooga somewhere else on the pier: fast travel, a ladder, the way back to the gate.
  const travel = (x, y, z, yaw, note) => {
    if (settle() || !crew.player) return false;
    crew.relocatePlayer({ x, y, z }, yaw);
    pilot.navigate({ position: { x, y, z }, yaw: yaw + Math.PI, pitch: 0.2, dist: 8 });
    sound.cue("whoosh"); if (note) hud.toast(note);
    return true;
  };
  const walk = () => {
    if (settle()) return;
    const a = crew.player || avatar;
    pilot.possess(a);
    pilot.navigate({ position: { x: a.root.position.x, y: a.root.position.y - a.baseY, z: a.root.position.z }, yaw: 0, pitch: 0.1, dist: 9 });
  };
  const showOverview = () => { if (!settle()) pilot.goPreset("overview"); };
  const showBeach = () => { if (!settle()) pilot.goPreset("beach"); };
  const returnHome = () => {
    if (leaving) return;
    if (settle()) { returnAfterRide = true; return; }
    world.pilot = crew.player?.traits.name || avatar.traits.name;
    leaving = go("bifrost");
  };
  const accountChanged = () => {
    const released = BL.net.state.released, denied = mayPossess(avatar) || (released?.name === avatar.traits.name ? "That Ooga is no longer yours to drive" : null);
    BL.net.state.released = null;
    if (denied && crew.player) {
      interactions.close(); closeMinis(); games.close(); rides.dispose(); boats.recover(); wheels.recover(); ferry.recover();
      pilot.release(true); hud.toast(denied);
    }
    crew.refreshRosterRow(avatar);
  };
  const soundGesture = (e) => {
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    ambience?.unlock(e); trainAudio?.unlock(e);
    for (let i = 0; i < minis.length; i++) if (minis[i].game.busy) minis[i].game.unlock(e);
  };
  const showMute = () => { muteButton.textContent = sound.muted ? "Unmute pier" : "Mute pier"; muteButton.setAttribute("aria-pressed", String(sound.muted)); };
  // The phone's folded toolbar: Menu opens it, and choosing anything folds it again.
  const foldMenu = (open) => { menuButton.parentElement.toggleAttribute("data-open", open); menuButton.setAttribute("aria-expanded", String(open)); };
  const toggleMenu = () => { foldMenu(!menuButton.parentElement.hasAttribute("data-open")); menuButton.blur(); };
  // Photo mode: the screen clears to the pier, and Save photo writes the frame to a file on this device.
  const photoMode = (on) => {
    if (on && engaged()) { hud.toast("Finish what you are doing, then take the photo"); return; }
    document.body.toggleAttribute("data-pier-photo", on); photoBar.hidden = !on;
    if (on) photoSave.focus(); else if (photoBar.contains(document.activeElement)) document.activeElement.blur();
  };
  const photoOn = () => document.body.hasAttribute("data-pier-photo");
  const photoShoot = () => { photoSnap = true; };
  const photoOff = () => photoMode(false);
  // Runs right after the frame is drawn, while the canvas still holds it.
  const photoTake = () => {
    photoSnap = false;
    const out = document.createElement("canvas"), ink = out.getContext("2d"), w = out.width = picture.width, h = out.height = picture.height, size = Math.max(12, Math.round(h / 44));
    ink.drawImage(picture, 0, 0);
    ink.font = `bold ${size}px monospace`; ink.textBaseline = "bottom";
    const height = BL.chain.snapshot.height, line = height ? `OOGA PIER  ·  BLOCK ${height.toLocaleString("en-US")}` : "OOGA PIER  ·  THE BITCOIN BOARDWALK";
    ink.fillStyle = "rgba(10,10,11,0.55)"; ink.fillRect(0, h - size * 2, ink.measureText(line).width + size * 2, size * 2);
    ink.fillStyle = "#f7931a"; ink.fillText(line, size, h - size * 0.45);
    out.toBlob((blob) => {
      if (!blob || !sound) return;
      photoBytes = blob.size;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = photoUrl; link.download = "ooga-pier.png"; link.click();
      sound.cue("select"); hud.toast("Photo saved to this device");
    }, "image/png");
  };
  const action = (name) => {
    foldMenu(false);
    if (name === "pier-photo") { photoMode(!photoOn()); return; }
    if (name === "pier-wave") { emote(0); return; }
    if (interactions?.busy) {
      if (name === "leave") returnHome(); else if (name === "reset-view") walk(); else if (name === "pier-overview") showOverview();
      return;
    }
    if (name === "pier-beach-view") { showBeach(); return; }
    if (name === "pier-mute") { sound.setMuted(!sound.muted); showMute(); return; }
    if (name === "pier-whistle") { if (rides.kind === "coaster") trainAudio.whistle(); return; }
    if (boats?.riding) {
      if (name === "leave") returnHome();
      else if (name === "act" || name === "pier-overview" || name === "reset-view" || name === "pier-gate") boats.requestExit();
      return;
    }
    const playing = games?.busy ? games : busyMini();
    if (playing) {
      if (name === "leave") returnHome(); else if (name === "act") playing.act();
      else if (name === "pier-overview") showOverview(); else if (name === "reset-view") walk();
      return;
    }
    if (rides?.riding) {
      if (name === "leave") returnHome();
      else if (name === "act" || name === "pier-overview" || name === "reset-view") rides.requestExit();
      return;
    }
    if (pilot.modeAction(name) || pilot.weaponAction(name)) return;
    if (name === "jetpack-toggle") toggleJetpack();
    else if (name === "act") pilot.action();
    else if (name === "pier-overview") showOverview();
    else if (name === "reset-view") walk();
    // The gate button always leads home: it dials at the gate and brings the visitor there from anywhere else.
    else if (name === "pier-gate") { if (nearGate()) gate.open(); else travel(L.gate.x + 3.5, L.gate.y, L.gate.z + 3.5, Math.PI * 1.25, "At the ₿IFRÖST gate"); }
    else if (name === "leave") returnHome();
  };
  // The Passport's line of things kept: written again only when one of them changes.
  let kept = -1;
  const keepsakes = () => {
    const p = game.state.pier, f = p.fish, mark = p.coins + (f[0] + f[1] + f[2] + f[3] + f[4]) * 4194304 + (p.lantern ? 0.5 : 0);
    if (mark === kept) return;
    kept = mark;
    document.getElementById("pier-collection").textContent = `Hidden coins ${coins.found}/${BL.pierCoins.COUNT} · Fish journal ${f.filter((n) => n > 0).length}/${f.length} kinds · Lighthouse lantern ${p.lantern ? "lit" : "unlit"}`;
  };
  // A gesture on the visitor's own Ooga, shown to the players sharing the pier.
  const emote = (kind) => {
    const a = crew.player;
    if (!a || busyMini() || games.busy || interactions.busy) return;
    gesture = kind; gestureAge = 0; fx.say(a, SAYS[kind], 1.8); BL.net.sendEvent("emote", [kind]);
  };
  // A moment from another player on the pier, relayed by the room.
  const moment = (rec, kind, values) => {
    if (rec.zone !== "scene-pier") return;
    if (kind === "emote") { const cave = remotes.emote(rec.id, values[0] | 0); if (cave) fx.say(cave, SAYS[values[0] | 0], 1.8); }
    else if (kind === "fireworks") fireworks.show(Math.max(1, Math.min(6, values[0] | 0)));
    else if (kind === "bell") { sound.cue("bell", 0.45); hud.hint(`${rec.display} rang the Proof-of-Work Bell`, 2500); }
  };
  // A page write only when the value changes.
  const hide = (el, hidden) => { if (el.hidden !== hidden) el.hidden = hidden; };
  const enter = (ctx) => {
    ({ world, go, game } = ctx);
    // The pier's own view of the save: the same game, with tickets paying double while a Block Party lasts.
    purse = Object.create(game); purse.addTickets = (n) => { const paid = n * (chain ? chain.multiplier : 1); game.addTickets(paid); return paid; };
    // A finished round also counts toward today's challenges and, while the chain names a season, the season's best.
    // A season best is also posted to the online board for a signed-in player (no backend, nothing is sent).
    for (const [method, task, kind, unit] of ROUNDS) purse[method] = (score) => {
      daily.round(task, Math.floor(score / unit));
      const season = fame.season();
      if (season && game.recordPierSeason(season, kind, score)) BL.net.postPierScore(kind, season, score);
      return game[method](score);
    };
    purse.lightPierLantern = () => { const lit = game.lightPierLantern(); if (lit) BL.net.postPierScore("lantern", 0, 1); return lit; };
    purse.recordPierMidway = (kind, hits) => { daily.round("midway", hits); return game.recordPierMidway(kind, hits); };
    leaving = returnAfterRide = wet = false; ripple = heard = skew = 0; kept = -1; gesture = -1; rang = 0;
    // The title card greets a visitor once a page; later arrivals from ₿IFRÖST walk straight in.
    if (world.pierWelcomed) document.getElementById("pier-intro").hidden = true; else world.pierWelcomed = true;
    root = S.createNode(); land = BL.pierModels.build(); S.addChild(root, land.root);
    performance.mark("ooga:pier-world");
    solids = BL.solidProps.create();
    solids.add(land.solid); solids.add(land.ferris.frame); solids.add(land.coaster.frame); solids.add(land.carousel.frame); solids.add(land.beach.solid);
    solids.sync();
    solids.add(land.midway.solid);
    for (const m of land.midway.stations) { solids.add(m.frame); solids.add(m.sign); }
    solids.sync();
    sound = BL.pierSound.create(); trainAudio = BL.pierTrainAudio.create(sound); ambience = BL.pierAmbience.create(sound); radio = BL.pierRadio.create(sound);
    window.addEventListener("pointerdown", soundGesture, true); window.addEventListener("pointerup", soundGesture, true); window.addEventListener("keydown", soundGesture, true);
    whistleButton = document.getElementById("pier-whistle"); muteButton = document.getElementById("pier-mute"); showMute();
    menuButton = document.getElementById("pier-menu"); menuButton.addEventListener("click", toggleMenu);
    picture = ctx.canvas; photoBar = document.getElementById("pier-photo"); photoSave = document.getElementById("pier-photo-save"); photoDone = document.getElementById("pier-photo-done");
    photoSave.addEventListener("click", photoShoot); photoDone.addEventListener("click", photoOff);
    life = BL.pierLife.create({ root, land, renderer: ctx.renderer, lighting: renderOpts }); renderOpts.dsbWater = life.ocean;
    lights = BL.pierLights.create({ lighting: renderOpts, layout: L });
    decor = BL.pierDressing.build({ root, layout: L, lights, land }); lights.ready();
    clock = BL.daylight.createClock({ hour: DEBUG ? parseFloat(params.get("hour")) : NaN, daylen: DEBUG ? parseFloat(params.get("daylen")) : NaN, day: DEBUG ? parseFloat(params.get("day")) : NaN, time: DEBUG ? params.get("time") : null, now: new Date() });
    camera = S.createCamera({ fov: 55, near: 0.1, far: 2400 });
    const carried = world.pilot || params.get("character"), allowed = (c) => !BL.net.mayDrive(c.name, BL.contributors.stateFor(c) === "working");
    const name = BL.contributors.roster.find((c) => c.name === carried && allowed(c))?.name || BL.net.ownCharacter()?.handle || BL.contributors.roster.find(allowed)?.name || "YellowBrokeIt";
    world.pilot = null;
    hud = BL.hud.create({ roster: BL.contributors.roster, catalog: BL.models.SWAG, tierColors: BL.models.TIER_COLORS, renderIcon: BL.hud.renderIcon, lootEnabled: false });
    hud.setAreaLabel("OOGA PIER · BOARDWALK");
    const hooks = {};
    input = BL.interact.create({ canvas: ctx.canvas, renderer: ctx.renderer, camera, hooks });
    pilot = BL.pilot.create({
      renderer: ctx.renderer, canvas: ctx.canvas, camera, hud, jetpackStatus,
      mayPossess: (c) => boats?.riding ? "Return to the boat dock before changing Oogas" : mayPossess(c),
      presets: { overview: { yaw: 0.55, pitch: 0.7, dist: 500, target: { x: -20, y: 2, z: 10 } }, beach: { yaw: Math.PI, pitch: 0.7, dist: 420, target: { x: 0, y: 1, z: 110 } }, ...L.views },
      landing: "overview", pitch: [0.1, 1.45], dist: [3, 660], follow: { y: 1, min: 3, max: 9, pitch: [0.1, 0.8] }, fly: { speed: 8, perDist: 0.1, climb: 5, yMax: 180 },
      clampCamera: (p) => { p.y = Math.max(p.y, L.sea + 0.12); },
      ceilingAt: (x, z, y, a) => solids.ceilingAt(x, z, y, a?.bodyRadius || 0.4),
      coarse: matchMedia("(pointer: coarse)").matches, onFreeAction: act, onPlayerAction: act,
      close: { eyeHeight: 1.7, eyeRatio: 0.8, eyeForward: 0, maxStep: 0.6, pitch: [-1.2, 1.2], orbitDist: 12, trailingDist: 6,
        groundAt: (x, z) => { const a = crew?.player || avatar; return groundAt(x, z, a ? a.root.position.y - a.baseY : L.top, 0, a); } }
    });
    fx = BL.fx.create({ root, renderer: ctx.renderer, camera, overlay: ctx.overlay, hud, tickerAt: { x: 0, y: L.spawn.y + 4, z: L.spawn.z } });
    const outside = (x, z) => Math.abs(x) > L.bounds.x || z < L.bounds.minZ || z > L.bounds.maxZ;
    const walkable = (ax, az, bx, bz, y, h = 1.5, a) => {
      if (outside(bx, bz)) return false;
      const floor = groundAt(bx, bz, y, 0, a), feet = Math.max(y, floor), step = BL.pilot.WALK.step, r = a?.bodyRadius || 0.4;
      if (floor - y > step + 1e-7) return false;
      return solids.segmentClear(ax, feet + step, az, bx, feet + step, bz, r, Math.max(0, h - step)) || solids.escapeSegmentClear(ax, feet + step, az, bx, feet + step, bz, r, Math.max(0, h - step));
    };
    const flyable = (ax, az, bx, bz, y, h = 1.5, a) => {
      if (outside(bx, bz)) return false;
      const r = a?.bodyRadius || 0.4;
      return solids.segmentClear(ax, y + 1e-5, az, bx, y + 1e-5, bz, r, h - 1e-5) || solids.escapeSegmentClear(ax, y + 1e-5, az, bx, y + 1e-5, bz, r, h - 1e-5);
    };
    const shared = {
      root, input, hud, game, world: { level: 0, weapons: new Map(), magazine: { owned: false, count: 0, ammo: 0, carrier: null } }, playerName: name, fx, viewYaw: 0,
      groundAt, walkable, flyable, useNear: act, localOnline: () => !BL.net.state.backend || !!BL.net.state.me, outsideActors: () => remotes ? remotes.actors() : [],
      reloadPolicy: { near: () => false, available: () => false }, ceilingAt: (x, z, y, a) => solids.ceilingAt(x, z, y, a?.bodyRadius || 0.4)
    };
    crew = shared.crew = BL.crew.create(shared); pilot.bind(shared);
    avatar = crew.cavemen.get(name); Object.assign(avatar.root.position, L.spawn); avatar.root.position.y += avatar.baseY;
    crew.setJetpackOwnership(avatar, true, BL.hubModels.jetpack(), BL.hubModels.jetFlame());
    rides = BL.pierRides.create({ models: [land.ferris, land.coaster, land.carousel, ...land.park.rides], crew, pilot, hud, game: purse, sound, layout: L });
    games = BL.pierGames.create({ land, crew, pilot, hud, game: purse, layout: L, fx, sound });
    boats = BL.pierBoats.create({ root, land, water: life.ocean, crew, pilot, hud });
    solids.add(boats.dock); solids.sync();
    const floorAt = (x, z, feet, r) => Math.max(-5, solids.supportAt(x, z, feet, BL.pilot.WALK.step, r));
    wheels = BL.pierWheels.create({ root, layout: L, crew, pilot, hud, fx, sound, walkable, floorAt, sea: L.sea });
    ferry = BL.pierFerry.create({ root, layout: L, water: life.ocean, crew, pilot, hud, game: purse, sound, solids, lighthouse: life.lighthouse, travel });
    for (const row of MINIS) {
      const place = L[row.at];
      minis.push({ id: row.id, label: row.label, icon: row.icon, verb: row.verb, pad: place.play, floor: place.floor ?? L.top,
        game: BL[row.module].create({ models: land[row.at], roof: land.park.bumperRoof, layout: L, water: life.ocean, camera, crew, pilot, hud, fx, game: purse, sound, fireworks: (n) => { fireworks.show(n); BL.net.sendEvent("fireworks", [n]); } }) });
    }
    Object.assign(hooks, pilot.hooks); hud.onAction(action); hud.onPreset(showOverview);
    gate = BL.oogaPortal.create({
      radius: 2.5, outerRadius: 2.8, position: { x: L.gate.x, y: L.gate.y + 1.9, z: L.gate.z }, rotation: { x: Math.PI / 2, y: 0, z: 0 },
      destinations: [{ id: "bifrost", label: "₿IFRÖST", enabled: true }], menuHint: "Activate, then walk through the gate to ₿IFRÖST.",
      onMenu: (open) => { pilot.setActive(!open); pilot.controls.reset(); input.reset(); }, onTraverse: returnHome
    });
    S.addChild(root, gate.root);
    Object.assign(gate.dialer.position, { x: L.gate.x + 4, y: L.gate.y, z: L.gate.z - 3 }); S.addChild(root, gate.dialer);
    const idle = () => crew.player && !gate.isOpen && !busyMini() && !games.busy && !rides.riding;
    const occupied = () => rides.riding || boats.riding || games.busy || !!busyMini();
    interactions = BL.pierInteractions.create({ root, land, crew, pilot, hud, fx, game, rides, games, boats, gate, minis, wheels, occupied, available: () => idle() && !boats.riding && !wheels.riding && !ferry.riding, exploring: idle, byWater: () => boats.riding || ferry.visiting(),
      travel: (q) => travel(q.arrive ? q.arrive.x : q.x, q.y, q.arrive ? q.arrive.z : q.z, 0, `${q.name}`) });
    // The Block Ferry's pads, and the lighthouse's door, crank and hatch. With the ferry away, its landing still
    // gets a visitor home: a launch is called.
    interactions.register({ id: "ferry", label: "Block Ferry", x: ferry.pierPad.x, z: ferry.pierPad.z, y: L.top, icon: "F", near: ferry.atPier, act: ferry.board, verb: () => ferry.state.phase === "out" || ferry.state.phase === "back" ? "FERRY AWAY" : "BOARD FERRY" });
    interactions.register({ id: "ferry-home", label: "Block Ferry", x: ferry.landing.x, z: ferry.landing.z, y: ferry.landing.y, icon: "F", near: ferry.atLanding, verb: () => ferry.state.phase === "landed" ? "BOARD FERRY" : "CALL LAUNCH",
      act: () => ferry.board() || travel(ferry.pierPad.x, L.top, ferry.pierPad.z + 2.5, 0, "A launch brought you back to the pier") });
    interactions.register({ id: "lighthouse-door", label: "Climb the lighthouse", x: ferry.door.x, z: ferry.door.z, y: ferry.landing.y, icon: "↑", verb: "CLIMB UP", near: ferry.nearDoor, act: ferry.climb });
    interactions.register({ id: "lighthouse-crank", label: "Turn the crank: check the block", x: ferry.gallery.x, z: ferry.gallery.z, y: ferry.gallery.y, icon: "✓", verb: "TURN CRANK", near: ferry.nearCrank, act: ferry.check });
    interactions.register({ id: "lighthouse-hatch", label: "Climb down", x: ferry.hatch.x, z: ferry.hatch.z, y: ferry.gallery.y, icon: "↓", verb: "CLIMB DOWN", near: ferry.nearHatch, act: ferry.descend });
    const swimming = () => { const a = crew.player; return !!a && !a.camp.seat && a.root.position.y - a.baseY < L.sea - 0.5; };
    for (let i = 0; i < LADDERS.length; i++) {
      const q = LADDERS[i];
      S.addChild(root, S.createNode({ geometry: BL.pierDetails.ladder(), position: { x: q.x, y: L.top, z: q.z }, rotation: { x: 0, y: q.up.x < q.x ? Math.PI / 2 : -Math.PI / 2, z: 0 } }));
      interactions.register({ id: `ladder-${i}`, label: "Climb out", verb: "CLIMB OUT", x: q.x, z: q.z, y: L.sea, icon: "↑", any: true,
        near: () => swimming() && Math.hypot(crew.player.root.position.x - q.x, crew.player.root.position.z - q.z) < 4,
        act: () => travel(q.up.x, L.top, q.up.z, q.up.x < q.x ? Math.PI / 2 : -Math.PI / 2, "Back on the boardwalk") });
    }
    fireworks = BL.pierFireworks.create({ fx, sound, layout: L });
    chain = BL.pierChain.create({ root, layout: L, renderer: ctx.renderer, camera, sound, hud, hooks: {
      // A new block rings the whole pier.
      onBlock: (height, txs) => {
        sound.cue("bell"); trainAudio.whistle(); fireworks.show(renderOpts.lampFactor > 0.3 ? 6 : 3);
        hud.toast(`Block ${height.toLocaleString("en-US")} found${txs > 0 ? ` · ${txs.toLocaleString("en-US")} transactions` : ""} · ${BL.pierChain.FESTIVALS[chain.state.festival]}!`);
        fx.showTicker(`BLOCK ${height} · TICKETS PAY DOUBLE`, 5);
        ferry.depart();
        const deep = land.coaster.couple(chain.state.blocks);
        if (rides.kind === "coaster") hud.hint(`Confirmation ${deep}: another block coupled on behind you`, 6000);
      },
      onFee: (level) => decor.setFee(level),
      onCoin: (tickets) => {
        game.addTickets(tickets); sound.cue("best"); hud.toast(`Block coin! +${tickets} tickets`);
        const p = crew.player.root.position; fx.burst(p.x, p.y + 1.4, p.z, 24, BL.fx.CONFETTI, 2.6);
      }
    } });
    bell = BL.pierBell.create({ models: land.bell, layout: L, crew, hud, fx, game: purse, sound });
    interactions.register({ id: "pow-bell", label: "Swing the hammer", verb: "SWING", x: L.bell.play.x, z: L.bell.play.z, y: L.bell.y, icon: "!", near: bell.near, act: bell.act });
    boards = BL.pierBoards.create({ root, layout: L, renderer: ctx.renderer, chain });
    // Reasons to come back: today's three and the streak, the hidden coins, and the hall of fame.
    daily = BL.pierDaily.create({ game: purse, hud, sound, onAll: () => fireworks.show(4) });
    coins = BL.pierCoins.create({ root, layout: L, game: purse, hud, sound, fx, floorAt, landing: ferry.landing });
    fame = BL.pierFame.create({ root, layout: L, renderer: ctx.renderer, game, chain, player: name });
    const date = new Date(), festival = params.has("nosim") ? null : DAYS.find((d) => d[0] === date.getUTCMonth() + 1 && d[1] === date.getUTCDate());
    if (festival) { hud.toast(`Today is ${festival[2]}`); fireworks.show(4); }
    crowd = BL.pierCrowd.create({ root, layout: L, renderer: ctx.renderer, fx, exclude: name });
    remotes = BL.remotePlayers.create({ root, crew, visible: (rec) => rec.zone === "scene-pier", hide: (who, on) => crowd.hide(who, on) }); unsubscribe = BL.net.subscribe(accountChanged);
    unhear = BL.net.subscribeEvents(moment);
    // Heat: bowl people over and a lifeguard comes. Caught, the visitor is put in the sea beside where they stood.
    heat = BL.pierHeat.create({ root, layout: L, crew, hud, fx, sound, game, walkable, onBust: (fine) => {
      const z = crew.player.root.position.z;
      if (wheels.riding) wheels.recover();
      // Over the east rail into open water, level with where they were caught (never onto the sand or under the lookout).
      crew.relocatePlayer({ x: 14, y: L.sea - SWIM, z: Math.max(-240, Math.min(-60, z)) }, 0);
      hud.toast(fine ? `Dunked by the lifeguard · ${fine} tickets fined` : "Dunked by the lifeguard");
    } });
    // A lantern lit before signing in still joins the shore's.
    if (game.state.pier.lantern) BL.net.postPierScore("lantern", 0, 1);
    const debugPier = { land, solids, gate, avatar, rides, life, lights, decor, crowd, fireworks, chain, boards, bell, ferry, daily, coins, fame, heat, radio, purse, remotes, moment, emote, photo: { mode: photoMode, shoot: photoShoot, get bytes() { return photoBytes; }, get on() { return photoOn(); } }, games, sound, trainAudio, boats, wheels, interactions, minis, travel };
    for (let i = 0; i < minis.length; i++) debugPier[MINIS[i].at] = minis[i].game;
    // The scene's own update in fixed steps without frames, as the games' handles do: a whole round in little wall time.
    debugPier.simulate = (seconds, dt = 1 / 60) => { for (let n = Math.round(seconds / dt); n > 0; n--) { skew += dt; update(dt, heard); } };
    Object.assign(scene, { root, camera, input, debug: { camera, pilot, crew, cavemen: crew.cavemen, controls: pilot.controls, hud, setHour: (hour) => { clock = BL.daylight.createClock({ hour, day: clock.dayOfYear }); }, pier: debugPier } });
    walk();
    // Measure only on layout changes; wrapped ride actions must clear the phone's equipment.
    const toolbar = document.querySelector(".topbar"), equipment = document.getElementById("equipment-hud");
    navigationLayout = new ResizeObserver(() => {
      if (!crew) return;
      const bottom = toolbar.getBoundingClientRect().bottom, height = equipment.getBoundingClientRect().height;
      document.body.style.setProperty("--pier-toolbar-bottom", bottom + "px"); document.body.style.setProperty("--pier-equipment-bottom", (bottom + 8 + height) + "px");
    });
    navigationLayout.observe(toolbar); navigationLayout.observe(equipment);
    const view = params.get("view");
    if (DEBUG && Object.hasOwn(L.views, view)) pilot.goPreset(view);
    performance.mark("ooga:pier-ready");
  };
  // `skew` is the scene time `simulate` has run beyond the director's, so time never steps back after it.
  const update = (dt, elapsed) => {
    if (leaving) return;
    heard = elapsed;
    const time = elapsed + skew;
    BL.daylight.sample(clock.read(), renderOpts, clock.dayOfYear, 34, clock.continuousDay, clock.utcMs);
    renderOpts.time = time; solids.sync(); gate.update();
    const warm = Math.max(0, Math.min(1, (18 - renderOpts.sunAltitude) / 18)) * Math.max(0, Math.min(1, (renderOpts.sunAltitude + 8) / 8));
    for (let i = 0; i < 3; i++) {
      renderOpts.horizon[i] += (SUNSET_HORIZON[i] - renderOpts.horizon[i]) * warm; renderOpts.zenith[i] += (SUNSET_ZENITH[i] - renderOpts.zenith[i]) * warm;
      renderOpts.sky[i] += (SUNSET_FILL[i] - renderOpts.sky[i]) * warm * 0.7; renderOpts.ground[i] += (SUNSET_GROUND[i] - renderOpts.ground[i]) * warm * 0.6;
    }
    for (let i = 0; i < 3; i++) renderOpts.direct[i] += (SUNSET_GLINT[i] - renderOpts.direct[i]) * warm * 0.55 * Math.min(1, renderOpts.sunStrength * 4);
    chain.update(dt, time, crew.player); boards.update(dt);
    tally.rings = bell.state.rings; tally.rides = rides.completed; tally.brass = rides.rings; tally.metres = wheels.travelled;
    daily.update(dt, tally); coins.update(time, crew.player, camera.position); fame.update(dt, camera.position, renderOpts.lampFactor); keepsakes();
    // The bell is heard by everyone on the pier.
    if (tally.rings !== rang) { rang = tally.rings; BL.net.sendEvent("bell"); }
    const weather = chain.state.rain;
    if (weather > 0.01) {
      // Arriving transactions bring the weather in: the sky greys and the cloud closes.
      for (let t = 0; t < GREYED.length; t++) { const c = renderOpts[GREYED[t]], grey = (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) * 0.82; for (let i = 0; i < 3; i++) c[i] += (grey - c[i]) * weather * 0.6; }
    }
    renderOpts.clouds = 0.68 + weather * 0.3;
    life.update(time, warm, renderOpts.lampFactor, camera.position, chain.state.burst, chain.state.surf, weather); land.beach.update(dt, time, crew.player, camera.position);
    if (weather > 0.01) { renderOpts.fogNear += (120 - renderOpts.fogNear) * weather; renderOpts.fogFar += (560 - renderOpts.fogFar) * weather; }
    const walker = crew.player, focus = walker ? walker.root.position : camera.target, night = renderOpts.lampFactor;
    decor.update(time, night); land.ferris.show(time, night, chain.fill, chain.state.burst); crowd.update(dt, time, camera.position, walker);
    lights.update(dt, night, focus, land.landmarks.update(night, camera.position, walker));
    renderOpts.shadowCenter.x = Math.round(focus.x / SHADOW_STEP) * SHADOW_STEP;
    renderOpts.shadowCenter.y = Math.round(focus.y / SHADOW_RISE) * SHADOW_RISE;
    renderOpts.shadowCenter.z = Math.round(focus.z / SHADOW_STEP) * SHADOW_STEP;
    if (walker) { Object.assign(before, walker.root.position); before.y += walker.bodyHeight / 2 - walker.baseY; }
    if (!gate.isOpen) {
      if (rides.boarding || games.busy || boats.boarding || wheels.boarding || ferry.boarding || interactions.busy || busyMini()) crew.steer(0, 0, 0, 0, 0); else pilot.readInput(dt);
      if (crew.player) crew.update(dt, time);
      if (gesture >= 0) {
        gestureAge += dt;
        if (!crew.player || gestureAge >= BL.remotePlayers.EMOTE_SECONDS) gesture = -1;
        else BL.remotePlayers.emotePose(crew.player.parts, gesture, gestureAge);
      }
      rides.update(dt); games.update(dt); boats.update(dt); wheels.update(dt); ferry.update(dt, time); bell.update(dt);
      // Wheels at speed bowl the deck's people over, which slows the vehicle and raises the Heat.
      const ridden = wheels.vehicle;
      if (ridden && wheels.riding && Math.abs(ridden.speed) > 4) { const hits = crowd.bump(ridden.x, ridden.z, ridden.kind.radius + 0.55); if (hits) { heat.add(hits); ridden.speed *= 0.55; sound.cue("bump"); } }
      heat.update(dt, crew.player, wet, rides.kind === "coaster", !!rides.riding || !!boats.riding || !!ferry.riding || !!games.busy || !!busyMini() || interactions.busy);
      for (let i = 0; i < minis.length; i++) minis[i].game.update(dt);
      splash(dt);
      pilot.update(dt);
    } else { rides.update(dt); boats.update(dt); ferry.update(dt, time); }
    interactions.update(dt);
    trainAudio.update(dt, land.coaster, crew.player ? crew.player.root.position : camera.position);
    const ears = crew.player ? crew.player.root.position : camera.position, afoot = crew.player && !crew.player.camp.seat && !crew.player.jet;
    ambience.update(dt, ears, renderOpts.lampFactor, !!afoot && pilot.moving, afoot ? ears.y - crew.player.baseY : L.sea, L.sea, weather);
    radio.update(wheels.riding && !wheels.boarding);
    hide(whistleButton, rides.kind !== "coaster");
    if (returnAfterRide && !rides.riding && !boats.riding && !ferry.riding) { returnHome(); return; }
    if (walker && crew.player === walker) {
      Object.assign(after, walker.root.position); after.y += walker.bodyHeight / 2 - walker.baseY;
      if (gate.traverse(before, after, walker.bodyRadius, -1, walker.bodyHeight)) return;
    }
    const driven = crew.player;
    BL.net.setZone("scene-pier"); BL.net.setBody(driven ? driven.traits.name : null);
    if (driven) {
      const p = driven.root.position;
      BL.net.sendPose(p.x, p.y - driven.baseY, p.z, driven.root.rotation.y); BL.net.setHealth(driven.health.value, driven.health.stunned);
      BL.net.setStance(driven.camp.seat ? 1 : wet ? 2 : 0);
    }
    fireworks.update(dt);
    remotes.update(dt); fx.update(dt);
  };
  // Going into the sea is a splash and a swim, not a trip back to the avenue.
  const splash = (dt) => {
    const a = crew.player;
    if (!a || a.camp.seat) { wet = false; return; }
    const p = a.root.position, now = p.y - a.baseY < L.sea - 0.5;
    if (now && !wet) {
      for (let i = 0; i < 10; i++) { const t = i * Math.PI / 5; fx.spawnParticle(BL.pierDetails.droplet(), p.x, L.sea + 0.1, p.z, Math.cos(t) * 1.4, 2.6, Math.sin(t) * 1.4, 0.7, 0, BL.pilot.WALK.gravity, L.sea); }
      sound.cue("splash"); hud.hint("Swimming. Head for the sand, or a ladder on the pier's side.", 5000);
    }
    wet = now;
    if (!wet) return;
    ripple -= dt;
    if (ripple <= 0 && pilot.moving) { ripple = 0.35; fx.spawnParticle(BL.pierDetails.droplet(), p.x, L.sea + 0.05, p.z, 0, 0.8, 0, 0.4, 0, BL.pilot.WALK.gravity, L.sea); }
  };
  const drawNames = (c, p) => { remotes.drawNames(c, p); };
  const leave = () => {
    navigationLayout.disconnect(); navigationLayout = null;
    document.body.style.removeProperty("--pier-toolbar-bottom"); document.body.style.removeProperty("--pier-equipment-bottom");
    window.removeEventListener("pointerdown", soundGesture, true); window.removeEventListener("pointerup", soundGesture, true); window.removeEventListener("keydown", soundGesture, true);
    foldMenu(false); menuButton.removeEventListener("click", toggleMenu);
    photoMode(false); photoSave.removeEventListener("click", photoShoot); photoDone.removeEventListener("click", photoOff);
    if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
    photoSnap = false;
    if (crew.player) world.pilot = crew.player.traits.name;
    unsubscribe(); unhear(); unhear = null; BL.net.setBody(null); BL.net.setZone("scene-transition");
    remotes.dispose(); heat.dispose(); crowd.dispose(); daily.dispose(); coins.dispose(); fame.dispose(); boards.dispose(); bell.dispose(); chain.dispose(); fireworks.dispose(); interactions.dispose();
    for (let i = minis.length - 1; i >= 0; i--) minis[i].game.dispose();
    minis.length = 0;
    games.dispose(); rides.dispose(); boats.dispose(); wheels.dispose(); ferry.dispose(); decor.dispose(); lights.dispose(); land.beach.dispose(); life.dispose(); renderOpts.dsbWater = null;
    trainAudio.dispose(); ambience.dispose(); sound.dispose();
    whistleButton.hidden = true;
    gate.dispose(); pilot.dispose(); crew.dispose(); fx.dispose(); solids.dispose();
    while (root.children.length) S.removeChild(root, root.children[root.children.length - 1]);
    const targets = input.targetCount;
    input.dispose(); hud.dispose(); scene.input = scene.debug = null;
    root = camera = input = hud = pilot = crew = avatar = fx = solids = land = gate = clock = game = remotes = unsubscribe = life = rides = games = boats = wheels = ferry = interactions = null;
    daily = coins = fame = heat = radio = lights = decor = crowd = fireworks = chain = boards = bell = purse = picture = photoBar = photoSave = photoDone = sound = trainAudio = ambience = menuButton = whistleButton = muteButton = null;
    return { targets };
  };
  const claim = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  const onKey = (e) => {
    soundGesture(e);
    if (interactions.busy) return true;
    const playing = busyMini();
    if (playing) return playing.onKey(e);
    const key = e.key.toLowerCase();
    if (boats.riding) {
      if (e.key === "Escape" || e.key === " " && !e.repeat) { claim(e); boats.requestExit(); }
      else if (/^[0-9]$/.test(e.key) || key === "j") claim(e);
      return true;
    }
    if (photoOn()) {
      if (e.key === "Escape") { claim(e); photoMode(false); return true; }
      if (e.key === "Enter" && !e.repeat) { claim(e); photoShoot(); return true; }
    }
    if (ferry.riding) {
      if ((e.key === "Escape" || e.key === " " || key === "e") && !e.repeat) { claim(e); ferry.requestExit(); }
      else if (/^[0-9]$/.test(e.key) || key === "j") claim(e);
      return true;
    }
    if (wheels.riding) {
      if ((e.key === "Escape" || e.key === " " || key === "e") && !e.repeat) { claim(e); wheels.dismount(); }
      else if (key === "n" && !e.repeat) { claim(e); hud.toast(radio.next()); }
      else if (/^[0-9]$/.test(e.key) || key === "j") claim(e);
      return true;
    }
    const plain = !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey, free = crew.player && !gate.isOpen && !games.busy && !rides.riding;
    if (e.key === " " && plain && free && boats.near()) { claim(e); boats.board(); return true; }
    if (key === "h" && plain && rides.kind === "coaster") { claim(e); trainAudio.whistle(); return true; }
    if (plain && Object.hasOwn(EMOTE_KEYS, key) && crew.player && !gate.isOpen && !games.busy) { claim(e); emote(EMOTE_KEYS[key]); return true; }
    if (e.key === " " && plain && free && rides.spaceBoard()) { claim(e); return true; }
    if (e.key === " " && plain && free) { const mini = nearMini(); if (mini) { claim(e); mini.act(); return true; } }
    if (games.busy) {
      if (e.key === "Escape") { e.preventDefault(); games.close(); } else if (e.key !== " " && e.key !== "Tab" && e.key !== "Enter") claim(e);
      return true;
    }
    if (rides.riding) {
      if (e.key === "0" || key === "j") claim(e);
      if (e.key === "Escape") rides.requestExit();
      return true;
    }
    if (key === "j" && !e.repeat) return toggleJetpack();
    if (e.key === "Escape" && !gate.isOpen) { showOverview(); return true; }
    return false;
  };
  // A payment can arrive in any scene: bank it on the shared pile and thank the donor where the visitor stands.
  const onDonation = (donation) => {
    game.recordDonation(donation);
    const bananas = BL.game.bananasFor(donation.sats);
    world.level = Math.min(BL.pile.MAX_BANANAS, world.level + bananas);
    hud.toast(`+${BL.game.formatLarge(donation.sats)} sats · ${bananas} banana${bananas > 1 ? "s" : ""} · ${donation.handle ? "@" + donation.handle : "anon"}`);
    fx.showTicker(`THANKS ${donation.handle ? "@" + donation.handle.toUpperCase() : "ANON"} · ${bananas} BANANAS`, 4.5);
    const at = crew.player ? crew.player.root.position : camera.target;
    fx.burst(at.x, at.y + 1.6, at.z, 20, BL.fx.CONFETTI, 2.2);
    sound.cue("coin"); fireworks.show(donation.sats >= 21000 ? 6 : 3);
  };
  Object.assign(scene, {
    enter, update, leave, onKey, onDonation,
    overlay: (dt) => { if (photoSnap) photoTake(); fx.drawOverlay(dt, drawNames); },
    stats: () => {
      let allNodes = 0, visibleNodes = 0;
      const count = (n) => { allNodes++; if (n.visible) visibleNodes++; for (const c of n.children) count(c); };
      count(root);
      return { allNodes, visibleNodes, targets: input.targetCount, tweens: 0, ...fx.stats(), ...remotes.stats() };
    },
    liveGeometry: (set) => {
      remotes.liveGeometry(set); land.beach.liveGeometry(set); decor.liveGeometry(set); set.add(avatar.headOpen).add(avatar.headClosed);
      for (const c of land.ferris.riders) set.add(c.headOpen).add(c.headClosed);
      for (const c of land.carousel.riders) set.add(c.headOpen).add(c.headClosed);
      for (const m of land.park.rides) for (const c of m.riders) set.add(c.headOpen).add(c.headClosed);
      crowd.liveGeometry(set); ferry.liveGeometry(set); fireworks.liveGeometry(set); chain.liveGeometry(set); boards.liveGeometry(set); fame.liveGeometry(set); heat.liveGeometry(set);
    },
    onLootCleared: () => {}
  });
  // Embedded browsers can report no focus even while the visitor drives an Ooga.
  Object.defineProperty(scene, "inMotion", { get: () => !!crew?.player });
  BL.scenes.pier = scene;
})();
