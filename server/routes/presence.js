const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
// ./spectate is required lazily inside the handler — both modules import each
// other (presence reads spectator counts; spectate reads presence state) and
// a top-level require here would resolve to a half-initialised module.

const router = express.Router();
router.use(requireAuth);

// In-memory presence map. Same lifecycle model as multiplayer lobbies: lives
// only while the server is up, redeploy clears it. Polled by the client every
// 5s via /heartbeat; stale entries (no heartbeat for SPECTATABLE_TTL_MS) are
// filtered out of /friends responses and garbage-collected by the cleanup tick.
//
// Shape: presence.get(userId) = { mode, mpCode, gameState, startedAt, lastSeen }
//   - mode: 'multiple-choice' | 'multiplayer' | ... | null
//   - mpCode: 4-char lobby code when mode='multiplayer'
//   - gameState: thin snapshot of solo-mode play state (score, streak, qIndex,
//     promptFlagCode, ...). For multiplayer the spectator reads state from the
//     lobby directly, so this is null/omitted.
const presence = new Map();

const SPECTATABLE_TTL_MS = 8000; // a player whose heartbeat stopped 8s ago is "no longer playing"
const HEARTBEAT_BODY_LIMIT = 4096; // body is already capped by express.json; this is belt+braces

// Allowed solo + MP mode keys. Anything else is treated as `null` (clearing).
const VALID_MODES = new Set([
    'multiple-choice', 'free-response', 'mirror', 'flash', 'reverse-mc',
    'globe', 'pixelated-quiz', 'frenzy-quiz', 'longest-route-quiz', 'language-quiz',
    'multiplayer',
]);

function clampInt(v, min, max, dflt) {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return dflt;
    return Math.min(max, Math.max(min, n));
}

function sanitizeGameState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const gs = {};
    if (raw.score != null)      gs.score = clampInt(raw.score, 0, 1000000, 0);
    if (raw.streak != null)     gs.streak = clampInt(raw.streak, 0, 1000000, 0);
    if (raw.bestStreak != null) gs.bestStreak = clampInt(raw.bestStreak, 0, 1000000, 0);
    if (raw.qIndex != null)     gs.qIndex = clampInt(raw.qIndex, 0, 1000000, 0);
    if (raw.finished != null)   gs.finished = !!raw.finished;
    if (raw.lastAnswerCorrect != null) gs.lastAnswerCorrect = !!raw.lastAnswerCorrect;
    // Prompt hint — exposes what the player is currently looking at WITHOUT
    // leaking the answer (see SpectatorScreen / planning doc section 3 for the
    // mode-by-mode audit). Capped to short strings.
    if (raw.promptKind && typeof raw.promptKind === 'string') {
        gs.promptKind = raw.promptKind.slice(0, 16);
    }
    if (raw.promptFlagCode && typeof raw.promptFlagCode === 'string') {
        gs.promptFlagCode = raw.promptFlagCode.slice(0, 8).toUpperCase();
    }
    if (raw.promptCountry && typeof raw.promptCountry === 'string') {
        gs.promptCountry = raw.promptCountry.slice(0, 80);
    }
    // Multiple-choice options surfaced to spectators so they can follow along
    // and see which choice the player is weighing. Capped to 4 short strings.
    if (Array.isArray(raw.options)) {
        gs.options = raw.options
            .slice(0, 4)
            .filter((s) => typeof s === 'string')
            .map((s) => s.slice(0, 80));
    }
    return gs;
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

function isFresh(entry, now) {
    return entry && entry.mode && (now - entry.lastSeen) <= SPECTATABLE_TTL_MS;
}

// Public read used by the spectate router so it can look up the target's
// current mode + game state without duplicating the storage.
function getPresence(userId) {
    const entry = presence.get(userId);
    if (!isFresh(entry, Date.now())) return null;
    return entry;
}

// ---- Routes ----

// Heartbeat. Called every ~5s while a quiz/match is active, and once on unmount
// with mode:null to clear. Response carries the spectator count + the highest
// reaction id the caller's spectators have already sent, so the target client
// knows when to start its own spectate poll (and where to resume `since` from).
router.post('/heartbeat', (req, res) => {
    if (JSON.stringify(req.body || {}).length > HEARTBEAT_BODY_LIMIT) {
        return res.status(413).json({ error: 'Heartbeat too large' });
    }
    const me = req.user.id;
    const body = req.body || {};
    const rawMode = typeof body.mode === 'string' ? body.mode : null;
    const mode = VALID_MODES.has(rawMode) ? rawMode : null;

    if (!mode) {
        presence.delete(me);
        return res.json({ ok: true, watchers: 0, lastReactionId: 0 });
    }

    const mpCode = (mode === 'multiplayer' && typeof body.mpCode === 'string')
        ? body.mpCode.slice(0, 8).toUpperCase()
        : null;
    const gameState = sanitizeGameState(body.gameState);
    const now = Date.now();
    const prev = presence.get(me);

    presence.set(me, {
        mode,
        mpCode,
        gameState,
        startedAt: (prev && prev.mode === mode) ? prev.startedAt : now,
        lastSeen: now,
    });

    const spectate = require('./spectate');
    res.json({
        ok: true,
        watchers: spectate.spectatorCount(me),
        lastReactionId: spectate.lastReactionId(me),
    });
});

// Friend presence — which of the caller's friends are currently playing.
// Returns a small map keyed by friend id so the Friends UI can light up an
// Eye icon next to each active friend without N round-trips. Friends who've
// opted out of spectating are omitted entirely (so the Eye icon never appears
// — less revealing than a "private" indicator).
router.get('/friends', (req, res) => {
    const me = req.user.id;
    const friendIds = acceptedFriendIds(me);
    const now = Date.now();
    const out = {};
    if (friendIds.length === 0) {
        return res.json({ presence: out });
    }
    // One query for the privacy flags of all friends — cheaper than N lookups.
    const placeholders = friendIds.map(() => '?').join(',');
    const privacyRows = db
        .prepare(`SELECT id, allow_spectate FROM users WHERE id IN (${placeholders})`)
        .all(...friendIds);
    const privacy = new Map(privacyRows.map((r) => [r.id, r.allow_spectate !== 0]));
    for (const id of friendIds) {
        if (!privacy.get(id)) continue;
        const entry = presence.get(id);
        if (!isFresh(entry, now)) continue;
        out[id] = {
            mode: entry.mode,
            mpCode: entry.mode === 'multiplayer' ? entry.mpCode : null,
            startedAt: entry.startedAt,
        };
    }
    res.json({ presence: out });
});

// Single-user presence lookup — used by the SpectatorScreen before subscribing
// so it can show a friendly "no longer playing" message if the friend logged
// off between Eye-click and screen mount. Friend-of-target enforcement is
// applied so a stranger can't probe presence by user id.
router.get('/:userId', (req, res) => {
    const target = parseInt(req.params.userId, 10);
    if (!Number.isFinite(target)) return res.status(400).json({ error: 'Bad user id' });
    const me = req.user.id;
    if (target !== me && !acceptedFriendIds(me).includes(target)) {
        return res.status(403).json({ error: 'Not a friend' });
    }
    const entry = presence.get(target);
    if (!isFresh(entry, Date.now())) return res.status(404).json({ error: 'Not playing' });
    res.json({
        mode: entry.mode,
        mpCode: entry.mode === 'multiplayer' ? entry.mpCode : null,
        startedAt: entry.startedAt,
    });
});

// Periodic GC. Drops stale entries so the map never grows unbounded — clients
// that crash/close tabs stop heartbeating and get evicted here, not just when
// /friends is hit. Stale TTL is generous so a brief network hiccup doesn't
// flicker the spectate badge.
const STALE_MS = SPECTATABLE_TTL_MS * 4; // give a bigger grace before full eviction
setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of presence) {
        if (!entry || now - entry.lastSeen > STALE_MS) presence.delete(id);
    }
}, 30 * 1000).unref?.();

module.exports = router;
module.exports.getPresence = getPresence;
module.exports.acceptedFriendIds = acceptedFriendIds;
