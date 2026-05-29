const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { masteredCount, geoMasteredCount, geoPlacedCount } = require('../xp');

const router = express.Router();

router.use(requireAuth);

// Player-search rate limit. Autocomplete fires several requests per query so
// give a generous per-minute ceiling; well above normal typing, low enough to
// blunt scrapers walking the user table.
const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
});

function withMastered(row) {
    let mastered = 0;
    if (row.stats_json) {
        try {
            mastered = masteredCount(JSON.parse(row.stats_json));
        } catch (_) {
            /* ignore malformed */
        }
    }
    return { id: row.id, username: row.username, xp: row.xp, masteredCount: mastered };
}

function acceptedFriendIds(userId) {
    const rows = db
        .prepare(
            `SELECT requester_id, addressee_id FROM friendships
             WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)`
        )
        .all(userId, userId);
    return rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
}

const BONUS_MODES = ['frenzy', 'pixelated', 'longestRoute', 'language', 'capitals'];
const VALID_SCOPES = ['overall', 'friends', 'atlas', 'mpwins', 'globe', ...BONUS_MODES];

function bestStreakOf(row) {
    if (!row.streaks_json) return 0;
    try {
        const m = JSON.parse(row.streaks_json) || {};
        return Object.values(m).reduce((max, v) => Math.max(max, Number(v) || 0), 0);
    } catch (_) {
        return 0;
    }
}

// The score that ranks a row for a given scope.
function metricValue(row, scope) {
    if (scope === 'atlas') return row.pet_level || 1;
    if (scope === 'mpwins') return row.mp_wins || 0;
    if (scope === 'globe') {
        try {
            // The Globe leaderboard ranks by "placed" (unique countries the
            // player has ever placed correctly), not by the strict mastery
            // streak — the strict metric was always 0 for everyone until they
            // hit a 6-in-a-row on a single country, which made the board read
            // empty. Mastery still surfaces in the row subtitle.
            return row.stats_json ? geoPlacedCount(JSON.parse(row.stats_json)) : 0;
        } catch (_) {
            return 0;
        }
    }
    if (BONUS_MODES.includes(scope)) {
        try {
            const b = row.bonus_scores_json ? JSON.parse(row.bonus_scores_json) : {};
            return Number(b[scope]) || 0;
        } catch (_) {
            return 0;
        }
    }
    return row.xp || 0; // overall / friends
}

function petOf(row) {
    if (!row.pet_json) return null;
    try {
        return JSON.parse(row.pet_json);
    } catch (_) {
        return null;
    }
}

// Mirror of deriveStage() in src/lib/pet.js so the leaderboard shows the SAME
// life-stage label players see on their own pet panel (keep the two in sync).
function petStageOf(pet) {
    if (!pet) return 'Hatchling';
    const days = (Date.now() - (pet.bornAt || Date.now())) / 86400000;
    if (days < 0.04) return 'Hatchling';
    if (days < 1) return 'Sprout';
    if (days < 3) return 'Explorer';
    if (days < 7) return 'Globetrotter';
    return 'Legend';
}

function achievementsOf(row) {
    if (!row.achievements_json) return { showcase: [], count: 0 };
    try {
        const a = JSON.parse(row.achievements_json);
        return { showcase: Array.isArray(a.showcase) ? a.showcase : [], count: a.count || 0 };
    } catch (_) {
        return { showcase: [], count: 0 };
    }
}

function buildEntry(row, scope) {
    let mastered = 0;
    let geoMastered = 0;
    let geoPlaced = 0;
    if (row.stats_json) {
        try {
            const stats = JSON.parse(row.stats_json);
            mastered = masteredCount(stats);
            geoMastered = geoMasteredCount(stats);
            geoPlaced = geoPlacedCount(stats);
        } catch (_) { /* ignore */ }
    }
    const ach = achievementsOf(row);
    const pet = petOf(row);
    // Guard this parse like every sibling parse in buildEntry — buildEntry is
    // mapped over EVERY user row, so one malformed cosmetics_json would throw
    // out of the .map and 500 the entire leaderboard / user-search for everyone.
    let cosmetics = null;
    if (row.cosmetics_json) {
        try { cosmetics = JSON.parse(row.cosmetics_json); } catch (_) { /* ignore malformed */ }
    }
    return {
        id: row.id,
        username: row.username,
        xp: row.xp,
        region: row.region || null,
        cosmetics,
        petLevel: row.pet_level || 1,
        petName: pet && pet.name ? String(pet.name) : null,
        petStage: petStageOf(pet),
        masteredCount: mastered,
        geoMasteredCount: geoMastered,
        geoPlacedCount: geoPlaced,
        bestStreak: bestStreakOf(row),
        mpWins: row.mp_wins || 0,
        showcase: ach.showcase,
        achievementCount: ach.count,
        // Player-chosen title; the client renders this in place of the scope's
        // auto-derived rank label when it's set.
        selectedTitle: row.selected_title || null,
        value: metricValue(row, scope),
    };
}

router.get('/leaderboard', (req, res) => {
    // `scope` chooses the metric (overall/atlas/bonus modes). `filter=friends`
    // narrows ANY scope to the caller + their friends. ('friends' as a scope is
    // still accepted for backward compatibility and behaves like overall+filter.)
    let scope = VALID_SCOPES.includes(req.query.scope) ? req.query.scope : 'overall';
    let friendsOnly = req.query.filter === 'friends';
    if (scope === 'friends') { scope = 'overall'; friendsOnly = true; }
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const cols = 'id, username, xp, region, cosmetics_json, pet_level, pet_json, achievements_json, bonus_scores_json, stats_json, streaks_json, mp_wins, selected_title';

    let rows;
    if (friendsOnly) {
        const ids = acceptedFriendIds(req.user.id);
        ids.push(req.user.id);
        const placeholders = ids.map(() => '?').join(',');
        rows = db.prepare(`SELECT ${cols} FROM users WHERE id IN (${placeholders})`).all(...ids);
    } else {
        rows = db.prepare(`SELECT ${cols} FROM users`).all();
    }

    const sorted = rows
        .map((r) => buildEntry(r, scope))
        .sort((a, b) => b.value - a.value || a.username.localeCompare(b.username));

    const myIndex = sorted.findIndex((e) => e.id === req.user.id);
    const myEntry = myIndex >= 0 ? sorted[myIndex] : null;

    const entries = sorted.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));

    res.json({
        scope,
        entries,
        myRank: myIndex >= 0 ? myIndex + 1 : null,
        myValue: myEntry ? myEntry.value : 0,
    });
});

// Prefix search across usernames. Used by the leaderboard's player-find input.
// Returns the same row shape as the leaderboard so a click can open ProfileCard
// without a second fetch. `q` is constrained to the username charset to neuter
// LIKE wildcard injection; `_` is also legitimate in usernames so we escape it.
router.get('/users/search', searchLimiter, (req, res) => {
    const raw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const safe = raw.replace(/[^a-zA-Z0-9_]/g, '');
    if (safe.length < 2) return res.json({ users: [] });
    const escaped = safe.replace(/_/g, '\\_');
    const cols = 'id, username, xp, region, cosmetics_json, pet_level, pet_json, achievements_json, bonus_scores_json, stats_json, streaks_json, mp_wins, selected_title';
    const rows = db
        .prepare(`SELECT ${cols} FROM users WHERE username LIKE ? ESCAPE '\\' COLLATE NOCASE ORDER BY username COLLATE NOCASE LIMIT 20`)
        .all(escaped + '%');
    const users = rows.map((r) => buildEntry(r, 'overall'));
    res.json({ users });
});

router.get('/friends', (req, res) => {
    const me = req.user.id;

    const accepted = db
        .prepare(
            `SELECT u.id, u.username, u.xp, u.stats_json
             FROM friendships f
             JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
             WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
             ORDER BY u.xp DESC`
        )
        .all(me, me, me)
        .map(withMastered);

    const incoming = db
        .prepare(
            `SELECT f.id AS requestId, u.id, u.username, u.xp, u.stats_json
             FROM friendships f JOIN users u ON u.id = f.requester_id
             WHERE f.addressee_id = ? AND f.status = 'pending'`
        )
        .all(me)
        .map((r) => ({ requestId: r.requestId, ...withMastered(r) }));

    const outgoing = db
        .prepare(
            `SELECT f.id AS requestId, u.id, u.username, u.xp, u.stats_json
             FROM friendships f JOIN users u ON u.id = f.addressee_id
             WHERE f.requester_id = ? AND f.status = 'pending'`
        )
        .all(me)
        .map((r) => ({ requestId: r.requestId, ...withMastered(r) }));

    res.json({ friends: accepted, incoming, outgoing });
});

router.post('/friends/request', (req, res) => {
    const { username } = req.body || {};
    const target = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!target) return res.status(404).json({ error: 'No user with that username.' });
    if (target.id === req.user.id) return res.status(400).json({ error: "You can't friend yourself." });

    const me = req.user.id;
    const existing = db
        .prepare(
            `SELECT * FROM friendships
             WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
        )
        .get(me, target.id, target.id, me);

    if (existing) {
        if (existing.status === 'accepted') {
            return res.status(409).json({ error: 'You are already friends.' });
        }
        // If they already requested us, accept it instead of duplicating.
        if (existing.addressee_id === me) {
            db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(existing.id);
            return res.json({ ok: true, status: 'accepted' });
        }
        return res.status(409).json({ error: 'Request already sent.' });
    }

    db.prepare(
        "INSERT INTO friendships (requester_id, addressee_id, status, created_at) VALUES (?, ?, 'pending', ?)"
    ).run(me, target.id, Date.now());
    res.json({ ok: true, status: 'pending' });
});

router.post('/friends/respond', (req, res) => {
    const { requestId, accept } = req.body || {};
    const fr = db.prepare('SELECT * FROM friendships WHERE id = ?').get(requestId);
    if (!fr || fr.addressee_id !== req.user.id || fr.status !== 'pending') {
        return res.status(404).json({ error: 'Request not found.' });
    }
    if (accept) {
        db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(fr.id);
    } else {
        db.prepare('DELETE FROM friendships WHERE id = ?').run(fr.id);
    }
    res.json({ ok: true });
});

router.delete('/friends/:userId', (req, res) => {
    const me = req.user.id;
    const other = parseInt(req.params.userId, 10);
    db.prepare(
        `DELETE FROM friendships
         WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
    ).run(me, other, other, me);
    res.json({ ok: true });
});

module.exports = router;
