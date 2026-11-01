// Ground-only visitors use the island's existing route facade and collision
// predicates. A fixed local search recovers a blocked leg; it never substitutes
// an unchecked slide, jump or teleport. Rig posing belongs to the caller.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // crew.js NPC_WALK_SPEED is 1.6 m/s; ordinary wander draws 1.3..1.8.
  // These visitors walk at half that comparable ordinary NPC baseline.
  const NORMAL_NPC_SPEED = 1.6, SPEED = NORMAL_NPC_SPEED * 0.5;
  const WIDTH = 21, HALF = 10, CELL = 0.5, SIZE = WIDTH * WIDTH, CENTER = HALF * WIDTH + HALF;
  const STEP = 0.125, SUPPORT_STEP = 0.6, ARRIVE = 0.18, STALL = 8, SEARCH_BUDGET = 6;
  const create = ({ root, paths = null, groundAt, clear, spotOk, pose = null, onRepick = null, radius = 1.3, height = 2.6, speed = SPEED }) => {
    const pathing = paths ? paths.createState() : { tx: NaN, tz: NaN, targetX: 0, targetZ: 0, count: 0, index: 0, plans: 0 };
    // npc-paths reads this small actor surface; no contributor, weapon, health
    // or other crew state is borrowed by an independent visitor.
    const actor = { root, baseY: 0, bodyRadius: radius, bodyHeight: height, state: "chilling", hop: 0, hopV: 0, bedTravel: { mode: "" }, pathing };
    const costs = new Float64Array(SIZE), heights = new Float64Array(SIZE), parents = new Int16Array(SIZE);
    const closed = new Uint8Array(SIZE), route = new Int16Array(SIZE);
    const state = { phase: "idle", goalX: 0, goalZ: 0, age: 0, stalled: 0, replans: 0, recoveries: 0, expansions: 0, moved: 0, reason: "" };
    let active = false, disposed = false, paused = false, heading = root.rotation.y, deadline = 0;
    let mode = 0, searchX = 0, searchZ = 0, searchGoalX = 0, searchGoalZ = 0, bestNode = CENTER, bestHeuristic = Infinity;
    let routeCount = 0, routeIndex = -1, bestGoal = Infinity, seenPlans = -1, seenIndex = -1;
    const resetRoute = () => { pathing.tx = NaN; pathing.count = pathing.index = 0; mode = 0; routeCount = 0; routeIndex = -1; };
    const resetProgress = () => { state.stalled = 0; bestGoal = Infinity; seenPlans = seenIndex = -1; };
    const reset = () => { if (disposed) return; resetRoute(); resetProgress(); state.age = 0; heading = root.rotation.y; paused = false; if (active) state.phase = "walk"; };
    const setDestination = (x, z) => {
      if (disposed || !Number.isFinite(x) || !Number.isFinite(z)) return false;
      state.goalX = x; state.goalZ = z; state.reason = ""; state.phase = "walk";
      active = true; reset();
      deadline = Math.min(90, Math.max(25, Math.hypot(x - root.position.x, z - root.position.z) / speed * 3 + 10));
      return true;
    };
    const fail = (reason) => {
      active = false; mode = 0; state.phase = "repick"; state.reason = reason;
      if (pose) pose(0, 0, heading);
      if (onRepick) onRepick(reason);
    };
    // Validate the complete swept support edge, not just its destination.
    // The caller's clear predicate includes current peer/NPC bodies as well
    // as static scenery; every actual step rechecks it after planning.
    const edge = (x, y, z, tx, tz) => {
      const count = Math.max(1, Math.ceil(Math.hypot(tx - x, tz - z) / 0.2));
      const sx = x, sz = z;
      for (let i = 1; i <= count; i++) {
        const nx = sx + (tx - sx) * i / count, nz = sz + (tz - sz) * i / count, ny = groundAt(nx, nz);
        if (!Number.isFinite(ny) || Math.abs(ny - y) > SUPPORT_STEP || !spotOk(nx, ny, nz, radius, height)
          || !clear(x, y, z, nx, ny, nz, radius, height)) return NaN;
        x = nx; y = ny; z = nz;
      }
      return y;
    };
    const nodeX = (index) => searchX + (index % WIDTH - HALF) * CELL;
    const nodeZ = (index) => searchZ + (Math.floor(index / WIDTH) - HALF) * CELL;
    const startSearch = (gx, gz) => {
      searchX = root.position.x; searchZ = root.position.z; searchGoalX = gx; searchGoalZ = gz;
      costs.fill(Infinity); parents.fill(-1); closed.fill(0);
      costs[CENTER] = 0; heights[CENTER] = root.position.y;
      bestNode = CENTER; bestHeuristic = Math.hypot(gx - searchX, gz - searchZ);
      mode = 1; routeCount = 0; routeIndex = -1; state.phase = "search"; state.recoveries++;
    };
    const finishSearch = (index) => {
      routeCount = 0;
      while (index !== CENTER && index >= 0 && routeCount < SIZE) { route[routeCount++] = index; index = parents[index]; }
      if (!routeCount || index !== CENTER) { fail("blocked"); return; }
      routeIndex = routeCount - 1; mode = 2; state.phase = "recover";
    };
    const search = () => {
      for (let budget = 0; budget < SEARCH_BUDGET && mode === 1; budget++) {
        let current = -1, score = Infinity;
        for (let i = 0; i < SIZE; i++) if (!closed[i] && costs[i] < Infinity) {
          const s = costs[i] + Math.hypot(searchGoalX - nodeX(i), searchGoalZ - nodeZ(i));
          if (s < score) { score = s; current = i; }
        }
        if (current < 0) {
          // A distant goal can lie beyond this five-metre local patch. Keep
          // only a frontier that makes substantial progress, then rejoin the
          // existing route; a sealed pocket requests a different destination.
          if (bestNode !== CENTER && bestHeuristic < Math.hypot(searchGoalX - searchX, searchGoalZ - searchZ) - 0.5) finishSearch(bestNode);
          else fail("blocked");
          return;
        }
        closed[current] = 1; state.expansions++;
        const x = nodeX(current), z = nodeZ(current), y = heights[current], h = Math.hypot(searchGoalX - x, searchGoalZ - z);
        if (h < bestHeuristic) { bestHeuristic = h; bestNode = current; }
        if (current !== CENTER && h < CELL * 0.8) { finishSearch(current); return; }
        const col = current % WIDTH, row = Math.floor(current / WIDTH);
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz || col + dx < 0 || col + dx >= WIDTH || row + dz < 0 || row + dz >= WIDTH) continue;
          const next = current + dx + dz * WIDTH, cost = costs[current] + Math.hypot(dx, dz) * CELL;
          if (closed[next] || cost >= costs[next]) continue;
          const floor = edge(x, y, z, nodeX(next), nodeZ(next));
          if (!Number.isFinite(floor)) continue;
          costs[next] = cost; heights[next] = floor; parents[next] = current;
        }
      }
    };
    const pause = (dt = 0, facing = heading) => {
      if (disposed) return;
      paused = true;
      heading = facing;
      if (pose) pose(dt, 0, heading);
    };
    const update = (dt) => {
      if (disposed) return;
      if (!active || !root.visible || dt <= 0) { if (pose) pose(Math.max(0, dt), 0, heading); return; }
      if (paused) { resetRoute(); resetProgress(); paused = false; }
      state.age += dt;
      if (state.age >= deadline) { fail("deadline"); return; }
      const p = root.position, fromX = p.x, fromZ = p.z;
      const goalDistance = Math.hypot(state.goalX - p.x, state.goalZ - p.z);
      state.stalled += dt;
      if (goalDistance < bestGoal - 0.12) { bestGoal = goalDistance; state.stalled = 0; }
      // Replans and lateral motion never reset the watchdog. Only a new best
      // distance or real advancement along a route does, including a legal
      // detour that first heads away from the final destination.
      if (state.stalled >= STALL) { fail("stalled"); return; }
      if (goalDistance <= ARRIVE) {
        active = false; state.phase = "arrived"; resetRoute();
        if (pose) pose(dt, 0, heading);
        return;
      }
      if (!spotOk(state.goalX, groundAt(state.goalX, state.goalZ), state.goalZ, radius, height)) { fail("unsafe-goal"); return; }
      let tx = state.goalX, tz = state.goalZ;
      if (mode === 1) { search(); if (mode !== 2) { if (pose) pose(dt, 0, heading); return; } }
      if (mode === 2) {
        while (routeIndex >= 0 && Math.hypot(nodeX(route[routeIndex]) - p.x, nodeZ(route[routeIndex]) - p.z) <= ARRIVE) { routeIndex--; state.stalled = 0; }
        if (routeIndex >= 0) { tx = nodeX(route[routeIndex]); tz = nodeZ(route[routeIndex]); }
        // Keep the road route's identity and forward index after a local
        // bypass. npc-paths projects ahead from that index; replanning here
        // could send the visitor back to the road behind the same obstacle.
        else { mode = 0; state.phase = "walk"; }
      }
      if (mode === 0 && paths) {
        const plans = pathing.plans;
        paths.target(actor, state.goalX, state.goalZ);
        if (pathing.plans !== plans) state.replans++;
        tx = pathing.targetX; tz = pathing.targetZ;
        if (seenPlans !== pathing.plans) { seenPlans = pathing.plans; seenIndex = pathing.index; }
        else if (pathing.index > seenIndex) { seenIndex = pathing.index; state.stalled = 0; }
      }
      const dx = tx - p.x, dz = tz - p.z, distance = Math.hypot(dx, dz);
      if (distance < 0.01) { pathing.tx = NaN; state.replans++; if (pose) pose(dt, 0, heading); return; }
      const wanted = Math.atan2(dx, dz), turn = Math.atan2(Math.sin(wanted - heading), Math.cos(wanted - heading));
      heading += turn * (1 - Math.exp(-8 * dt));
      // Small supported substeps match the crew's stepping discipline. The
      // chosen waypoint is not permission to skip a newly arrived walker.
      let left = Math.min(distance, speed * dt * Math.max(0, Math.cos(turn)));
      while (left > 1e-8) {
        const step = Math.min(left, STEP), nx = p.x + dx / distance * step, nz = p.z + dz / distance * step;
        const floor = edge(p.x, p.y, p.z, nx, nz);
        if (!Number.isFinite(floor)) {
          startSearch(state.goalX, state.goalZ);
          break;
        }
        p.x = nx; p.y = floor; p.z = nz; left -= step;
      }
      const moved = Math.hypot(p.x - fromX, p.z - fromZ);
      state.moved += moved;
      if (pose) pose(dt, moved / dt, heading);
    };
    const dispose = () => {
      if (disposed) return;
      disposed = true; active = false; resetRoute();
      actor.root = null; root = paths = pose = onRepick = clear = spotOk = groundAt = null;
    };
    return { setDestination, update, pause, reset, dispose, actor, state, get active() { return active; } };
  };
  BL.pepiRoaming = { create, SPEED, NORMAL_NPC_SPEED };
})();
