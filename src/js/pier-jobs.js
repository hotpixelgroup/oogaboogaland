// Jobs against the clock, taken from the board on the plaza: a dash down the boardwalk, an ice cream run and a
// sweep of the park. A job is gates out in the world (beams of light to pass through, in order or in any order)
// and a time; gold, silver and bronze are set against it. A medal pays tickets the first time it is earned and
// a few for every finish after; only a faster time is kept as the best. Wheels are allowed and are the point.
// The board is a station like the games (a row in the scene's MINIS): choosing a job closes it and the job runs
// while the visitor moves freely. `medalFor` is the rule on its own (the suite runs it in Node).
(() => {
  "use strict";
  const BL = window.BL, S = BL.scene, M = BL.models, REACH = 3.2, MEDALS = ["Gold", "Silver", "Bronze"], PRIZES = [30, 20, 10], AGAIN = 3, GIVE_UP = 1.6, LINGER = 5;
  // medals: seconds for gold, silver and bronze. gates: x, z on the deck.
  const JOBS = [
    { id: "dash", name: "Boardwalk dash", brief: "Six gates to the pier's tip. Take wheels.", ordered: true, medals: [40, 60, 95], gates: [[0, 40], [0, -20], [0, -90], [0, -160], [0, -230], [0, -261]] },
    { id: "run", name: "Ice cream run", brief: "Three drops in order: Playland, the wheel, the lookout.", ordered: true, medals: [60, 85, 130], gates: [[-36, 40], [-42, -100], [-5, -262]] },
    { id: "sweep", name: "Park sweep", brief: "Eight beacons in Pacific Park, any order.", ordered: false, medals: [50, 70, 110], gates: [[-57, -20], [-36, -30], [-9, -40], [-54, -60], [-30, -80], [-57, -100], [-12, -100], [-36, -128]] }
  ];
  const MOST = 8;
  // 0 gold, 1 silver, 2 bronze, or -1 for a finish outside every medal.
  const medalFor = (job, seconds) => { for (let i = 0; i < 3; i++) if (seconds <= job.medals[i]) return i; return -1; };
  const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  const gate = M.cached(() => {
    const g = M.merge(M.lathe({ profile: [[1.5, 0], [1.1, 9]], segments: 14, color: "#f7931a", emissive: 1 }), M.torus(1.6, 0.09, "#fff0d3", 1, 20, 5));
    g.glass = 0.16; g.glassOpacity = 0.16; g.castShadow = false; return g;
  });
  const board = M.cached(() => {
    const box = (w, h, d, x, y, z, color) => M.moved(M.bevelBox({ w, h, d, color }), x, y, z), parts = [box(2.6, 1.6, 0.14, 0, 1.9, 0, "#8e6949"), box(2.3, 1.3, 0.04, 0, 1.9, 0.09, "#f3dfb5")];
    for (const x of [-1.15, 1.15]) parts.push(M.beam(x, 0, 0, x, 2.8, 0, 0.09, "#6f5137"));
    // Pinned notes.
    for (const [x, y, color] of [[-0.7, 2.15, "#f7931a"], [0.1, 2.2, "#30b9bd"], [0.75, 2.05, "#f28ab2"], [-0.3, 1.6, "#fff7de"], [0.55, 1.55, "#ffd866"]]) parts.push(box(0.55, 0.4, 0.02, x, y, 0.12, color));
    return M.merge(...parts);
  });
  const pad = M.cached(() => M.box({ w: 1.8, h: 0.015, d: 2.2, color: "#eac66f" }));
  const build = (layout) => {
    const q = layout.jobs, root = S.createNode(), solid = S.createNode({ geometry: board(), position: { x: q.x, y: q.floor, z: q.z } });
    S.addChild(root, solid);
    S.addChild(root, S.createNode({ geometry: BL.hubModels.postSign("JOBS", 0.32, 1.3), position: { x: q.x - 2.1, y: q.floor, z: q.z } }));
    S.addChild(root, S.createNode({ geometry: pad(), position: { x: q.play.x, y: q.floor + 0.009, z: q.play.z } }));
    const gates = [];
    for (let i = 0; i < MOST; i++) { const node = S.createNode({ geometry: gate(), visible: false, glow: 1 }); S.addChild(root, node); gates.push(node); }
    return { root, solid, gates };
  };
  const create = ({ models, layout, crew, pilot, hud, fx, game, sound }) => {
    const q = layout.jobs, top = layout.top;
    const ui = { panel: document.getElementById("pier-jobs"), list: document.getElementById("pier-jobs-list"), stop: document.getElementById("pier-jobs-stop"), close: document.getElementById("pier-jobs-close"), banner: document.getElementById("pier-job"), name: document.getElementById("pier-job-name"), left: document.getElementById("pier-job-left") };
    const quiet = [hud.el.act, hud.el.hint, document.getElementById("joy-move"), document.getElementById("joy-look"), document.querySelector(".pier-navigation")], hidden = new Array(quiet.length);
    const rows = [];
    for (const job of JOBS) {
      const li = document.createElement("li"), text = document.createElement("span"), name = document.createElement("b"), note = document.createElement("small"), button = document.createElement("button");
      name.textContent = job.name; button.type = "button"; button.dataset.job = job.id; button.textContent = "Start"; text.append(name, note); li.append(text, button); ui.list.append(li); rows.push({ job, note });
    }
    const state = { job: null, seconds: 0, passed: 0, finished: 0, medal: -1 }, done = new Array(MOST).fill(false);
    let actor = null, shownSecond = -1, shownPassed = -1, linger = 0;
    const refresh = () => {
      for (const row of rows) {
        const best = game.state.pier.jobs[row.job.id], medal = best ? medalFor(row.job, best / 1000) : -1;
        row.note.textContent = `${row.job.brief} Gold ${clock(row.job.medals[0])}.${best ? ` Best ${clock(best / 1000)}${medal >= 0 ? ` · ${MEDALS[medal]}` : ""}.` : ""}`;
      }
      ui.stop.hidden = !state.job;
    };
    const lay = () => {
      const job = state.job;
      for (let i = 0; i < MOST; i++) {
        const node = models.gates[i], on = !!job && i < job.gates.length && !done[i];
        node.visible = on;
        if (!on) continue;
        node.position.x = job.gates[i][0]; node.position.y = top; node.position.z = job.gates[i][1];
        // In an ordered job the next gate is the bright one.
        node.glow = !job.ordered || i === state.passed ? 2.2 : 0.5;
      }
    };
    const stop = (note) => { state.job = null; ui.banner.hidden = true; linger = 0; lay(); if (note) hud.toast(note); refresh(); };
    const start = (job) => {
      state.job = job; state.seconds = 0; state.passed = 0; state.medal = -1; done.fill(false); shownSecond = shownPassed = -1; linger = 0;
      ui.banner.hidden = false; ui.name.textContent = job.name; lay(); sound.cue("select");
      hud.toast(`${job.name}: ${job.brief}`);
    };
    const finish = () => {
      const job = state.job, seconds = state.seconds, medal = medalFor(job, seconds), before = game.state.pier.jobs[job.id], had = before ? medalFor(job, before / 1000) : -1;
      const best = game.recordPierJob(job.id, Math.round(seconds * 1000));
      // A medal better than any held pays in full; any other finish pays the small sum.
      const paid = game.addTickets(medal >= 0 && (had < 0 || medal < had) ? PRIZES[medal] : AGAIN);
      state.finished++; state.medal = medal;
      sound.cue(best ? "best" : "win");
      const p = crew.player ? crew.player.root.position : null;
      if (p) fx.burst(p.x, p.y + 1.4, p.z, 20, BL.fx.CONFETTI, 2.4);
      stop(`${job.name} in ${clock(seconds)}${medal >= 0 ? ` · ${MEDALS[medal]}` : ""}${best ? " · new best" : ""} · +${paid} tickets`);
      // The result stays on the banner a few seconds: a toast can be talked over by whatever else just happened.
      ui.name.textContent = job.name; ui.left.textContent = `${medal >= 0 ? `${MEDALS[medal]} · ` : ""}${clock(seconds)} · +${paid} tickets`; ui.banner.hidden = false; linger = LINGER;
    };
    const near = () => { const a = crew.player; return !!a && !a.jet && !a.camp.seat && Math.abs(a.root.position.y - a.baseY - q.floor) < 0.2 && Math.hypot(a.root.position.x - q.play.x, a.root.position.z - q.play.z) < 2; };
    const close = () => {
      if (!actor) return;
      if (ui.panel.contains(document.activeElement)) document.activeElement.blur();
      actor = null; ui.panel.hidden = true;
      for (let i = 0; i < quiet.length; i++) quiet[i].hidden = hidden[i];
      pilot.setActive(true); pilot.controls.reset(); crew.steer(0, 0, 0, 0, 0); pilot.showAct();
    };
    const act = () => {
      if (actor) return true;
      if (!near()) return false;
      actor = crew.player; crew.setWeaponTrigger(false); crew.steer(0, 0, 0, 0, 0); pilot.controls.reset(); pilot.setActive(false);
      for (let i = 0; i < quiet.length; i++) { hidden[i] = quiet[i].hidden; quiet[i].hidden = true; }
      refresh(); ui.panel.hidden = false; ui.panel.focus();
      return true;
    };
    const onJob = (e) => {
      const button = e.target.closest("button[data-job]");
      if (!actor || !button) return;
      const job = JOBS.find((j) => j.id === button.dataset.job);
      close(); start(job);
    };
    const onStop = () => { if (actor && state.job) { stop("Job dropped"); } };
    const onButtonKey = (e) => { if (e.key === " " && e.target.closest("button")) e.stopPropagation(); };
    const onKey = (e) => {
      if (!actor) return false;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
      else if (e.key !== " " && e.key !== "Tab" && e.key !== "Enter") { e.preventDefault(); e.stopImmediatePropagation(); }
      return true;
    };
    ui.list.addEventListener("click", onJob); ui.stop.addEventListener("click", onStop); ui.close.addEventListener("click", close); ui.panel.addEventListener("keydown", onButtonKey);
    const update = (dt) => {
      if (actor) { if (crew.player !== actor) close(); else crew.steer(0, 0, 0, 0, 0); }
      const job = state.job;
      if (!job) { if (linger > 0 && (linger -= dt) <= 0) ui.banner.hidden = true; return; }
      state.seconds += dt;
      if (state.seconds > job.medals[2] * GIVE_UP) { sound.cue("miss"); stop(`${job.name}: out of time`); return; }
      const a = crew.player;
      if (a) {
        const x = a.root.position.x, z = a.root.position.z, feet = a.root.position.y - a.baseY;
        for (let i = 0; i < job.gates.length; i++) {
          if (done[i] || job.ordered && i !== state.passed) continue;
          if (Math.abs(feet - top) < 3 && Math.hypot(x - job.gates[i][0], z - job.gates[i][1]) < REACH) {
            done[i] = true; state.passed++; sound.cue("good", 1, 1 + state.passed * 0.05); lay();
            if (state.passed === job.gates.length) { finish(); return; }
          }
        }
      }
      // The banner changes once a second or when a gate is passed.
      const second = Math.floor(state.seconds);
      if (second !== shownSecond || state.passed !== shownPassed) { shownSecond = second; shownPassed = state.passed; ui.left.textContent = `${state.passed}/${job.gates.length} · ${clock(state.seconds)}`; }
    };
    return {
      act, close, near, onKey, update, start, state, unlock: () => {}, setMuted: () => {},
      get busy() { return !!actor; }, get running() { return !!state.job; },
      dispose: () => { close(); stop(""); ui.list.removeEventListener("click", onJob); ui.stop.removeEventListener("click", onStop); ui.close.removeEventListener("click", close); ui.panel.removeEventListener("keydown", onButtonKey); ui.list.replaceChildren(); }
    };
  };
  BL.pierJobs = { build, create, medalFor, JOBS, MEDALS, PRIZES, AGAIN };
})();
