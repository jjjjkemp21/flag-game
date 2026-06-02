const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { DEFAULTS, CATALOG, isFreeStarter } = require('../cosmeticsCatalog');

const EMOTE_LOADOUT_SIZE = 4;

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
    const isOwned = (cat, id) => {
        if (DEFAULTS[cat] === id) return true;
        if (isFreeStarter(cat, id)) return true;
        return owned.has(`${cat}:${id}`);
    };
    const gate = (cat, id) => (isOwned(cat, id) ? id : DEFAULTS[cat]);
    // Emote loadout: array of EMOTE_LOADOUT_SIZE ids; unknown / unowned slots
    // collapse to 'none'. Padded so a short payload doesn't shrink the loadout.
    const rawLoadout = Array.isArray(c.emoteLoadout) ? c.emoteLoadout : [];
    const loadout = Array(EMOTE_LOADOUT_SIZE).fill('none').map((_, i) => {
        const id = rawLoadout[i];
        if (typeof id !== 'string' || !CATALOG.emote || !(id in CATALOG.emote)) return 'none';
        return isOwned('emote', id) ? id : 'none';
    });
    // Companion names: { [knownCompanionId]: name }. Drop unknown ids /
    // non-string values, trim and cap length so a crafted payload can't bloat
    // the row or store a name for a companion that isn't in the catalog.
    const rawNames = (c.companionNames && typeof c.companionNames === 'object') ? c.companionNames : {};
    const companionNames = {};
    for (const [id, nm] of Object.entries(rawNames)) {
        if (!CATALOG.companion || !CATALOG.companion[id] || id === 'none') continue;
        if (typeof nm !== 'string') continue;
        const t = nm.trim().slice(0, 20);
        if (t) companionNames[id] = t;
    }
    return {
        ...c,
        color: gate('color', c.color),
        hat: gate('hat', c.hat),
        glasses: gate('glasses', c.glasses),
        mouth: gate('mouth', c.mouth),
        effect: gate('effect', c.effect),
        scene: gate('scene', c.scene),
        emote: gate('emote', c.emote),
        companion: gate('companion', c.companion),
        companionNames,
        emoteLoadout: loadout,
    };
}

router.get('/', (req, res) => {
    const row = db.prepare('SELECT region, cosmetics_json, achievements_json, streaks_json, selected_title, allow_spectate FROM users WHERE id = ?').get(req.user.id);
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
        // Column is INTEGER (0/1), default 1. Surface as a real boolean so the
        // client never has to remember the encoding.
        allowSpectate: row.allow_spectate !== 0,
    });
});

// Partial update of region, equipped cosmetics, achievements, streaks, and/or
// the player's chosen display title.
router.put('/', (req, res) => {
    const { region, cosmetics, achievements, streaks, selectedTitle, allowSpectate } = req.body || {};
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
    if (allowSpectate !== undefined) {
        // Boolean -> SQLite INTEGER. Anything truthy = allow.
        const v = allowSpectate ? 1 : 0;
        db.prepare('UPDATE users SET allow_spectate = ? WHERE id = ?').run(v, req.user.id);
    }
    res.json({ ok: true });
});

module.exports = router;
