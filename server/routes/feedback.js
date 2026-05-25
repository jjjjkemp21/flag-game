// Player-submitted feedback (suggestions + bug reports). Mirrors the
// announcements shape (auth-gated POST, admin-only management). Each accepted
// submission is also appended to /data/feedback.jsonl on the Pi so it survives
// independently of the SQLite blob — `docker cp` (or the feedback-dump CLI) is
// all that's needed to pull it back into the repo as FEEDBACK.md.

const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware');

const router = express.Router();

// Persistent append-only log next to the SQLite db. Same volume in prod (/data),
// same dev fallback as db.js when DB_PATH isn't a /data path.
const LOG_PATH = path.join(path.dirname(process.env.DB_PATH || '/data/flagquest.db'), 'feedback.jsonl');

const CATEGORIES = new Set(['bug', 'suggestion', 'other']);
const MAX_BODY = 2000;

// Anyone can submit, but only signed-in players (cheap spam gate) and only a
// few times per window per IP.
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/', requireAuth, submitLimiter, (req, res) => {
    const { category, body } = req.body || {};
    const cat = CATEGORIES.has(category) ? category : 'other';
    const text = typeof body === 'string' ? body.trim() : '';
    if (!text) return res.status(400).json({ error: 'Message is required.' });
    if (text.length > MAX_BODY) {
        return res.status(400).json({ error: `Message too long (max ${MAX_BODY} chars).` });
    }

    const createdAt = Date.now();
    const info = db
        .prepare('INSERT INTO feedback (user_id, username, category, body, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.username, cat, text, createdAt);

    try {
        const line = JSON.stringify({
            id: info.lastInsertRowid,
            user_id: req.user.id,
            username: req.user.username,
            category: cat,
            body: text,
            created_at: createdAt,
        });
        fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
    } catch (e) {
        // DB write already succeeded — losing the log mirror isn't fatal, but
        // surface it so ops notice the on-disk file falling out of sync.
        console.error('feedback log write failed:', e.message);
    }

    res.json({ ok: true, id: info.lastInsertRowid });
});

router.get('/', requireAuth, requireAdmin, (req, res) => {
    const list = db
        .prepare('SELECT id, user_id, username, category, body, created_at, resolved_at FROM feedback ORDER BY id DESC LIMIT 500')
        .all();
    res.json({ feedback: list });
});

router.post('/:id/resolve', requireAuth, requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid feedback id.' });
    }
    const info = db.prepare('UPDATE feedback SET resolved_at = ? WHERE id = ?').run(Date.now(), id);
    if (info.changes === 0) return res.status(404).json({ error: 'Feedback not found.' });
    res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid feedback id.' });
    }
    const info = db.prepare('DELETE FROM feedback WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Feedback not found.' });
    res.json({ ok: true });
});

module.exports = router;
