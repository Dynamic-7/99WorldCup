/* ============================================================================
   99WORLDCUP — SKY HOP  (one button)
   A pure module: given a seeded RNG it produces an identical run for identical
   input. No DOM, no Date.now(), no Math.random(), no network. That is what
   makes a run reproducible — and therefore checkable by a server later.
   Original artwork and tuning; the genre is a classic, the assets are not.
   ========================================================================== */
import { clamp } from '../core/dom.js';

export function skyhop(rand){
  const W = 320, H = 480, GY = H - 68, BX = 94, BR = 11, PW = 48;
  const gapFor   = n => Math.max(98, 142 - n * 1.15);
  const speedFor = n => Math.min(4.3, 2.15 + n * 0.022);
  const spaceFor = n => Math.max(146, 194 - n * 1.1);

  let y = H * .40, vy = 0, pipes = [], passed = 0, t = 0, started = false;
  const g = { w: W, h: H, score: 0, dead: false };

  function spawn() {
    const gap = gapFor(passed + pipes.length);
    const top = 52 + rand() * (GY - 104 - gap);
    pipes.push({ x: W + 30, top, gap, scored: false });
  }
  spawn();

  g.update = function (input) {
    t++;
    if (!started) {
      if (input.takeTap()) { started = true; vy = -6.7; }
      else { y = H * .40 + Math.sin(t / 17) * 7; return; }
    }
    if (input.takeTap()) vy = -6.7;
    vy = Math.min(vy + 0.42, 10.6);
    y += vy;

    const sp = speedFor(passed);
    for (const p of pipes) p.x -= sp;
    if (!pipes.length || pipes[pipes.length - 1].x < W - spaceFor(passed)) spawn();
    while (pipes.length && pipes[0].x < -PW - 10) pipes.shift();

    if (y - BR < 0) { y = BR; vy = 0; }
    if (y + BR >= GY) { y = GY - BR; g.dead = true; return; }

    for (const p of pipes) {
      if (BX + BR > p.x && BX - BR < p.x + PW &&
          (y - BR < p.top || y + BR > p.top + p.gap)) { g.dead = true; return; }
      if (!p.scored && p.x + PW < BX - BR) { p.scored = true; passed++; g.score++; }
    }
  };


  /* Re-simulation hook. A compact numeric fingerprint of the current state.
     A server replaying (seed, input log) can compare traces frame by frame and
     find the exact step where a submitted run stops being real. Nothing in the
     interface reads this; it exists for the checker and for the tests. */
  g.trace = () => [Math.round(y), Math.round(vy * 10), pipes.length,
                   pipes.length ? Math.round(pipes[0].x) : 0,
                   pipes.length ? Math.round(pipes[0].top) : 0, g.score];

  g.render = function (c) {
    const sky = c.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, '#0B1C3D'); sky.addColorStop(.55, '#123A6B'); sky.addColorStop(1, '#2A6EA8');
    c.fillStyle = sky; c.fillRect(0, 0, W, GY);

    /* skyline: deterministic from x, so it never shimmers */
    c.fillStyle = '#0A1730';
    for (let i = 0; i < 14; i++) {
      const bw = 26 + (i * 37 % 19), bh = 40 + (i * 53 % 66);
      c.fillRect((i * 43 - (t * .22) % 602 + 602) % 602 - 141, GY - 68 - bh, bw, bh + 68);
    }
    c.fillStyle = 'rgba(255,201,28,.20)';
    for (let i = 0; i < 26; i++) {
      const bx = (i * 61 - (t * .22) % 602 + 602) % 602 - 141;
      c.fillRect(bx + 6, GY - 92 - (i * 29 % 50), 4, 5);
    }

    for (const p of pipes) {
      const x = Math.round(p.x), top = Math.round(p.top), gap = Math.round(p.gap);
      c.fillStyle = '#3FA34D'; c.fillRect(x, 0, PW, top);
      c.fillRect(x, top + gap, PW, GY - top - gap);
      c.fillStyle = '#5ED16C';
      c.fillRect(x + 4, 0, 7, top); c.fillRect(x + 4, top + gap, 7, GY - top - gap);
      c.fillStyle = '#2F7C3A';
      c.fillRect(x - 4, top - 16, PW + 8, 16);
      c.fillRect(x - 4, top + gap, PW + 8, 16);
      c.fillStyle = '#1E5527';
      c.fillRect(x - 4, top - 4, PW + 8, 4); c.fillRect(x - 4, top + gap + 12, PW + 8, 4);
    }

    c.fillStyle = '#2D6B3C'; c.fillRect(0, GY, W, H - GY);
    c.fillStyle = '#245A31';
    for (let i = 0; i < 12; i++) c.fillRect(((i * 34 - t * 2.2) % 374 + 374) % 374 - 27, GY + 10, 18, 6);
    c.fillStyle = '#1B4526'; c.fillRect(0, GY, W, 4);

    const tilt = clamp(vy / 13, -.45, 1.0);
    c.save(); c.translate(BX, Math.round(y)); c.rotate(tilt);
    c.fillStyle = '#FFC91C'; c.fillRect(-11, -9, 20, 17);
    c.fillStyle = '#FFE07A'; c.fillRect(-11, -9, 20, 5);
    c.fillStyle = '#E88F14';
    c.fillRect(-9, started && Math.floor(t / 6) % 2 ? -1 : 2, 10, 6);   // wing
    c.fillStyle = '#FF8A1C'; c.fillRect(9, -2, 7, 5);                    // beak
    c.fillStyle = '#FFF'; c.fillRect(2, -6, 6, 6);
    c.fillStyle = '#000'; c.fillRect(5, -4, 3, 3);
    c.restore();

    if (!started) {
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, H / 2 - 26, W, 40);
      c.fillStyle = '#FFC91C'; c.font = '11px "Press Start 2P", monospace'; c.textAlign = 'center';
      c.fillText('TAP TO HOP', W / 2, H / 2);
      c.textAlign = 'left';
    }
  };
  return g;
}
