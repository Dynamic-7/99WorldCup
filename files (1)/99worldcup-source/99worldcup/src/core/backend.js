/* ============================================================================
   99WORLDCUP — BACKEND ADAPTER
   ============================================================================
   THIS FILE IS THE LINE BETWEEN PROTOTYPE AND PRODUCTION. Read it before you
   claim anything about the integrity of a score.

   MODE 'prototype'  (what ships today)
     The browser issues its own session seed, plays the run, validates it with
     core/scoring.js and writes the result to the shared store. The client is
     therefore both the player and the referee. The checks catch impossible and
     accidental scores. They do not stop somebody with developer tools, and
     nothing in this interface ever claims they do.

   MODE 'server'  (what production needs)
     configureBackend({ baseUrl }) switches every call below to HTTP:
        POST /session/start  -> { sid, seed, game, gameVersion, configVersion,
                                  startedAt, expiresAt }      seed unguessable,
                                                              sid single-use
        POST /run/submit     -> { verdict, note, rank, digest }
     The server re-simulates the run from (seed, input log) with the same pure
     game modules in src/games and compares the score it reaches with the score
     that was submitted. That is the only version of this that is actually
     enforceable, and it is a small job precisely because the games are pure.

   Nothing here fakes the second mode. If baseUrl is not configured, the app
   says "prototype" everywhere it matters.
   ========================================================================== */
import { GAMES } from '../config/games.js';
import { S, SI, utcDay } from '../config/season.js';
import { App } from './app.js';
import { validateRun } from './scoring.js';
import { fnv1a } from './rng.js';

export const Backend = { mode:'prototype', baseUrl:null };

export function configureBackend(opts){
  Backend.baseUrl = (opts && opts.baseUrl) || null;
  Backend.mode = Backend.baseUrl ? 'server' : 'prototype';
  return Backend.mode;
}
export const isPrototype = () => Backend.mode === 'prototype';

function randomSeed(){
  const buf = new Uint32Array(2);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(buf);
  else { buf[0] = Math.random() * 2 ** 32; buf[1] = Math.random() * 2 ** 32; }
  return buf;
}

/* --------------------------------------------------------------------------
   START A COMPETITIVE SESSION
   -------------------------------------------------------------------------- */
export async function startSession(gameKey){
  const g = GAMES[gameKey];
  if (!g) return { error:'UNKNOWN_GAME' };
  if (!SI().live) return { error:'SEASON_CLOSED' };

  if (Backend.mode === 'server'){
    const r = await fetch(Backend.baseUrl + '/session/start', {
      method:'POST', headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ game:gameKey, season:S.id })
    });
    if (!r.ok) return { error:'SESSION_REFUSED' };
    return await r.json();
  }

  /* [PROTOTYPE] The browser is trusted to generate this. A server must not be. */
  const buf = randomSeed();
  return {
    sid:'s_' + buf[0].toString(36) + buf[1].toString(36),
    seed:buf[0] >>> 0,
    season:S.id, game:g.key, gameVersion:g.v, configVersion:g.cfgV,
    startedAt:Date.now(), spent:false, local:true
  };
}

/* --------------------------------------------------------------------------
   SUBMIT A FINISHED RUN
   Returns { verdict, note, title, digest, written, pb, dailyPb, prevBest }
   -------------------------------------------------------------------------- */
export async function submitRun(session, run){
  const digest = fnv1a([session.sid, session.seed, run.score, run.endedAt,
                        (run.log || []).join(',')].join('|'));

  if (Backend.mode === 'server'){
    const r = await fetch(Backend.baseUrl + '/run/submit', {
      method:'POST', headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ sid:session.sid, run })
    });
    if (!r.ok) return { verdict:'expired', title:'SESSION EXPIRED',
                        note:'This run was no longer part of a live session. Start a new game.',
                        digest, written:false };
    return Object.assign({ digest }, await r.json());
  }

  /* --- prototype path ---------------------------------------------------
     Validate FIRST, then burn the session. Marking it spent up front made
     every submission fail its own reuse check — the bug that sent legitimate
     scores to review. Order matters here; do not reorder these two lines. */
  const v = validateRun(session, run);
  session.spent = true;

  if (v.verdict !== 'accepted'){
    App.flagged.push({ game:session.game, score:run.score, verdict:v.verdict,
                       note:v.note, at:run.endedAt, digest });
    return Object.assign({ digest, written:false }, v);
  }

  const g = session.game, day = utcDay(run.endedAt);
  const prevBest  = App.me[g + '_b'] || 0;
  const sameDay   = App.me[g + '_d'] === day;
  const prevToday = sameDay ? (App.me[g + '_t'] || 0) : 0;

  const patch = {
    games:(App.me.games || 0) + 1,
    [g + '_n']:(App.me[g + '_n'] || 0) + 1,
    [g + '_d']:day,
    [g + '_t']:Math.max(prevToday, run.score)
  };
  if (run.score > prevBest){ patch[g + '_b'] = run.score; patch[g + '_bt'] = run.endedAt; }

  let written = true;
  try { const r = await App.savePlayer(patch); written = r.ok; }
  catch (e){ written = false; }

  return Object.assign({ digest, written, prevBest,
                         pb:run.score > prevBest, dailyPb:run.score > prevToday }, v);
}
