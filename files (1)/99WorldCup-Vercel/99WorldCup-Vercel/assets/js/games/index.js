/* ============================================================================
   99WORLDCUP — GAME MODULES
   The key here must match the key in config/games.js and the key listed in a
   season's `games` array. Nothing else in the project maps names to code.
   ========================================================================== */
import { skyhop }    from './skyhop.js';
import { walldrift } from './walldrift.js';
import { mazesnap }  from './mazesnap.js';

export const GAME_IMPL = { skyhop, walldrift, mazesnap };
