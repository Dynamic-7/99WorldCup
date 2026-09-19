/* ============================================================================
   99WORLDCUP — RUN VALIDATION
   ----------------------------------------------------------------------------
   WHAT THIS IS: a plausibility gate. A run that clears it is *possible*. That
   is the strongest claim anything running inside the player's own browser can
   make, and the Rules page says so in those words.

   WHAT THIS IS NOT: proof. Proof needs the seed to be issued by a server and
   the run to be re-simulated there from the recorded input. The games are pure
   and seeded precisely so that becomes a small job later — see core/backend.js.

   Four outcomes, and only four:
     accepted — goes on the board
     review   — possible but outside the expected envelope; held back
     rejected — internally inconsistent; cannot be counted
     expired  — the session was not live any more
   ========================================================================== */
import { GAMES } from '../config/games.js';
import { S, SI, Season } from '../config/season.js';

export const VERDICT = {
  accepted:{ title:'SCORE ACCEPTED',    css:'verdict--ok' },
  review:  { title:'SCORE UNDER REVIEW', css:'verdict--review' },
  rejected:{ title:'SCORE REJECTED',     css:'verdict--bad' },
  expired: { title:'SESSION EXPIRED',    css:'verdict--bad' }
};

/* Player-facing copy. Deliberately vague about *which* check fired: naming the
   exact rule would hand a cheater the shape of the envelope. */
const NOTE = {
  accepted:'This run counts.',
  review  :'This run scored faster than the game is expected to allow, so it is being held back while it is looked at.',
  rejected:'This run did not match the session it started from, so it cannot be counted.',
  expired :'This run was no longer part of a live session. Start a new game.'
};

const MAX_SESSION_MS = 4 * 3600e3;

/**
 * @param session {sid, seed, game, gameVersion, configVersion, startedAt, spent}
 * @param run     {score, endedAt, seed, gameVersion, configVersion, playMs, log}
 */
export function validateRun(session, run){
  const g = GAMES[session.game];
  const out = (verdict, code) => ({ verdict, code, note:NOTE[verdict], title:VERDICT[verdict].title });
  if (!g) return out('rejected','UNKNOWN_GAME');

  /* --- session liveness ------------------------------------------------- */
  if (session.spent)                                    return out('rejected','SESSION_REUSED');
  if (!Season.isOpen(S) || run.endedAt >= SI().end)      return out('expired','SEASON_CLOSED');
  if (run.endedAt - session.startedAt > MAX_SESSION_MS)  return out('expired','SESSION_STALE');
  if (run.endedAt < session.startedAt)                   return out('rejected','CLOCK_BACKWARDS');

  /* --- the number itself ------------------------------------------------ */
  if (typeof run.score !== 'number' || !isFinite(run.score)) return out('rejected','SCORE_NOT_A_NUMBER');
  if (run.score !== Math.floor(run.score))                   return out('rejected','SCORE_NOT_INTEGER');
  if (run.score < 0 || run.score > 1e7)                       return out('rejected','SCORE_OUT_OF_RANGE');

  /* --- does the run belong to this session? ----------------------------- */
  if (run.seed !== session.seed)                        return out('rejected','SEED_MISMATCH');
  if (run.gameVersion !== g.v)                          return out('rejected','GAME_VERSION');
  if (run.configVersion !== g.cfgV)                     return out('rejected','CONFIG_VERSION');

  /* --- the score log: monotonic, and it ends where it claims ------------ */
  const log = run.log || [];
  for (let i = 1; i < log.length; i++)
    if (log[i] < log[i - 1])                            return out('rejected','SCORE_DECREASED');
  if (log.length && log[log.length - 1] !== run.score)   return out('rejected','LOG_TAIL');

  /* --- time. playMs is counted in fixed 60 Hz steps, so pausing, blurring
         or sitting on the start screen cannot inflate or deflate it. ------ */
  const playMs = run.playMs || 0;
  if (playMs < 0)                                       return out('rejected','NEGATIVE_PLAYTIME');
  if (playMs > (run.endedAt - session.startedAt) + 2000) return out('rejected','PLAYTIME_EXCEEDS_CLOCK');

  /* Everything below is "unlikely", not "impossible" — so it is held for
     review rather than thrown away. A human decides, not this function. */
  const lim = g.limits;
  if (run.score > 0 && playMs < lim.minMs)               return out('review','TOO_SHORT');
  if (run.score > (playMs / 1000) * lim.maxRate + lim.grace) return out('review','RATE');

  return out('accepted','OK');
}
