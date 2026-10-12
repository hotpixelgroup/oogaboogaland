// Ooga Pier's online board against the real migrations: SQLite in memory (D1 is SQLite) behind the three
// calls of D1 the Worker uses, so the SQL here is the SQL that ships.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { handleApi } from "../src/api.js";
import { PIER_CAPS, PIER_TOP, deletePlayer, pierBoards, pierEntry, putPierScore } from "../src/db.js";

const MIGRATIONS = new URL("../migrations/", import.meta.url);
const d1 = () => {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync(MIGRATIONS).sort()) raw.exec(readFileSync(new URL(file, MIGRATIONS), "utf8"));
  const prepare = (sql) => {
    let args = [];
    const reads = /^\s*select/i.test(sql);
    const statement = {
      reads,
      bind: (...values) => { args = values; return statement; },
      run: async () => { raw.prepare(sql).run(...args); return { success: true, results: [] }; },
      first: async () => raw.prepare(sql).get(...args) ?? null,
      all: async () => ({ success: true, results: raw.prepare(sql).all(...args) }),
    };
    return statement;
  };
  return { raw, prepare, batch: async (list) => { const out = []; for (const s of list) out.push(s.reads ? await s.all() : await s.run()); return out; } };
};
const player = (db, id, login, display = null, banned = null) =>
  db.raw.prepare("INSERT INTO players (id, login, display, created_at, last_login_at, banned_at) VALUES (?, ?, ?, 1, 1, ?)").run(id, login, display, banned);

test("a score is a known game, a whole number within its cap and a plausible season", () => {
  assert.deepEqual(pierEntry({ game: "fishing", season: 451, score: 45 }), { game: "fishing", season: 451, score: 45 });
  assert.deepEqual(pierEntry({ game: "lantern", season: 0, score: 1 }), { game: "lantern", season: 0, score: 1 });
  for (const bad of [null, [], "x", { game: "poker", season: 451, score: 3 }, { game: "fishing", season: 451, score: PIER_CAPS.fishing + 1 }, { game: "fishing", season: 451, score: 0 },
    { game: "fishing", season: 451, score: 4.5 }, { game: "fishing", season: 0, score: 5 }, { game: "fishing", season: 1e9, score: 5 }, { game: "fishing", season: "451", score: 5 },
    { game: "lantern", season: 451, score: 1 }, { game: "lantern", season: 0, score: 2 }, { game: "__proto__", season: 1, score: 1 }]) {
    assert.equal(pierEntry(bad), null, JSON.stringify(bad));
  }
});

test("the board keeps each player's best, lists a season's best five in order and counts lanterns", async () => {
  const db = d1();
  for (let i = 1; i <= 7; i++) player(db, i, `ooga${i}`, i === 2 ? "Second Ooga" : null);
  player(db, 8, "banned", null, 5);
  for (let i = 1; i <= 7; i++) await putPierScore(db, i, { game: "fishing", season: 451, score: i * 5 });
  await putPierScore(db, 8, { game: "fishing", season: 451, score: 150 });
  await putPierScore(db, 3, { game: "fishing", season: 451, score: 10 });
  await putPierScore(db, 1, { game: "fishing", season: 451, score: 40 });
  await putPierScore(db, 1, { game: "fishing", season: 452, score: 20 });
  await putPierScore(db, 1, { game: "volley", season: 451, score: 9 });
  await putPierScore(db, 4, { game: "lantern", season: 0, score: 1 });
  await putPierScore(db, 4, { game: "lantern", season: 0, score: 1 });
  await putPierScore(db, 5, { game: "lantern", season: 0, score: 1 });
  const board = await pierBoards(db, 451);
  assert.equal(board.season, 451);
  assert.deepEqual(board.boards.fishing, [["ooga1", 40], ["ooga7", 35], ["ooga6", 30], ["ooga5", 25], ["ooga4", 20]], "a better score replaced the first, a lower one was ignored, a banned player is left out");
  assert.equal(board.boards.fishing.length, PIER_TOP);
  assert.deepEqual(board.boards.volley, [["ooga1", 9]]);
  assert.deepEqual(board.boards.whack, []);
  assert.equal(board.lanterns, 2);
  assert.deepEqual((await pierBoards(db, 452)).boards.fishing, [["ooga1", 20]], "a season has its own board");
  assert.equal(Object.keys(board.boards).includes("lantern"), false);
  await putPierScore(db, 2, { game: "fishing", season: 451, score: 40 });
  assert.deepEqual((await pierBoards(db, 451)).boards.fishing.slice(0, 2), [["ooga1", 40], ["Second Ooga", 40]], "the earlier of two equal scores stays ahead, and a display name is shown");
});

test("deleting the account removes its scores and its lantern", async () => {
  const db = d1();
  player(db, 1, "leaver");
  player(db, 2, "stayer");
  await putPierScore(db, 1, { game: "whack", season: 451, score: 50 });
  await putPierScore(db, 1, { game: "lantern", season: 0, score: 1 });
  await putPierScore(db, 2, { game: "whack", season: 451, score: 30 });
  await deletePlayer(db, 1);
  const board = await pierBoards(db, 451);
  assert.deepEqual(board.boards.whack, [["stayer", 30]]);
  assert.equal(board.lanterns, 0);
  assert.equal(db.raw.prepare("SELECT COUNT(*) AS n FROM pier_scores WHERE player_id = 1").get().n, 0);
});

test("the route reads for anyone and refuses a post without a session or from another site", async () => {
  const db = d1(), env = { DB: db, SITE_ORIGIN: "https://ooga.example" };
  const call = (path, init) => { const url = new URL(path, env.SITE_ORIGIN); return handleApi(new Request(url, init), env, url); };
  const read = await call("/api/pier/scores?season=451");
  assert.equal(read.status, 200);
  assert.deepEqual((await read.json()).boards.fishing, []);
  assert.equal((await call("/api/pier/scores?season=abc")).status, 400);
  assert.equal((await call("/api/pier/scores?season=-1")).status, 400);
  const body = JSON.stringify({ game: "fishing", season: 451, score: 45 });
  assert.equal((await call("/api/pier/scores", { method: "POST", body, headers: { origin: "https://evil.example" } })).status, 403);
  assert.equal((await call("/api/pier/scores", { method: "POST", body, headers: { origin: env.SITE_ORIGIN } })).status, 401);
  assert.equal((await call("/api/pier/scores", { method: "DELETE", headers: { origin: env.SITE_ORIGIN } })).status, 405);
  assert.equal(db.raw.prepare("SELECT COUNT(*) AS n FROM pier_scores").get().n, 0);
});
