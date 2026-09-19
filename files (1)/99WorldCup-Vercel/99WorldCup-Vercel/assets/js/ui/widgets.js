/* ============================================================================
   99WORLDCUP — SHARED UI
   Loading / error / empty are first-class components, not afterthoughts. Every
   screen that can be slow or fail uses the same three, so a broken network
   looks the same everywhere.
   ========================================================================== */
import { el, fmt } from '../core/dom.js';
import { S, SI, fmtDate, seasonLabel } from '../config/season.js';

export function Loading(what){
  return el('div', { class:'panel state' }, [
    el('div', { class:'tiny muted', text:(what || 'LOADING') + '…' }),
    el('div', { class:'bar' }, [el('i')]),
    el('p', { class:'tiny muted', text:'PLEASE WAIT' })
  ]);
}

export function ErrorState(title, msg, retry){
  return el('div', { class:'panel panel--alarm state state--err', role:'alert' }, [
    el('div', { class:'state__icon', text:'⚠', 'aria-hidden':'true' }),
    el('h2', { text:title }),
    el('p', { text:msg }),
    retry ? el('button', { class:'btn btn--play', text:'TRY AGAIN', on:{ click:retry } }) : null
  ]);
}

export const Legend = t => el('div', { class:'legend', text:t });

/* A player's name and flag, assembled from text nodes only. There is no path
   in this project where a display name reaches innerHTML. */
export function NameCell(row){
  return el('span', {}, [
    el('span', { class:'flag', 'aria-hidden':'true', text:row.f || '🏳️' }),
    el('span', { text:String(row.h || '').slice(0, 16) })
  ]);
}

/* ---------------------------------------------------------------------------
   Mechanical counter — the split-flap / odometer digits on an arcade score
   plate. Rebuilt only when the number actually changes.
   ------------------------------------------------------------------------- */
export function Counter(value, opts){
  const n = el('span', { class:'counter' + ((opts && opts.cls) ? ' ' + opts.cls : ''),
                         role:'status', 'aria-label':(opts && opts.label) || 'Score' });
  setCounter(n, value, opts && opts.pad);
  return n;
}

export function setCounter(node, value, pad){
  const s = fmt(Math.max(0, Math.floor(Number(value) || 0)));
  const want = pad ? s.padStart(pad, '0') : s;
  if (node.dataset.v === want) return;
  node.dataset.v = want;
  node.textContent = '';
  for (const ch of want){
    node.appendChild(el('span', {
      class:'counter__d' + (ch === ',' ? ' counter--sep' : ''),
      'aria-hidden':'true', text:ch
    }));
  }
  node.setAttribute('aria-label', (node.getAttribute('aria-label') || 'Score').split(':')[0] + ': ' + want);
}

/* --------------------------------------------------------------------------- */
export function SeasonMeter(){
  const si = SI();
  const cells = [];
  for (let i = 0; i < 33; i++) cells.push(el('i', { class:(i / 33) * S.days < si.day ? 'on' : '' }));

  return el('div', { class:'panel panel--alarm stack', style:'gap:12px' }, [
    el('div', { class:'spread' }, [
      el('h3', { class:'coin', text:seasonLabel() }),
      el('span', { class:'daycount', text:'DAY ' + si.day + ' / ' + S.days })
    ]),
    el('div', { class:'meter', role:'progressbar', 'aria-valuemin':'0',
                'aria-valuemax':String(S.days), 'aria-valuenow':String(si.day),
                'aria-label':'Season progress' }, cells),
    el('p', { class:'tiny muted', text:si.live
      ? 'FREEZES ' + fmtDate(si.end).toUpperCase() + ' · 00:00 UTC'
      : si.frozen ? 'THIS SEASON IS FROZEN' : 'SEASON HAS NOT STARTED' })
  ]);
}
