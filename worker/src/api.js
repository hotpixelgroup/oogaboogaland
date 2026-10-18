// /api/*: who is signed in, their display name, deleting the account, and Ooga Pier's online board.
// Signed out, /api/me answers 200 with `player: null`, so a signed-out page logs nothing. Its `donations` says
// whether this Worker reaches bananapayserver (the `DONATIONS` binding), which turns the page's real donations on
// through its own address; without the binding the page stays simulated.

import { cookieNames, isSecureOrigin, serializeCookie } from "./cookies.js";
import { PIER_SEASON_MAX, deletePlayer, getPlayer, pierBoards, pierEntry, publicPlayer, putPierScore, sanitizeDisplay, updateDisplay } from "./db.js";
import { allowed, fromSite, getSessionFromRequest, json, text } from "./http.js";
import { contributorFor } from "./contributor-access.js";

const BODY_MAX = 1024;

const me = async (request, env) => {
  const found = await getSessionFromRequest(request, env);
  if (request.method === "GET") return json({ player: found ? publicPlayer(found.player) : null,
    character: found ? await contributorFor(found.player.login) : null, donations: !!env.DONATIONS });
  if (!fromSite(request, env.SITE_ORIGIN)) return json({ error: "forbidden" }, 403);
  if (!found) return json({ error: "unauthenticated" }, 401);

  if (request.method === "PATCH") {
    const raw = await request.text();
    if (raw.length > BODY_MAX) return json({ error: "too large" }, 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "bad json" }, 400);
    }
    const display = sanitizeDisplay(body && body.display);
    if (!display) return json({ error: "display must be 3-24 letters, digits or simple punctuation" }, 400);
    await updateDisplay(env.DB, found.player.id, display);
    return json({ player: publicPlayer(await getPlayer(env.DB, found.player.id)) });
  }

  if (request.method === "DELETE") {
    await deletePlayer(env.DB, found.player.id);
    const clear = serializeCookie(cookieNames(env.SITE_ORIGIN).session, "", { maxAge: 0, secure: isSecureOrigin(env.SITE_ORIGIN) });
    return new Response(null, { status: 204, headers: { "set-cookie": clear, "cache-control": "no-store" } });
  }

  return json({ error: "method not allowed" }, 405, { allow: "GET, PATCH, DELETE" });
};

// The pier's board: anyone may read a season's best five a game and the count of lanterns; a signed-in player
// posts only their own score, which the table keeps when it beats the one it has.
const pierScores = async (request, env, url) => {
  if (request.method === "GET") {
    const season = Number(url.searchParams.get("season"));
    if (!Number.isInteger(season) || season < 0 || season > PIER_SEASON_MAX) return json({ error: "bad season" }, 400);
    return json(await pierBoards(env.DB, season));
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405, { allow: "GET, POST" });
  if (!fromSite(request, env.SITE_ORIGIN)) return json({ error: "forbidden" }, 403);
  const found = await getSessionFromRequest(request, env);
  if (!found) return json({ error: "unauthenticated" }, 401);
  if (!(await allowed(env.SCORE_LIMITER, String(found.player.id)))) return json({ error: "too many scores" }, 429);
  const raw = await request.text();
  if (raw.length > BODY_MAX) return json({ error: "too large" }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const entry = pierEntry(body);
  if (!entry) return json({ error: "not a score this board keeps" }, 400);
  await putPierScore(env.DB, found.player.id, entry);
  return json({ ok: true });
};

export const handleApi = (request, env, url) => {
  if (url.pathname === "/api/me") return me(request, env);
  if (url.pathname === "/api/pier/scores") return pierScores(request, env, url);
  if (url.pathname === "/api/health") return text("ok", 200);
  return json({ error: "not found" }, 404);
};
