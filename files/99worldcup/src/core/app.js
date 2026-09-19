/* ============================================================================
   99WORLDCUP — APP STATE
   ----------------------------------------------------------------------------
   Two stores, deliberately separate:
     Local — this browser only. Preferences + personal bests. Survives offline.
     Store — shared across everyone who opens this page. The public board.
   The page must work with Store === null.

   [SERVER] The shared store used here is the artifact host's key/value document
   store. A production deployment replaces `connect()` with its own API client;
   nothing outside this file knows which one it is talking to.
   ========================================================================== */
import { $ } from './dom.js';
import { Local } from './storage.js';
import { S } from '../config/season.js';
import { CMAP } from '../config/countries.js';

const bestKeys = () => S.games.map(g => g + '_b');

export const App = {
  db:null, uid:null, ready:false,
  me:null,        // the public player record { h, c, cn, f, <game>_b, ... }
  flagged:[],     // runs this session that did not reach a leaderboard

  async boot(){
    const d = Local.read();
    this.me = { h:d.h || '', c:d.c || '', cn:'', f:'', games:0 };
    bestKeys().forEach(k => { this.me[k] = 0; });
    if (d.c && CMAP[d.c]){ this.me.cn = CMAP[d.c][1]; this.me.f = CMAP[d.c][2]; }
    Object.assign(this.me, d.best || {});
    paintIdentity();

    try {
      const [db, user] = await Promise.all([
        window.claude ? claude.use('db')   : null,
        window.claude ? claude.use('user') : null
      ]);
      this.db  = db;
      this.uid = user ? await user.id() : null;
      if (this.db && this.uid){
        const snap = await this.db.doc('players/' + this.uid).get();
        if (snap.exists){
          const v = snap.data();
          this.me = Object.assign(this.me, v);
          const best = {};
          bestKeys().forEach(k => { best[k] = v[k] || 0; });
          Local.patch({ h:v.h, c:v.c, best });
        }
      }
    } catch (e){ /* offline cabinet; nothing to announce */ }

    this.ready = true;
    paintIdentity();
    window.dispatchEvent(new CustomEvent('99:ready'));
  },

  get online(){ return !!(this.db && this.uid); },
  get named(){ return !!(this.me && this.me.h); },

  /** Writes the whole public player record. One write per real change. */
  async savePlayer(patch){
    Object.assign(this.me, patch);
    const best = {};
    bestKeys().forEach(k => { best[k] = this.me[k] || 0; });
    Local.patch({ h:this.me.h, c:this.me.c, best });
    paintIdentity();
    if (!this.online) return { ok:false, reason:'offline' };
    const body = Object.assign({ sid:S.id, upd:new Date().toISOString() }, this.me);
    delete body.id;
    await this.db.doc('players/' + this.uid).set(body);
    return { ok:true };
  }
};

export function paintIdentity(){
  const m = App.me || {};
  const name = $('#nav-name'), flag = $('#nav-flag');
  if (name) name.textContent = m.h ? m.h.toUpperCase() : 'GUEST';
  if (flag) flag.textContent = m.f || '👾';
}

/** Resolves once the shared store has been reached (or given up on). */
export function whenReady(){
  return App.ready ? Promise.resolve()
                   : new Promise(r => window.addEventListener('99:ready', r, { once:true }));
}
