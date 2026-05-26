const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { lobbies } = require('../lobbies');
const { CATALOG, DEFAULTS, isFreeStarter } = require('../cosmeticsCatalog');
const SPECTATOR_PHRASES = require('../spectatorPhrases');

const router = express.Router();
router.use(requireAuth);

// In-memory spectator + reaction state. Same redeploy-clears-it model as
// multiplayer lobbies. Two maps:
//   sessions: targetId -> Map<spectatorId, { username, cosmetics, selectedTitle, lastSeen, joinedAt, lastReactionAt }>
//   reactions: targetId -> { nextId, items: [{ id, fromId, fromUsername, fromCosmetics, kind, payload, ts, expiresAt }] }
//
// Both maps are looked up by the target's user id — a friend watching me
// pushes their spectator entry into sessions[me] and any emote/message lands
// in reactions[me], so my own client (the target) and other spectators on the
// same target all see it via one polled endpoint.
const sessions = new Map();
const reactions = new Map();

const SPECTATOR_TTL_MS = 6000;    // drop spectators who stop polling
const REACTION_TTL_MS = 3000;     // how long a single emote/message floats
const REACTION_RATE_LIMIT_MS = 1500; // per spectator, per target
const MAX_SPECTATORS = 20;        // hard cap per target
const MAX_RECENT_REACTIONS = 50;  // ring-buffer cap, oldest dropped first
const MESSAGE_TEXT_LIMIT = 60;    // server validates messageId; the limit is belt+braces

// ---- Lookups + helpers ---------------------------------------------------

function acceptedFriendIds(userId) {
    const rows = db
        .prepare(
            `SELECT requester_id, addressee_id FROM friendships
             WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)`
        )
        .all(userId, userId);
    return rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
}

function userPublicInfo(userId) {
    try {
        const row = db
            .prepare('SELECT id, username, cosmetics_json, selected_title FROM users WHERE id = ?')
            .get(userId);
        if (!row) return null;
        let cosmetics = null;
        try { cosmetics = row.cosmetics_json ? JSON.parse(row.cosmetics_json) : null; } catch (_) { /* malformed */ }
        return {
            id: row.id,
            username: row.username,
            cosmetics,
            selectedTitle: row.selected_title || null,
        };
    } catch (_) { return null; }
}

// Has the target opted in to letting friends spectate them? Defaults to true
// for legacy accounts where the column is NULL or 1.
function allowsSpectate(userId) {
    try {
        const row = db.prepare('SELECT allow_spectate FROM users WHERE id = ?').get(userId);
        if (!row) return false;
        return row.allow_spectate !== 0;
    } catch (_) { return false; }
}

// Ownership check for a category+id. Defaults + free starters are always owned;
// otherwise we look up the player's owned_cosmetics_json. Used by /react to
// verify a spectator owns the emote they're trying to send.
function ownsCosmetic(userId, category, id) {
    if (!category || !id) return false;
    if (DEFAULTS[category] === id) return true;
    if (isFreeStarter(category, id)) return true;
    try {
        const row = db.prepare('SELECT owned_cosmetics_json FROM users WHERE id = ?').get(userId);
        if (!row || !row.owned_cosmetics_json) return false;
        const arr = JSON.parse(row.owned_cosmetics_json);
        return Array.isArray(arr) && arr.includes(`${category}:${id}`);
    } catch (_) { return false; }
}

function getSession(targetId) {
    let m = sessions.get(targetId);
    if (!m) { m = new Map(); sessions.set(targetId, m); }
    return m;
}

function getReactionLog(targetId) {
    let r = reactions.get(targetId);
    if (!r) { r = { nextId: 1, items: [] }; reactions.set(targetId, r); }
    return r;
}

function pruneStaleSpectators(targetId, now) {
    const m = sessions.get(targetId);
    if (!m) return 0;
    for (const [sid, s] of m) {
        if (now - s.lastSeen > SPECTATOR_TTL_MS) m.delete(sid);
    }
    if (m.size === 0) sessions.delete(targetId);
    return m.size;
}

function pruneExpiredReactions(targetId, now) {
    const r = reactions.get(targetId);
    if (!r) return;
    r.items = r.items.filter((x) => x.expiresAt > now);
    if (r.items.length === 0 && !sessions.get(targetId)) reactions.delete(targetId);
}

// ---- Public helpers used by presence.js ----------------------------------

function spectatorCount(targetId) {
    const now = Date.now();
    pruneStaleSpectators(targetId, now);
    const m = sessions.get(targetId);
    return m ? m.size : 0;
}

// The highest reaction id currently in the buffer for a target — used by the
// target's heartbeat response so its client knows from where to resume polling
// after it starts watching its own spectator stream.
function lastReactionId(targetId) {
    const r = reactions.get(targetId);
    if (!r || r.items.length === 0) return 0;
    return r.items[r.items.length - 1].id;
}

// ---- View construction ---------------------------------------------------

// Build the spectator-facing view of a target. Caller can be the target
// themself (caller === targetId) — in that case we omit gameState because
// they already know it; spectators get the prompt hint + score/streak only,
// never the answer or option list (see plan doc § 3 for the leak audit).
function buildState(targetId, callerId, since) {
    const now = Date.now();
    const target = userPublicInfo(targetId);
    if (!target) return null;

    let presenceEntry = null;
    try {
        const presence = require('./presence');
        presenceEntry = presence.getPresence(targetId);
    } catch (_) { /* fresh module not loaded yet */ }

    let gameState = null;
    let activeMode = null;
    let mpCode = null;
    let startedAt = null;
    if (presenceEntry) {
        activeMode = presenceEntry.mode;
        mpCode = presenceEntry.mpCode;
        startedAt = presenceEntry.startedAt;
        if (callerId !== targetId) {
            if (presenceEntry.mode === 'multiplayer' && presenceEntry.mpCode) {
                const lobby = lobbies.get(presenceEntry.mpCode);
                const m = lobby && lobby.members[targetId];
                if (lobby && m) {
                    gameState = {
                        mode: 'multiplayer',
                        mpMode: lobby.config.mode,
                        score: m.score,
                        streak: m.streak,
                        bestStreak: m.bestStreak,
                        qIndex: m.qIndex,
                        finished: !!m.finished,
                        mpCode: lobby.code,
                        target: lobby.config.target,
                        state: lobby.state,
                    };
                }
            } else if (presenceEntry.gameState) {
                gameState = { mode: presenceEntry.mode, ...presenceEntry.gameState };
            }
        }
    }

    pruneStaleSpectators(targetId, now);
    pruneExpiredReactions(targetId, now);

    const sessionMap = sessions.get(targetId);
    const spectators = sessionMap
        ? Array.from(sessionMap.values())
            .sort((a, b) => a.joinedAt - b.joinedAt)
            .map((s) => ({
                id: s.id,
                username: s.username,
                cosmetics: s.cosmetics,
            }))
        : [];

    const sinceN = Number.isFinite(+since) ? +since : 0;
    const log = reactions.get(targetId);
    const recent = log
        ? log.items.filter((x) => x.id > sinceN && x.expiresAt > now)
        : [];
    const nextSince = log && log.items.length ? log.items[log.items.length - 1].id : sinceN;

    return {
        target: {
            id: target.id,
            username: target.username,
            cosmetics: target.cosmetics,
            selectedTitle: target.selectedTitle,
            activeMode,
            mpCode,
            startedAt,
            gameState,
        },
        spectators,
        reactions: recent,
        nextSince,
        serverNow: now,
    };
}

// ---- Routes --------------------------------------------------------------

router.post('/:userId/start', (req, res) => {
    const target = parseInt(req.params.userId, 10);
    if (!Number.isFinite(target)) return res.status(400).json({ error: 'Bad user id' });
    const me = req.user.id;
    if (me === target) return res.status(400).json({ error: "You can't spectate yourself." });
    if (!acceptedFriendIds(me).includes(target)) {
        return res.status(403).json({ error: 'Only friends can spectate each other.' });
    }
    if (!allowsSpectate(target)) {
        return res.status(403).json({ error: 'That friend has disabled spectating.' });
    }
    const mySession = getSession(target);
    if (!mySession.has(me) && mySession.size >= MAX_SPECTATORS) {
        return res.status(409).json({ error: 'Too many spectators on this match.' });
    }
    const meInfo = userPublicInfo(me);
    const now = Date.now();
    mySession.set(me, {
        id: me,
        username: meInfo ? meInfo.username : `player ${me}`,
        cosmetics: meInfo ? meInfo.cosmetics : null,
        selectedTitle: meInfo ? meInfo.selectedTitle : null,
        joinedAt: (mySession.get(me) && mySession.get(me).joinedAt) || now,
        lastSeen: now,
        lastReactionAt: 0,
    });
    const state = buildState(target, me, 0);
    if (!state) return res.status(404).json({ error: 'User not found' });
    res.json(state);
});

router.post('/:userId/stop', (req, res) => {
    const target = parseInt(req.params.userId, 10);
    if (!Number.isFinite(target)) return res.status(400).json({ error: 'Bad user id' });
    const m = sessions.get(target);
    if (m) {
        m.delete(req.user.id);
        if (m.size === 0) sessions.delete(target);
    }
    res.json({ ok: true });
});

// Boot a spectator from your own match. Only the target (caller === userId in
// the route) can kick someone. `:spectatorId` is the spectator to remove.
router.post('/:userId/kick/:spectatorId', (req, res) => {
    const target = parseInt(req.params.userId, 10);
    const spectatorId = parseInt(req.params.spectatorId, 10);
    if (!Number.isFinite(target) || !Number.isFinite(spectatorId)) {
        return res.status(400).json({ error: 'Bad user id' });
    }
    if (req.user.id !== target) {
        return res.status(403).json({ error: 'Only you can boot spectators from your match.' });
    }
    const m = sessions.get(target);
    if (m) {
        m.delete(spectatorId);
        if (m.size === 0) sessions.delete(target);
    }
    res.json({ ok: true });
});

// Combined poll: returns state + new reactions since `?since=N`. Bumps the
// caller's lastSeen so they stay in the session map. The target polls the
// SAME endpoint to receive reactions; caller === target is honoured.
router.get('/:userId', (req, res) => {
    const target = parseInt(req.params.userId, 10);
    if (!Number.isFinite(target)) return res.status(400).json({ error: 'Bad user id' });
    const me = req.user.id;

    if (me !== target) {
        if (!acceptedFriendIds(me).includes(target)) {
            return res.status(403).json({ error: 'Only friends can spectate each other.' });
        }
        if (!allowsSpectate(target)) {
            return res.status(403).json({ error: 'That friend has disabled spectating.' });
        }
        // Bump heartbeat; missing session means they never called /start, so
        // implicitly attach (still subject to the MAX_SPECTATORS cap).
        const m = getSession(target);
        const existing = m.get(me);
        if (!existing) {
            if (m.size >= MAX_SPECTATORS) {
                return res.status(409).json({ error: 'Too many spectators on this match.' });
            }
            const meInfo = userPublicInfo(me);
            const now = Date.now();
            m.set(me, {
                id: me,
                username: meInfo ? meInfo.username : `player ${me}`,
                cosmetics: meInfo ? meInfo.cosmetics : null,
                selectedTitle: meInfo ? meInfo.selectedTitle : null,
                joinedAt: now,
                lastSeen: now,
                lastReactionAt: 0,
            });
        } else {
            existing.lastSeen = Date.now();
        }
    }

    const state = buildState(target, me, req.query.since);
    if (!state) return res.status(404).json({ error: 'User not found' });
    res.json(state);
});

router.post('/:userId/react', (req, res) => {
    const target = parseInt(req.params.userId, 10);
    if (!Number.isFinite(target)) return res.status(400).json({ error: 'Bad user id' });
    const me = req.user.id;
    if (me === target) return res.status(400).json({ error: "Can't react to yourself." });
    if (!acceptedFriendIds(me).includes(target)) {
        return res.status(403).json({ error: 'Only friends can react.' });
    }

    const body = req.body || {};
    const kind = body.kind === 'emote' || body.kind === 'message' ? body.kind : null;
    if (!kind) return res.status(400).json({ error: 'Bad reaction kind' });

    let payload = null;
    if (kind === 'emote') {
        const emoteId = typeof body.emoteId === 'string' ? body.emoteId : '';
        // The emote must exist in the catalog, not be the "no emote" slot
        // placeholder, and be owned by the sender. BP-exclusive emotes are
        // valid here once owned via a battlepass claim — only the bucks-buy
        // path rejects them, not reactions.
        if (!emoteId || !CATALOG.emote || !(emoteId in CATALOG.emote) || emoteId === 'none') {
            return res.status(400).json({ error: 'Unknown emote' });
        }
        if (!ownsCosmetic(me, 'emote', emoteId)) {
            return res.status(403).json({ error: "You don't own that emote." });
        }
        payload = { emoteId };
    } else {
        const messageId = parseInt(body.messageId, 10);
        if (!Number.isInteger(messageId) || messageId < 0 || messageId >= SPECTATOR_PHRASES.length) {
            return res.status(400).json({ error: 'Unknown message' });
        }
        payload = { messageId, text: String(SPECTATOR_PHRASES[messageId]).slice(0, MESSAGE_TEXT_LIMIT) };
    }

    const mySession = getSession(target);
    const entry = mySession.get(me);
    const now = Date.now();
    if (!entry) return res.status(409).json({ error: 'Not spectating' });
    if (now - entry.lastReactionAt < REACTION_RATE_LIMIT_MS) {
        res.setHeader('Retry-After', '1');
        return res.status(429).json({ error: 'Slow down a moment.' });
    }
    entry.lastReactionAt = now;
    entry.lastSeen = now;

    const log = getReactionLog(target);
    const reaction = {
        id: log.nextId++,
        fromId: me,
        fromUsername: entry.username,
        fromCosmetics: entry.cosmetics,
        kind,
        payload,
        ts: now,
        expiresAt: now + REACTION_TTL_MS,
    };
    log.items.push(reaction);
    if (log.items.length > MAX_RECENT_REACTIONS) {
        log.items.splice(0, log.items.length - MAX_RECENT_REACTIONS);
    }

    res.json({ ok: true, id: reaction.id });
});

// Periodic GC — drops stale spectators + expired reactions. Same 30s tick
// cadence as the multiplayer cleanup; .unref() so test runners can exit.
setInterval(() => {
    const now = Date.now();
    for (const targetId of [...sessions.keys()]) pruneStaleSpectators(targetId, now);
    for (const targetId of [...reactions.keys()]) pruneExpiredReactions(targetId, now);
}, 30 * 1000).unref?.();

module.exports = router;
module.exports.spectatorCount = spectatorCount;
module.exports.lastReactionId = lastReactionId;
