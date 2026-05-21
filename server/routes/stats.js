const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { computeXp } = require('../xp');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
    const row = db
        .prepare('SELECT stats_json, bonus_scores_json, xp FROM users WHERE id = ?')
        .get(req.user.id);
    res.json({
        flagStats: row.stats_json ? JSON.parse(row.stats_json) : null,
        bonusScores: row.bonus_scores_json ? JSON.parse(row.bonus_scores_json) : null,
        xp: row.xp,
    });
});

router.put('/', (req, res) => {
    const { flagStats, bonusScores } = req.body || {};
    if (flagStats !== undefined && !Array.isArray(flagStats)) {
        return res.status(400).json({ error: 'flagStats must be an array.' });
    }

    // Partial update: only the provided fields change; the rest keep their
    // current values. XP is recomputed from the resulting combined state.
    const row = db
        .prepare('SELECT stats_json, bonus_scores_json FROM users WHERE id = ?')
        .get(req.user.id);

    const newFlagStats = Array.isArray(flagStats)
        ? flagStats
        : (row.stats_json ? JSON.parse(row.stats_json) : []);
    const newBonus = bonusScores && typeof bonusScores === 'object'
        ? bonusScores
        : (row.bonus_scores_json ? JSON.parse(row.bonus_scores_json) : {});

    const xp = computeXp(newFlagStats, newBonus);

    db.prepare(
        'UPDATE users SET stats_json = ?, bonus_scores_json = ?, xp = ? WHERE id = ?'
    ).run(JSON.stringify(newFlagStats), JSON.stringify(newBonus), xp, req.user.id);

    res.json({ ok: true, xp });
});

module.exports = router;
