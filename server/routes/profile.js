const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { DEFAULTS } = require('../cosmeticsCatalog');

const router = express.Router();

router.use(requireAuth);

// Equipping is allowed for items the player owns (or defaults). Coerce any
// unknown / unowned ids back to the default for that slot so a bad payload
// can't make the mascot render a cosmetic the player hasn't bought.
function ownedSetOf(userId) {
    const row = db.prepare('SELECT owned_cosmetics_json FROM users WHERE id = ?').get(userId);
    if (!row || !row.owned_cosmetics_json) return new Set();
    try {
        const arr = JSON.parse(row.owned_cosmetics_json);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) { return new Set(); }
}

function gateCosmetics(userId, c) {
    if (!c || typeof c !== 'object') return c;
    const owned = ownedSetOf(userId);
    const gate = (cat, id) => {
        if (DEFAULTS[cat] === id) return id;
        if (owned.has(`${cat}:${id}`)) return id;
        return DEFAULTS[cat];
    };
    return {
        ...c,
        color: gate('color', c.color),
        hat: gate('hat', c.hat),
        glasses: gate('glasses', c.glasses),
        effect: gate('effect', c.effect),
    };
}

router.get('/', (req, res) => {
    const row = db.prepare('SELECT region, cosmetics_json, achievements_json, streaks_json, selected_title FROM users WHERE id = ?').get(req.user.id);
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
        selectedTitle: row.selected_title || null,
    });
});

// Partial update of region, equipped cosmetics, achievements, streaks, and/or
// the player's chosen display title.
router.put('/', (req, res) => {
    const { region, cosmetics, achievements, streaks, selectedTitle } = req.body || {};
    if (region !== undefined) {
        const code = region === null ? null : String(region).slice(0, 8);
        db.prepare('UPDATE users SET region = ? WHERE id = ?').run(code, req.user.id);
    }
    if (cosmetics && typeof cosmetics === 'object') {
        const safe = gateCosmetics(req.user.id, cosmetics);
        db.prepare('UPDATE users SET cosmetics_json = ? WHERE id = ?')
            .run(JSON.stringify(safe), req.user.id);
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
    if (selectedTitle !== undefined) {
        // Stored as a free-form short string; the client is the source of truth
        // for which titles are unlocked. Length-capped so a clever caller can't
        // bloat the row, and `null`/empty clears the choice (back to auto-rank).
        const t = selectedTitle === null || selectedTitle === ''
            ? null
            : String(selectedTitle).slice(0, 40);
        db.prepare('UPDATE users SET selected_title = ? WHERE id = ?').run(t, req.user.id);
    }
    res.json({ ok: true });
});

module.exports = router;
