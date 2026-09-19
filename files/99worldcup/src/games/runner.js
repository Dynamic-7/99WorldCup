/* ============================================================================
   99WORLDCUP — RUNNER
   ----------------------------------------------------------------------------
   One loop, one input model, one submission path for all three games. Games
   never touch the DOM, the clock or the network; they are pure step-and-draw
   modules driven at a fixed 60 Hz.

   INPUT POLICY (read before adding a listener):
     · The canvas is the only element that takes gestures away from the browser.
       It carries touch-action:none in CSS, which is enough on its own — so
       there is no preventDefault() on pointer events anywhere in this file.
     · Nothing is bound to window/document for touch. Scrolling the page,
       swiping back and pull-to-refresh all keep working during a run.
     · Keys are only swallowed while a run is actually live, and only the ones
       the game uses, so Tab, browser shortcuts and screen readers are intact.
   ========================================================================== */
import { el, fmt } from '../core/dom.js';
import { GAMES } from '../config/games.js';
import { App } from '../core/app.js';
import { startSession, submitRun, isPrototype } from '../core/backend.js';
import { VERDICT } from '../core/scoring.js';
import { rng } from '../core/rng.js';
import { GAME_IMPL } from './index.js';
import { setCounter } from '../ui/widgets.js';

export const STEP_MS = 1000 / 60;

/** Shared input. Games read it; they never bind listeners themselves. */
export function makeInput(){
  return {
    dir:null,          // 'u'|'d'|'l'|'r' — latest requested direction
    held:{},           // raw key state
    tap:false,         // one-shot press
    py:null,           // pointer Y in logical px
    takeTap(){ const t = this.tap; this.tap = false; return t; },
    clear(){ this.dir = null; this.tap = false; this.py = null; this.held = {}; }
  };
}

export function Runner(o){
  const g = GAMES[o.key];
  let game = null, session = null, raf = 0, acc = 0, last = 0;
  let state = 'idle';                     // idle | playing | paused | over
  let log = [], frames = 0, shown = -1, fitPending = 0;

  const setLamp = (s, label) => {
    if (!o.lampEl) return;
    o.lampEl.dataset.s = s;
    o.lampEl.textContent = label;
  };

  /* ---------------------------------------------------------------- layout */
  /* The glass is sized to fit the viewport, so a tall game never pushes its
     own controls off the bottom of a phone. Runs on mount and on resize only. */
  function fitScreen(){
    if (!game || !o.screen) return;
    const ar = game.w / game.h;
    const rect = o.cabinet.getBoundingClientRect();
    const others = o.cabinet.offsetHeight - o.screen.offsetHeight;   // chrome height
    /* On a phone the glass is the show: only the machine above the screen is
       reserved, so the canvas runs wide instead of shrinking to a stamp. The
       deck sits below the fold — every game is touch-playable on the glass
       itself (tap / swipe / drag), so nothing is lost mid-run. */
    const reserve = window.matchMedia('(max-width:599px)').matches ? 106 : others + 84;
    const avail = window.innerHeight - rect.top - reserve;
    const byHeight = Math.max(170, avail) * ar;
    o.screen.style.maxWidth = Math.floor(byHeight) + 'px';
  }
  const queueFit = () => {
    cancelAnimationFrame(fitPending);
    fitPending = requestAnimationFrame(fitScreen);
  };

  /* --------------------------------------------------------------- session */
  async function newSession(){
    session = await startSession(o.key);
    if (!session || session.error){ showExpired(); return false; }
    game = GAME_IMPL[o.key](rng(session.seed), session.seed);
    o.canvas.width = game.w; o.canvas.height = game.h;
    log = []; frames = 0; shown = -1;
    setCounter(o.scoreEl, 0);
    queueFit();
    return true;
  }

  function overlayCard(kids){
    o.overlay.hidden = false;
    o.overlay.innerHTML = '';
    kids.filter(Boolean).forEach(k => o.overlay.appendChild(k));
  }

  function showExpired(){
    state = 'over';
    setLamp('over', 'CLOSED');
    overlayCard([
      el('h2', { class:'alarm', text:VERDICT.expired.title }),
      el('p', { class:'muted', text:'This cabinet is not accepting runs right now.' }),
      el('a', { class:'btn btn--play', href:'#/leaderboards', text:'VIEW LEADERBOARDS' })
    ]);
  }

  function ready(){
    state = 'idle';
    setLamp('ready', 'READY');
    const start = el('button', { class:'btn btn--coin', text:'PRESS START', on:{ click:begin } });
    overlayCard([
      el('h2', { text:g.name }),
      el('p', { class:'muted', text:g.tag }),
      start,
      el('p', { class:'tiny muted', text:'SEED ' + session.seed.toString(16).toUpperCase() +
                ' · ' + g.v.toUpperCase() })
    ]);
    start.focus({ preventScroll:true });
    draw();
  }

  function begin(){
    if (state === 'playing') return;
    state = 'playing';
    setLamp('live', 'LIVE');
    o.overlay.hidden = true;
    o.input.clear();
    last = performance.now(); acc = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function pause(why){
    if (state !== 'playing') return;
    state = 'paused';
    setLamp('paused', 'PAUSED');
    cancelAnimationFrame(raf);
    const resume = el('button', { class:'btn btn--coin', text:'RESUME', on:{ click:begin } });
    overlayCard([
      el('h2', { text:'PAUSED' }),
      el('p', { class:'muted', text:why || 'The clock is stopped. Your run is safe.' }),
      resume,
      el('a', { class:'btn btn--sm btn--ghost', href:'#/play', text:'LEAVE GAME' })
    ]);
    resume.focus({ preventScroll:true });
  }

  /* ------------------------------------------------------------------ loop */
  function tick(now){
    if (state !== 'playing') return;
    acc += Math.min(now - last, 250);      // a backgrounded tab must not fast-forward
    last = now;
    let steps = 0;
    while (acc >= STEP_MS && steps < 8){
      game.update(o.input);
      acc -= STEP_MS; steps++; frames++;
      if (frames % 60 === 0) log.push(game.score);      // one sample a second
      if (game.dead){ over(); return; }
    }
    if (game.score !== shown){ shown = game.score; setCounter(o.scoreEl, game.score); }
    draw();
    raf = requestAnimationFrame(tick);
  }

  function draw(){
    const ctx = o.canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    game.render(ctx);
  }

  /* ------------------------------------------------------------ submission */
  async function over(){
    state = 'over';
    cancelAnimationFrame(raf);
    setLamp('over', 'GAME OVER');
    draw();

    const score = game.score;
    log.push(score);
    setCounter(o.scoreEl, score);

    overlayCard([
      el('h2', { class:'alarm', text:'GAME OVER' }),
      el('div', { class:'overlay__score', text:fmt(score) }),
      el('p', { class:'tiny muted', text:'SUBMITTING RUN…' })
    ]);

    let res;
    try {
      res = await submitRun(session, {
        score, endedAt:Date.now(), seed:session.seed,
        gameVersion:g.v, configVersion:g.cfgV,
        playMs:Math.round(frames * STEP_MS), log
      });
    } catch (e){
      res = { verdict:'expired', title:VERDICT.expired.title,
              note:'The scoreboard could not be reached, so this run was not recorded.',
              written:false, digest:'--------' };
    }
    showVerdict(res, score);
  }

  function showVerdict(res, score){
    const again = el('button', { class:'btn btn--coin', text:'PLAY AGAIN',
      on:{ click:async () => { if (await newSession()) begin(); } } });

    if (res.verdict === 'accepted'){
      setCounter(o.bestEl, App.me[o.key + '_b'] || 0);
      overlayCard([
        el('h2', { class:res.pb ? 'coin' : 'alarm', text:res.pb ? 'NEW PERSONAL BEST' : 'GAME OVER' }),
        el('div', { class:'overlay__score', text:fmt(score) }),
        el('span', { class:'verdict verdict--ok', text:VERDICT.accepted.title }),
        el('p', { class:'tiny muted', text:res.written
          ? (App.named ? 'ON THE SEASON BOARD' : 'SAVED — CLAIM A NAME TO APPEAR ON THE BOARD')
          : 'SAVED IN THIS BROWSER ONLY — SCOREBOARD UNREACHABLE' }),
        again,
        el('div', { class:'row', style:'justify-content:center;gap:8px' }, [
          !App.named ? el('a', { class:'btn btn--sm btn--ghost', href:'#/profile', text:'CLAIM A NAME' }) : null,
          el('a', { class:'btn btn--sm btn--ghost', href:'#/leaderboards', text:'LEADERBOARD' })
        ]),
        el('p', { class:'tiny muted', text:'RUN ' + String(res.digest).toUpperCase() })
      ]);
    } else {
      const v = VERDICT[res.verdict] || VERDICT.rejected;
      overlayCard([
        el('h2', { class:res.verdict === 'review' ? 'coin' : 'alarm', text:res.title || v.title }),
        el('div', { class:'overlay__score', text:fmt(score) }),
        el('span', { class:'verdict ' + v.css, text:'NOT ON A LEADERBOARD' }),
        el('p', { class:'muted', text:res.note }),
        again,
        el('a', { class:'btn btn--sm btn--ghost', href:'#/rules', text:'HOW SCORING WORKS' })
      ]);
    }
    again.focus({ preventScroll:true });
  }

  /* ------------------------------------------------------------- listeners */
  const KEYMAP = { ArrowUp:'u', ArrowDown:'d', ArrowLeft:'l', ArrowRight:'r',
                   w:'u', s:'d', a:'l', d:'r', W:'u', S:'d', A:'l', D:'r' };

  const onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape' || k === 'p' || k === 'P'){
      if (state === 'paused') begin(); else if (state === 'playing') pause();
      e.preventDefault();
      return;
    }
    if (state === 'idle' && (k === ' ' || k === 'Enter')){ e.preventDefault(); begin(); return; }
    if (state !== 'playing') return;
    if (KEYMAP[k]){ o.input.dir = KEYMAP[k]; o.input.held[KEYMAP[k]] = true; e.preventDefault(); }
    if (k === ' '){ o.input.tap = true; e.preventDefault(); }
  };
  const onKeyUp = e => { if (KEYMAP[e.key]) o.input.held[KEYMAP[e.key]] = false; };

  /* Pointer handling lives entirely on the canvas. */
  let drag = null;
  const localY = e => {
    const r = o.canvas.getBoundingClientRect();
    return (e.clientY - r.top) * (game ? game.h / r.height : 1);
  };
  const onDown = e => {
    if (state === 'idle'){ begin(); return; }
    if (state !== 'playing') return;
    o.input.tap = true;
    o.input.py = localY(e);
    drag = { x:e.clientX, y:e.clientY };
    if (o.canvas.setPointerCapture && e.pointerId !== undefined){
      try { o.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };
  const onMove = e => {
    if (state !== 'playing') return;
    o.input.py = localY(e);
    if (drag && o.key === 'mazesnap'){
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) > 22 || Math.abs(dy) > 22){
        o.input.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
        drag = { x:e.clientX, y:e.clientY };
      }
    }
  };
  const onUp = () => { drag = null; };
  const onBlur = () => pause('You switched away. The clock is stopped.');
  const onResize = () => queueFit();

  function mount(){
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    o.canvas.addEventListener('pointerdown', onDown);
    o.canvas.addEventListener('pointermove', onMove);
    o.canvas.addEventListener('pointerup', onUp);
    o.canvas.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (o.pauseBtn) o.pauseBtn.addEventListener('click', () => {
      if (state === 'paused') begin(); else if (state === 'playing') pause(); else if (state === 'idle') begin();
    });
    if (o.actionBtn) o.actionBtn.addEventListener('pointerdown', () => {
      if (state === 'idle') begin(); else if (state === 'playing') o.input.tap = true;
    });
    newSession().then(ok => { if (ok) ready(); });
  }

  function destroy(){
    cancelAnimationFrame(raf);
    cancelAnimationFrame(fitPending);
    state = 'over';
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  }

  return { mount, destroy, fit:queueFit, prototype:isPrototype() };
}
