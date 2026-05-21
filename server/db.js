const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
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

// Seed / promote the admin account from env. If ADMIN_PASSWORD is set, the admin
// account is created (or its password reset) on boot so it can always log in.
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminUsername) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
    if (existing) {
        db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existing.id);
        if (adminPassword) {
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                .run(bcrypt.hashSync(adminPassword, 10), existing.id);
        }
    } else if (adminPassword) {
        db.prepare(
            'INSERT INTO users (username, password_hash, created_at, is_admin) VALUES (?, ?, ?, 1)'
        ).run(adminUsername, bcrypt.hashSync(adminPassword, 10), Date.now());
    }
}

module.exports = db;
