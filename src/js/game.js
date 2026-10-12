(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { fnv1a } = BL.math;
  const { HANDLE_MAX, MESSAGE_MAX } = BL.donations;
  const STORAGE_KEY = "oogaboogaland.v1";
  const INVENTORY_MAX = 200;
  const STACK_MAX = 9;
  const LOOT_TIERS = [
    { tier: "legendary", minSats: 100000 },
    { tier: "epic", minSats: 21000 },
    { tier: "rare", minSats: 5000 },
    { tier: "common", minSats: 1000 }
  ];
  const SATS_PER_BANANA = 400;
  const tierFor = (sats) => {
    const found = LOOT_TIERS.find((t) => sats >= t.minSats);
    return found ? found.tier : null;
  };
  // Same donation id always yields the same item.
  const lootFor = (donation, catalog) => {
    const tier = tierFor(donation.sats);
    if (!tier) return null;
    const pool = catalog.filter((item) => item.tier === tier);
    if (!pool.length) return null;
    return { tier, item: pool[fnv1a(`${donation.id}/loot`) % pool.length] };
  };
  const bananasFor = (sats) => Math.max(1, Math.min(12, Math.round(sats / SATS_PER_BANANA)));
  const LARGE_UNITS = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  const formatLarge = (n) => {
    const unit = LARGE_UNITS.find(([size]) => n >= size);
    if (!unit) return String(n);
    const v = n / unit[0];
    return `${v < 10 ? (Math.floor(v * 10) / 10).toFixed(1).replace(/\.0$/, "") : Math.floor(v)}${unit[1]}`;
  };
  const formatThree = (n, compact = false) => {
    if (!Number.isFinite(n)) return "-";
    const rounded = Number(n.toPrecision(3));
    const unit = compact ? LARGE_UNITS.find(([size]) => Math.abs(rounded) >= size) : null;
    const value = unit ? rounded / unit[0] : rounded;
    const places = value === 0 ? 2 : Math.max(0, 2 - Math.floor(Math.log10(Math.abs(value))));
    return `${value.toFixed(places)}${unit ? unit[1] : ""}`;
  };
  const formatFeeRate = (n) => {
    if (!(n > 0 && n < 1)) return formatThree(n);
    const rounded = Number(n.toPrecision(2));
    return rounded.toFixed(Math.max(0, 1 - Math.floor(Math.log10(rounded))));
  };
  const isString = (v, max) => typeof v === "string" && v.length <= max;
  const isEntry = (e, catalog) => e && typeof e === "object" && isString(e.id, 40) && catalog.some((c) => c.id === e.itemId) && LOOT_TIERS.some((t) => t.tier === e.tier) && isString(e.donationId, 64) && Number.isFinite(e.at);
  const defaults = () => ({ inventory: [], assignments: {}, handle: "", message: "", handFed: 0, totalSats: 0, donations: 0, pier: { version: 1, stamps: [], prize: false, fishing: 0, builder: 0, mayhem: 0, whack: 0, seedMatch: 0, volley: 0, lantern: false, midway: { ring: 0, hoops: 0 }, fish: [0, 0, 0, 0, 0], coins: 0, owned: [], balloon: "", daily: { day: 0, progress: [0, 0, 0], done: [false, false, false], bonus: false }, streak: { last: 0, count: 0, best: 0, spared: 0 }, season: { id: 0, fishing: 0, builder: 0, mayhem: 0, whack: 0, seedMatch: 0, volley: 0 }, jobs: { dash: 0, run: 0, sweep: 0 } }, race: { best: {}, cup: null }, drop: { best: null, jumps: 0 }, orbit: { best: null, build: null }, mine: { best: null }, arcade: { skee: 0, hoops: 0, shy: 0, claw: 0, hockey: 0, billiards: 0, darts: 0, pinball: 0, ride: 0, invaders: 0, snake: 0, pong: 0, stampede: 0, flap: 0, breaker: 0, dash: 0, stacker: 0, tickets: 0, prizes: [] } });
  // Stable passport ids are saved independently of authored positions and display names.
  const PIER_STAMPS = ["boardwalk", "hippodrome", "aquarium", "pacific-park", "playland", "route66", "seafood", "muscle-beach", "pier-tip", "lighthouse"];
  // What the pier keeps beside its bests: looks bought at the Surf Shop or earned by a streak (never power), the
  // hidden coins found (one bit each), the fish journal by rarity, and the day's three challenges with the streak.
  const PIER_GOODS = ["balloon-orange", "balloon-teal", "balloon-pink", "balloon-stripe", "balloon-gold", "balloon-block"], PIER_COINS = 21, PIER_FISH_MAX = 9999, PIER_DAY_MAX = 999999;
  // The most each pier game can score, for the season's bests (a season is one difficulty period, numbered by the chain).
  const PIER_CAPS = { fishing: 150, builder: 216, mayhem: 42, whack: 120, seedMatch: 12, volley: 15 };
  // A job on the pier takes a few seconds at the very least and is given up long before an hour.
  const PIER_JOB_MIN = 3000, PIER_JOB_MAX = 3600000;
  // Ooga Arcade's carnival bests, each capped past the most its game can score (nine doubled 100s; the round games
  // run on), the retro cabinets' bests (`retro-games.js`, capped past any run), the ticket balance, and the prizes
  // (`ARCADE_PRIZES` ids) redeemed at the counter.
  const ARCADE_MAX = { skee: 1800, hoops: 9999, shy: 999, claw: 400, hockey: 200, billiards: 200, darts: 540, pinball: 9999999, ride: 9999,
    invaders: 50000, snake: 120000, pong: 99999, stampede: 75000, flap: 20000, breaker: 50000, dash: 99999, stacker: 999999 }, TICKETS_MAX = 1e7;
  const ARCADE_PRIZES = ["banana-plush", "coconut-cup", "bone-kazoo", "gold-sticker", "gorilla-plush", "crown"];
  // A drop best is a landing on your feet: a crash keeps its ring points on the card but is never a best.
  const LANDINGS = ["stand", "stumble"];
  const ORBIT_LANDINGS = ["pad", "islet", "island", "land", "sea", "overpressure", "stuck", "heat", "breakup", "burnup", "splat", "crash", "wreck", "debris"];
  const CUP_MEDALS = ["gold", "silver", "bronze"];
  const MINE_ENDINGS = ["goal", "time", "broke", "wrecked", "seized", "left"];
  const isTime = (v) => Number.isFinite(v) && v > 0 && v < 36e5;
  const load = (catalog) => {
    const state = defaults();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return state;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.inventory)) state.inventory = parsed.inventory.filter((e) => isEntry(e, catalog)).slice(0, INVENTORY_MAX);
      if (parsed.assignments && typeof parsed.assignments === "object") {
        for (const [name, entryId] of Object.entries(parsed.assignments)) {
          if (isString(name, 40) && state.inventory.some((e) => e.id === entryId)) state.assignments[name] = entryId;
        }
      }
      if (isString(parsed.handle, HANDLE_MAX)) state.handle = parsed.handle;
      if (isString(parsed.message, MESSAGE_MAX)) state.message = parsed.message;
      for (const key of ["handFed", "totalSats", "donations"]) {
        if (Number.isFinite(parsed[key]) && parsed[key] >= 0) state[key] = Math.floor(parsed[key]);
      }
      if (parsed.race && parsed.race.best && typeof parsed.race.best === "object") {
        for (const [track, b] of Object.entries(parsed.race.best)) {
          if (isString(track, 16) && b && isTime(b.lap) && isTime(b.race)) state.race.best[track] = { lap: Math.floor(b.lap), race: Math.floor(b.race), medal: CUP_MEDALS.includes(b.medal) ? b.medal : null };
        }
      }
      if (parsed.race && parsed.race.cup && CUP_MEDALS.includes(parsed.race.cup.medal) && Number.isFinite(parsed.race.cup.points) && parsed.race.cup.points >= 0) {
        state.race.cup = { medal: parsed.race.cup.medal, points: Math.floor(parsed.race.cup.points) };
      }
      const jumps = parsed.drop && parsed.drop.jumps;
      if (Number.isFinite(jumps) && jumps >= 0 && jumps < 1e7) state.drop.jumps = Math.floor(jumps);
      const d = parsed.drop && parsed.drop.best;
      if (d && Number.isFinite(d.score) && d.score >= 0 && d.score < 1e6 && Number.isFinite(d.rings) && d.rings >= 0 && Number.isFinite(d.ringTotal) && d.ringTotal >= d.rings && d.ringTotal <= 99 && LANDINGS.includes(d.landing)) {
        state.drop.best = { score: Math.floor(d.score), rings: Math.floor(d.rings), ringTotal: Math.floor(d.ringTotal), landing: d.landing };
      }
      const o = parsed.orbit;
      if (o && o.best && Number.isFinite(o.best.score) && o.best.score >= 0 && o.best.score < 1e6 && typeof o.best.orbit === "boolean" && ORBIT_LANDINGS.includes(o.best.landing)) {
        state.orbit.best = { score: Math.floor(o.best.score), orbit: o.best.orbit, landing: o.best.landing };
      }
      const build = o && BL.rocketParts.sanitize(o.build);
      if (build && build.length) state.orbit.build = build;
      const m = parsed.mine && parsed.mine.best;
      if (m && Number.isFinite(m.sats) && m.sats >= 0 && m.sats < 1e15 && Number.isFinite(m.seconds) && m.seconds > 0 && m.seconds <= BL.mineRigs.RUN_SECONDS
        && MINE_ENDINGS.includes(m.ending) && typeof m.won === "boolean" && Number.isFinite(m.score) && m.score >= 0 && m.score < 1e7) {
        state.mine.best = { sats: Math.floor(m.sats), seconds: Math.floor(m.seconds), ending: m.ending, won: m.won, score: Math.floor(m.score), continued: m.continued === true };
      }
      const a = parsed.arcade;
      if (a && typeof a === "object") for (const kind in ARCADE_MAX) {
        if (Number.isFinite(a[kind]) && a[kind] >= 0 && a[kind] <= ARCADE_MAX[kind]) state.arcade[kind] = Math.floor(a[kind]);
      }
      if (a && Number.isFinite(a.tickets) && a.tickets >= 0 && a.tickets <= TICKETS_MAX) state.arcade.tickets = Math.floor(a.tickets);
      if (a && Array.isArray(a.prizes)) state.arcade.prizes = ARCADE_PRIZES.filter((id) => a.prizes.includes(id));
      const p = parsed.pier;
      if (p && p.version === 1 && Array.isArray(p.stamps)) {
        state.pier.stamps = PIER_STAMPS.filter((id) => p.stamps.includes(id));
        state.pier.prize = state.pier.stamps.length === PIER_STAMPS.length && p.prize === true;
        if (Number.isInteger(p.fishing) && p.fishing >= 0 && p.fishing <= 150 && p.fishing % 5 === 0) state.pier.fishing = p.fishing;
        if (Number.isInteger(p.builder) && p.builder >= 0 && p.builder <= 216) state.pier.builder = p.builder;
        if (Number.isInteger(p.whack) && p.whack >= 0 && p.whack <= 120) state.pier.whack = p.whack;
        if (Number.isInteger(p.volley) && p.volley >= 0 && p.volley <= 15) state.pier.volley = p.volley;
        if (Number.isInteger(p.seedMatch) && p.seedMatch >= 0 && p.seedMatch <= 12) state.pier.seedMatch = p.seedMatch;
        if (Number.isInteger(p.mayhem) && p.mayhem >= 0 && p.mayhem <= 42 && p.mayhem % 6 === 0) state.pier.mayhem = p.mayhem;
        state.pier.lantern = p.lantern === true;
        const whole = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
        if (p.midway && typeof p.midway === "object") for (const kind of ["ring", "hoops"]) if (whole(p.midway[kind], 5)) state.pier.midway[kind] = p.midway[kind];
        if (Array.isArray(p.fish)) for (let i = 0; i < state.pier.fish.length; i++) if (whole(p.fish[i], PIER_FISH_MAX)) state.pier.fish[i] = p.fish[i];
        if (whole(p.coins, 2 ** PIER_COINS - 1)) state.pier.coins = p.coins;
        if (Array.isArray(p.owned)) state.pier.owned = PIER_GOODS.filter((id) => p.owned.includes(id));
        if (state.pier.owned.includes(p.balloon)) state.pier.balloon = p.balloon;
        const d = p.daily, k = p.streak;
        if (d && typeof d === "object" && whole(d.day, PIER_DAY_MAX) && Array.isArray(d.progress) && Array.isArray(d.done)) {
          state.pier.daily.day = d.day;
          for (let i = 0; i < 3; i++) { if (whole(d.progress[i], 99999)) state.pier.daily.progress[i] = d.progress[i]; state.pier.daily.done[i] = d.done[i] === true; }
          state.pier.daily.bonus = d.bonus === true && state.pier.daily.done.every(Boolean);
        }
        // A job's best time in milliseconds; 0 is never finished.
        if (p.jobs && typeof p.jobs === "object") for (const id in state.pier.jobs) if (whole(p.jobs[id], PIER_JOB_MAX) && p.jobs[id] >= PIER_JOB_MIN) state.pier.jobs[id] = p.jobs[id];
        const n = p.season;
        if (n && typeof n === "object" && whole(n.id, PIER_DAY_MAX)) { state.pier.season.id = n.id; for (const kind in PIER_CAPS) if (whole(n[kind], PIER_CAPS[kind])) state.pier.season[kind] = n[kind]; }
        if (k && typeof k === "object" && whole(k.last, PIER_DAY_MAX) && whole(k.best, PIER_DAY_MAX) && whole(k.count, k.best) && whole(k.spared, PIER_DAY_MAX)) Object.assign(state.pier.streak, { last: k.last, count: k.count, best: k.best, spared: k.spared });
      }
    } catch {
      return defaults();
    }
    return state;
  };
  const save = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable; keep going in memory.
    }
  };
  const create = ({ catalog }) => {
    const state = load(catalog);
    let seq = state.inventory.length;
    const countOf = (itemId) => state.inventory.reduce((n, e) => n + (e.itemId === itemId), 0);
    // Full stacks never roll: a crate only carries an item the locker still has room for.
    const lootForVisitor = (donation) => lootFor(donation, catalog.filter((item) => countOf(item.id) < STACK_MAX));
    const addItem = ({ item, tier, donationId }) => {
      if (countOf(item.id) >= STACK_MAX) return null;
      const entry = { id: `${donationId}/${seq++}`, itemId: item.id, tier, donationId, at: Date.now() };
      state.inventory.push(entry);
      if (state.inventory.length > INVENTORY_MAX) {
        const dropped = state.inventory.shift();
        for (const [name, id] of Object.entries(state.assignments)) if (id === dropped.id) delete state.assignments[name];
      }
      save(state);
      return entry;
    };
    const assign = (entryId, name) => {
      if (!state.inventory.some((e) => e.id === entryId)) return false;
      // One item per caveman, so drop the previous wearer.
      for (const [other, id] of Object.entries(state.assignments)) if (id === entryId) delete state.assignments[other];
      state.assignments[name] = entryId;
      save(state);
      return true;
    };
    const unassign = (name) => {
      delete state.assignments[name];
      save(state);
    };
    const itemOf = (entryId) => {
      const entry = state.inventory.find((e) => e.id === entryId);
      return entry ? catalog.find((c) => c.id === entry.itemId) : null;
    };
    const assignedTo = (entryId) => Object.keys(state.assignments).find((name) => state.assignments[name] === entryId) || null;
    const recordDonation = (donation) => {
      state.totalSats += donation.sats;
      state.donations += 1;
      save(state);
    };
    const recordHandFed = () => {
      state.handFed += 1;
      save(state);
    };
    const resetAll = () => {
      if (BL.mineSim) BL.mineSim.clear();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage unavailable, but the reload still resets.
      }
    };
    const clearLoot = () => {
      state.inventory.length = 0;
      for (const name of Object.keys(state.assignments)) delete state.assignments[name];
      save(state);
    };
    // A track's best keeps its best medal too: the medal is earned by place as well as time, so it is
    // not something the times alone can say.
    const recordRace = (track, lap, race, medal = null) => {
      const b = state.race.best[track], rank = (m) => CUP_MEDALS.indexOf(m);
      const bestMedal = b && b.medal && (!medal || rank(b.medal) < rank(medal)) ? b.medal : medal || (b && b.medal) || null;
      const entry = { lap: Math.floor(b && b.lap < lap ? b.lap : lap), race: Math.floor(b && b.race < race ? b.race : race), medal: bestMedal };
      const improved = !b || entry.race < b.race || entry.lap < b.lap || (!!medal && (!b.medal || rank(medal) < rank(b.medal)));
      state.race.best[track] = entry;
      save(state);
      return improved;
    };
    // Best cup finish = a higher medal, or the same medal with more points.
    const recordCup = (place, points) => {
      const medal = CUP_MEDALS[place - 1];
      if (!medal) return false;
      const c = state.race.cup;
      const better = !c || CUP_MEDALS.indexOf(medal) < CUP_MEDALS.indexOf(c.medal) || (medal === c.medal && points > c.points);
      if (better) {
        state.race.cup = { medal, points: Math.floor(points) };
        save(state);
      }
      return better;
    };
    // Every flight counts as a jump; the count seeds the course's shape and numbers the results.
    const recordJump = () => {
      state.drop.jumps = (state.drop.jumps | 0) + 1;
      save(state);
      return state.drop.jumps;
    };
    const recordDrop = ({ score, rings, ringTotal, landing }) => {
      const b = state.drop.best;
      // A lost first jump is not a best.
      if (score <= 0 || !LANDINGS.includes(landing) || (b && b.score >= score)) return false;
      state.drop.best = { score: Math.floor(score), rings, ringTotal, landing };
      save(state);
      return true;
    };
    const recordOrbit = ({ score, orbit, landing }) => {
      const b = state.orbit.best;
      if (b && b.score >= score) return false;
      state.orbit.best = { score: Math.floor(score), orbit, landing };
      save(state);
      return true;
    };
    // A mine run is best by its score: coin mined plus the speed bonus a finished run earns, so a
    // faster win beats a slower one and any win beats a run that ran out of hour. `continued` marks a
    // run that came back from a loss: it can be the best, but it wears no medal.
    const recordMine = ({ sats, seconds, ending, won, score, continued }) => {
      const b = state.mine.best;
      if (b && score <= b.score) return false;
      state.mine.best = { sats: Math.floor(sats), seconds: Math.floor(seconds), ending, won: !!won, score: Math.floor(score), continued: !!continued };
      save(state);
      return true;
    };
    const recordArcade = (kind, score) => {
      if (!(kind in ARCADE_MAX) || !(score > state.arcade[kind])) return false;
      state.arcade[kind] = Math.min(ARCADE_MAX[kind], Math.floor(score));
      save(state);
      return true;
    };
    const addTickets = (n) => {
      state.arcade.tickets = Math.min(TICKETS_MAX, state.arcade.tickets + Math.max(0, Math.floor(n)));
      save(state);
      return state.arcade.tickets;
    };
    // Tickets spent at a machine (the jackpot wheel's spin): false, and nothing spent, when the tickets fall short or
    // the cost is not a whole number above nothing.
    const spendTickets = (n) => {
      if (!Number.isInteger(n) || n <= 0 || state.arcade.tickets < n) return false;
      state.arcade.tickets -= n;
      save(state);
      return true;
    };
    // A prize at the counter: false when it is already won or the tickets fall short.
    const redeem = (id, cost) => {
      if (!Number.isInteger(cost) || cost <= 0 || !ARCADE_PRIZES.includes(id) || state.arcade.prizes.includes(id) || state.arcade.tickets < cost) return false;
      state.arcade.tickets -= cost;
      state.arcade.prizes.push(id);
      save(state);
      return true;
    };
    const stampPier = (id) => {
      if (!PIER_STAMPS.includes(id) || state.pier.stamps.includes(id)) return false;
      state.pier.stamps.push(id);
      save(state);
      return true;
    };
    // A separate, free souvenir never spends tickets or duplicates an arcade prize.
    const redeemPierPassport = () => {
      if (state.pier.prize || state.pier.stamps.length !== PIER_STAMPS.length) return false;
      state.pier.prize = true;
      save(state);
      return true;
    };
    // The lighthouse's crank, turned once: the visitor checked a block for themselves and their lantern burns for good.
    const lightPierLantern = () => {
      if (state.pier.lantern) return false;
      state.pier.lantern = true;
      save(state);
      return true;
    };
    const recordPierFishing = (score) => {
      if (!Number.isInteger(score) || score <= state.pier.fishing || score > 150 || score % 5 !== 0) return false;
      state.pier.fishing = score;
      save(state);
      return true;
    };
    const recordPierBuilder = (fees) => {
      if (!Number.isInteger(fees) || fees <= state.pier.builder || fees > 216) return false;
      state.pier.builder = fees;
      save(state);
      return true;
    };
    const recordPierMayhem = (tickets) => {
      if (!Number.isInteger(tickets) || tickets <= state.pier.mayhem || tickets > 42 || tickets % 6 !== 0) return false;
      state.pier.mayhem = tickets;
      save(state);
      return true;
    };
    const recordPierWhack = (score) => {
      if (!Number.isInteger(score) || score <= state.pier.whack || score > 120) return false;
      state.pier.whack = score;
      save(state);
      return true;
    };
    const recordPierSeedMatch = (score) => {
      if (!Number.isInteger(score) || score <= state.pier.seedMatch || score > 12) return false;
      state.pier.seedMatch = score;
      save(state);
      return true;
    };
    const recordPierVolley = (score) => {
      if (!Number.isInteger(score) || score <= state.pier.volley || score > 15) return false;
      state.pier.volley = score;
      save(state);
      return true;
    };
    // A round's score in season `id`. A later season starts every best again; an earlier one is ignored.
    const recordPierSeason = (id, kind, score) => {
      const kept = state.pier.season;
      if (!Number.isInteger(id) || id <= 0 || id < kept.id || !Object.hasOwn(PIER_CAPS, kind) || !Number.isInteger(score) || score < 0 || score > PIER_CAPS[kind]) return false;
      if (id > kept.id) { for (const each in PIER_CAPS) kept[each] = 0; kept.id = id; }
      else if (score <= kept[kind]) return false;
      kept[kind] = Math.max(kept[kind], score);
      save(state);
      return true;
    };
    // A job's time in milliseconds: kept when it is the first or faster than the best.
    const recordPierJob = (id, ms) => {
      if (!Object.hasOwn(state.pier.jobs, id) || !Number.isInteger(ms) || ms < PIER_JOB_MIN || ms > PIER_JOB_MAX || state.pier.jobs[id] && ms >= state.pier.jobs[id]) return false;
      state.pier.jobs[id] = ms;
      save(state);
      return true;
    };
    const recordPierMidway = (kind, hits) => {
      if (!Object.hasOwn(state.pier.midway, kind) || !Number.isInteger(hits) || hits <= state.pier.midway[kind] || hits > 5) return false;
      state.pier.midway[kind] = hits;
      save(state);
      return true;
    };
    // The fish journal: one more of that rarity. Returns how many are logged now, so 1 is a first.
    const logPierFish = (tier) => {
      if (!Number.isInteger(tier) || tier < 0 || tier >= state.pier.fish.length) return 0;
      if (state.pier.fish[tier] < PIER_FISH_MAX) state.pier.fish[tier]++;
      save(state);
      return state.pier.fish[tier];
    };
    const findPierCoin = (index) => {
      if (!Number.isInteger(index) || index < 0 || index >= PIER_COINS || state.pier.coins & 1 << index) return false;
      state.pier.coins |= 1 << index;
      save(state);
      return true;
    };
    // A look from the Surf Shop, paid in tickets; `grantPier` is the same look earned by a streak, at no cost.
    const buyPier = (id, cost) => {
      if (!PIER_GOODS.includes(id) || state.pier.owned.includes(id) || !Number.isInteger(cost) || cost < 0 || state.arcade.tickets < cost) return false;
      state.arcade.tickets -= cost;
      state.pier.owned.push(id);
      save(state);
      return true;
    };
    const grantPier = (id) => buyPier(id, 0);
    const wearPierBalloon = (id) => {
      if (id !== "" && !state.pier.owned.includes(id)) return false;
      state.pier.balloon = id;
      save(state);
      return true;
    };
    // The day's challenges and the streak are kept by pier-daily.js, which writes them in place and saves here.
    const savePierDaily = () => save(state);
    const setOrbitBuild = (stack) => {
      state.orbit.build = stack.slice();
      save(state);
    };
    const setIdentity = ({ handle, message }) => {
      state.handle = handle;
      state.message = message;
      save(state);
    };
    const forecast = (level, workers, eatRatePerWorker) => {
      const rate = workers * eatRatePerWorker;
      if (rate <= 0) return Infinity;
      return level / rate;
    };
    const formatDuration = (seconds) => {
      if (!Number.isFinite(seconds)) return "stable";
      if (seconds < 90) return `${Math.max(1, Math.round(seconds))}s`;
      if (seconds < 5400) return `${Math.round(seconds / 60)}m`;
      return `${(seconds / 3600).toFixed(1)}h`;
    };
    return { state, countOf, lootFor: lootForVisitor, addItem, assign, unassign, itemOf, assignedTo, clearLoot, resetAll, recordDonation, recordHandFed, recordRace, recordCup, recordJump, recordDrop, recordOrbit, recordMine, recordArcade, addTickets, spendTickets, redeem, stampPier, redeemPierPassport, lightPierLantern, recordPierFishing, recordPierBuilder, recordPierMayhem, recordPierWhack, recordPierSeedMatch, recordPierVolley, recordPierSeason, recordPierJob, recordPierMidway, logPierFish, findPierCoin, buyPier, grantPier, wearPierBalloon, savePierDaily, setOrbitBuild, setIdentity, forecast, formatDuration };
  };
  BL.game = { create, LOOT_TIERS, STACK_MAX, SATS_PER_BANANA, PIER_STAMPS, tierFor, lootFor, bananasFor, formatLarge, formatThree, formatFeeRate };
})();
