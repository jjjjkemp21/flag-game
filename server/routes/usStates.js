const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// United States mastery persistence. Stores the per-state spaced-repetition
// stats blob in users.us_state_stats_json. Same shape and ownership rules as
// capitals: the client (src/lib/usStates.js) owns the schedule; the server
// just validates + persists.
//
// stats: { [code]: { correct, incorrect, streak, nextReview, lastAnswered } }

// 50 states + DC is plenty. Pad to 200 for headroom — bounds the blob so a
// malformed / hostile client can't write an unbounded map.
const MAX_STATES = 200;
const CODE_RE = /^[a-z]{2}$/;

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
        if (count >= MAX_STATES) break;
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
    const row = db.prepare('SELECT us_state_stats_json FROM users WHERE id = ?').get(userId);
    if (!row || !row.us_state_stats_json) return {};
    try {
        const v = JSON.parse(row.us_state_stats_json);
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
    db.prepare('UPDATE users SET us_state_stats_json = ? WHERE id = ?')
        .run(JSON.stringify(stats), req.user.id);
    res.json({ ok: true, stats });
});

module.exports = router;
