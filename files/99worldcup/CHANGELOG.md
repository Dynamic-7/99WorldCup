# CHANGELOG

## 1.1.0 — the revision pass

The approved design was kept. Nothing was redesigned: same palette, same pixel
type, same CRT/cabinet language, same spacing philosophy, same voice. The work
below refines it, pushes the arcade identity further, and fixes real bugs.

### Fixed — scores were going to review every single time

A genuine bug, not conservative anti-cheat. `SessionSvc.submit()` marked the
session as used **before** running validation, and validation's first check is
"has this session already been submitted?" Every legitimate run therefore failed
its own reuse check.

- Validation now runs first; the session is spent afterwards
  (`src/core/backend.js`, with a comment saying why the order matters).
- Checks moved from wall-clock time to **active play time**, counted in fixed
  60 Hz steps. Pausing, backgrounding the tab or sitting on the start screen no
  longer affects a verdict.
- No threshold was loosened to make the interface say "accepted". Verified
  end to end in a headless browser: a real run now returns SCORE ACCEPTED.

### Score status — four honest states

`accepted` · `review` · `rejected` · `expired`, defined once in
`src/core/scoring.js` and rendered identically everywhere.

- Player-facing copy is plain language and never names which rule fired —
  publishing the envelope would hand it to the one person it exists to stop.
- `review` holds a run back for a human; it is not an accusation and not a ban.
- The profile lists runs that did not count, in the same plain language.
- Nothing anywhere says "verified".

### Added — the prototype / production line, in code

New `src/core/backend.js` is the single adapter between the app and score
verification. Prototype mode (today) validates in the browser and says so on the
gameplay screen and in Rules §9. Server mode is real code — `POST /session/start`,
`POST /run/submit` — inert until `configureBackend({ baseUrl })` is called.
Each game also gained `g.trace()`, a per-frame state fingerprint so a server can
re-simulate a run and find the exact frame where it stops being real.

### Fixed — the retro font on mobile

The three faces were coming from the Google Fonts CDN, which is why the pixel
type appeared on a laptop and not on a phone. They are now bundled: latin-subset
`.woff2` files in `public/fonts`, declared with `@font-face` and `font-display:swap`,
with intentional monospace fallbacks and their licences alongside. No third-party
font request remains. Confirmed loading in a headless browser at every width.

### Mobile first

The stylesheets were rewritten so the **phone** rule is the base rule and media
queries only add width. Checked with no horizontal overflow at 320, 360, 375,
390, 414, 768, 1366, 1440 and 1920 across all eleven routes.

- Body, headings, `.tiny`, nav, buttons, tabs, board rows, form fields and
  notices all sized up on phones, then tightened on large screens — hierarchy
  kept, nothing scaled globally.
- Nav drawer: 48px rows, 12px labels.
- Scoreboard: fixed table layout, name truncation, country name hidden under
  600px so rank/name/flag/score still fit a 320px screen.

### Game select fits one phone viewport

All three cabinets are visible without scrolling at 320×568, 360×640, 375×667,
390×844 and 414×896 — measured, not estimated. Each cabinet collapses to one
row: art, name, one clamped line of description, control hint, and a 56px PLAY
button. The desktop composition (name, screen, description, controls, play) is
unchanged.

### Gameplay is a machine now

Lit marquee with the game name and season, a mechanical score plate with per-digit
counters, a status lamp (READY / LIVE / PAUSED / GAME OVER), curved CRT glass with
a static scanline layer, a moulded bezel, a control deck, and a coin door reading
INSERT COIN TO BELONG. Maze Snap gets a 52px d-pad; Sky Hop gets a large red
action button; Wall Drift drags on the glass. The screen is sized to the viewport
so a tall game never pushes its own controls off the bottom of a phone.

All of it is static CSS — gradients and one inset shadow. Nothing animates behind
the canvas. The scanline layer is dropped below 600px where a 1px pitch moirés on
a 3× panel, and the home corridor renders a single static frame on phones and
under `prefers-reduced-motion` instead of looping.

### Touch and gestures

Rewritten. `touch-action:none` now sits on the **canvas alone**, and there is no
`preventDefault()` on any pointer event anywhere. Nothing is bound to
window/document for touch. Page scrolling, back-swipe and pull-to-refresh all
keep working during a run. Keys are swallowed only while a run is live and only
the ones the game uses.

### Copy

- `99 days. 3 games. 100 places.` → **`99 days with 3 games`**
- "good people" removed everywhere — footer and corridor poster — with nothing
  put in its place (verified: zero occurrences in the project).
- "a small bird a bigger world" → **"a small bird in a bigger world"**
- The tagline is the centre of the home hero and is not repeated elsewhere.

### Game names

`Sky Hop`, `Wall Drift`, `Maze Snap` — in the registry, the season config, the
leaderboards, the profile, badges, season pages, loading screens, canvas prompts,
page metadata and the internal module keys, which were renamed to match.

### Removed — the UI States demo

Gone from the footer, the router and the codebase. The real application states it
was demonstrating are all still present and still used: loading, game loading,
network error, leaderboard unavailable, offline/solo, empty board, session
expired, score under review, score rejected, season closed, unknown route.

### Delivered as source

The single artifact file became a project: 28 ES modules, six stylesheets, the
font files, a dependency-free `build.mjs` that produces the single file again,
and a 52-check test suite. `npm run dev` to work on it, `npm run build` to ship it.

### Code quality

Dead code removed (the `Empty` widget and `gameList` helper had no callers after
the demo page went). Per-game best scores are derived from the season config
instead of three hardcoded keys. The runner's unused import dropped. Game
registry data — names, hints, instructions, score envelopes — moved out of views
and into `config/games.js`. `build.mjs` fails the build on a duplicate top-level
name rather than shipping a broken file.

### Also fixed along the way

- Maze Snap's ghost release times and scatter phase are now drawn from the
  session seed. The maze is fixed, so before this the seed had no effect on play
  until the very end of a board — two sessions were the same run.
- `.burger` stayed visible on desktop because `.btn { display:inline-flex }`
  loads later and won on source order. Fixed with specificity, not `!important`.
- `.legend` stretched full width inside flex columns.
- `build.mjs` was silently eating `$$` in the bundle: `String.replace` treats
  `$$` in a *replacement string* as an escape. Replacer functions now.

### Unchanged on purpose

Palette, type, textures, spacing, panel bolts, the corridor hero, the season
meter, the badge slots, the ranking rule and its tie-break, UTC day boundaries,
the legal placeholders, and every honest empty state.
