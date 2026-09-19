/* ============================================================================
   99WORLDCUP — UNKNOWN ROUTE
   ========================================================================== */
import { el } from '../core/dom.js';

export function ViewNotFound(){
  return el('div', { class:'shell', style:'padding-top:var(--gap)' }, [
    el('div', { class:'panel panel--alarm state state--err' }, [
      el('div', { class:'state__icon', text:'🕹', 'aria-hidden':'true' }),
      el('h2', { text:'NO SUCH CABINET' }),
      el('p', { text:'That page is not part of the arcade.' }),
      el('a', { class:'btn btn--play', href:'#/', text:'BACK TO THE FLOOR' })
    ])
  ]);
}
