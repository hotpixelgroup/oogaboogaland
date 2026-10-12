// A reason to come back tomorrow: three challenges a day and a streak.
//  - The three are drawn from the UTC day's number, so every visitor has the same three with no server between
//    them: one out on the pier (the bell, the rides, the brass ring, wheels, the midway) and two of the six games.
//  - Each one finished pays PRIZE tickets, all three a BONUS on top, once a day.
//  - The first one finished in a day adds that day to the streak. One missed day is forgiven once in any week;
//    a longer gap starts the chain again. Nothing already earned is taken away, and a streak only ever unlocks a
//    look (a balloon), never a score.
// `pick` and `step` are the rules on their own (the suite runs them in Node). Progress lives in the save
// (`game.state.pier.daily`, `.streak`), written in place and saved through `game.savePierDaily`.
(() => {
  "use strict";
  const BL = window.BL, PRIZE = 15, BONUS = 30, WEEK = 7, DAY_MS = 86400000, FLUSH = 5;
  const times = (n) => n === 1 ? "once" : n === 2 ? "twice" : `${n} times`;
  // `sum` adds up over the day; the others are the best single round.
  const WORLD = [
    { id: "rings", sum: true, goals: [1, 2, 3], text: (n) => `Ring the Proof-of-Work Bell ${times(n)}` },
    { id: "rides", sum: true, goals: [2, 3], text: (n) => `Ride ${n} rides to the end` },
    { id: "brass", sum: true, goals: [1, 2], text: (n) => n === 1 ? "Grab a brass ring on the carousel" : "Grab two brass rings on the carousel" },
    { id: "metres", sum: true, goals: [300, 600, 900], text: (n) => `Pedal or skate ${n} metres` },
    { id: "midway", goals: [2, 3, 4], text: (n) => `Land ${n} throws in one midway round` }
  ];
  const GAMES = [
    { id: "fishing", goals: [3, 4, 5], text: (n) => `Land ${n} keepers in one round of Hash Fishing` },
    { id: "builder", goals: [30, 40, 50], text: (n) => `Fit ${n} fees into one block at Block Builder` },
    { id: "whack", goals: [30, 50, 70], text: (n) => `Score ${n} in one round of Double-Spend Whack` },
    { id: "volley", goals: [5, 8, 11], text: (n) => `Route ${n} payments in one round of Lightning Volley` },
    { id: "seed", goals: [10, 12], text: (n) => `Recover ${n} seed words in order` },
    { id: "mayhem", goals: [12, 18, 24], text: (n) => `Bank ${n} tickets in one round of Mempool Mayhem` }
  ];
  // Days of streak, the look it unlocks (a `game.js` PIER_GOODS id) and its name.
  const MILESTONES = [[3, "balloon-stripe", "striped balloon"], [7, "balloon-gold", "gold balloon"], [21, "balloon-block", "block balloon"]];
  const pick = (day) => {
    const rand = BL.math.mulberry32(BL.math.fnv1a(`ooga-pier-day-${day}`)), draw = (n) => Math.floor(rand() * n);
    const task = (def) => { const goal = def.goals[draw(def.goals.length)]; return { id: def.id, sum: !!def.sum, goal, text: def.text(goal) }; };
    const out = [task(WORLD[draw(WORLD.length)])], first = draw(GAMES.length), second = (first + 1 + draw(GAMES.length - 1)) % GAMES.length;
    out.push(task(GAMES[first]), task(GAMES[second]));
    return out;
  };
  // One more day played, written into `streak` in place.
  const step = (streak, day) => {
    if (day === streak.last && streak.count > 0) return streak;
    const gap = day - streak.last;
    if (streak.count > 0 && gap === 1) streak.count++;
    else if (streak.count > 0 && gap === 2 && (streak.spared === 0 || day - streak.spared >= WEEK)) { streak.count++; streak.spared = day - 1; }
    else streak.count = 1;
    streak.last = day; streak.best = Math.max(streak.best, streak.count);
    return streak;
  };
  // The streak as it stands on `day`: its count while it can still be carried on, else 0.
  const standing = (streak, day) => {
    const gap = day - streak.last;
    return streak.count > 0 && (gap <= 1 || gap === 2 && (streak.spared === 0 || day - streak.spared >= WEEK)) ? streak.count : 0;
  };
  // Parked, nothing counts on this page. The suite parks the challenges so other checks' ticket counts stay exact.
  let held = false;
  const create = ({ game, hud, sound, onAll, today = () => Math.floor(Date.now() / DAY_MS) }) => {
    const save = game.state.pier.daily, streak = game.state.pier.streak;
    const ui = { items: [...document.getElementById("pier-daily-list").children], streak: document.getElementById("pier-streak"), pill: document.getElementById("pier-daily") };
    // The last reading of each running count; -1 until the first, so a visit starts from where the pier stands.
    const seen = { rings: -1, rides: -1, brass: -1, metres: -1 };
    let tasks = null, wait = 0, flush = 0, dirty = false, notice = "", delay = 0, pinned = 0;
    const paint = () => {
      let done = 0;
      for (let i = 0; i < 3; i++) {
        const t = tasks[i], item = ui.items[i];
        if (save.done[i]) done++;
        item.textContent = save.done[i] ? `Done · ${t.text}` : `${Math.min(save.progress[i], t.goal)}/${t.goal} · ${t.text} · ${PRIZE} tickets`;
        item.dataset.done = String(save.done[i]);
      }
      ui.pill.textContent = `Today ${done}/3`;
      const count = standing(streak, save.day), next = MILESTONES.find((m) => m[0] > count);
      ui.streak.textContent = count ? `Streak: ${count} ${count === 1 ? "day" : "days"} · best ${streak.best}${next ? ` · ${next[2]} at ${next[0]}` : ""}` : streak.best ? `Streak ended · best ${streak.best}. Finish one to start again.` : "Finish one to start a streak. A missed day a week is forgiven.";
    };
    const roll = (day) => {
      if (save.day !== day) { save.day = day; save.progress.fill(0); save.done.fill(false); save.bonus = false; game.savePierDaily(); }
      tasks = pick(day); paint();
    };
    const finish = (i) => {
      save.done[i] = true;
      const counted = streak.last === save.day && streak.count > 0;
      let paid = game.addTickets(PRIZE), unlocked = "";
      if (!counted) {
        step(streak, save.day);
        for (const [days, id, name] of MILESTONES) if (streak.count >= days && game.grantPier(id)) unlocked = ` · ${days}-day streak: the ${name} is yours at the Surf Shop`;
      }
      const all = save.done.every(Boolean);
      if (all && !save.bonus) { save.bonus = true; paid += game.addTickets(BONUS); onAll(); }
      game.savePierDaily(); dirty = false; paint();
      // A round's own result is on screen at this moment; this follows it.
      notice = `${all ? "All three done today" : `Today ${save.done.filter(Boolean).length}/3`} · ${tasks[i].text} · +${paid} tickets${unlocked}`; delay = 1.6;
    };
    const credit = (i, progress) => {
      if (held) return;
      save.progress[i] = Math.min(99999, progress); dirty = true;
      if (save.progress[i] >= tasks[i].goal) finish(i); else paint();
    };
    // A finished round's result, for the challenges that ask for one good round.
    const round = (id, value) => { for (let i = 0; i < 3; i++) if (tasks[i].id === id && !tasks[i].sum && !save.done[i] && value > save.progress[i]) credit(i, value); };
    // A running total from the pier (rings, rides, metres): what it grew by since the last look counts.
    const count = (id, total) => {
      total = Math.floor(total);
      const grew = seen[id] < 0 ? 0 : total - seen[id];
      seen[id] = total;
      if (grew > 0) for (let i = 0; i < 3; i++) if (tasks[i].id === id && tasks[i].sum && !save.done[i]) credit(i, save.progress[i] + grew);
    };
    const update = (dt, stats) => {
      if (notice && (delay -= dt) <= 0) { hud.toast(notice); sound.cue("best"); notice = ""; }
      wait -= dt;
      if (wait > 0) return;
      wait = 0.5;
      const day = pinned || today();
      if (day !== save.day) roll(day);
      count("rings", stats.rings); count("rides", stats.rides); count("brass", stats.brass); count("metres", stats.metres);
      // Metres tick up all the while a visitor pedals: write them down every few seconds, not every look.
      flush -= 0.5;
      if (dirty && flush <= 0) { dirty = false; flush = FLUSH; game.savePierDaily(); }
    };
    roll(today());
    return {
      update, round, save, streak,
      // Stand on a given day, or 0 for the real one (the maintainer, the suite).
      pin: (day) => { pinned = day; roll(day || today()); },
      get tasks() { return tasks; },
      get done() { return save.done.filter(Boolean).length; },
      dispose: () => { if (dirty) game.savePierDaily(); ui.pill.textContent = ""; }
    };
  };
  BL.pierDaily = { create, pick, step, standing, hold: (on) => { held = on; }, PRIZE, BONUS, MILESTONES, WORLD, GAMES };
})();
