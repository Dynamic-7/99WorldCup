/* ============================================================================
   99WORLDCUP — GAMEPLAY
   You walk up to a machine: lit marquee, score plate, curved glass, a control
   deck and a coin door. The page furniture gets out of the way entirely.
   ========================================================================== */
import { el } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { S, SI, fmtDate, seasonLabel } from '../config/season.js';
import { App } from '../core/app.js';
import { isPrototype } from '../core/backend.js';
import { RT } from '../core/router.js';
import { Counter, Legend } from '../ui/widgets.js';
import { Runner, makeInput } from '../games/runner.js';
import { ViewNotFound } from './notfound.js';

/* how wide the machine is allowed to get on a desktop, per game */
const CAB_MAX = { skyhop:460, walldrift:640, mazesnap:520 };

export function ViewGame(key){
  const g = GAMES[key];
  if (!g || S.games.indexOf(key) < 0) return ViewNotFound();

  const si = SI();
  if (!si.live){
    return el('div', { class:'shell', style:'padding-top:var(--gap)' }, [
      el('div', { class:'panel panel--alarm state state--err' }, [
        el('div', { class:'state__icon', text:'🔒', 'aria-hidden':'true' }),
        el('h2', { text:si.frozen ? 'SEASON CLOSED' : 'SEASON HAS NOT OPENED' }),
        el('p', { text:si.frozen
          ? 'Season ' + S.id + ' froze on ' + fmtDate(si.end) + '. Its leaderboards are final.'
          : 'Season ' + S.id + ' opens ' + fmtDate(si.start) + '.' }),
        el('a', { class:'btn btn--play', href:'#/leaderboards', text:'VIEW LEADERBOARDS' })
      ])
    ]);
  }

  /* ----------------------------------------------------------- the machine */
  const canvas  = el('canvas', { 'aria-label':g.name + ' game screen', role:'img' });
  const overlay = el('div', { class:'overlay' });
  const screen  = el('div', { class:'screen' }, [
    canvas, el('div', { class:'glass', 'aria-hidden':'true' }), overlay
  ]);

  const scoreEl = Counter(0, { label:'Score' });
  const bestEl  = Counter((App.me && App.me[key + '_b']) || 0, { cls:'counter--best', label:'Your best' });
  const lampEl  = el('span', { class:'lamp', 'data-s':'ready', text:'READY' });

  const plates = el('div', { class:'plates' }, [
    el('div', {}, [el('span', { class:'plates__lbl', text:'SCORE' }), scoreEl]),
    el('div', { class:'plates__mid' }, [lampEl]),
    el('div', { class:'plates__end' }, [el('span', { class:'plates__lbl', text:'YOUR BEST' }), bestEl])
  ]);

  const pauseBtn = el('button', { class:'btn btn--sm pausebtn', 'aria-label':'Pause or resume', text:'❚❚' });
  const input = makeInput();
  let actionBtn = null;
  const deck = el('div', { class:'deck' });

  if (key === 'mazesnap'){
    const dpad = el('div', { class:'dpad', role:'group', 'aria-label':'Direction pad' });
    [['u','▲','Up'],['l','◀','Left'],['r','▶','Right'],['d','▼','Down']].forEach(([d, sym, lbl]) => {
      const b = el('button', { class:d, 'aria-label':lbl, text:sym });
      /* pointerdown only — a click would arrive a frame late on touch */
      b.addEventListener('pointerdown', () => { input.dir = d; });
      b.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ input.dir = d; e.preventDefault(); }
      });
      dpad.appendChild(b);
    });
    deck.append(dpad, deckSide(g.hint, pauseBtn));

  } else if (key === 'skyhop'){
    actionBtn = el('button', { class:'action', 'aria-label':'Hop', text:'HOP' });
    deck.append(actionBtn, deckSide(g.hint, pauseBtn));

  } else {
    deck.append(el('div', { class:'deck__hint' }, ['MOVE PADDLE', el('b', { text:g.hint })]),
                el('div', { style:'text-align:right' }, [pauseBtn]));
  }

  const cabinet = el('div', { class:'cabinet', style:'--cab-max:' + (CAB_MAX[key] || 560) + 'px' }, [
    el('div', { class:'cabinet__marquee' }, [
      el('span', { class:'cabinet__name', text:g.name }),
      el('span', { class:'cabinet__badge', text:S.id + ' · ' + g.sub.toUpperCase() })
    ]),
    plates,
    el('div', { class:'cabinet__bezel' }, [screen]),
    deck,
    el('div', { class:'coindoor' }, [
      el('span', { class:'coindoor__slot', 'aria-hidden':'true' }),
      el('span', { text:'INSERT COIN TO BELONG' }),
      el('span', { text:'PLAYER 1' })
    ])
  ]);

  const wrap = el('div', { class:'shell cab-stage' }, [
    cabinet,
    el('div', { class:'cab-foot', style:'--cab-max:' + (CAB_MAX[key] || 560) + 'px' }, [
      el('a', { class:'btn btn--sm btn--ghost', href:'#/play', text:'‹ CABINETS' }),
      el('a', { class:'btn btn--sm btn--ghost', href:'#/leaderboards', text:'LEADERBOARD ›' })
    ]),
    el('div', { class:'panel instructions', style:'--cab-max:' + (CAB_MAX[key] || 560) + 'px' }, [
      Legend('HOW TO PLAY'),
      el('ol', {}, g.how.map(line => el('li', { text:line }))),
      el('p', { class:'tiny muted', style:'margin:12px 0 0' }, [
        seasonLabel() + ' · DAY ' + si.day + ' OF ' + S.days + ' · ',
        el('a', { href:'#/rules', text:'RULES' })
      ]),
      isPrototype() ? el('p', { class:'tiny muted', style:'margin:8px 0 0' }, [
        'PROTOTYPE BUILD: RUNS ARE CHECKED IN THIS BROWSER, NOT ON A SERVER. ',
        el('a', { href:'#/rules', text:'WHAT THAT MEANS' })
      ]) : null
    ])
  ]);

  const runner = Runner({ key, canvas, overlay, screen, cabinet,
                          scoreEl, bestEl, lampEl, pauseBtn, actionBtn, input });
  runner.mount();
  RT.cleanup = runner.destroy;
  return wrap;
}

function deckSide(hint, pauseBtn){
  return el('div', { style:'text-align:right;display:flex;flex-direction:column;gap:10px;align-items:flex-end' }, [
    el('div', { class:'deck__hint' }, ['CONTROLS', el('b', { text:hint })]),
    pauseBtn
  ]);
}
