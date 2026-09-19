/* ============================================================================
   99WORLDCUP — SEASON ARCHIVE + SEASON DETAIL
   The archive is the point of the product: what froze, and when. It lists only
   seasons that exist. Season 01 is live and has not frozen, so it says that
   instead of pretending to be a hall of fame.
   ========================================================================== */
import { el } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { SEASONS, Season, fmtDate } from '../config/season.js';
import { App, whenReady } from '../core/app.js';
import { Board } from '../core/board.js';
import { NameCell, SeasonMeter, Legend } from '../ui/widgets.js';
import { ViewNotFound } from './notfound.js';

export function ViewSeasons(){
  const rows = SEASONS.map(s => {
    const si = Season.info(s);
    return el('a', { class:'panel', href:'#/seasons/' + String(s.num).padStart(2, '0'),
                     style:'text-decoration:none;display:block' }, [
      el('div', { class:'seasonrow' }, [
        el('div', { class:'poster', 'aria-hidden':'true', text:s.poster }),
        el('div', {}, [
          el('h3', { class:'coin', text:s.name }),
          el('p', { class:'muted', style:'margin:0;font-size:19px',
                    text:fmtDate(si.start) + ' → ' + fmtDate(si.end) }),
          el('div', { style:'margin-top:8px' }, [
            el('span', { class:'chip ' + (si.frozen ? 'chip--frozen' : si.live ? 'chip--live' : ''),
                         text:si.frozen ? 'FROZEN' : si.live ? 'LIVE · DAY ' + si.day : 'UPCOMING' })
          ].concat(s.games.map(g => el('span', { class:'chip', text:GAMES[g].name }))))
        ]),
        el('span', { class:'coin mono', style:'font-size:18px', 'aria-hidden':'true', text:'›' })
      ])
    ]);
  });

  return el('div', { class:'shell stack' }, [
    el('div', { class:'pagehead' }, [
      el('h1', { class:'coin', text:'SEASON ARCHIVE' }),
      el('p', { class:'muted', text:'Every season that has ever run, and what it froze.' })
    ]),
    ...rows,
    el('div', { class:'notice' }, [
      el('strong', { text:'ONE SEASON SO FAR. ' }),
      'Season 01 is live and has not frozen yet, so there are no historical rankings ' +
      'to browse. When day 99 ends, this page keeps Season 01 exactly as it finished — ' +
      'permanently, and readable forever.'
    ])
  ]);
}

export function ViewSeason(numStr){
  const s = SEASONS.find(x => x.num === parseInt(numStr, 10));
  if (!s) return ViewNotFound();
  const si = Season.info(s);

  const fact = (icon, label, value) => el('div', {}, [
    el('div', { class:'tiny muted' }, [el('span', { 'aria-hidden':'true', text:icon + ' ' }), label]),
    el('div', { class:'factv', text:value })
  ]);

  const champBox = el('div', {}, [
    el('div', { class:'tiny muted' }, [el('span', { 'aria-hidden':'true', text:'👑 ' }), 'CHAMPION']),
    el('div', { class:'factv muted', text:'TBD' })
  ]);

  const view = el('div', { class:'shell stack', style:'padding-top:var(--gap)' }, [
    el('div', { class:'panel panel--coin stack' }, [
      Legend('SEASON ' + String(s.num).padStart(2, '0')),
      el('div', { style:'text-align:center;padding:10px 0 20px;border-bottom:1px solid var(--dim)' }, [
        el('h1', { class:'coin', text:s.name }),
        el('p', { class:'muted', style:'margin-top:12px', text:'A 90s arcade revival.' })
      ]),
      el('div', { class:'facts' }, [
        fact('📅', 'START DATE', fmtDate(si.start)),
        fact('📅', 'END DATE', fmtDate(si.end)),
        fact('🎨', 'THEME', s.theme),
        champBox,
        fact('🏆', 'PLACES', 'TOP 100')
      ]),
      el('hr', { class:'rule' }),
      el('div', {}, [
        el('h4', { class:'tube', text:'GAMES SELECTED' }),
        el('div', { class:'row', style:'margin-top:12px;gap:10px' },
          s.games.map(g => el('a', { class:'btn btn--sm btn--ghost', href:'#/play/' + g,
                                     text:GAMES[g].name })))
      ]),
      el('hr', { class:'rule' }),
      el('div', {}, [
        el('h4', { class:'coin', text:'SEASON STORY' }),
        el('p', { style:'margin-top:12px;max-width:62ch', text:s.story })
      ]),
      el('div', { class:'spread', style:'margin-top:8px' }, [
        el('p', { class:'marker', style:'font-size:22px;margin:0', text:'The Originals. Forever.' }),
        el('a', { class:'btn btn--coin', href:'#/leaderboards', text:'VIEW LEADERBOARD ›' })
      ])
    ]),
    SeasonMeter()
  ]);

  if (si.frozen) champBox.lastChild.textContent = 'SEE ARCHIVE';
  else loadSeasonChamp(champBox, s);
  return view;
}

async function loadSeasonChamp(box, s){
  await whenReady();
  if (!App.online) return;
  const res = await Promise.all(s.games.map(g => Board.fetch(g, 'season')));
  let top = null, topG = null;
  res.forEach((r, i) => {
    const row = r.rows[0];
    if (row && (!top || row[s.games[i] + '_b'] > top[topG + '_b'])){ top = row; topG = s.games[i]; }
  });
  box.lastChild.textContent = '';
  if (!top){ box.lastChild.textContent = 'NO CHAMPION YET'; return; }
  box.lastChild.classList.remove('muted');
  box.lastChild.appendChild(NameCell(top));
}
