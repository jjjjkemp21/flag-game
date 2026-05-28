const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { lobbies } = require('../lobbies');

const router = express.Router();
router.use(requireAuth);

// In-memory lobby store lives in ../lobbies so the spectator router can read it.
// Matches are short-lived (a redeploy clears them, which is fine for transient
// games). No WebSockets: clients play locally and poll for the shared
// scoreboard, which is robust behind the reverse proxy and plenty responsive
// for a score race.

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I/L
const LOBBY_TTL_MS = 2 * 60 * 60 * 1000;   // hard cap on lobby age
const IDLE_MS = 3 * 60 * 1000;             // drop members who stop polling
const EMPTY_GRACE_MS = 30 * 1000;          // close empty lobbies after a grace period
const PREMATCH_COUNTDOWN_MS = 3000;        // 3-2-1 countdown before play begins
// After a race-to-N runner crosses the line, wait this long before finalising
// so a second player whose final POST arrives moments later still counts as a
// tie-break candidate. Winner is decided by EARLIEST server-receive timestamp,
// not by which POST landed first on the wire.
const RACE_FINISH_GRACE_MS = 700;

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
    battle: { players: 2 },  // 1v1 Atlas Battle: each correct hits the rival's Atlas; KO to win
};

// Modes that end when a player reaches the target score (vs. timed modes).
const TARGET_MODES = new Set(['race', 'battle']);

function normalizeConfig(c) {
    c = c || {};
    let mode = MODES[c.mode] ? c.mode : 'race';
    const content = c.content === 'languages' ? 'languages'
        : c.content === 'globe' ? 'globe'
        : 'flags';
    // Globe content is click-on-country only — Atlas Battle would feel awful
    // with a slow place-the-pin loop, so fall it back to race.
    if (content === 'globe' && mode === 'battle') mode = 'race';
    const questionType = c.questionType === 'text' ? 'text' : 'mc';
    const scope = (content === 'flags' || content === 'globe')
        && typeof c.scope === 'string' && c.scope
        ? c.scope.slice(0, 32)
        : 'all';
    let maxPlayers = clampInt(c.maxPlayers, 2, MODES[mode].players, MODES[mode].players);
    if (mode === 'blitz' || mode === 'battle') maxPlayers = 2;
    return {
        mode,
        content,
        questionType,
        strict: !!c.strict,
        scope,
        target: clampInt(c.target, 5, 200, 50),     // race: correct answers to win
        duration: clampInt(c.duration, 20, 300, 60), // blitz/streak: seconds
        maxPlayers,
        // Atlas Bucks gambling: each player antes this amount into the pot at
        // start; winner takes it all. 0 disables wagering (default).
        ante: clampInt(c.ante, 0, 10000, 0),
    };
}

// Atomically debit a player's Atlas Bucks balance. Returns true if the debit
// succeeded (the WHERE-guard ensures we never let a balance go negative even
// if two requests race). Used to collect antes at match start.
function tryDebitBucks(userId, amount) {
    if (!amount || amount <= 0) return true;
    const info = db.prepare('UPDATE users SET bucks = bucks - ? WHERE id = ? AND bucks >= ?')
        .run(amount, userId, amount);
    return info.changes === 1;
}

function creditBucks(userId, amount) {
    if (!amount || amount <= 0) return;
    db.prepare('UPDATE users SET bucks = bucks + ? WHERE id = ?').run(amount, userId);
}

function bucksOf(userId) {
    const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(userId);
    return Math.max(0, Math.round(Number(row && row.bucks) || 0));
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

// Player-chosen display title. Joined into the lobby member at create-time so
// the lobby roster + results scoreboard can render it next to each username.
function selectedTitleOf(userId) {
    try {
        const row = db.prepare('SELECT selected_title FROM users WHERE id = ?').get(userId);
        return row && row.selected_title ? row.selected_title : null;
    } catch (_) {
        return null;
    }
}

function newMember(user) {
    return {
        id: user.id,
        username: user.username,
        cosmetics: cosmeticsOf(user.id),
        selectedTitle: selectedTitleOf(user.id),
        score: 0,
        streak: 0,
        bestStreak: 0,
        finished: false,
        qIndex: 0,
        picks: {},
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        reachedAt: null,
    };
}

// Decide whether a playing lobby has ended, and who won.
function evaluate(lobby) {
    if (lobby.state !== 'playing') return;
    // Don't tally results during the pre-match countdown — endsAt was placed
    // after playsAt, but a stray progress post shouldn't end a target-mode
    // race before everyone has even started.
    if (lobby.playsAt && Date.now() < lobby.playsAt) return;
    const members = Object.values(lobby.members);
    const { mode, target } = lobby.config;

    if (TARGET_MODES.has(mode)) {
        const reached = members.filter((m) => m.score >= target && m.reachedAt);
        if (reached.length === 0) return;
        // Hold the result for a short grace period after the first crossing so
        // a near-simultaneous second finisher isn't disqualified by network
        // jitter alone. Once the grace elapses, the earliest reachedAt wins;
        // ties (same ms) fall back to higher score, then earlier joinedAt.
        const earliest = Math.min(...reached.map((m) => m.reachedAt));
        if (Date.now() - earliest < RACE_FINISH_GRACE_MS) return;
        reached.sort((a, b) => a.reachedAt - b.reachedAt || b.score - a.score || a.joinedAt - b.joinedAt);
        finish(lobby, reached[0].id);
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
    // Tally the win for the multiplayer leaderboard (once per match — finish only
    // runs on the playing -> finished transition). Multiplayer never grants XP.
    if (winnerId) {
        try {
            db.prepare('UPDATE users SET mp_wins = COALESCE(mp_wins, 0) + 1 WHERE id = ?').run(winnerId);
        } catch (_) { /* a transient match win isn't worth failing the request over */ }
    }
    // Pay out the Atlas Bucks pot. Winner takes the lot. If the lobby finishes
    // without a winner (timed mode with no answers), refund equally so nobody
    // loses their stake to a non-event.
    const pot = Math.max(0, Math.round(Number(lobby.pot) || 0));
    if (pot > 0) {
        if (winnerId) {
            try { creditBucks(winnerId, pot); } catch (_) { /* losing pot to an error is worse than a missed credit retry */ }
            lobby.payout = { winnerId, amount: pot };
        } else {
            const ids = Object.keys(lobby.members).map((id) => parseInt(id, 10));
            if (ids.length > 0) {
                const each = Math.floor(pot / ids.length);
                try { ids.forEach((id) => creditBucks(id, each)); } catch (_) { /* ignore */ }
                lobby.payout = { refunded: true, perPlayer: each };
            }
        }
        lobby.pot = 0;
    }
}

// Strip internals and present members as a sorted array for the scoreboard.
function view(lobby, meId) {
    const { mode, target } = lobby.config;
    const metric = mode === 'streak' ? (m) => m.bestStreak : (m) => m.score;
    // The question the viewer is currently on — used to surface what each opponent
    // picked for *that* question (null if they haven't reached/answered it).
    const me = lobby.members[meId];
    const viewerQ = me && me.qIndex != null ? String(me.qIndex) : null;
    const members = Object.values(lobby.members)
        .map((m) => ({
            id: m.id,
            username: m.username,
            cosmetics: m.cosmetics,
            selectedTitle: m.selectedTitle || null,
            score: m.score,
            streak: m.streak,
            bestStreak: m.bestStreak,
            finished: m.finished,
            pick: (m.id !== meId && viewerQ != null && m.picks) ? (m.picks[viewerQ] || null) : null,
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
        playsAt: lobby.playsAt || null,
        endsAt: lobby.endsAt || null,
        serverNow: Date.now(),
        winnerId: lobby.winnerId || null,
        target,
        members,
        // Atlas Bucks pot info — populated for wagering matches so the lobby +
        // results screens can show the stakes and the payout.
        pot: Math.max(0, Math.round(Number(lobby.pot) || 0)),
        payout: lobby.payout || null,
        meBucks: bucksOf(meId),
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

    // Wagering: every member must be able to afford the ante before we start.
    // Check first (cheap), then debit atomically. If any debit fails (race
    // with another tab spending bucks), we refund anything taken and abort.
    const ante = Math.max(0, Math.round(Number(lobby.config.ante) || 0));
    const memberIds = Object.keys(lobby.members).map((id) => parseInt(id, 10));
    if (ante > 0) {
        const broke = memberIds
            .map((id) => ({ id, bucks: bucksOf(id), name: lobby.members[id]?.username || `player ${id}` }))
            .filter((m) => m.bucks < ante);
        if (broke.length > 0) {
            return res.status(409).json({
                error: `Can't start — ${broke.map((m) => m.name).join(', ')} can't cover the ${ante} Atlas Bucks ante.`,
            });
        }
        const debited = [];
        try {
            for (const id of memberIds) {
                if (tryDebitBucks(id, ante)) debited.push(id);
                else throw new Error('debit-race');
            }
            lobby.pot = ante * memberIds.length;
            lobby.payout = null;
        } catch (_) {
            // Refund anything we already took so nobody loses bucks to a race.
            debited.forEach((id) => creditBucks(id, ante));
            return res.status(409).json({ error: 'Could not collect every ante — try again.' });
        }
    } else {
        lobby.pot = 0;
        lobby.payout = null;
    }

    lobby.state = 'playing';
    lobby.seed = Math.floor(Math.random() * 2 ** 31);
    lobby.startedAt = Date.now();
    // 3-2-1 countdown: play actually begins at `playsAt`. Timed modes count
    // from there, scoring is gated client-side until then.
    lobby.playsAt = lobby.startedAt + PREMATCH_COUNTDOWN_MS;
    if (!TARGET_MODES.has(lobby.config.mode)) {
        lobby.endsAt = lobby.playsAt + lobby.config.duration * 1000;
    }
    Object.values(lobby.members).forEach((m) => {
        m.score = 0; m.streak = 0; m.bestStreak = 0; m.finished = false; m.lastSeen = Date.now(); m.reachedAt = null;
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
    lobby.playsAt = null;
    lobby.endsAt = null;
    lobby.seed = 0;
    // Clear wager bookkeeping — the next start will collect fresh antes (which
    // gives players a chance to bow out before re-paying).
    lobby.pot = 0;
    lobby.payout = null;
    Object.values(lobby.members).forEach((m) => {
        m.score = 0; m.streak = 0; m.bestStreak = 0; m.finished = false; m.lastSeen = Date.now(); m.reachedAt = null;
    });
    res.json(view(lobby, req.user.id));
});

router.post('/lobby/:code/progress', (req, res) => {
    const lobby = getLobbyOr404(req, res);
    if (!lobby) return;
    const m = lobby.members[req.user.id];
    if (!m) return res.status(404).json({ error: 'You are not in this lobby.' });
    const b = req.body || {};
    // The client is authoritative for its own score. It can move down as well as
    // up because a wrong answer costs a point, so we set (not max) it, clamped >= 0.
    if (b.score != null) m.score = clampInt(b.score, 0, 100000, m.score);
    m.streak = clampInt(b.streak, 0, 100000, m.streak);
    m.bestStreak = Math.max(m.bestStreak, clampInt(b.bestStreak, 0, 100000, m.bestStreak));
    if (b.finished) m.finished = true;
    // Stamp the first server-receive time at which this member's score crossed
    // the race target. The race-mode evaluator picks the winner by EARLIEST
    // reachedAt (with a short grace) so a near-simultaneous second finisher
    // can still tie-break instead of losing to wire timing.
    if (TARGET_MODES.has(lobby.config.mode)
        && !m.reachedAt
        && m.score >= lobby.config.target
    ) {
        m.reachedAt = Date.now();
    }
    // Track where this player is and what they picked, so other clients can show
    // each opponent's Atlas sitting on the option they chose for that question.
    if (b.qIndex != null) m.qIndex = clampInt(b.qIndex, 0, 1000000, m.qIndex || 0);
    if (typeof b.pick === 'string' && b.qIndex != null) {
        m.picks = m.picks || {};
        m.picks[String(clampInt(b.qIndex, 0, 1000000, 0))] = b.pick.slice(0, 80);
    }
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
