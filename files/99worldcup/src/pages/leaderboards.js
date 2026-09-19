/* ============================================================================
   99WORLDCUP — LEADERBOARDS
   Three games, two periods, top 100. Everything on this page is real: if the
   board is empty it says so rather than showing a plausible-looking table.
   ========================================================================== */
import { el, fmt, $$ } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { S, utcDay, seasonLabel } from '../config/season.js';
import { App, whenReady } from '../core/app.js';
import { Board } from '../core/board.js';
import { Loading, ErrorState, NameCell } from '../ui/widgets.js';

const LB = { game:null, period:'today' };

export function ViewBoards(){
  if (!LB.game || S.games.indexOf(LB.game) < 0) LB.game = S.games[0];
  const body = el('div', { class:'panel', style:'padding:0;overflow:hidden' });

  const gameTabs = el('div', { class:'tabs', role:'tablist', 'aria-label':'Game' },
    S.games.map(g => el('button', {
      role:'tab', id:'tab-' + g, 'aria-selected':String(g === LB.game),
      'aria-controls':'lb-body', text:GAMES[g].name,
      on:{ click:() => { LB.game = g; redraw(); } }
    })));

  const periodTabs = el('div', { class:'tabs tabs--sub', role:'tablist', 'aria-label':'Period' },
    [['today','TODAY'],['season','SEASON']].map(p => el('button', {
      role:'tab', 'aria-selected':String(p[0] === LB.period),
      'aria-controls':'lb-body', text:p[1],
      on:{ click:() => { LB.period = p[0]; redraw(); } }
    })));

  function redraw(){
    $$('button', gameTabs).forEach((b, i) =>
      b.setAttribute('aria-selected', String(S.games[i] === LB.game)));
    $$('button', periodTabs).forEach((b, i) =>
      b.setAttribute('aria-selected', String(['today','season'][i] === LB.period)));
    loadBoard(body);
  }

  const wrap = el('div', { class:'shell stack' }, [
    el('div', { class:'pagehead' }, [
      el('h1', { class:'coin', text:'LEADERBOARDS' }),
      el('p', { class:'tiny muted', text:seasonLabel() + ' · ' + S.name })
    ]),
    gameTabs, periodTabs,
    el('div', { id:'lb-body', role:'tabpanel', tabindex:'-1' }, [body]),
    el('p', { class:'tiny muted', style:'text-align:center' },
      ['TOP 100 PLAYERS. ONE HISTORY. ', el('a', { href:'#/rules', text:'HOW RANKING WORKS' })])
  ]);

  loadBoard(body);
  return wrap;
}

async function loadBoard(box){
  const game = LB.game, period = LB.period;
  box.innerHTML = '';
  box.appendChild(Loading('READING THE SCOREBOARD'));

  await whenReady();
  const res = await Board.fetch(game, period);
  if (game !== LB.game || period !== LB.period) return;   // the player switched
  box.innerHTML = '';

  if (res.state === 'error'){
    return box.appendChild(ErrorState('SCOREBOARD OFFLINE',
      'The leaderboard did not answer. Your scores are safe.', () => loadBoard(box)));
  }

  if (res.state === 'offline'){
    const b = App.me[game + '_b'] || 0;
    return box.appendChild(el('div', { class:'state' }, [
      el('div', { class:'state__icon', text:'🔌', 'aria-hidden':'true' }),
      el('h2', { class:'coin', text:'PLAYING SOLO' }),
      el('p', { class:'muted' }, [
        'The shared scoreboard is not available in this view. ',
        b ? 'Your best on ' + GAMES[game].name + ' here is ' + fmt(b) + '.'
          : 'Scores you set are still saved in this browser.'
      ]),
      el('a', { class:'btn btn--play btn--sm', href:'#/play/' + game, text:'PLAY ' + GAMES[game].name })
    ]));
  }

  if (res.state === 'empty'){
    return box.appendChild(el('div', { class:'state' }, [
      el('div', { class:'state__icon', text:'🏆', 'aria-hidden':'true' }),
      el('h2', { class:'coin', text:'NO CHAMPION YET.' }),
      el('p', { class:'muted', text:period === 'today'
        ? 'Nobody has posted a score on ' + GAMES[game].name + ' today. The day resets at 00:00 UTC.'
        : 'Be the first to make history.' }),
      el('a', { class:'btn btn--play btn--sm', href:'#/play/' + game, text:'BE THE FIRST' })
    ]));
  }

  const f = res.field;
  const rows = res.rows.map((r, i) => {
    const rank = i + 1;
    const cls = [rank <= 3 ? 'p' + rank : '', r.id === App.uid ? 'me' : ''].filter(Boolean).join(' ');
    return el('tr', { class:cls }, [
      el('td', { class:'r-rank' }, [rank === 1
        ? el('span', { text:'👑', 'aria-label':'Rank 1' })
        : el('span', { text:'#' + rank })]),
      el('td', { class:'r-name' }, [NameCell(r)]),
      el('td', { class:'r-ctry' }, [
        el('span', { class:'flag', 'aria-hidden':'true', text:r.f || '🏳️' }),
        el('span', { class:'cname', text:r.cn || '—' })
      ]),
      el('td', { class:'r-score', text:fmt(r[f]) })
    ]);
  });

  box.appendChild(el('table', { class:'board' }, [
    el('caption', { text:GAMES[game].name + ' · ' +
      (period === 'today' ? 'TODAY (' + utcDay() + ' UTC)' : 'SEASON ' + S.id + ' — ALL TIME') }),
    el('thead', {}, [el('tr', {}, [
      el('th', { scope:'col', text:'#' }),
      el('th', { scope:'col', text:'PLAYER' }),
      el('th', { scope:'col', text:'COUNTRY' }),
      el('th', { scope:'col', style:'text-align:right', text:'SCORE' })
    ])]),
    el('tbody', {}, rows)
  ]));
}
