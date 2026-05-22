const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// In-memory lobby store. Matches are short-lived, so lobbies live only in memory
// (a redeploy clears them, which is fine for transient games). No WebSockets:
// clients play locally and poll for the shared scoreboard, which is robust behind
// the reverse proxy and plenty responsive for a score race.
const lobbies = new Map(); // code -> lobby

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I/L
const LOBBY_TTL_MS = 2 * 60 * 60 * 1000;   // hard cap on lobby age
const IDLE_MS = 3 * 60 * 1000;             // drop members who stop polling
const EMPTY_GRACE_MS = 30 * 1000;          // close empty lobbies after a grace period

function clampInt(v, min, max, dflt) {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return dflt;
    return Math.min(max, Math.max(min, n));
}

// The set of game modes. Each is the same per-answer engine with a different
// win condition, so they're all configurable in the same way.
const MODES = {
    blitz:  { players: 2 },  // 1v1: most correct before the clock runs out
    race:   { players: 8 },  // first to N correct wins
    streak: { players: 8 },  // highest answer streak before time runs out
};

function normalizeConfig(c) {
    c = c || {};
    const mode = MODES[c.mode] ? c.mode : 'race';
    const content = c.content === 'languages' ? 'languages' : 'flags';
    const questionType = c.questionType === 'text' ? 'text' : 'mc';
    const scope = content === 'flags' && typeof c.scope === 'string' && c.scope
        ? c.scope.slice(0, 32)
        : 'all';
    let maxPlayers = clampInt(c.maxPlayers, 2, MODES[mode].players, MODES[mode].players);
    if (mode === 'blitz') maxPlayers = 2;
    return {
        mode,
        content,
        questionType,
        strict: !!c.strict,
        scope,
        target: clampInt(c.target, 5, 200, 50),     // race: correct answers to win
        duration: clampInt(c.duration, 20, 300, 60), // blitz/streak: seconds
        maxPlayers,
    };
}

function generateCode() {
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    } while (lobbies.has(code));
    return code;
}

function cosmeticsOf(userId) {
    try {
        const row = db.prepare('SELECT cosmetics_json FROM users WHERE id = ?').get(userId);
        return row && row.cosmetics_json ? JSON.parse(row.cosmetics_json) : null;
    } catch (_) {
        return null;
    }
}

function newMember(user) {
    return {
        id: user.id,
        username: user.username,
        cosmetics: cosmeticsOf(user.id),
        score: 0,
        streak: 0,
        bestStreak: 0,
        finished: false,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
    };
}

// Decide whether a playing lobby has ended, and who won.
function evaluate(lobby) {
    if (lobby.state !== 'playing') return;
    const members = Object.values(lobby.members);
    const { mode, target } = lobby.config;

    if (mode === 'race') {
        const reached = members.filter((m) => m.score >= target);
        if (reached.length > 0) {
            reached.sort((a, b) => b.score - a.score);
            finish(lobby, reached[0].id);
        }
        return;
    }

    // Timed modes (blitz / streak)
    if (Date.now() >= lobby.endsAt) {
        const metric = mode === 'streak' ? (m) => m.bestStreak : (m) => m.score;
        const ranked = [...members].sort((a, b) => metric(b) - metric(a) || a.joinedAt - b.joinedAt);
        finish(lobby, ranked.length ? ranked[0].id : null);
    }
}

function finish(lobby, winnerId) {
    lobby.state = 'finished';
    lobby.winnerId = winnerId;
    lobby.finishedAt = Date.now();
}

// Strip internals and present members as a sorted array for the scoreboard.
function view(lobby, meId) {
    const { mode, target } = lobby.config;
    const metric = mode === 'streak' ? (m) => m.bestStreak : (m) => m.score;
    const members = Object.values(lobby.members)
        .map((m) => ({
            id: m.id,
            username: m.username,
            cosmetics: m.cosmetics,
            score: m.score,
            streak: m.streak,
            bestStreak: m.bestStreak,
            finished: m.finished,
        }))
        .sort((a, b) => metric(b) - metric(a) || a.score - b.score);
    return {
        code: lobby.code,
        hostId: lobby.hostId,
        isHost: lobby.hostId === meId,
        state: lobby.state,
        config: lobby.config,
        seed: lobby.seed,
        startedAt: lobby.startedAt || null,
        endsAt: lobby.endsAt || null,
        serverNow: Date.now(),
        winnerId: lobby.winnerId || null,
        target,
        members,
    };
}

function getLobbyOr404(req, res) {
    const lobby = lobbies.get((req.params.code || '').toUpperCase());
    if (!lobby) {
        res.status(404).json({ error: 'Lobby not found. Check the code.' });
        return null;
    }
    return lobby;
}

// ---- Routes ----

router.post('/lobby', (req, res) => {
    const config = normalizeConfig(req.body && req.body.config);
    const code = generateCode();
    const lobby = {
        code,
        hostId: req.user.id,
        state: 'lobby',
        config,
        members: {},
        seed: 0,
        createdAt: Date.now(),
    };
    lobby.members[req.user.id] = newMember(req.user);
    lobbies.set(code, lobby);
    res.json(view(lobby, req.user.id));
});

router.post('/lobby/:code/join', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    const me = req.user.id;
    if (!lobby.members[me]) {
        if (lobby.state !== 'lobby') return res.status(409).json({ error: 'That match has already started.' });
        if (Object.keys(lobby.members).length >= lobby.config.maxPlayers) {
            return res.status(409).json({ error: 'Lobby is full.' });
        }
        lobby.members[me] = newMember(req.user);
    } else {
        lobby.members[me].lastSeen = Date.now();
    }
    res.json(view(lobby, me));
});

router.post('/lobby/:code/leave', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    delete lobby.members[req.user.id];
    const remaining = Object.keys(lobby.members);
    if (remaining.length === 0) {
        lobby.emptyAt = Date.now();
    } else if (lobby.hostId === req.user.id) {
        lobby.hostId = parseInt(remaining[0], 10); // hand off host
    }
    if (lobby.state === 'playing') evaluate(lobby);
    res.json({ ok: true });
});

router.put('/lobby/:code/config', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    if (lobby.hostId !== req.user.id) return res.status(403).json({ error: 'Only the host can change settings.' });
    if (lobby.state !== 'lobby') return res.status(409).json({ error: 'Cannot change settings after the match starts.' });
    lobby.config = normalizeConfig(req.body && req.body.config);
    // Trim members if the new cap is lower.
    const ids = Object.keys(lobby.members);
    if (ids.length > lobby.config.maxPlayers) {
        ids.slice(lobby.config.maxPlayers).forEach((id) => {
            if (parseInt(id, 10) !== lobby.hostId) delete lobby.members[id];
        });
    }
    res.json(view(lobby, req.user.id));
});

router.post('/lobby/:code/start', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    if (lobby.hostId !== req.user.id) return res.status(403).json({ error: 'Only the host can start.' });
    if (lobby.state !== 'lobby') return res.status(409).json({ error: 'Already started.' });
    lobby.state = 'playing';
    lobby.seed = Math.floor(Math.random() * 2 ** 31);
    lobby.startedAt = Date.now();
    if (lobby.config.mode !== 'race') {
        lobby.endsAt = lobby.startedAt + lobby.config.duration * 1000;
    }
    Object.values(lobby.members).forEach((m) => {
        m.score = 0; m.streak = 0; m.bestStreak = 0; m.finished = false; m.lastSeen = Date.now();
    });
    res.json(view(lobby, req.user.id));
});

router.post('/lobby/:code/reset', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    if (lobby.hostId !== req.user.id) return res.status(403).json({ error: 'Only the host can restart.' });
    lobby.state = 'lobby';
    lobby.winnerId = null;
    lobby.startedAt = null;
    lobby.endsAt = null;
    lobby.seed = 0;
    Object.values(lobby.members).forEach((m) => {
        m.score = 0; m.streak = 0; m.bestStreak = 0; m.finished = false; m.lastSeen = Date.now();
    });
    res.json(view(lobby, req.user.id));
});

router.post('/lobby/:code/progress', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    const m = lobby.members[req.user.id];
    if (!m) return res.status(404).json({ error: 'You are not in this lobby.' });
    const b = req.body || {};
    // Scores only move forward (guards against out-of-order posts).
    m.score = Math.max(m.score, clampInt(b.score, 0, 100000, m.score));
    m.streak = clampInt(b.streak, 0, 100000, m.streak);
    m.bestStreak = Math.max(m.bestStreak, clampInt(b.bestStreak, 0, 100000, m.bestStreak));
    if (b.finished) m.finished = true;
    m.lastSeen = Date.now();
    evaluate(lobby);
    res.json(view(lobby, req.user.id));
});

router.get('/lobby/:code', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    const m = lobby.members[req.user.id];
    if (m) m.lastSeen = Date.now();
    evaluate(lobby); // finalize timed matches even if nobody posted
    res.json(view(lobby, req.user.id));
});

// Periodic cleanup of idle members and stale/empty lobbies.
setInterval(() => {
    const now = Date.now();
    for (const [code, lobby] of lobbies) {
        // Drop members who stopped polling while still in the lobby room.
        if (lobby.state === 'lobby') {
            for (const [id, m] of Object.entries(lobby.members)) {
                if (now - m.lastSeen > IDLE_MS) {
                    delete lobby.members[id];
                    if (lobby.hostId === parseInt(id, 10)) {
                        const rest = Object.keys(lobby.members);
                        if (rest.length) lobby.hostId = parseInt(rest[0], 10);
                    }
                }
            }
        }
        const empty = Object.keys(lobby.members).length === 0;
        if (empty && !lobby.emptyAt) lobby.emptyAt = now;
        if (!empty) lobby.emptyAt = null;
        const expired = now - lobby.createdAt > LOBBY_TTL_MS;
        const emptyExpired = lobby.emptyAt && now - lobby.emptyAt > EMPTY_GRACE_MS;
        if (expired || emptyExpired) lobbies.delete(code);
    }
}, 30 * 1000).unref?.();

module.exports = router;
