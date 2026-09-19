/* ============================================================================
   99WORLDCUP — GAME REGISTRY
   ----------------------------------------------------------------------------
   The single source of truth for what a game is called, how it is played and
   what a plausible score looks like. Screens read from here; none of them
   hardcode a game name. Adding a season means adding entries here and listing
   their keys in config/season.js — no view needs to change.

   `limits` is the plausibility envelope, expressed in ACTIVE play time (the
   fixed 60 Hz step count), not wall-clock time. Pausing, backgrounding the
   tab or staring at the start screen therefore cannot affect it.
   ========================================================================== */

export const GAMES = {
  skyhop: {
    key:'skyhop', name:'SKY HOP', sub:'one button',
    v:'skyhop-v1', cfgV:'cfg-1',
    tag:'One button. One bird. No second chances.',
    hint:'TAP / SPACE',
    controls:[['␣','Space Bar'],['🖱','Left Click'],['✋','Tap anywhere on screen']],
    how:[
      'Tap, click or press space to rise. Let go and you fall.',
      'Every gap you clear is one point.',
      'Touch a pipe or the ground and the run is over.'
    ],
    limits:{ maxRate:2.2, grace:4, minMs:1200 }
  },
  walldrift: {
    key:'walldrift', name:'WALL DRIFT', sub:'one paddle',
    v:'walldrift-v1', cfgV:'cfg-1',
    tag:'Hold the wall. The ball always wins.',
    hint:'DRAG / MOUSE',
    controls:[['🖱','Move the mouse'],['✋','Drag on the screen'],['↑↓','Arrow Keys']],
    how:[
      'Move your paddle to keep the ball out of your wall.',
      'Every return is a point. Getting one past the opponent is worth twenty-five.',
      'The ball speeds up and your paddle shrinks. Nobody survives forever.'
    ],
    limits:{ maxRate:30, grace:50, minMs:1200 }
  },
  mazesnap: {
    key:'mazesnap', name:'MAZE SNAP', sub:'maze chase',
    v:'mazesnap-v1', cfgV:'cfg-1',
    tag:'Clear the maze. Do not get cornered.',
    hint:'SWIPE / ARROWS',
    controls:[['↑↓←→','Arrow Keys'],['WASD','WASD'],['✋','Swipe or use the pad']],
    how:[
      'Eat every dot in the maze. Each one is ten points.',
      'A big dot turns the ghosts blue for a few seconds — eat them for 200 and up.',
      'One life. One touch from a ghost ends the run.'
    ],
    limits:{ maxRate:300, grace:400, minMs:1200 }
  }
};
