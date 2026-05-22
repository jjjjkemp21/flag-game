# Flag Game — repo guide

A playful flag/geography quiz. **Create React App** frontend + **Node/Express + better-sqlite3** backend. In production a single Node process serves the built React app *and* the `/api`.

> The app is branded "Flag Game". Some internal identifiers still say `flagQuest`/`flagQuiz`/`flagquest.db` — leave those (renaming them logs users out / orphans the DB).

## Build & deploy pipeline — DO NOT CHANGE

Push to `main` → GitHub Action (`.github/workflows/deploy.yml`) SSHes into the Pi → runs `deploy.sh` → `git pull` → `docker build` (`Dockerfile`) → restart container on the `my_proxy_network` with a `/data` volume for SQLite. `deploy.sh` also auto-posts release notes (`server/announce.js`, deduped by commit sha).

- **`Dockerfile`** stage 1 builds the CRA app (`npm install && npm run build`); stage 2 installs `server/` deps (better-sqlite3 compiles natively) and runs `node server/index.js`, serving `build/` + `/api` on port 80.
- The CRA build runs inside Docker. **Broken imports / syntax / malformed CSS fail the build.** Treat ESLint problems (unused imports, `react-hooks/exhaustive-deps`) as build-breaking and avoid them — do not rely on warnings being non-fatal.
- This dev environment has **no Node/npm/Docker** — you cannot run the build, lint, or tests. Rely on careful static review.

## Layout

```
src/
  index.js            App entry. Wraps <App/> in Audio/Toast/Auth providers.
                      Imports the 4 global stylesheets IN ORDER (see Styling).
  App.js              Root. View navigation is a STRING `view` useState + a switch
                      in renderView() — there is NO react-router. Add a screen =
                      add a `case` here + a trigger (usually a MainMenu mode card).
                      Owns flagsData, drives account load/sync + pet feeding + XP.
  api/client.js       fetch wrapper; injects Bearer token (localStorage 'flagQuestToken').
  auth/AuthProvider.jsx  {user, status, isAuthed, login/register/logout/refresh/patchUser}.
  audio/AudioProvider.jsx  Web Audio SFX (no media files). Resumes ctx on play (mobile).
  components/         Screens + widgets (flat). ui/ holds primitives + useToast.
  lib/                Account-tied state + game logic (see Stores below).
  assets/illustrations/  SVG art. Mascot.jsx = "Atlas" globe pet; Cosmetics.jsx =
                      hat/glasses/effect SVG renderers.
  motion/index.js     framer-motion variants + springs.
  styles/             tokens.css, base.css, components.css (the big one), animations.css.
server/
  index.js            Express bootstrap; mounts /api/* routers; serves ../build (SPA fallback).
  db.js               SQLite open + idempotent schema + ALTER-based migrations + admin seed.
  middleware.js       JWT sign/verify; requireAuth / requireAdmin. Exports JWT_SECRET.
  xp.js               XP formula — MIRROR of src/lib/xp.js; keep the two in sync.
  routes/             auth, stats, pet, profile, social (leaderboard+friends),
                      announcements, multiplayer.
  announce.js         CLI used by deploy.sh to insert a release-note announcement.
public/data/          flags.json, languages.json, phrases.json, longest_routes.json.
```

## Stores (`src/lib/`)

Account-tied stores use `useSyncExternalStore`; mutate via exported setters that `notify()` listeners and `persist()` (debounced PUT). On sign-in App loads them; on logout/guest they reset. **Progress is never in localStorage** (only theme, strictSpelling, audio, and the run streak are).

- **progress.js** — bonus-mode high scores + `earnedXp` accumulator. `addEarnedXp`.
- **profile.js** — region, equipped `cosmetics`, achievements (showcase + unlocked). Persists to `/api/profile`.
- **pet.js** — "Atlas": needs (fed/joy/energy) decay in real time, health, `level` (from careXp), `chub`/`obese` (overfeeding → chubby, never fatal). Persists to `/api/pet`.
- **xp.js** — `computeXp()` = `earnedXp` + bonus totals. `awardForAnswer(flag, mode, streak)` (mode × streak-multiplier, new flags worth more). Legacy accounts seeded server-side so totals never drop.
- **syncStats.js** — extract/apply flag stats; debounced `pushStats`; `flushStats` (sendBeacon on page hide).
- **mastery.js** — mastery rank titles + `scopeRank(scope, entry, total)` for leaderboard.
- **achievements.js** — catalog + `evaluate(ctx)` + `topAchievements`.
- **cosmetics.js** — COLORS/HATS/GLASSES/EFFECTS catalogs, CATEGORIES, normalize/clamp.
- **streak.js** — current run streak (localStorage, survives leaving the page).
- **multiplayer.js** — `/api/mp` wrappers, seeded question engine (`makeEngine`), `useLobbyPoll`.

## Key concepts

- **XP**: earned per correct answer (scaled), accumulated in `earned_xp` (server) / progress store (client). Bonus high scores add on top. Multiplayer gives NO XP.
- **Cosmetics**: `{ color, hat, glasses, effect, hatPos, glassesPos }`. Mascot renders them; animated colors + effects use SMIL so they play everywhere (previews, avatars) regardless of `still`. The little flag is the default "hat" (shown only when no hat equipped).
- **Multiplayer**: in-memory lobbies on the server (cleared on redeploy); clients play locally and **poll** for the shared scoreboard (no WebSockets — proxy-safe). Modes share one configurable engine.
- **Leaderboard**: `/api/leaderboard?scope=...`; rows carry cosmetics, petLevel/name, masteredCount, showcase, achievementCount, value.

## Conventions & gotchas

- **Styling**: all CSS lives in the 4 files imported by `index.js`; almost everything is in `styles/components.css` (search its `/* ==== section ==== */` banners). There are NO per-component `.css` files — do not create them; add rules to `components.css`. The mode-card color system is `.mode-card.tone-{...}`.
- **Icons**: `<Icon name="..."/>` renders Material Symbols Rounded ligatures.
- **server/xp.js and src/lib/xp.js must stay in sync.**
- **DB migrations**: add columns with `ALTER TABLE ... ADD COLUMN` guarded by a `PRAGMA table_info` check in `db.js` (SQLite has no ADD COLUMN IF NOT EXISTS).

### Git
- Push over **HTTPS**: `git push https://github.com/jjjjkemp21/flag-game.git main` (SSH is broken locally). Don't modify git config.
- **Exclude from commits**: `.claude/` and `src/answers.txt`.
- End commit messages with: `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Pass multi-line messages via `git commit -F <file>` (PowerShell here-strings have mangled the subject line).
- Only commit/push when asked.
