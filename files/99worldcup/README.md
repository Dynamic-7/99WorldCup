# 99WORLDCUP

A seasonal arcade competition. Ninety-nine days, three games, one hundred places.
When the season ends the leaderboards freeze and stay frozen.

**The game ends. The score stays forever.**

---

## Run it

No build step is needed to develop. The project is plain ES modules, plain CSS
and three canvas games — no framework, no bundler, no dependencies.

```bash
# 1. serve the folder (any static server works)
npm run dev            # → http://localhost:5173
# or:  python3 -m http.server 5173
# or:  npx serve .
```

Then open `http://localhost:5173`. Edit anything under `src/` and reload.

> Open `index.html` directly from the filesystem and the browser will refuse to
> load the ES modules (CORS). Use a server — any server.

```bash
npm run build          # → dist/99worldcup.html  (one self-contained file)
npm test               # → 52 checks, no framework
```

`build.mjs` walks the import graph from `src/main.js`, inlines the CSS, embeds
the three fonts as base64 and concatenates the modules into one file. That file
is what gets deployed or published as an artifact. It has no external requests
at all, so it runs from a CDN, an S3 bucket, a USB stick or a file:// path.

---

## Project structure

```
index.html              dev entry; the static chrome (header, footer, toast)
build.mjs               single-file bundler (no dependencies)
public/fonts/           the three bundled faces + their licences
src/
  main.js               route table and boot
  config/
    season.js           SEASONS, the 99-day engine, UTC day helpers
    games.js            game names, control hints, instructions, score limits
    countries.js        country list + time-zone → country hints
  core/
    dom.js              el(), $, escaping, toast
    rng.js              seeded mulberry32 + run digest
    storage.js          localStorage wrapper
    app.js              player identity and the shared store connection
    scoring.js          run validation and the four verdicts
    backend.js          prototype vs production adapter  ← read this one
    board.js            leaderboard queries and ranking
    router.js           hash router with per-view teardown
  ui/
    widgets.js          loading / error / legend / counters / season meter
    art.js              the corridor hero and the pixel cabinet previews
  games/
    index.js            key → module map
    skyhop.js           SKY HOP     (one button)
    walldrift.js        WALL DRIFT  (one paddle)
    mazesnap.js         MAZE SNAP   (maze chase)
    runner.js           fixed 60 Hz loop, input model, submission
  pages/                one file per screen
  styles/               six files, loaded in order, mobile first
tests/run.mjs           the test suite
```

### Changing a season

Everything a season is lives in `src/config/season.js` and `src/config/games.js`.
Add a game module to `src/games/`, register its key in `games/index.js`, describe
it in `config/games.js`, then list the three keys in the season's `games` array.
No screen needs to change — every view reads the registry.

### Styling

`src/styles/01-tokens.css` holds the palette and the font declarations. A future
season overrides the same custom-property names under its own `[data-season]`
block; nothing else in the CSS hardcodes a Season 01 colour.

The stylesheets are **mobile first**. Every base rule is the phone rule; media
queries only ever add width (`min-width`), with a small number of `max-width`
blocks where a phone genuinely needs a different layout rather than a smaller one.

---

## Fonts

Bundled, not fetched. `public/fonts` holds latin-subset `.woff2` files declared
with `@font-face` in `01-tokens.css`, so the pixel type renders on phones,
offline, and behind a firewall that blocks font CDNs.

| Face | Used for | Licence |
|---|---|---|
| Press Start 2P | display, labels, scoreboards | SIL Open Font License 1.1 |
| VT323 | body copy | SIL Open Font License 1.1 |
| Permanent Marker | one graffiti line | Apache License 2.0 |

Full licence texts are in `public/fonts/`. All three permit bundling and
redistribution; keep those files with the project.

---

## Known limitations

Read this before describing 99WorldCup to anybody.

### Score verification — **prototype**

`src/core/backend.js` is the line between what exists and what does not.

Today the browser issues its own session seed, plays the run, validates it and
writes the result. The client is both the player and the referee. The checks in
`src/core/scoring.js` are real and they catch impossible and accidental scores —
they are not decoration — but a determined person with developer tools can still
forge one. **A browser game cannot be made cheat-proof.**

Nothing in the interface ever says "verified". The gameplay screen and Rules §9
both say, in plain language, that only your own browser checked the run.

What production needs, and what the code is already shaped for:

```
POST /session/start → { sid, seed, game, gameVersion, configVersion, startedAt }
POST /run/submit    → { verdict, note, rank, digest }
```

The seed must be unguessable and the session id single-use. The server re-runs
the submitted input log through the same pure module in `src/games/` and compares
the score it reaches with the score it was given. Each game exposes `g.trace()`
for exactly this: a compact per-frame fingerprint, so a checker can find the step
where a run stops being real. `configureBackend({ baseUrl })` switches every call
over; no view changes.

### Leaderboard persistence — **host-dependent**

The shared board is the artifact host's document store, reached in `core/app.js`
through `claude.use('db')`. Outside that host `App.online` is false, the app
degrades to a single-player cabinet, and it says so on screen instead of showing
an empty table. Swap `boot()` and `savePlayer()` for your own API client to move it.

### Authentication — **none of our own**

Identity is whatever the host hands us via `claude.use('user')`. There is no
password, no session token and no account recovery in this project. A production
deployment needs real accounts before a leaderboard means anything, because
without them one person is many players.

### Anti-cheat — **plausibility only**

Rate ceilings, run length, score monotonicity, seed and version matching, and
single-use sessions. No re-simulation, no behavioural analysis, no rate limiting
across accounts, no IP reputation. Runs that fail are held or rejected, never
auto-banned: `verdict: 'review'` means a human should look, not that somebody
cheated.

### Legal pages — **unfinished on purpose**

Terms, Privacy and Cookies contain `[OPERATING ENTITY — TO BE COMPLETED]`,
`[CONTACT ADDRESS — TO BE COMPLETED]` and `[JURISDICTION — TO BE COMPLETED]`,
each with a red note. No company, address, jurisdiction or compliance claim has
been invented. A lawyer fills those in before launch.

### Content

There is no fabricated data anywhere: no invented champions, player counts,
testimonials, partnerships or statistics. Empty boards say they are empty.

---

## Games

Original implementations and original artwork. The genres are classics; nothing
here is copied from, affiliated with or licensed from any classic arcade title,
and the commercial names of those titles do not appear in the product.

Each game module is pure: given a seeded RNG it produces an identical run for
identical input. No DOM, no `Date.now()`, no `Math.random()`, no network. That
purity is what makes server-side re-simulation a small job later.
