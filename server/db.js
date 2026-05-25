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
// ---- Battlepass ----
// `battlepass_json` holds the per-user season blob: { season, owned (premium
// pass bought?), claimed[] (reward keys "free:N"/"prem:N"), counters{} }. When
// the SEASON_ID in server/battlepassCatalog.js changes, the route resets the
// player to a fresh state on next request — keeping past purchases scoped to
// the season they were made in.
if (!hasCol('battlepass_json')) db.exec('ALTER TABLE users ADD COLUMN battlepass_json TEXT');

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

module.exports = db;
