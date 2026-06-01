const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// Pride mastery persistence. Stores the per-flag spaced-repetition stats blob
// in users.pride_stats_json. Same shape and ownership rules as capitals /
// us-states: the client (src/lib/pride.js) owns the schedule; the server just
// validates + persists.
//
// stats: { [slug]: { correct, incorrect, streak, nextReview, lastAnswered } }

// 27 flags now; pad to 200 for any future additions. Bounds the blob so a
// malformed / hostile client can't write an unbounded map.
const MAX_FLAGS = 200;
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

function clampInt(v) {
    const n = Math.round(Number(v) || 0);
    return n > 0 ? n : 0;
}
function clampTs(v) {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function sanitize(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    let count = 0;
    for (const [slug, s] of Object.entries(raw)) {
        if (count >= MAX_FLAGS) break;
        if (!SLUG_RE.test(slug) || !s || typeof s !== 'object') continue;
        out[slug] = {
            correct: clampInt(s.correct),
            incorrect: clampInt(s.incorrect),
            streak: clampInt(s.streak),
            nextReview: clampTs(s.nextReview),
            lastAnswered: clampTs(s.lastAnswered),
        };
        count += 1;
    }
    return out;
}

function loadStats(userId) {
    const row = db.prepare('SELECT pride_stats_json FROM users WHERE id = ?').get(userId);
    if (!row || !row.pride_stats_json) return {};
    try {
        const v = JSON.parse(row.pride_stats_json);
        return v && typeof v === 'object' ? v : {};
    } catch (_) {
        return {};
    }
}

router.get('/', (req, res) => {
    res.json({ stats: loadStats(req.user.id) });
});

router.put('/', (req, res) => {
    const stats = sanitize(req.body && req.body.stats);
    db.prepare('UPDATE users SET pride_stats_json = ? WHERE id = ?')
        .run(JSON.stringify(stats), req.user.id);
    res.json({ ok: true, stats });
});

module.exports = router;
