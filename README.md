# Flag Game

A playful flag & geography quiz with spaced-repetition learning, a virtual pet
("Atlas"), cosmetics, quests, a battlepass, an XP road, multiplayer, and
leaderboards.

- **Frontend:** Create React App (React 18) + framer-motion, with a 3D globe
  mode built on three.js.
- **Backend:** Node/Express + better-sqlite3.
- **Production:** a single Node process serves the built React app *and* the
  `/api`, in a Docker container on a Raspberry Pi.

## Quick start (local dev)

Requires Node + npm. Run the frontend and backend in two terminals:

```bash
# 1. Frontend (CRA dev server on http://localhost:3000, proxies /api → :4000)
npm install
npm start

# 2. Backend (Express + SQLite on http://localhost:4000)
cd server
npm install        # better-sqlite3 compiles a native module the first time
npm start          # or: node index.js
```

The SQLite file is created under `server/` when run outside Docker. If you start
the UI without the backend, the app transparently falls back to an in-browser
dev mock (`src/api/mock.js`); call `window.__useRealApi()` in the console (then
reload) once the backend is up.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm start` | CRA dev server (root) |
| `npm run build` | Production CRA bundle into `build/` — surfaces ESLint/import errors the Docker build would hit |
| `npm test` | Jest (react-scripts), incl. the client/server catalog-sync guard |
| `node server/index.js` | Express + SQLite API |

> **Treat ESLint warnings as build-breaking.** With `CI=true`, `npm run build`
> turns warnings into errors. Run `CI=true npm run build` before pushing.

## Architecture

```
src/
  index.js                 App entry: Audio/Toast/Auth providers + 4 global stylesheets.
  App.js                   Root. View navigation is a string `view` useState + a switch
                           in renderView() (no react-router). Owns flagsData, account
                           load/sync, pet feeding, XP.
  quiz_logic.js            Flag selection (weighted spaced-repetition) + stat updates.
  answer_check.js          Fuzzy answer matching (Levenshtein) + known-answer guard.
  api/                     fetch wrapper (client.js) + localhost dev mock (mock.js).
  auth/ audio/             Auth + Web Audio SFX providers.
  components/
    quizzes/               The quiz modes + their menus (MC, free response, globe, frenzy, …).
    economy/               Store, battlepass, quests, XP road, chests, modals.
    social/                Leaderboard, friends, inbox, multiplayer, spectate, profile card.
    profile/               Achievements, stats, settings, auth screen, pet panel, badges.
    menu/                  Main menu + top bar.
    common/                Icon, Markdown.
    ui/                    Design-system primitives (Button, Card, Modal, …) + useToast.
  lib/                     Account-tied stores (useSyncExternalStore) + game logic.
  assets/illustrations/    SVG art. Mascot.jsx = Atlas; Cosmetics.jsx = hat/glasses/mouth/effect renderers.
  styles/                  tokens.css, base.css, components.css (the big one), animations.css.
server/
  index.js                 Express bootstrap; mounts /api/* routers; serves ../build.
  db.js                    SQLite schema + ALTER-based migrations.
  middleware.js            JWT sign/verify; requireAuth / requireAdmin.
  xp.js                    XP formula — mirror of src/lib/xp.js.
  routes/                  auth, stats, pet, profile, social, multiplayer, currency, …
public/data/               flags.json, languages.json, phrases.json, longest_routes.json.
tools/                     Dev-only helpers (e.g. calculate_routes.py).
```

### Conventions

- **Styling lives in the four `src/styles/*.css` files** imported by `index.js`
  (almost everything is in `components.css`, organised by `/* ==== section ==== */`
  banners). There are no per-component CSS files.
- **Account-tied state** (`src/lib/*`) uses `useSyncExternalStore`; mutate via the
  exported setters that `notify()` + debounced-`persist()`. Progress is never kept
  in localStorage — only theme, strict-spelling, audio, and the run streak are.
- **Mirrored files** must stay in sync: `server/xp.js` ⇄ `src/lib/xp.js`,
  `server/battlepassCatalog.js` ⇄ `src/lib/battlepassCatalog.js`, and
  `server/cosmeticsCatalog.js` ⇄ `src/lib/cosmetics.js`. `npm test` fails if they
  drift (`src/__tests__/catalogSync.test.js`).
- **DB migrations:** add columns with `ALTER TABLE … ADD COLUMN` guarded by a
  `PRAGMA table_info` check in `db.js`.

### Server environment variables

| Var | Purpose |
| --- | --- |
| `JWT_SECRET` | Signs auth tokens. Set a long random value in production. |
| `DB_PATH` | SQLite file path (defaults to `/data/flagquest.db` in the container). |
| `ADMIN_CLAIM_PASSWORD` | Secret for the in-app admin self-promotion. **If unset, admin claiming is disabled** (the safe default). Never commit it. |

## Deploy

Pushing to `main` triggers a GitHub Action that builds the Docker image and
restarts the container. The CRA build runs inside Docker, so broken imports,
syntax errors, or ESLint problems fail the deploy. Updating `RELEASE_NOTES.md`
auto-posts a user-facing in-app announcement for that release.
