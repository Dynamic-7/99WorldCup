/* ============================================================================
   99WORLDCUP — DETERMINISM
   mulberry32. A session seed produces the identical obstacle stream on every
   device, which is what makes a run reproducible — and therefore checkable by
   a server that knows the seed. Do not replace this with Math.random().
   ========================================================================== */

export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap run-log digest. Evidence, not security: it is printed on the
 *  game-over card so a player can quote a specific run in a dispute. */
export function fnv1a(str){
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
