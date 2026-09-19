/* ============================================================================
   99WORLDCUP — GENERATED ART
   Drawn in code, not stock imagery: no image requests on the critical path and
   nothing to go missing. Both routines are cheap and neither runs during
   gameplay.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   The arcade corridor behind the home hero: a perspective floor and two rows
   of cabinets whose screens flicker on a fixed schedule.
   Renders ONE static frame when the viewer prefers reduced motion or is on a
   phone — a looping canvas is not worth a phone's battery for a backdrop.
   ------------------------------------------------------------------------- */
export function corridor(canvas){
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
             || window.innerWidth < 600;
  let raf = 0, W = 0, H = 0, t = 0;
  const hues = ['#FF2E3F','#3BD7FF','#C04BFF','#FFC91C','#4BFFB0','#2B4DFF'];

  function size(){
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(320, r.width); H = Math.max(200, r.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function cabinet(x, y, w, h, hue, lit){
    ctx.fillStyle = '#080B18'; ctx.fillRect(x, y, w, h);                 // body
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    ctx.fillStyle = hue; ctx.globalAlpha = lit ? .30 : .07;              // marquee
    ctx.fillRect(x + w * .1, y + h * .05, w * .8, h * .09);
    ctx.globalAlpha = lit ? .55 : .13;                                   // screen
    ctx.fillRect(x + w * .14, y + h * .2, w * .72, h * .3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,.55)';                                   // control deck
    ctx.fillRect(x, y + h * .56, w, h * .06);
    ctx.fillStyle = hue; ctx.globalAlpha = lit ? .16 : .05;              // floor glow
    ctx.fillRect(x - w * .2, y + h, w * 1.4, 10);
    ctx.globalAlpha = 1;
  }

  function frame(){
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04060E'); g.addColorStop(.58, '#0B1024'); g.addColorStop(1, '#05070F');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const vx = W / 2, vy = H * .48;                      // vanishing point
    ctx.strokeStyle = 'rgba(43,77,255,.18)'; ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++){                       // boards running to the eye
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + i * (W / 4.5), H + 40); ctx.stroke();
    }
    for (let i = 1; i <= 8; i++){                        // cross-bands, tighter with distance
      const y = vy + Math.pow(i / 8, 2.4) * (H - vy);
      ctx.globalAlpha = .09 + i * .014;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* Cabinets recede in true perspective: the inner edge rides the sight line
       from the vanishing point, so the centre stays dark and the wordmark
       always has something quiet to sit on. */
    const N = 7;
    for (let i = 1; i <= N; i++){
      const s = Math.pow(i / N, 2.4);
      const inner = vx * (.075 + s * .90);
      const w = 24 + s * (W * .21), h = w * 2.15;
      const floor = vy + s * (H - vy) + 6;
      const y = floor - h;
      const lit = still || ((Math.floor(t / 30) + i * 2) % 5 !== 0);
      cabinet(vx - inner - w, y, w, h, hues[i % hues.length], lit);
      cabinet(vx + inner,     y, w, h, hues[(i + 3) % hues.length], still || !lit);
    }
    ctx.fillStyle = 'rgba(4,6,14,.45)'; ctx.fillRect(0, 0, W, H * .22);
    if (!still){ t++; raf = requestAnimationFrame(frame); }
  }

  size(); frame();
  const onResize = () => { size(); if (still) frame(); };
  window.addEventListener('resize', onResize);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
}

/* ---------------------------------------------------------------------------
   Pixel previews for the select screen. Original art, 120×78, drawn once.
   ------------------------------------------------------------------------- */
export function preview(kind, canvas){
  const ctx = canvas.getContext('2d');
  canvas.width = 120; canvas.height = 78;
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(0, 0, 120, 78, '#000');

  if (kind === 'mazesnap'){
    ctx.strokeStyle = '#2B4DFF'; ctx.lineWidth = 2;
    [[8,8,44,22],[60,8,52,22],[8,38,30,32],[46,38,26,14],[80,38,32,32]]
      .forEach(r => ctx.strokeRect(r[0], r[1], r[2], r[3]));
    for (let x = 14; x < 112; x += 12) P(x, 34, 3, 3, '#FFE9A8');
    ctx.fillStyle = '#FFC91C'; ctx.beginPath();
    ctx.arc(36, 60, 9, .35 * Math.PI, 1.65 * Math.PI); ctx.lineTo(36, 60); ctx.fill();
    P(78, 52, 12, 14, '#FF2E3F'); P(80, 55, 3, 4, '#fff'); P(86, 55, 3, 4, '#fff');

  } else if (kind === 'skyhop'){
    P(0, 0, 120, 78, '#123A6B'); P(0, 66, 120, 12, '#2D6B3C');
    P(30, 0, 18, 26, '#3FA34D'); P(28, 24, 22, 6, '#2F7C3A');
    P(30, 50, 18, 16, '#3FA34D'); P(28, 46, 22, 6, '#2F7C3A');
    P(86, 0, 18, 38, '#3FA34D'); P(84, 36, 22, 6, '#2F7C3A');
    P(86, 58, 18, 8, '#3FA34D'); P(84, 54, 22, 6, '#2F7C3A');
    P(58, 32, 12, 10, '#FFC91C'); P(66, 34, 5, 4, '#FF8A1C'); P(60, 34, 3, 3, '#000');

  } else {
    P(6, 26, 5, 26, '#E8F0FF'); P(109, 18, 5, 26, '#E8F0FF');
    P(58, 36, 5, 5, '#fff');
    ctx.strokeStyle = '#3B4666'; ctx.setLineDash([4, 5]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(60, 4); ctx.lineTo(60, 74); ctx.stroke(); ctx.setLineDash([]);
  }
}
