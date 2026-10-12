// D1 access. Players are keyed by the GitHub numeric id, which survives a login rename; sessions
// are stored by the SHA-256 of their token, so a leaked table holds nothing a browser could replay.

import { randomToken, sha256Hex } from "./crypto.js";

export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const TOUCH_SECONDS = 10 * 60;
export const DISPLAY_MIN = 3;
export const DISPLAY_MAX = 24;
const USER_AGENT_MAX = 120;

export const nowSeconds = () => Math.floor(Date.now() / 1000);

/** The same character set `donations.sanitize` keeps in src/js/donations.js; null when too short. */
export const sanitizeDisplay = (text) => {
  const clean = String(text ?? "").replace(/[^\w .,!?'@#:-]/g, "").replace(/\s+/g, " ").trim().slice(0, DISPLAY_MAX).trim();
  return clean.length >= DISPLAY_MIN ? clean : null;
};

export const isExpired = (session, now) => session.expires_at <= now;

/** A session is touched at most once per TOUCH_SECONDS so `/api/me` is not a write per call. */
export const needsTouch = (session, now) => !session.last_used_at || now - session.last_used_at >= TOUCH_SECONDS;

const parseLook = (text) => {
  if (!text) return null;
  try {
    const look = JSON.parse(text);
    return look && typeof look === "object" && !Array.isArray(look) ? look : null;
  } catch {
    return null;
  }
};

/** The fields the page may see. `avatar_url` stays server-side until the CSP allows GitHub images. */
export const publicPlayer = (row) => ({
  id: row.id,
  login: row.login,
  display: row.display || row.login,
  look: parseLook(row.look),
  createdAt: row.created_at,
});

export const upsertPlayerFromGitHub = async (db, { id, login, avatar_url }) => {
  const now = nowSeconds();
  await db.prepare(
    `INSERT INTO players (id, login, avatar_url, created_at, last_login_at) VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT(id) DO UPDATE SET login = ?2, avatar_url = ?3, last_login_at = ?4`,
  ).bind(id, login, avatar_url || null, now).run();
  return db.prepare("SELECT * FROM players WHERE id = ?1").bind(id).first();
};

export const getPlayer = (db, id) => db.prepare("SELECT * FROM players WHERE id = ?1").bind(id).first();

export const updateDisplay = (db, id, display) =>
  db.prepare("UPDATE players SET display = ?2 WHERE id = ?1").bind(id, display).run();

export const createSession = async (db, playerId, userAgent) => {
  const token = randomToken();
  const now = nowSeconds();
  await db.prepare(
    "INSERT INTO sessions (token_hash, player_id, created_at, expires_at, last_used_at, user_agent) VALUES (?1, ?2, ?3, ?4, ?3, ?5)",
  ).bind(await sha256Hex(token), playerId, now, now + SESSION_SECONDS, String(userAgent || "").slice(0, USER_AGENT_MAX)).run();
  return token;
};

/** `{ player, session }` for a live session of a player who is not banned; null otherwise. */
export const getSession = async (db, token) => {
  if (!token) return null;
  const hash = await sha256Hex(token);
  const row = await db.prepare(
    `SELECT s.token_hash, s.expires_at, s.last_used_at, p.*
     FROM sessions s JOIN players p ON p.id = s.player_id WHERE s.token_hash = ?1`,
  ).bind(hash).first();
  if (!row) return null;
  const now = nowSeconds();
  const session = { token_hash: row.token_hash, expires_at: row.expires_at, last_used_at: row.last_used_at };
  if (isExpired(session, now)) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(hash).run();
    return null;
  }
  if (row.banned_at) return null;
  if (needsTouch(session, now)) {
    await db.batch([
      db.prepare("UPDATE sessions SET last_used_at = ?2 WHERE token_hash = ?1").bind(hash, now),
      db.prepare("UPDATE players SET last_seen_at = ?2 WHERE id = ?1").bind(row.id, now),
    ]);
  }
  return { player: row, session };
};

export const deleteSession = async (db, token) =>
  db.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(await sha256Hex(token)).run();

export const deleteAllSessions = (db, playerId) =>
  db.prepare("DELETE FROM sessions WHERE player_id = ?1").bind(playerId).run();

/** Sessions and scores go first: D1 enforces the foreign keys, but the explicit order keeps the delete obvious. */
export const deletePlayer = (db, id) => db.batch([
  db.prepare("DELETE FROM pier_scores WHERE player_id = ?1").bind(id),
  db.prepare("DELETE FROM sessions WHERE player_id = ?1").bind(id),
  db.prepare("DELETE FROM players WHERE id = ?1").bind(id),
]);

export const purgeExpiredSessions = (db) =>
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?1").bind(nowSeconds()).run();

// Ooga Pier's online board. The most each game can score (src/js/game.js PIER_CAPS keeps the same numbers), so a
// posted score is at least possible; a lantern is the row ("lantern", season 0, score 1). Stakes are looks and a
// name on a board, so a cap and one row per player, game and season are the whole defence.
export const PIER_CAPS = { fishing: 150, builder: 216, mayhem: 42, whack: 120, seedMatch: 12, volley: 15, lantern: 1 };
export const PIER_SEASON_MAX = 100000;
export const PIER_TOP = 5;

/** The score a player may post, or null: a known game, a whole score within its cap, a plausible season. */
export const pierEntry = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { game, season, score } = body;
  if (typeof game !== "string" || !Object.hasOwn(PIER_CAPS, game)) return null;
  if (!Number.isInteger(score) || score < 1 || score > PIER_CAPS[game]) return null;
  if (game === "lantern" ? season !== 0 : !Number.isInteger(season) || season < 1 || season > PIER_SEASON_MAX) return null;
  return { game, season, score };
};

/** Keeps the better of the stored and the posted score; an equal or lower one changes nothing. */
export const putPierScore = (db, playerId, { game, season, score }) => db.prepare(
  `INSERT INTO pier_scores (player_id, game, season, score, at) VALUES (?1, ?2, ?3, ?4, ?5)
   ON CONFLICT(player_id, game, season) DO UPDATE SET score = excluded.score, at = excluded.at WHERE excluded.score > pier_scores.score`,
).bind(playerId, game, season, score, nowSeconds()).run();

/** `{ season, boards: { game: [[name, score], ...] }, lanterns }`: each game's best five, and every lantern lit. */
export const pierBoards = async (db, season) => {
  const games = Object.keys(PIER_CAPS).filter((game) => game !== "lantern");
  const answers = await db.batch([
    ...games.map((game) => db.prepare(
      `SELECT COALESCE(p.display, p.login) AS name, s.score AS score FROM pier_scores s JOIN players p ON p.id = s.player_id
       WHERE s.game = ?1 AND s.season = ?2 AND p.banned_at IS NULL ORDER BY s.score DESC, s.at ASC LIMIT ?3`,
    ).bind(game, season, PIER_TOP)),
    db.prepare("SELECT COUNT(*) AS n FROM pier_scores WHERE game = 'lantern'"),
  ]);
  const boards = {};
  games.forEach((game, i) => { boards[game] = answers[i].results.map((row) => [row.name, row.score]); });
  return { season, boards, lanterns: answers[games.length].results[0].n };
};
