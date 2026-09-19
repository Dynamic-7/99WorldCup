/* ============================================================================
   99WORLDCUP — RULES
   This page exists because the leaderboard only means something if the rules
   behind it are visible. Every number here matches the code that enforces it.
   Section 8 is the honest limitation. Do not delete it when a backend lands —
   replace it with what the backend actually does.
   ========================================================================== */
import { el } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { S, SI, fmtDate } from '../config/season.js';
import { isPrototype } from '../core/backend.js';
import { LegalNav } from './legal.js';

export function ViewRules(){
  const si = SI();
  const names = S.games.map(g => GAMES[g].name).join(', ');

  return el('div', { class:'shell legal' }, [
    LegalNav('rules'),
    el('article', { class:'panel doc' }, [
      el('h1', { class:'coin', text:'RULES' }),
      el('p', { class:'muted', text:'Season ' + S.id + '. Last updated ' + fmtDate(Date.parse(S.start)) + '.' }),

      el('h3', { text:'1. The season' }),
      el('p', { text:'A season is exactly ' + S.days + ' days. Season 01 opened ' + fmtDate(si.start) +
        ' at 00:00 UTC and closes ' + fmtDate(si.end) + ' at 00:00 UTC. A run that ends before that ' +
        'instant counts. A run that ends at or after it does not — including a run that started on ' +
        'day 99 and finished after the bell.' }),

      el('h3', { text:'2. The three games' }),
      el('p', { text:'Three games are chosen before a season opens and locked for its whole length: ' +
        names + '. They do not rotate, re-roll or change on refresh. Each game keeps its own ' +
        'separate leaderboard.' }),

      el('h3', { text:'3. How a score gets on the board' }),
      el('p', { text:'Starting a game opens a competitive session with its own id, its own random ' +
        'seed and a recorded game version. The seed decides the obstacles, so the same seed always ' +
        'produces the same run — which is what makes a score checkable at all. When the run ends it ' +
        'is submitted once against that session and checked before it is written anywhere.' }),
      el('p', { text:'Checks run against active play time, counted in fixed sixtieths of a second. ' +
        'Pausing, switching tabs or sitting on the start screen is not play time, so none of it ' +
        'helps or hurts you.' }),

      el('h3', { text:'4. The four outcomes' }),
      el('p', { text:'Every submitted run ends in exactly one of these:' }),
      el('ul', {}, [
        el('li', { text:'ACCEPTED — the run is consistent and within what the game can award. It goes on the board.' }),
        el('li', { text:'UNDER REVIEW — the run is possible but outside the expected envelope. It is held back, not deleted, and a human decides.' }),
        el('li', { text:'REJECTED — the run does not match the session it started from. It cannot be counted.' }),
        el('li', { text:'SESSION EXPIRED — the session was no longer live, usually because the season closed or the game sat open for hours. Start a new game.' })
      ]),
      el('p', { text:'A single unusual score is treated as something to look at, not as proof of ' +
        'anything. We do not publish the exact thresholds, because that would hand them to the one ' +
        'person they are meant to stop.' }),

      el('h3', { text:'5. Ranking and ties' }),
      el('p', { text:'Higher score ranks higher. When two players share a score, the one who reached ' +
        'it first ranks higher — being early is the tie-break. Only the top 100 are shown.' }),

      el('h3', { text:'6. Today vs. all time' }),
      el('p', { text:'TODAY shows your best run of the current UTC calendar day and resets at 00:00 ' +
        'UTC for everyone at the same instant, wherever you are. SEASON shows your single best run ' +
        'of the whole ' + S.days + ' days. Today never affects the season board; it is a separate ' +
        'race on the same games.' }),

      el('h3', { text:'7. When the season freezes' }),
      el('p', { text:'At the end of day ' + S.days + ' all three leaderboards freeze permanently. No ' +
        'later run can change a final rank. Final positions are written into badges that name the ' +
        'season, the game, the rank and the score. Season 01 cannot happen twice, so an S01 badge ' +
        'cannot be earned again. Your account, your name and your badges carry into Season 02 — your ' +
        'scores do not. Every season starts at zero.' }),

      el('h3', { text:'8. Names' }),
      el('p', { text:'3 to 16 characters, letters, numbers, underscore and hyphen. Names that ' +
        'impersonate staff are refused. Your name and country are public; nothing else is.' }),

      el('h3', { class:'alarm', text:'9. What this build can and cannot promise' }),
      el('div', { class:'flagnote' }, [
        el('p', { style:'margin:0', text:isPrototype()
          ? 'Honest limitation. This is a prototype build: the game runs, scores itself and writes ' +
            'to the scoreboard entirely inside your browser. The checks in section 3 catch ' +
            'impossible and accidental scores, and they are not cosmetic — but a determined person ' +
            'with developer tools can still forge one. A browser game cannot be made cheat-proof. ' +
            'Making it genuinely hard requires the session seed to be issued by a server and the run ' +
            'to be re-simulated there from the recorded input, which this version does not do yet. ' +
            'Nothing in this interface will ever tell you a score was "verified" when only your own ' +
            'browser checked it. We would rather say that here than claim a fairness we cannot enforce.'
          : 'Sessions are issued by the server and every accepted run is re-simulated there from its ' +
            'seed before it reaches a leaderboard.' })
      ])
    ])
  ]);
}
