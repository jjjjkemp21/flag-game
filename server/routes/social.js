const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { masteredCount } = require('../xp');

const router = express.Router();

router.use(requireAuth);

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

router.get('/leaderboard', (req, res) => {
    const scope = req.query.scope === 'friends' ? 'friends' : 'global';
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

    let rows;
    if (scope === 'friends') {
        const ids = acceptedFriendIds(req.user.id);
        ids.push(req.user.id);
        const placeholders = ids.map(() => '?').join(',');
        rows = db
            .prepare(
                `SELECT id, username, xp, stats_json FROM users
                 WHERE id IN (${placeholders}) ORDER BY xp DESC, username ASC LIMIT ?`
            )
            .all(...ids, limit);
    } else {
        rows = db
            .prepare(
                `SELECT id, username, xp, stats_json FROM users
                 ORDER BY xp DESC, username ASC LIMIT ?`
            )
            .all(limit);
    }

    const entries = rows.map((r, i) => ({ ...withMastered(r), rank: i + 1 }));

    // Caller's overall global rank (independent of the displayed page).
    const higher = db
        .prepare('SELECT COUNT(*) AS c FROM users WHERE xp > ?')
        .get(req.user.xp).c;

    res.json({ scope, entries, myRank: higher + 1, myXp: req.user.xp });
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
