/* ============================================================================
   99WORLDCUP — TESTS
   Run with:  npm test     (or: node tests/run.mjs)

   No framework. These cover the parts where a silent bug is expensive:
   the score pipeline, the username policy, and whether a seeded run is
   actually reproducible — which is the whole basis for checking a score on a
   server later.
   ========================================================================== */
import { strict as assert } from 'node:assert';

/* --- the smallest DOM the modules need in order to be imported ----------- */
globalThis.window = globalThis;
globalThis.document = {
  createElement: () => ({ setAttribute(){}, appendChild(){}, addEventListener(){},
                          style:{}, dataset:{}, classList:{ add(){}, remove(){} } }),
  querySelector: () => null,
  querySelectorAll: () => []
};
globalThis.localStorage = {
  _d:{}, getItem(k){ return this._d[k] || null; }, setItem(k, v){ this._d[k] = v; }
};
globalThis.addEventListener = () => {};
globalThis.dispatchEvent = () => {};

const { validateRun } = await import('../src/core/scoring.js');
const { submitRun, startSession } = await import('../src/core/backend.js');
const { validateName } = await import('../src/pages/profile.js');
const { GAMES } = await import('../src/config/games.js');
const { S, Season, SI } = await import('../src/config/season.js');
const { rng } = await import('../src/core/rng.js');
const { GAME_IMPL } = await import('../src/games/index.js');
const { App } = await import('../src/core/app.js');

let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); console.log('  ok   ' + name); pass++; }
  catch (e){ console.log('  FAIL ' + name + '\n       ' + e.message); fail++; }
};
const atest = async (name, fn) => {
  try { await fn(); console.log('  ok   ' + name); pass++; }
  catch (e){ console.log('  FAIL ' + name + '\n       ' + e.message); fail++; }
};

/* --------------------------------------------------------------- fixtures */
const GAME = 'skyhop';
const g = GAMES[GAME];

function session(over){
  return Object.assign({
    sid:'s_test', seed:12345, season:S.id, game:GAME,
    gameVersion:g.v, configVersion:g.cfgV,
    startedAt:Date.now() - 40000, spent:false
  }, over);
}
function run(over){
  return Object.assign({
    score:12, endedAt:Date.now(), seed:12345,
    gameVersion:g.v, configVersion:g.cfgV,
    playMs:30000, log:[1,3,5,8,12]
  }, over);
}
const verdict = (s, r) => validateRun(s, r).verdict;
const code    = (s, r) => validateRun(s, r).code;

/* ------------------------------------------------------------------ suite */
console.log('\nSEASON');
test('season 01 is live',              () => assert.equal(SI().live, true));
test('season is exactly 99 days',      () => assert.equal(S.days, 99));
test('day is within range',            () => assert.ok(SI().day >= 1 && SI().day <= 99));
test('three games are locked in',      () => assert.equal(S.games.length, 3));
test('every season game has a module', () => S.games.forEach(k => assert.ok(GAME_IMPL[k], k)));
test('every season game has config',   () => S.games.forEach(k => assert.ok(GAMES[k], k)));

console.log('\nSCORING — a normal run');
test('an ordinary run is accepted',    () => assert.equal(verdict(session(), run()), 'accepted'));
test('a zero score is accepted',       () => assert.equal(verdict(session(), run({ score:0, log:[0,0] })), 'accepted'));
test('an empty log is accepted',       () => assert.equal(verdict(session(), run({ log:[] })), 'accepted'));

console.log('\nSCORING — rejected (internally inconsistent)');
test('replayed session',   () => assert.equal(code(session({ spent:true }), run()), 'SESSION_REUSED'));
test('seed mismatch',      () => assert.equal(code(session(), run({ seed:999 })), 'SEED_MISMATCH'));
test('game version',       () => assert.equal(code(session(), run({ gameVersion:'x' })), 'GAME_VERSION'));
test('config version',     () => assert.equal(code(session(), run({ configVersion:'x' })), 'CONFIG_VERSION'));
test('non-integer score',  () => assert.equal(code(session(), run({ score:1.5, log:[1.5] })), 'SCORE_NOT_INTEGER'));
test('negative score',     () => assert.equal(code(session(), run({ score:-1, log:[-1] })), 'SCORE_OUT_OF_RANGE'));
test('absurd score',       () => assert.equal(code(session(), run({ score:1e8, log:[1e8] })), 'SCORE_OUT_OF_RANGE'));
test('score went backwards', () => assert.equal(code(session(), run({ log:[5,4,12] })), 'SCORE_DECREASED'));
test('log tail disagrees', () => assert.equal(code(session(), run({ log:[1,2,3] })), 'LOG_TAIL'));
test('more play than clock', () => assert.equal(code(session(), run({ playMs:9e6 })), 'PLAYTIME_EXCEEDS_CLOCK'));

console.log('\nSCORING — held for review (possible, but outside the envelope)');
test('rate beyond the game maximum',
  () => assert.equal(verdict(session(), run({ score:400, log:[400] })), 'review'));
test('scored in under the minimum run length',
  () => assert.equal(verdict(session(), run({ playMs:500, score:1, log:[1] })), 'review'));
test('review is not rejection',
  () => assert.equal(validateRun(session(), run({ score:400, log:[400] })).verdict, 'review'));

console.log('\nSCORING — expired');
test('run ended after the season closed', () => {
  const end = SI().end;
  assert.equal(code(session(), run({ endedAt:end + 1000 })), 'SEASON_CLOSED');
});
test('session left open for hours', () => {
  const s = session({ startedAt:Date.now() - 5 * 3600e3 });
  assert.equal(code(s, run()), 'SESSION_STALE');
});

console.log('\nSUBMISSION — the regression that sent every score to review');
await atest('submit() validates BEFORE burning the session', async () => {
  App.me = { games:0 }; App.flagged = [];
  const s = await startSession(GAME);
  s.startedAt -= 40000;                     // as if the player had been playing
  const res = await submitRun(s, run({ seed:s.seed, endedAt:Date.now() }));
  assert.equal(res.verdict, 'accepted', 'a legitimate run must not go to review');
  assert.equal(s.spent, true, 'the session must be spent afterwards');
});
await atest('the same session cannot be submitted twice', async () => {
  App.me = { games:0 }; App.flagged = [];
  const s = await startSession(GAME);
  s.startedAt -= 40000;
  await submitRun(s, run({ seed:s.seed }));
  const second = await submitRun(s, run({ seed:s.seed }));
  assert.equal(second.verdict, 'rejected');
});
await atest('two sessions never share an id', async () => {
  const a = await startSession(GAME), b = await startSession(GAME);
  assert.notEqual(a.sid, b.sid);
});
await atest('a flagged run is recorded, not silently dropped', async () => {
  App.me = { games:0 }; App.flagged = [];
  const s = await startSession(GAME);
  s.startedAt -= 40000;
  await submitRun(s, run({ seed:s.seed, score:5000, log:[5000] }));
  assert.equal(App.flagged.length, 1);
  assert.ok(App.flagged[0].note.length > 10, 'the player is told what happened');
});

console.log('\nNAMES');
test('too short',        () => assert.ok(validateName('ab')));
test('too long',         () => assert.ok(validateName('a'.repeat(17))));
test('spaces refused',   () => assert.ok(validateName('two words')));
test('markup refused',   () => assert.ok(validateName('<script>')));
test('staff impersonation refused', () => assert.ok(validateName('admin_dave')));
test('moderator refused',() => assert.ok(validateName('MODerator')));
test('repeat spam refused', () => assert.ok(validateName('aaaaaaaa')));
test('ordinary name allowed',  () => assert.equal(validateName('pixel_kid'), null));
test('hyphen allowed',         () => assert.equal(validateName('ms-pac-91'), null));

console.log('\nGAMES — determinism and playability');
function bot(key, seed, drive, maxFrames = 60 * 240){
  const game = GAME_IMPL[key](rng(seed), seed);
  const input = { dir:null, held:{}, tap:false, py:null,
                  takeTap(){ const t = this.tap; this.tap = false; return t; },
                  clear(){} };
  let f = 0;
  while (!game.dead && f < maxFrames){ drive(game, input, f); game.update(input); f++; }
  return { score:game.score, frames:f, dead:game.dead };
}
const drivers = {
  skyhop:(game, input) => { input.tap = Math.random() < 0.055; },
  walldrift:(game, input, f) => { input.py = 150 + Math.sin(f / 22) * 90; },
  mazesnap:(game, input, f) => { if (f % 14 === 0) input.dir = 'udlr'[Math.floor(Math.random() * 4)]; }
};

function trace(key, seed, drive, frames){
  const game = GAME_IMPL[key](rng(seed), seed);
  const input = { dir:null, held:{}, tap:false, py:null,
                  takeTap(){ const t = this.tap; this.tap = false; return t; },
                  clear(){} };
  const out = [];
  for (let f = 0; f < frames && !game.dead; f++){
    drive(game, input, f);
    game.update(input);
    out.push(game.trace().join(','));
  }
  return out;
}
const fixedDrive = (game, input, f) => {
  input.tap = (f % 27 === 0);
  input.py = 150 + ((f * 7) % 120);
  if (f % 14 === 0) input.dir = 'udlr'[(f / 14) % 4 | 0];   // cycle all four
};

for (const key of S.games){
  test(key + ' — identical seed replays frame for frame', () => {
    const a = trace(key, 4242, fixedDrive, 900);
    const b = trace(key, 4242, fixedDrive, 900);
    assert.ok(a.length > 60, 'trace too short to mean anything');
    assert.deepEqual(a, b);
  });
  test(key + ' — a different seed is a different run', () => {
    const a = trace(key, 1, fixedDrive, 900);
    const b = trace(key, 98765, fixedDrive, 900);
    assert.notDeepEqual(a, b, 'the session seed had no effect on play');
  });
  test(key + ' — different input gives a different trace', () => {
    const a = trace(key, 555, fixedDrive, 900);
    const b = trace(key, 555, (game, input, f) => {
      fixedDrive(game, input, f);
      if (f >= 40 && f < 90){ input.tap = true; input.dir = 'u'; input.py = 20; }
    }, 900);
    assert.notDeepEqual(a, b, 'a forged input log would be indistinguishable');
  });
  test(key + ' — a run ends by itself (no immortal player)', () => {
    const r = bot(key, 77, drivers[key]);
    assert.equal(r.dead, true, 'bot survived ' + r.frames + ' frames');
  });
  test(key + ' — a played run passes validation', () => {
    const r = bot(key, 31337, drivers[key]);
    const gg = GAMES[key];
    const s = session({ game:key, gameVersion:gg.v, configVersion:gg.cfgV,
                        startedAt:Date.now() - (r.frames * 1000 / 60) - 500 });
    const v = validateRun(s, { score:r.score, endedAt:Date.now(), seed:s.seed,
                               gameVersion:gg.v, configVersion:gg.cfgV,
                               playMs:Math.round(r.frames * 1000 / 60), log:[r.score] });
    assert.equal(v.verdict, 'accepted', key + ' scored ' + r.score + ' in ' +
                 Math.round(r.frames / 60) + 's → ' + v.code);
  });
}

console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
