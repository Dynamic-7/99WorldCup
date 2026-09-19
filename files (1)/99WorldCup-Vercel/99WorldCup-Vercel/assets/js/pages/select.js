/* ============================================================================
   99WORLDCUP — GAME SELECT
   A first-time visitor must see, without scrolling, that the season has
   exactly three games. On a phone each cabinet collapses to one compact row:
   art, name, one line of what it is, and a play button big enough to hit.
   ========================================================================== */
import { el } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { S, SI, seasonLabel } from '../config/season.js';
import { preview } from '../ui/art.js';

export function ViewSelect(){
  const si = SI();

  const cabs = S.games.map(key => {
    const g = GAMES[key];
    const art = el('canvas', { class:'cab__art', 'aria-hidden':'true' });
    requestAnimationFrame(() => preview(key, art));

    const cta = si.live
      ? el('a', { class:'btn btn--play', href:'#/play/' + key,
                  'aria-label':'Play ' + g.name, text:'PLAY' })
      : el('span', { class:'btn', 'aria-disabled':'true', text:'CLOSED' });

    /* Four children: name, art, text, call to action. A phone lays them out as
       a grid (art on the left, name and text stacked beside it, button on the
       right); a desktop stacks them into the original cabinet. */
    return el('article', { class:'panel cab cab--' + key }, [
      el('h2', { class:'cab__name', text:g.name }),
      art,
      el('div', { class:'cab__body' }, [
        el('p', { class:'cab__tag', text:g.tag }),
        el('p', { class:'cab__hint', text:g.hint }),
        el('div', { class:'ctrls' }, g.controls.map(c => el('div', { class:'ctrl' }, [
          el('span', { class:'key', text:c[0] }), el('span', { text:c[1] })
        ])))
      ]),
      cta
    ]);
  });

  return el('div', { class:'shell stack' }, [
    el('div', { class:'selecthead' }, [
      el('h1', { class:'coin' }, [seasonLabel(), el('br'), S.name]),
      el('p', { class:'muted', text:'Three games. Pick one.' })
    ]),
    el('div', { class:'cabinets' }, cabs),
    el('p', { class:'tiny muted', style:'text-align:center' },
      ['LOCKED FOR ALL ' + S.days + ' DAYS. ', el('a', { href:'#/seasons/01', text:'SEASON DETAILS' })])
  ]);
}
