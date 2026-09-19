/* ============================================================================
   99WORLDCUP — SEASONS
   A season is 99 days long, its three games are fixed before it opens, and
   its state is derived from UTC instants — never from a flag someone could
   flip. At day 99 + 0ms the leaderboards freeze and stay frozen.
   ========================================================================== */
import { clamp } from '../core/dom.js';

export const DAY_MS = 86400000;

export const SEASONS = [{
  id:'S01', num:1, name:'THE ORIGINALS', themeKey:'01', theme:'90s ARCADE',
  start:'2026-09-01T00:00:00.000Z', days:99,
  games:['skyhop','walldrift','mazesnap'],
  poster:'🕹️',
  story:'The first season. Three games, ninety-nine days, one hundred places. ' +
        'Nothing here has happened before, which means everything recorded in it ' +
        'is the oldest record the arcade will ever have.'
}];

export const Season = {
  all(){ return SEASONS; },
  current(){
    const now = Date.now();
    return SEASONS.find(s => {
      const st = Date.parse(s.start);
      return now >= st && now < st + s.days * DAY_MS;
    }) || null;
  },
  info(s){
    const st = Date.parse(s.start), en = st + s.days * DAY_MS, now = Date.now();
    return {
      start:st, end:en,
      day:clamp(Math.floor((now - st) / DAY_MS) + 1, 0, s.days),
      live:now >= st && now < en,
      upcoming:now < st,
      frozen:now >= en,
      msLeft:Math.max(0, en - now)
    };
  },
  isOpen(s){ return this.info(s).live; }
};

/** The season this build is playing. */
export const S = Season.current() || SEASONS[0];
export const SI = () => Season.info(S);
export const seasonLabel = () => 'SEASON ' + String(S.num).padStart(2,'0');

/** "Today" is a UTC calendar day, so the daily board is one race, not 24. */
export const utcDay = t => new Date(t || Date.now()).toISOString().slice(0,10);

export const fmtDate = ms => new Date(ms).toLocaleDateString('en-US',
  { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' });
