/* ============================================================================
   99WORLDCUP — PROFILE
   Identity, season stats and badge slots. Badges are minted at freeze and
   stored; they are never recomputed from a live board. Season 01 has not
   frozen, so the slots are empty and the page says why.
   ========================================================================== */
import { el, fmt, $ } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { S, SI, fmtDate, seasonLabel } from '../config/season.js';
import { COUNTRIES, CMAP, TZ_HINT } from '../config/countries.js';
import { App } from '../core/app.js';
import { Board } from '../core/board.js';
import { Legend } from '../ui/widgets.js';
import { toast } from '../core/dom.js';

export function ViewProfile(){
  const wrap = el('div', { class:'shell stack', style:'padding-top:var(--gap)' });

  const render = () => {
    wrap.innerHTML = '';
    const m = App.me || {};
    const total  = S.games.reduce((a, g) => a + (m[g + '_b'] || 0), 0);
    const played = S.games.reduce((a, g) => a + (m[g + '_n'] || 0), 0);

    wrap.appendChild(el('div', { class:'panel panel--coin' }, [
      el('div', { class:'idcard' }, [
        el('div', { class:'portrait', 'aria-hidden':'true', text:m.f || '👾' }),
        el('div', { class:'stack', style:'gap:8px' }, [
          el('h1', { class:'coin', text:m.h ? m.h : 'UNNAMED PLAYER' }),
          el('p', { class:'muted', style:'margin:0' }, [
            el('span', { class:'flag', 'aria-hidden':'true', text:m.f || '🏳️' }),
            el('span', { text:' ' + (m.cn || 'Country not set') })
          ]),
          el('p', { class:'marker', style:'font-size:19px;margin:6px 0 0', text:'Better games. Better days.' })
        ]),
        el('button', { class:'btn btn--sm', text:m.h ? 'EDIT' : 'SET UP',
                       on:{ click:() => openEditor(render) } })
      ])
    ]));

    wrap.appendChild(el('dl', { class:'statgrid' }, [
      el('div', {}, [el('dt', { text:'SEASONS PLAYED' }), el('dd', { text:played ? '1' : '0' })]),
      el('div', {}, [el('dt', { text:'BEST RANK' }), el('dd', { id:'best-rank', text:'—' })]),
      el('div', {}, [el('dt', { text:'GAMES PLAYED' }), el('dd', { text:fmt(played) })]),
      el('div', {}, [el('dt', { text:'TOTAL BEST' }), el('dd', { text:fmt(total) })])
    ]));

    wrap.appendChild(el('div', { class:'panel stack' }, [
      Legend('BADGES'),
      el('div', { class:'badges' }, S.games.map(g => el('div', { class:'badge badge--empty' }, [
        el('span', { class:'badge__s', text:S.id }),
        el('span', { class:'badge__r', text:'?' }),
        el('span', { class:'badge__g', text:GAMES[g].name })
      ]))),
      el('p', { class:'tiny muted', text:
        'BADGES ARE MINTED WHEN THE SEASON FREEZES ON ' + fmtDate(SI().end).toUpperCase() +
        '. ONE PER GAME, CARRYING YOUR FINAL RANK. THEY CANNOT BE EARNED AGAIN.' })
    ]));

    wrap.appendChild(el('div', { class:'panel stack' }, [
      Legend('GAME STATS · ' + seasonLabel()),
      el('div', { class:'gamestats' }, S.games.map(g => el('div', {}, [
        el('h4', { class:'tube', text:GAMES[g].name }),
        el('div', { class:'num coin', style:'font-size:22px;margin:10px 0 6px', text:fmt(m[g + '_b'] || 0) }),
        el('div', { class:'tiny muted', text:(m[g + '_n'] || 0) + ' RUNS' }),
        el('a', { class:'btn btn--sm btn--ghost', style:'margin-top:10px', href:'#/play/' + g, text:'PLAY' })
      ])))
    ]));

    /* Runs that did not reach a board this session. Plain language only: the
       player is told what happened, not which rule fired. */
    if (App.flagged.length){
      wrap.appendChild(el('div', { class:'panel panel--alarm stack' }, [
        Legend('RUNS NOT COUNTED'),
        el('p', { class:'muted', style:'font-size:19px',
          text:'These runs were not added to any leaderboard.' }),
        el('ul', { style:'margin:0;padding-left:20px' }, App.flagged.map(h =>
          el('li', { style:'font-size:19px;margin-bottom:6px' }, [
            el('span', { class:'coin', text:GAMES[h.game].name + ' ' + fmt(h.score) }),
            el('span', { class:'muted', text:' — ' + h.note })
          ])))
      ]));
    }

    if (!App.online){
      wrap.appendChild(el('div', { class:'notice' }, [
        el('strong', { text:'LOCAL PROFILE. ' }),
        'This view cannot reach the shared scoreboard, so your record lives in this browser only.'
      ]));
    }

    fillBestRank();
    return wrap;
  };

  async function fillBestRank(){
    if (!App.online || !App.me.h) return;
    const out = await Promise.all(S.games.map(g => Board.fetch(g, 'season')));
    let best = null;
    out.forEach(r => {
      const i = r.rows.findIndex(x => x.id === App.uid);
      if (i >= 0 && (best === null || i + 1 < best)) best = i + 1;
    });
    const node = $('#best-rank');
    if (node) node.textContent = best ? '#' + best : '—';
  }

  if (!App.ready) window.addEventListener('99:ready', render, { once:true });
  return render();
}

/* ---------------------------------------------------------------------------
   Identity editor. Everything is validated before it is stored, and the stored
   value is only ever rendered through textContent.
   ------------------------------------------------------------------------- */
export function openEditor(done){
  const m = App.me || {};
  const tz = (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '';
  const guess = m.c || TZ_HINT[tz] || '';

  const nameIn = el('input', {
    id:'f-name', type:'text', maxlength:'16', value:m.h || '',
    autocomplete:'off', spellcheck:'false', 'aria-describedby':'f-name-help f-name-err'
  });
  const errN = el('p', { class:'err', id:'f-name-err', role:'alert' });
  const sel = el('select', { id:'f-ctry' },
    [el('option', { value:'', text:'— choose —' })].concat(
      COUNTRIES.map(c => el('option', { value:c[0], selected:c[0] === guess ? true : null,
                                        text:c[2] + '  ' + c[1] }))));

  const dlg = el('div', { class:'panel panel--coin stack', role:'dialog',
                          'aria-modal':'false', 'aria-label':'Player identity' }, [
    Legend('PLAYER IDENTITY'),
    el('div', { class:'field' }, [
      el('label', { for:'f-name', text:'DISPLAY NAME' }), nameIn,
      el('p', { class:'tiny muted', id:'f-name-help', text:'3–16 CHARACTERS. LETTERS, NUMBERS, _ AND - ONLY.' }),
      errN
    ]),
    el('div', { class:'field' }, [
      el('label', { for:'f-ctry', text:'COUNTRY' }), sel,
      el('p', { class:'tiny muted', text:guess && !m.c
        ? 'GUESSED FROM YOUR TIME ZONE. CHANGE IT IF IT IS WRONG.'
        : 'SHOWN NEXT TO YOUR NAME ON EVERY BOARD.' })
    ]),
    el('div', { class:'row', style:'gap:10px' }, [
      el('button', { class:'btn btn--coin', text:'SAVE', on:{ click:save } }),
      el('button', { class:'btn', text:'CANCEL', on:{ click:() => done() } })
    ]),
    el('p', { class:'tiny muted' }, ['YOUR NAME AND COUNTRY ARE PUBLIC. NOTHING ELSE IS. ',
      el('a', { href:'#/privacy', text:'PRIVACY' })])
  ]);

  async function save(){
    const raw = nameIn.value.trim();
    const bad = validateName(raw);
    if (bad){ errN.textContent = bad; nameIn.focus(); return; }
    const c = sel.value;
    if (!c){ errN.textContent = 'Pick a country, or "Not saying".'; sel.focus(); return; }
    const row = CMAP[c];
    try {
      const r = await App.savePlayer({ h:raw, c:c, cn:row[1], f:row[2] });
      toast(r.ok ? 'IDENTITY SAVED TO THE SCOREBOARD' : 'SAVED IN THIS BROWSER ONLY', !r.ok);
    } catch (e){ toast('COULD NOT SAVE — TRY AGAIN', true); return; }
    done();
  }

  const host = $('#main .shell') || $('#main');
  host.innerHTML = '';
  host.appendChild(dlg);
  nameIn.focus();
}

/** Username policy, enforced before storage. Anything that gets through here
 *  is still escaped at render time — two layers, on purpose. */
export function validateName(s){
  if (s.length < 3) return 'Too short. Minimum 3 characters.';
  if (s.length > 16) return 'Too long. Maximum 16 characters.';
  if (!/^[A-Za-z0-9_-]+$/.test(s))
    return 'Letters, numbers, underscore and hyphen only — no spaces or symbols.';
  if (/^(admin|administrator|mod|moderator|staff|official|system|root|99worldcup|support)/i.test(s))
    return 'That name looks like staff. Pick another.';
  if (/(.)\1{5,}/.test(s)) return 'Too many repeated characters.';
  return null;
}
