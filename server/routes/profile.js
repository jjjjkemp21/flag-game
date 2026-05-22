const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
    const row = db.prepare('SELECT region, cosmetics_json, achievements_json, streaks_json FROM users WHERE id = ?').get(req.user.id);
    let achievements = null;
    if (row.achievements_json) {
        try { achievements = JSON.parse(row.achievements_json); } catch (_) { /* ignore malformed */ }
    }
    let streaks = null;
    if (row.streaks_json) {
        try { streaks = JSON.parse(row.streaks_json); } catch (_) { /* ignore malformed */ }
    }
    res.json({
        region: row.region || null,
        cosmetics: row.cosmetics_json ? JSON.parse(row.cosmetics_json) : null,
        achievements,
        streaks,
    });
});

// Partial update of region, equipped cosmetics, and/or achievements.
router.put('/', (req, res) => {
    const { region, cosmetics, achievements, streaks } = req.body || {};
    if (region !== undefined) {
        const code = region === null ? null : String(region).slice(0, 8);
        db.prepare('UPDATE users SET region = ? WHERE id = ?').run(code, req.user.id);
    }
    if (cosmetics && typeof cosmetics === 'object') {
        db.prepare('UPDATE users SET cosmetics_json = ? WHERE id = ?')
            .run(JSON.stringify(cosmetics), req.user.id);
    }
    if (achievements && typeof achievements === 'object') {
        const showcase = Array.isArray(achievements.showcase)
            ? achievements.showcase.filter((x) => typeof x === 'string').slice(0, 3)
            : [];
        const count = Math.max(0, parseInt(achievements.count, 10) || 0);
        db.prepare('UPDATE users SET achievements_json = ? WHERE id = ?')
            .run(JSON.stringify({ showcase, count }), req.user.id);
    }
    if (streaks && typeof streaks === 'object') {
        // Keep only sane integer streaks, and never let a stored best decrease.
        let prev = {};
        const row = db.prepare('SELECT streaks_json FROM users WHERE id = ?').get(req.user.id);
        if (row && row.streaks_json) {
            try { prev = JSON.parse(row.streaks_json) || {}; } catch (_) { prev = {}; }
        }
        const merged = { ...prev };
        for (const [mode, val] of Object.entries(streaks)) {
            const n = Math.max(0, parseInt(val, 10) || 0);
            if (n > (merged[mode] || 0)) merged[mode] = n;
        }
        db.prepare('UPDATE users SET streaks_json = ? WHERE id = ?')
            .run(JSON.stringify(merged), req.user.id);
    }
    res.json({ ok: true });
});

module.exports = router;
