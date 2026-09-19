/* ============================================================================
   99WORLDCUP — ENTRY
   Route table, then boot. The first paint comes from local state; nothing on
   the critical path waits for the network.
   ========================================================================== */
import { toast } from './core/dom.js';
import { App } from './core/app.js';
import { route, setFallback, navigate, mountChrome } from './core/router.js';

import { ViewHome }    from './pages/home.js';
import { ViewSelect }  from './pages/select.js';
import { ViewGame }    from './pages/play.js';
import { ViewBoards }  from './pages/leaderboards.js';
import { ViewProfile } from './pages/profile.js';
import { ViewSeasons, ViewSeason } from './pages/seasons.js';
import { ViewRules }   from './pages/rules.js';
import { ViewTerms, ViewPrivacy, ViewCookies, ViewContact } from './pages/legal.js';
import { ViewNotFound } from './pages/notfound.js';

route(/^\/$/,                   ViewHome);
route(/^\/play$/,               ViewSelect);
route(/^\/play\/([a-z]+)$/,     ViewGame);
route(/^\/leaderboards$/,       ViewBoards);
route(/^\/seasons$/,            ViewSeasons);
route(/^\/seasons\/(\d{1,2})$/, ViewSeason);
route(/^\/profile$/,            ViewProfile);
route(/^\/rules$/,              ViewRules);
route(/^\/terms$/,              ViewTerms);
route(/^\/privacy$/,            ViewPrivacy);
route(/^\/cookies$/,            ViewCookies);
route(/^\/contact$/,            ViewContact);
setFallback(ViewNotFound);

mountChrome();
navigate();
App.boot();

window.addEventListener('99:ready', () => {
  /* First visit with a real identity slot and no name yet: nudge once, quietly. */
  if (App.online && !App.named && location.hash.replace('#', '') !== '/profile'){
    toast('PICK A NAME ON YOUR PROFILE TO APPEAR ON THE BOARDS');
  }
});
