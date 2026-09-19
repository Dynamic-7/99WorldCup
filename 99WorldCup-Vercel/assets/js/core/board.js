/* ============================================================================
   99WORLDCUP — LEADERBOARD
   Ranking, stated once so every screen agrees:
     1. higher score first
     2. equal scores → whoever reached it first ranks higher (earlier timestamp)
     3. top 100 only
   Rule 2 is a product decision, written on the Rules page rather than buried
   here, because players will ask.
   ========================================================================== */
import { App } from './app.js';
import { S, utcDay } from '../config/season.js';

export const Board = {
  async fetch(game, period){
    if (!App.online) return { state:'offline', rows:[] };
    const field = period === 'today' ? game + '_t' : game + '_b';
    try {
      let q = App.db.collection('players');
      q = period === 'today'
        ? q.where(game + '_d', '==', utcDay())
        : q.where('sid', '==', S.id);
      const snap = await q.orderBy(field, 'desc').limit(100).get();
      const rows = snap.docs.map(d => Object.assign({ id:d.id }, d.data()))
        .filter(r => (r[field] || 0) > 0 && r.h)
        .sort((a, b) => (b[field] - a[field]) ||
                        ((a[game + '_bt'] || 0) - (b[game + '_bt'] || 0)))
        .slice(0, 100);
      return { state:rows.length ? 'ok' : 'empty', rows, field };
    } catch (e){
      return { state:'error', rows:[], error:e && e.code };
    }
  }
};
