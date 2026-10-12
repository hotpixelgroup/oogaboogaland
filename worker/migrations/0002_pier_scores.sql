-- Ooga Pier's online board: one row per signed-in player, game and season, holding that player's best.
-- A season is one difficulty period of the chain, numbered by the page (block height / 2016). A lantern is
-- the row ('lantern', season 0, score 1): that player checked a block at the lighthouse.
-- Rows go with their player: the cascade here, and the explicit delete in db.js `deletePlayer`.

CREATE TABLE pier_scores (
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game      TEXT    NOT NULL,                 -- a key of PIER_CAPS in src/db.js
  season    INTEGER NOT NULL,
  score     INTEGER NOT NULL,                 -- within the game's cap; only ever raised
  at        INTEGER NOT NULL,                 -- unix seconds of the best; an earlier best wins a tie
  PRIMARY KEY (player_id, game, season)
);
CREATE INDEX pier_scores_board ON pier_scores(game, season, score DESC, at);
