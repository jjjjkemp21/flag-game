const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || '/data/flagquest.db';

// Ensure the parent directory exists (e.g. /data on a fresh volume).
const dir = path.dirname(DB_PATH);
try {
    fs.mkdirSync(dir, { recursive: true });
} catch (_) {
    /* directory may already exist */
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        xp INTEGER NOT NULL DEFAULT 0,
        stats_json TEXT,
        bonus_scores_json TEXT,
        last_read_announcement_id INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS security_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer_hash TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sq_user ON security_questions(user_id);

    CREATE TABLE IF NOT EXISTS recovery_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        used_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_rc_user ON recovery_codes(user_id);

    CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        UNIQUE(requester_id, addressee_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        username TEXT NOT NULL,
        category TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        resolved_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        read_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read_at, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
`);

// Migration: add commit_sha to announcements so the deploy pipeline can dedupe
// auto-published release notes (SQLite has no "ADD COLUMN IF NOT EXISTS").
const announcementCols = db.prepare('PRAGMA table_info(announcements)').all();
if (!announcementCols.some((c) => c.name === 'commit_sha')) {
    db.exec('ALTER TABLE announcements ADD COLUMN commit_sha TEXT');
}

// Migrations: virtual-pet ("Atlas") state, profile cosmetics, region, pet level.
const userCols = db.prepare('PRAGMA table_info(users)').all();
const hasCol = (name) => userCols.some((c) => c.name === name);
if (!hasCol('pet_json')) db.exec('ALTER TABLE users ADD COLUMN pet_json TEXT');
if (!hasCol('cosmetics_json')) db.exec('ALTER TABLE users ADD COLUMN cosmetics_json TEXT');
if (!hasCol('region')) db.exec('ALTER TABLE users ADD COLUMN region TEXT');
if (!hasCol('pet_level')) db.exec('ALTER TABLE users ADD COLUMN pet_level INTEGER NOT NULL DEFAULT 1');
if (!hasCol('achievements_json')) db.exec('ALTER TABLE users ADD COLUMN achievements_json TEXT');
// earned_xp: lifetime flag-answer XP (mode/streak-scaled). NULL until first
// migrated/written; the stats route seeds it from the legacy formula so totals
// carry over for accounts that predate per-answer scaling.
if (!hasCol('earned_xp')) db.exec('ALTER TABLE users ADD COLUMN earned_xp INTEGER');
// Per-gamemode best run streaks (JSON map, e.g. {"multiple-choice":12}) and the
// running tally of multiplayer match wins (for the multiplayer leaderboard).
if (!hasCol('streaks_json')) db.exec('ALTER TABLE users ADD COLUMN streaks_json TEXT');
if (!hasCol('mp_wins')) db.exec('ALTER TABLE users ADD COLUMN mp_wins INTEGER NOT NULL DEFAULT 0');
// Player-chosen display title (one of the mastery-rank titles they've unlocked).
// NULL means "use the auto-derived rank for the current leaderboard scope" —
// the existing behaviour for accounts that haven't picked one yet.
if (!hasCol('selected_title')) db.exec('ALTER TABLE users ADD COLUMN selected_title TEXT');
// ---- Atlas Bucks (currency) ----
// `bucks` is the player's spendable balance. `bucks_minted_xp` tracks how much
// earned XP has already been converted to bucks so a trade-in claim only mints
// the *new* delta. `owned_cosmetics_json` stores the JSON array of "cat:id"
// strings the player has bought — equipping requires ownership now (instead
// of an XP threshold). Defaults (color:teal, none for the other slots) are
// always considered owned by the client/server normalizers.
if (!hasCol('bucks')) db.exec('ALTER TABLE users ADD COLUMN bucks INTEGER NOT NULL DEFAULT 0');
if (!hasCol('bucks_minted_xp')) db.exec('ALTER TABLE users ADD COLUMN bucks_minted_xp INTEGER NOT NULL DEFAULT 0');
if (!hasCol('owned_cosmetics_json')) db.exec('ALTER TABLE users ADD COLUMN owned_cosmetics_json TEXT');
// Economy v2 (2026-05-28): lifetime gameplay-earned bucks (monotonic mirror of
// earned_xp). The /api/stats PUT carries this absolute value; the server adds
// (incoming - stored) to the spendable `bucks` balance so admin grants and
// purchases are never clobbered. `migration_v2_grant` holds the one-shot
// amount we credited to legacy claimants — non-zero means we still owe them a
// patch-notes modal on next sign-in (cleared to 0 on dismissal).
if (!hasCol('bucks_earned_lifetime')) db.exec('ALTER TABLE users ADD COLUMN bucks_earned_lifetime INTEGER NOT NULL DEFAULT 0');
if (!hasCol('migration_v2_grant')) db.exec('ALTER TABLE users ADD COLUMN migration_v2_grant INTEGER NOT NULL DEFAULT 0');
// ---- Login chest (economy v2) ----
// last_login_chest_date: YYYY-MM-DD (UTC) of the most recent daily-chest
// rollover. login_streak: current cycle position; day-of-cycle is
// ((login_streak - 1) % 7) + 1 (1..7) with Day 7 paying the jackpot.
// pending_login_chest_json: { day, bucks, claimed } staged for the client to
// open; cleared on claim.
if (!hasCol('last_login_chest_date')) db.exec('ALTER TABLE users ADD COLUMN last_login_chest_date TEXT');
if (!hasCol('login_streak')) db.exec('ALTER TABLE users ADD COLUMN login_streak INTEGER NOT NULL DEFAULT 0');
if (!hasCol('pending_login_chest_json')) db.exec('ALTER TABLE users ADD COLUMN pending_login_chest_json TEXT');
// ---- Quests (economy v2) ----
// quests_json: { daily: { date, quests: [...] }, weekly: { weekStart, quests: [...] } }
// Rolled fresh on date rollover (UTC midnight daily / Monday UTC weekly).
if (!hasCol('quests_json')) db.exec('ALTER TABLE users ADD COLUMN quests_json TEXT');
// ---- Battlepass ----
// `battlepass_json` holds the per-user season blob: { season, owned (premium
// pass bought?), claimed[] (reward keys "free:N"/"prem:N"), counters{} }. When
// the SEASON_ID in server/battlepassCatalog.js changes, the route resets the
// player to a fresh state on next request — keeping past purchases scoped to
// the season they were made in.
if (!hasCol('battlepass_json')) db.exec('ALTER TABLE users ADD COLUMN battlepass_json TEXT');
// ---- Capitals ----
// Per-capital mastery for the Capitals mode, keyed by the country's (lowercased)
// flag code. Shape: { [code]: { correct, incorrect, streak, nextReview,
// lastAnswered } }. Entirely separate from flag/geo mastery. See
// server/routes/capitals.js and src/lib/capitals.js.
if (!hasCol('capital_stats_json')) db.exec('ALTER TABLE users ADD COLUMN capital_stats_json TEXT');
// ---- United States ----
// Per-state mastery for the US sub-mode under Capital, keyed by the lowercase
// two-letter postal code. Shape: { [code]: { correct, incorrect, streak,
// nextReview, lastAnswered } }. Both sub-modes (map + capitals) share one
// stat per state — like Globe's find/name pair. See server/routes/usStates.js
// and src/lib/usStates.js.
if (!hasCol('us_state_stats_json')) db.exec('ALTER TABLE users ADD COLUMN us_state_stats_json TEXT');
// ---- XP Road (removed) ----
// These two columns backed the now-removed XP Road feature. They're retained
// rather than dropped — SQLite can't drop a column without a full table
// rebuild, and they're harmless dead weight: nothing reads or writes them
// anymore. Kept so a fresh dev database keeps the same schema as production.
if (!hasCol('claimed_xproad_json')) db.exec('ALTER TABLE users ADD COLUMN claimed_xproad_json TEXT');
if (!hasCol('xp_road_titles_json')) db.exec('ALTER TABLE users ADD COLUMN xp_road_titles_json TEXT');

// ---- Spectator privacy ----
// When set to 0, friends can still see the player as "Playing X" on the Friends
// tab (presence heartbeat is unaffected), but the spectator endpoints refuse to
// /start a session — and the Eye icon is hidden client-side so a private setting
// isn't surfaced. Defaults to 1 (allow) so existing accounts opt-in to privacy
// rather than being silently locked out of the feature.
if (!hasCol('allow_spectate')) db.exec('ALTER TABLE users ADD COLUMN allow_spectate INTEGER NOT NULL DEFAULT 1');

// No dedicated/seeded admin account anymore — admin is now claimed at runtime
// by any signed-in user who enters the secret password (see POST
// /api/auth/claim-admin). Existing is_admin flags on real users are preserved
// so a previously-promoted account doesn't silently lose access on this boot.
// ADMIN_USERNAME / ADMIN_PASSWORD env vars are intentionally ignored.

// --- One-shot migrations ---------------------------------------------------
// Simple key/value table used to gate one-time DB operations across boots.
db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
        key   TEXT PRIMARY KEY,
        value TEXT
    );
`);

// 2026-05-22: wipe every existing announcement so the app starts fresh from
// curated user-facing release notes only (the auto-publish fallback used to
// post raw commit bodies, which polluted the bell). Also resets each user's
// last_read_announcement_id and the AUTOINCREMENT counter so future posts
// start from id = 1 and read as unread for everyone. Guarded by the meta
// key so this never runs twice — re-deploys are safe.
const WIPE_KEY = 'announcements_wiped_2026_05_22';
const alreadyWiped = db.prepare('SELECT 1 FROM _meta WHERE key = ?').get(WIPE_KEY);
if (!alreadyWiped) {
    db.exec('DELETE FROM announcements');
    db.exec('UPDATE users SET last_read_announcement_id = 0');
    try {
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'announcements'");
    } catch (_) { /* table absent if AUTOINCREMENT never used */ }
    db.prepare('INSERT INTO _meta (key, value) VALUES (?, ?)').run(WIPE_KEY, String(Date.now()));
}

// 2026-05-28: economy v2 — kill the XP→Bucks claim, pay Bucks directly. Every
// existing account that hasn't yet "minted" all its earned XP is one-shot
// credited with (earned_xp - bucks_minted_xp) Bucks at the original 1:1 rate
// so nobody loses purchasing power. The grant amount is stashed in
// migration_v2_grant so the client can show a patch-notes modal on next
// sign-in (cleared to 0 when the user dismisses it). Idempotent: guarded by
// _meta so re-deploys never re-grant.
const ECON_V2_KEY = 'economy_v2_2026_05_28';
const econV2Done = db.prepare('SELECT 1 FROM _meta WHERE key = ?').get(ECON_V2_KEY);
if (!econV2Done) {
    // bucks_earned_lifetime defaults to 0 and is the lifetime gameplay-earned
    // total, so it should equal the grant — NOT `bucks + grant` (SQLite reads
    // the pre-update `bucks` here, conflating any prior balance into the
    // lifetime stat).
    db.exec(`
        UPDATE users
        SET
            bucks = bucks + MAX(0, COALESCE(earned_xp, 0) - bucks_minted_xp),
            bucks_earned_lifetime = MAX(0, COALESCE(earned_xp, 0) - bucks_minted_xp),
            migration_v2_grant = MAX(0, COALESCE(earned_xp, 0) - bucks_minted_xp),
            bucks_minted_xp = COALESCE(earned_xp, 0)
        WHERE COALESCE(earned_xp, 0) > bucks_minted_xp
    `);
    db.prepare('INSERT INTO _meta (key, value) VALUES (?, ?)').run(ECON_V2_KEY, String(Date.now()));
}

// Economy-v2 follow-up: the migration above keyed on COALESCE(earned_xp, 0), so
// legacy accounts whose earned_xp was still NULL at v2-boot (dormant since
// before per-answer scaling shipped) were treated as 0 earned XP and received
// NO Bucks grant. Their earned_xp is only materialized lazily on a /stats
// request, which never happened. Here we materialize earned_xp from the legacy
// formula for any still-NULL rows and credit the Bucks they were owed at the
// same 1:1 rate — mirroring exactly what the v2 grant would have done. Strictly
// scoped to earned_xp IS NULL (rows that provably never ran the real v2 grant),
// idempotent via _meta, so it can never double-pay an already-migrated account.
const ECON_V2_LEGACY_KEY = 'economy_v2_legacy_seed_2026_05_28';
const econV2LegacyDone = db.prepare('SELECT 1 FROM _meta WHERE key = ?').get(ECON_V2_LEGACY_KEY);
if (!econV2LegacyDone) {
    const { legacyBaseXp } = require('./xp');
    const nullRows = db.prepare(
        'SELECT id, stats_json, bucks_minted_xp FROM users WHERE earned_xp IS NULL'
    ).all();
    const apply = db.prepare(
        `UPDATE users SET
            earned_xp = @earned,
            bucks = bucks + @grant,
            bucks_earned_lifetime = bucks_earned_lifetime + @grant,
            migration_v2_grant = migration_v2_grant + @grant,
            bucks_minted_xp = @earned
         WHERE id = @id`
    );
    const seedTx = db.transaction((rows) => {
        for (const r of rows) {
            let stats = [];
            try { stats = r.stats_json ? JSON.parse(r.stats_json) : []; } catch (_) { stats = []; }
            const earned = legacyBaseXp(Array.isArray(stats) ? stats : []);
            const grant = Math.max(0, earned - (Number(r.bucks_minted_xp) || 0));
            apply.run({ id: r.id, earned, grant });
        }
    });
    seedTx(nullRows);
    db.prepare('INSERT INTO _meta (key, value) VALUES (?, ?)').run(ECON_V2_LEGACY_KEY, String(Date.now()));
}

module.exports = db;
