const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// Capitals mastery persistence. Stores the per-capital spaced-repetition stats
// blob in users.capital_stats_json. The client (src/lib/capitals.js) owns the
// schedule; the server just validates + persists, mirroring the other stores.
//
// stats: { [code]: { correct, incorrect, streak, nextReview, lastAnswered } }

// Bound the blob so a malformed / hostile client can't store an unbounded map.
// The catalog is ~240 capitals; 1000 keys is comfortable headroom.
const MAX_CAPITALS = 1000;
const CODE_RE = /^[a-z0-9-]{1,48}$/;

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
    for (const [code, s] of Object.entries(raw)) {
        if (count >= MAX_CAPITALS) break;
        if (!CODE_RE.test(code) || !s || typeof s !== 'object') continue;
        out[code] = {
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
    const row = db.prepare('SELECT capital_stats_json FROM users WHERE id = ?').get(userId);
    if (!row || !row.capital_stats_json) return {};
    try {
        const v = JSON.parse(row.capital_stats_json);
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
    db.prepare('UPDATE users SET capital_stats_json = ? WHERE id = ?')
        .run(JSON.stringify(stats), req.user.id);
    res.json({ ok: true, stats });
});

module.exports = router;
