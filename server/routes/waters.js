const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// Bodies-of-Water mastery persistence. Stores the per-body spaced-repetition
// stats blob in users.water_stats_json. The client (src/lib/waters.js) owns the
// schedule; the server just validates + persists, mirroring the other stores.
//
// stats: { [waterId]: { correct, incorrect, streak, nextReview, lastAnswered } }

// Bound the blob so a malformed / hostile client can't store an unbounded map.
// The curated catalog is ~150 bodies; 1000 keys is comfortable headroom.
const MAX_BODIES = 1000;
const ID_RE = /^[a-z0-9-]{1,48}$/;

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
    for (const [id, s] of Object.entries(raw)) {
        if (count >= MAX_BODIES) break;
        if (!ID_RE.test(id) || !s || typeof s !== 'object') continue;
        out[id] = {
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
    const row = db.prepare('SELECT water_stats_json FROM users WHERE id = ?').get(userId);
    if (!row || !row.water_stats_json) return {};
    try {
        const v = JSON.parse(row.water_stats_json);
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
    db.prepare('UPDATE users SET water_stats_json = ? WHERE id = ?')
        .run(JSON.stringify(stats), req.user.id);
    res.json({ ok: true, stats });
});

module.exports = router;
