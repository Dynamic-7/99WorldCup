/* ============================================================================
   99WORLDCUP — ROUTER
   Hash routing, so the whole thing runs from a file:// path or any static host
   with no server rewrites. A view may register a teardown on RT.cleanup; the
   router calls it before the next view mounts (canvas loops rely on this).
   ========================================================================== */
import { $, $$ } from './dom.js';

const Routes = [];
export const RT = { cleanup:null };
let fallback = () => null;

export const route = (re, fn) => Routes.push([re, fn]);
export const setFallback = fn => { fallback = fn; };

const NAV_BREAK = 900;

export function navigate(){
  if (RT.cleanup){ try { RT.cleanup(); } catch (e) {} RT.cleanup = null; }

  const path = (location.hash.replace(/^#/, '') || '/');
  const main = $('#main');
  main.innerHTML = '';

  let view = null, params = [];
  for (const [re, fn] of Routes){
    const m = path.match(re);
    if (m){ view = fn; params = m.slice(1); break; }
  }

  const out = view ? view.apply(null, params) : fallback();
  if (out) main.appendChild(out);

  $$('#navlinks a').forEach(a => {
    const h = a.getAttribute('href').slice(1);
    const on = h !== '/' && path.indexOf(h) === 0;
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  if (window.innerWidth < NAV_BREAK) closeNav();
  main.focus({ preventScroll:true });
  window.scrollTo(0, 0);
}

function closeNav(){
  const nav = $('#navlinks'), b = $('#burger');
  if (!nav) return;
  nav.hidden = true;
  if (b) b.setAttribute('aria-expanded', 'false');
}

export function mountChrome(){
  const burger = $('#burger');
  if (burger) burger.addEventListener('click', e => {
    const nav = $('#navlinks');
    nav.hidden = !nav.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!nav.hidden));
  });

  const sync = () => {
    const nav = $('#navlinks');
    if (!nav) return;
    if (window.innerWidth >= NAV_BREAK) nav.hidden = false;
    else closeNav();
  };
  window.addEventListener('resize', sync);
  window.addEventListener('hashchange', navigate);
  sync();
}
