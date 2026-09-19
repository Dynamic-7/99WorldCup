/* ============================================================================
   99WORLDCUP — DOM HELPERS
   Everything the interface builds goes through el(). Player-supplied text is
   only ever written as a text node, which is why a display name cannot become
   markup no matter what it contains.
   ========================================================================== */

export const $  = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** Kept for any place that must build a string; el() is preferred. */
export function esc(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

export function el(tag, attrs, kids){
  const n = document.createElement(tag);
  for (const k in (attrs || {})){
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;            // never called with user data
    else if (k === 'on') for (const e in v) n.addEventListener(e, v[e]);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(kids || [])){
    if (c === null || c === undefined || c === false) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}

export const fmt = n => Number(n || 0).toLocaleString('en-US');

export function toast(msg, bad){
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast' + (bad ? ' toast--bad' : '');
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 3800);
}
