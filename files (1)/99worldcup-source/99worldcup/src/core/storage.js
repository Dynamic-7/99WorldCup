/* ============================================================================
   99WORLDCUP — LOCAL STORE
   This browser only: preferences and personal bests. The page must keep
   working when the shared scoreboard is unreachable — it simply becomes a
   single-player cabinet. Never treat anything in here as authoritative.
   ========================================================================== */

const LS_KEY = '99wc.v1';

export const Local = {
  read(){
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  },
  write(o){ try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {} },
  patch(o){ const d = this.read(); Object.assign(d, o); this.write(d); return d; }
};
