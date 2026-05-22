const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware');
const { totalXp, legacyBaseXp } = require('../xp');

const router = express.Router();

// Resolve the earned_xp baseline for a row: the stored value, or — for legacy
// accounts where it's still NULL — the old formula's flag-answer portion so XP
// carries over exactly.
function earnedBaseline(row) {
    if (row.earned_xp !== null && row.earned_xp !== undefined) return row.earned_xp;
    const stats = row.stats_json ? safeParse(row.stats_json, []) : [];
    return legacyBaseXp(stats);
}

function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch (_) { return fallback; }
}

// Apply a stats update for a user id. Shared by the authed PUT and the
// unload-time beacon. Only provided fields change; XP is recomputed from the
// resulting combined state.
function applyUpdate(userId, body) {
    const { flagStats, bonusScores, earnedXp } = body || {};
    if (flagStats !== undefined && !Array.isArray(flagStats)) {
        return { error: 'flagStats must be an array.' };
    }

    const row = db
        .prepare('SELECT stats_json, bonus_scores_json, earned_xp FROM users WHERE id = ?')
        .get(userId);
    if (!row) return { error: 'User not found.' };

    const newFlagStats = Array.isArray(flagStats)
        ? flagStats
        : (row.stats_json ? safeParse(row.stats_json, []) : []);
    const newBonus = bonusScores && typeof bonusScores === 'object'
        ? bonusScores
        : (row.bonus_scores_json ? safeParse(row.bonus_scores_json, {}) : {});

    // Last-write-wins (consistent with flag stats): use the client's absolute
    // earned_xp when provided, else keep the existing/seeded baseline.
    const newEarned = Number.isFinite(Number(earnedXp))
        ? Math.max(0, Math.round(Number(earnedXp)))
        : earnedBaseline(row);

    const xp = totalXp(newEarned, newBonus);

    db.prepare(
        'UPDATE users SET stats_json = ?, bonus_scores_json = ?, earned_xp = ?, xp = ? WHERE id = ?'
    ).run(JSON.stringify(newFlagStats), JSON.stringify(newBonus), newEarned, xp, userId);

    return { ok: true, xp, earnedXp: newEarned };
}

// Unload beacon: navigator.sendBeacon can't set an Authorization header, so the
// token rides in the query string. Registered before requireAuth.
router.post('/beacon', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).end();
    let uid;
    try {
        uid = jwt.verify(token, JWT_SECRET).uid;
    } catch (_) {
        return res.status(401).end();
    }
    applyUpdate(uid, req.body);
    res.status(204).end();
});

router.use(requireAuth);

router.get('/', (req, res) => {
    const row = db
        .prepare('SELECT stats_json, bonus_scores_json, xp, earned_xp FROM users WHERE id = ?')
        .get(req.user.id);
    res.json({
        flagStats: row.stats_json ? JSON.parse(row.stats_json) : null,
        bonusScores: row.bonus_scores_json ? JSON.parse(row.bonus_scores_json) : null,
        xp: row.xp,
        earnedXp: earnedBaseline(row),
    });
});

router.put('/', (req, res) => {
    const result = applyUpdate(req.user.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

module.exports = router;
