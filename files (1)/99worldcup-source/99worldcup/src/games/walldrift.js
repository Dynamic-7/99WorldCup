/* ============================================================================
   99WORLDCUP — WALL DRIFT  (one paddle)
   The ball outgrows the paddle on purpose: past roughly seventy rallies its
   vertical speed exceeds what a paddle can travel, so no amount of tracking
   keeps a player alive forever. Every run has to end, which is what makes the
   score mean something.
   ========================================================================== */
import { clamp } from '../core/dom.js';

export function walldrift(rand){
  const W = 440, H = 300, PW = 8, PX = 18, AX = W - 18 - PW, R = 5;
  const PMAX = 10.5;                       // how fast a paddle can physically travel
  let py = H / 2, ay = H / 2, hits = 0, aiErr = 0, flash = 0, pts = 0;
  let b = { x: W / 2, y: H / 2, vx: -3.2, vy: (rand() * 2 - 1) * 1.8 };
  let trail = [];
  const g = { w: W, h: H, score: 0, dead: false };

  /* The ramp: the ball outgrows the paddle. Past roughly 70 rallies the ball's
     vertical speed exceeds PMAX, so no amount of tracking keeps you alive
     forever — the run has to end, which is what makes the score mean something. */
  const speed = () => Math.min(15.5, 3.2 + hits * 0.145);
  const ph    = () => Math.max(30, 56 - hits * 0.22);

  function serve(toPlayer) {
    b = { x: W / 2, y: H / 2, vx: (toPlayer ? -1 : 1) * speed() * .75,
          vy: (rand() * 2 - 1) * 2.4 };
    trail = [];
  }

  g.update = function (input) {
    if (flash > 0) flash--;
    const H2 = ph() / 2;
    if (input.py !== null && input.py !== undefined) py += clamp(input.py - py, -PMAX, PMAX);
    if (input.held.u) py -= PMAX * .7;
    if (input.held.d) py += PMAX * .7;
    py = clamp(py, H2, H - H2);

    const aiSp = Math.min(9.6, 2.7 + hits * 0.078);
    const want = b.vx > 0 ? b.y + aiErr : H / 2;
    if (ay < want - 2) ay = Math.min(ay + aiSp, want);
    else if (ay > want + 2) ay = Math.max(ay - aiSp, want);
    ay = clamp(ay, H2, H - H2);

    trail.push({ x: b.x, y: b.y }); if (trail.length > 8) trail.shift();
    b.x += b.vx; b.y += b.vy;
    if (b.y - R < 0) { b.y = R; b.vy = -b.vy; }
    if (b.y + R > H) { b.y = H - R; b.vy = -b.vy; }

    if (b.vx < 0 && b.x - R <= PX + PW && b.x - R > PX - 14 && Math.abs(b.y - py) < H2 + R) {
      hits++; g.score++; flash = 6;
      const rel = clamp((b.y - py) / H2, -1, 1), ang = rel * 0.95, s = speed();
      b.vx = Math.cos(ang) * s; b.vy = Math.sin(ang) * s; b.x = PX + PW + R;
      /* one fresh aim error per leg; the opponent sharpens as the rally grows */
      aiErr = (rand() * 2 - 1) * Math.max(2, 44 - hits * 1.4);
    }
    if (b.vx > 0 && b.x + R >= AX && b.x + R < AX + PW + 14 && Math.abs(b.y - ay) < H2 + R) {
      const rel = clamp((b.y - ay) / H2, -1, 1), ang = Math.PI - rel * 0.95, s = speed();
      b.vx = Math.cos(ang) * s; b.vy = Math.sin(ang) * s; b.x = AX - R;
    }
    if (b.x - R > W) { g.score += 25; pts++; flash = 16; serve(true); }
    if (b.x + R < 0) { g.dead = true; }
  };


  /* Re-simulation hook. A compact numeric fingerprint of the current state.
     A server replaying (seed, input log) can compare traces frame by frame and
     find the exact step where a submitted run stops being real. Nothing in the
     interface reads this; it exists for the checker and for the tests. */
  g.trace = () => [Math.round(b.x), Math.round(b.y), Math.round(b.vx * 10),
                   Math.round(b.vy * 10), Math.round(py), Math.round(ay), hits, g.score];

  g.render = function (c) {
    const H2 = ph() / 2;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#242D4E'; c.lineWidth = 3; c.setLineDash([9, 11]);
    c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); c.setLineDash([]);

    c.fillStyle = '#131B3B'; c.textAlign = 'center';
    c.font = '30px "Press Start 2P", monospace';
    c.fillText(String(g.score), W / 2, 52);
    if (pts) {
      c.font = '9px "Press Start 2P", monospace'; c.fillStyle = '#1E2A55';
      c.fillText(pts + (pts === 1 ? ' POINT PAST' : ' POINTS PAST'), W / 2, 72);
    }

    trail.forEach((t, i) => {
      c.fillStyle = 'rgba(232,240,255,' + (i / trail.length * .20) + ')';
      c.fillRect(Math.round(t.x) - R, Math.round(t.y) - R, R * 2, R * 2);
    });

    c.fillStyle = flash > 0 ? '#FFC91C' : '#E8F0FF';
    c.fillRect(PX, Math.round(py - H2), PW, Math.round(H2 * 2));
    c.fillStyle = '#7F93BC';
    c.fillRect(AX, Math.round(ay - H2), PW, Math.round(H2 * 2));
    c.fillStyle = '#FFF';
    c.fillRect(Math.round(b.x) - R, Math.round(b.y) - R, R * 2, R * 2);
    c.textAlign = 'left';
  };
  return g;
};
