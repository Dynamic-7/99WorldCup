/* ============================================================================
   99WORLDCUP — HOME
   The hero says two things and stops: what the season is, and the law the
   whole product is built on. No invented player counts, no testimonials, no
   trust badges. If there is no champion yet, it says so.
   ========================================================================== */
import { el, fmt } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { S, SI, seasonLabel } from '../config/season.js';
import { App, whenReady } from '../core/app.js';
import { Board } from '../core/board.js';
import { RT } from '../core/router.js';
import { Loading, ErrorState, Legend, NameCell, SeasonMeter } from '../ui/widgets.js';
import { corridor } from '../ui/art.js';

export function ViewHome(){
  const si = SI();

  const hero = el('section', { class:'corridor' }, [
    el('canvas', { id:'corridor-canvas', 'aria-hidden':'true' }),
    el('div', { class:'tape tape--l' }, ['GOOD GAMES', el('br'), 'BETTER DAYS']),
    el('div', { class:'tape tape--r' }, ['PLAY', el('br'), 'COMPETE', el('br'), 'COLLECT', el('br'), 'REPEAT']),
    el('div', { class:'shell corridor__in' }, [
      el('h1', { class:'bigmark' }, ['99W', el('span', { class:'globe', text:'🌍' }), 'RLDCUP']),
      el('p', { class:'seasonline', text:seasonLabel() + ' — ' + S.name }),
      el('p', { class:'creed' }, [
        el('span', { class:'creed__days', text:'99 days with 3 games' }),
        el('span', { class:'creed__law' }, [
          el('em', { text:'The game ends. ' }),
          el('b', { text:'The score stays forever.' })
        ])
      ]),
      el('div', { style:'margin-top:24px' }, [
        el('a', { class:'btn btn--coin', href:'#/play',
          text:si.live ? 'PLAY NOW' : si.upcoming ? 'SEASON OPENS SOON' : 'SEASON CLOSED' })
      ]),
      el('p', { class:'tiny muted', style:'margin-top:14px', text:'GET INTO THE GAMES' })
    ])
  ]);

  const champs = el('div', { class:'panel stack' }, [
    Legend('CURRENT CHAMPIONS'), Loading('READING THE SCOREBOARD')
  ]);

  const wrap = el('div', {}, [
    hero,
    el('div', { class:'shell' }, [
      el('div', { class:'homegrid' }, [
        el('div', {}, [champs]),
        el('div', {}, [SeasonMeter()])
      ])
    ])
  ]);

  const cv = hero.querySelector('#corridor-canvas');
  requestAnimationFrame(() => { RT.cleanup = corridor(cv); });

  loadChampions(champs);
  return wrap;
}

async function loadChampions(box){
  const render = node => {
    box.innerHTML = '';
    box.appendChild(Legend('CURRENT CHAMPIONS'));
    box.appendChild(node);
  };

  await whenReady();

  if (!App.online){
    return render(el('div', { class:'notice' }, [
      el('strong', { text:'SCOREBOARD OFFLINE. ' }),
      'This cabinet is running on its own. Your scores are saved in this browser ' +
      'but nobody else can see them yet.'
    ]));
  }

  const results = await Promise.all(S.games.map(g => Board.fetch(g, 'season')));

  if (results.every(r => r.state === 'error')){
    return render(ErrorState('SCOREBOARD OFFLINE', 'The leaderboard did not answer.',
      () => loadChampions(box)));
  }

  if (!results.some(r => r.rows.length)){
    return render(el('div', { class:'state', style:'min-height:170px;padding:26px 10px' }, [
      el('div', { class:'state__icon', text:'🏆', 'aria-hidden':'true' }),
      el('h3', { class:'coin', text:'NO CHAMPION YET.' }),
      el('p', { class:'muted', text:'Be the first to make history.' }),
      el('a', { class:'btn btn--play btn--sm', href:'#/play', text:'TAKE THE FIRST SCORE' })
    ]));
  }

  render(el('div', { class:'champrow' }, S.games.map((g, i) => {
    const r = results[i].rows[0];
    return el('div', {}, [
      el('h4', { class:'tube', text:GAMES[g].name }),
      r ? el('div', { style:'margin-top:12px' }, [
            el('div', { class:'state__icon', style:'font-size:22px', text:'👑', 'aria-hidden':'true' }),
            el('div', { class:'mono', style:'font-size:11px;margin-top:8px' }, [NameCell(r)]),
            el('div', { class:'num coin', style:'font-size:15px;margin-top:8px', text:fmt(r[g + '_b']) })
          ])
        : el('div', { class:'tiny muted', style:'margin-top:26px', text:'NO CHAMPION YET' })
    ]);
  })));
}
