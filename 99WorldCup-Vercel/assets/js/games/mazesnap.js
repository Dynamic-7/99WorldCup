/* ============================================================================
   99WORLDCUP — MAZE SNAP  (maze chase)
   Original 19x21 maze: two tunnels, four power pellets, a central pen with a
   ghost-only door. Entities live on (tile, progress-to-next-tile) rather than
   raw pixels, so there is no float drift and "may I turn here" is answered
   exactly once per tile.
   ========================================================================== */
const MAZE = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '   #.#.......#.#   ',
  '####.#.##-##.#.####',
  'T......#GGG#......T',
  '####.#.#####.#.####',
  '   #.#.......#.#   ',
  '####.#.#####.#.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#.......P...#.o#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################'
];

export function mazesnap(rand){
  const T = 16, COLS = 19, ROWS = 21, W = COLS * T, H = ROWS * T;
  const DV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  const OPP = { u: 'd', d: 'u', l: 'r', r: 'l' };

  const wall = [], pellet = [], power = [];
  let start = { c: 11, r: 15 }, pen = [];
  for (let r = 0; r < ROWS; r++) {
    wall[r] = []; pellet[r] = []; power[r] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = MAZE[r][c];
      wall[r][c] = (ch === '#' || ch === ' ');
      pellet[r][c] = (ch === '.');
      power[r][c] = (ch === 'o');
      if (ch === 'P') start = { c, r };
      if (ch === 'G') pen.push({ c, r });
    }
  }
  const DOOR = { c: 9, r: 8 }, PEN = { c: 9, r: 9 }, EXIT = { c: 9, r: 7 };
  const total = pellet.flat().filter(Boolean).length + power.flat().filter(Boolean).length;
  let left = total;

  const wrapC = c => (c + COLS) % COLS;
  /* Can an entity standing on (c,r) move one tile in `dir`?
     The pen door is passable by ghosts only, which is what keeps the player out. */
  function open(c, r, dir, ghost) {
    const d = DV[dir], nr = r + d[1];
    if (nr < 0 || nr >= ROWS) return false;
    const nc = wrapC(c + d[0]);
    if (nc === DOOR.c && nr === DOOR.r) return !!ghost;
    return !wall[nr][nc];
  }

  /* Entities live on (tile, progress-to-next-tile). No float drift, no
     snap-back, and "am I allowed to turn" is answered exactly once per tile. */
  const ent = (c, r, dir) => ({ c, r, prog: 0, dir });
  const px = e => (e.c * T + T / 2) + DV[e.dir][0] * e.prog * T;
  const py = e => (e.r * T + T / 2) + DV[e.dir][1] * e.prog * T;

  function advance(e, tilesPerFrame, pick, ghost, onEnter) {
    let remain = tilesPerFrame, guard = 0;
    while (remain > 1e-6 && guard++ < 6) {
      if (e.prog === 0) {
        const d = pick(e);
        if (d && open(e.c, e.r, d, ghost)) e.dir = d;
        if (!open(e.c, e.r, e.dir, ghost)) return false;      // nose against a wall
      }
      const adv = Math.min(remain, 1 - e.prog);
      e.prog += adv; remain -= adv;
      if (e.prog >= 1 - 1e-9) {
        const v = DV[e.dir];
        e.c = wrapC(e.c + v[0]); e.r += v[1]; e.prog = 0;
        if (onEnter) onEnter(e);
      }
    }
    return true;
  }
  /* A reversal is legal anywhere, including mid-tile: flip into the tile ahead
     and invert the progress so the position on screen does not jump. */
  function reverse(e) {
    if (e.prog > 0) {
      const v = DV[e.dir];
      e.c = wrapC(e.c + v[0]); e.r += v[1]; e.prog = 1 - e.prog;
    }
    e.dir = OPP[e.dir];
  }

  const p = ent(start.c, start.r, 'l');
  let want = null;
  const GC = ['#FF2E3F', '#FF8AD0', '#3BD7FF', '#FF9E3D'];
  const CORNER = [{ c: 17, r: 1 }, { c: 1, r: 1 }, { c: 17, r: 19 }, { c: 1, r: 19 }];
  const ghosts = [0, 1, 2, 3].map(i => {
    const home = pen[Math.min(i, pen.length - 1)];
    const e = i === 0 ? ent(EXIT.c, EXIT.r, 'l') : ent(home.c, home.r, 'u');
    /* Release times and the scatter phase are drawn from the session seed, so
       two sessions of the same fixed maze are still different runs — and both
       are reproducible from their seed. */
    return Object.assign(e, { i, out: i === 0, wait: i * 160 + Math.floor(rand() * 90),
                              eaten: false, bob: 0 });
  });

  const phase = Math.floor(rand() * 900);      // where in the chase/scatter cycle we start
  let frames = 0, mouth = 0, fright = 0, combo = 0, regen = 0, grace = 90;
  const g = { w: W, h: H, score: 0, dead: false };

  function eatAt(c, r) {
    if (pellet[r][c]) { pellet[r][c] = false; left--; g.score += 10; }
    else if (power[r][c]) {
      power[r][c] = false; left--; g.score += 50; fright = 420; combo = 0;
      for (const gh of ghosts) if (gh.out && !gh.eaten) reverse(gh);
    }
  }

  function respawnPellet() {
    for (let t = 0; t < 60; t++) {
      const c = Math.floor(rand() * COLS), r = Math.floor(rand() * ROWS);
      if (wall[r][c] || pellet[r][c] || power[r][c]) continue;
      if (r >= 8 && r <= 10 && c >= 7 && c <= 11) continue;      // never inside the pen
      if (c === p.c && r === p.r) continue;
      pellet[r][c] = true; left++; return;
    }
  }

  function target(gh) {
    if (gh.eaten) return PEN;
    if (fright > 0) return CORNER[gh.i];
    if (((frames + phase) % 900) > 660) return CORNER[gh.i];    // periodic scatter
    const d = DV[p.dir];
    if (gh.i === 0) return { c: p.c, r: p.r };
    if (gh.i === 1) return { c: p.c + d[0] * 4, r: p.r + d[1] * 4 };
    if (gh.i === 2) return { c: p.c + d[0] * 2 + (p.c - ghosts[0].c),
                             r: p.r + d[1] * 2 + (p.r - ghosts[0].r) };
    return Math.hypot(gh.c - p.c, gh.r - p.r) > 8 ? { c: p.c, r: p.r } : CORNER[3];
  }

  const ghostPick = gh => e => {
    const tgt = target(gh);
    let best = null, bd = Infinity;
    for (const d of ['u', 'l', 'd', 'r']) {
      if (d === OPP[e.dir]) continue;
      if (!open(e.c, e.r, d, true)) continue;
      const v = DV[d], dist = Math.hypot(wrapC(e.c + v[0]) - tgt.c, e.r + v[1] - tgt.r);
      if (dist < bd) { bd = dist; best = d; }
    }
    return best || OPP[e.dir];
  };

  g.update = function (input) {
    frames++; mouth++;
    if (grace > 0) grace--;
    if (fright > 0 && --fright === 0) combo = 0;
    if (input.dir) { want = input.dir; input.dir = null; }

    if (want && want === OPP[p.dir] && p.prog > 0) { reverse(p); want = null; }
    advance(p, 1.55 / T, () => { const w = want; if (w && open(p.c, p.r, w, false)) want = null; return w; },
            false, e => eatAt(e.c, e.r));
    if (p.prog === 0) eatAt(p.c, p.r);

    /* Once the maze is nearly cleared a pellet returns about every 2.5s in a
       seeded position, so a strong run is ended by the ghosts, not by hunger. */
    if (left < total * 0.2 && ++regen >= 150) { regen = 0; respawnPellet(); }

    for (const gh of ghosts) {
      if (!gh.out) {
        gh.bob++;
        if (gh.wait > 0) { gh.wait--; continue; }
        gh.c = EXIT.c; gh.r = EXIT.r; gh.prog = 0; gh.dir = 'l'; gh.out = true;
        continue;
      }
      const sp = gh.eaten ? 2.7 : (fright > 0 ? 0.95 : 1.33);
      advance(gh, sp / T, ghostPick(gh), true, e => {
        if (e.eaten && e.c === PEN.c && e.r === PEN.r) {
          e.eaten = false; e.c = EXIT.c; e.r = EXIT.r; e.prog = 0; e.dir = 'l';
        }
      });
      if (grace > 0 || gh.eaten) continue;
      if (Math.hypot(px(gh) - px(p), py(gh) - py(p)) < 11) {
        if (fright > 0) { combo = Math.min(combo + 1, 4); g.score += 200 * Math.pow(2, combo - 1); gh.eaten = true; }
        else { g.dead = true; return; }
      }
    }
  };


  /* Re-simulation hook. A compact numeric fingerprint of the current state.
     A server replaying (seed, input log) can compare traces frame by frame and
     find the exact step where a submitted run stops being real. Nothing in the
     interface reads this; it exists for the checker and for the tests. */
  g.trace = () => [p.c, p.r, Math.round(p.prog * 100), p.dir.charCodeAt(0), left,
                   fright, g.score].concat(ghosts.map(gh => gh.c * 32 + gh.r));

  g.render = function (c) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#2B4DFF'; c.lineWidth = 2; c.lineCap = 'square';
    c.beginPath();
    const solid = (r, cc) => (r < 0 || r >= ROWS || cc < 0 || cc >= COLS) ? true : wall[r][cc];
    for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
      if (!wall[r][cc]) continue;
      const x = cc * T, y = r * T;
      if (!solid(r - 1, cc)) { c.moveTo(x, y + 1); c.lineTo(x + T, y + 1); }
      if (!solid(r + 1, cc)) { c.moveTo(x, y + T - 1); c.lineTo(x + T, y + T - 1); }
      if (!solid(r, cc - 1)) { c.moveTo(x + 1, y); c.lineTo(x + 1, y + T); }
      if (!solid(r, cc + 1)) { c.moveTo(x + T - 1, y); c.lineTo(x + T - 1, y + T); }
    }
    c.stroke();
    c.strokeStyle = '#FF8AD0'; c.beginPath();
    c.moveTo(DOOR.c * T + 3, DOOR.r * T + T / 2); c.lineTo(DOOR.c * T + T - 3, DOOR.r * T + T / 2);
    c.stroke();

    c.fillStyle = '#FFE9A8';
    for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++)
      if (pellet[r][cc]) c.fillRect(cc * T + 7, r * T + 7, 3, 3);
    const pulse = 4 + Math.sin(frames / 7) * 1.5;
    c.fillStyle = '#FFC91C';
    for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++)
      if (power[r][cc]) { c.beginPath(); c.arc(cc * T + 8, r * T + 8, pulse, 0, 7); c.fill(); }

    for (const gh of ghosts) {
      const x = Math.round(px(gh)), y = Math.round(py(gh)) + (gh.out ? 0 : Math.round(Math.sin(gh.bob / 10) * 2));
      const blue = fright > 0 && !gh.eaten;
      const flash = blue && fright < 120 && Math.floor(fright / 12) % 2 === 0;
      if (!gh.eaten) {
        c.fillStyle = flash ? '#FFF' : blue ? '#2B4DFF' : GC[gh.i];
        c.beginPath();
        c.arc(x, y - 1, 7, Math.PI, 0); c.lineTo(x + 7, y + 6);
        c.lineTo(x + 4.6, y + 2); c.lineTo(x + 2.3, y + 6); c.lineTo(x, y + 2);
        c.lineTo(x - 2.3, y + 6); c.lineTo(x - 4.6, y + 2); c.lineTo(x - 7, y + 6);
        c.closePath(); c.fill();
      }
      const d = DV[gh.dir];
      c.fillStyle = gh.eaten ? '#A8BBEE' : (flash ? '#FF2E3F' : '#FFF');
      c.fillRect(x - 5, y - 4, 4, 5); c.fillRect(x + 1, y - 4, 4, 5);
      if (!flash) {
        c.fillStyle = blue && !gh.eaten ? '#FF2E3F' : '#1B2550';
        c.fillRect(x - 4 + d[0] * 1.5, y - 3 + d[1] * 1.5, 2, 3);
        c.fillRect(x + 2 + d[0] * 1.5, y - 3 + d[1] * 1.5, 2, 3);
      }
    }

    const a = (Math.abs(Math.sin(mouth / 5)) * .30 + .02) * Math.PI;
    const rot = { r: 0, d: Math.PI / 2, l: Math.PI, u: -Math.PI / 2 }[p.dir];
    c.save(); c.translate(Math.round(px(p)), Math.round(py(p))); c.rotate(rot);
    c.fillStyle = (grace > 0 && Math.floor(frames / 8) % 2) ? '#FFE07A' : '#FFC91C';
    c.beginPath(); c.arc(0, 0, 7.5, a, Math.PI * 2 - a); c.lineTo(0, 0); c.fill();
    c.restore();

    if (grace > 0) {
      c.fillStyle = '#FFC91C'; c.font = '9px "Press Start 2P", monospace'; c.textAlign = 'center';
      c.fillText('READY', W / 2, H / 2 - 30);
      c.textAlign = 'left';
    }
  };
  return g;
};
