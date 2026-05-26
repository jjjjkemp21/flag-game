const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.use(requireAuth);

const MAX_BODY = 1000;

// Friendship guard — only accepted (mutual) friends can DM each other.
function areFriends(a, b) {
    const row = db
        .prepare(
            `SELECT 1 FROM friendships
             WHERE status = 'accepted'
               AND ((requester_id = ? AND addressee_id = ?)
                 OR (requester_id = ? AND addressee_id = ?))`
        )
        .get(a, b, b, a);
    return !!row;
}

// GET /api/messages — inbox + sent + unreadCount in one trip.
router.get('/', (req, res) => {
    const me = req.user.id;
    const received = db
        .prepare(
            `SELECT m.id, m.body, m.created_at, m.read_at,
                    u.id AS from_id, u.username AS from_username
             FROM messages m JOIN users u ON u.id = m.sender_id
             WHERE m.recipient_id = ?
             ORDER BY m.created_at DESC
             LIMIT 100`
        )
        .all(me);
    const sent = db
        .prepare(
            `SELECT m.id, m.body, m.created_at, m.read_at,
                    u.id AS to_id, u.username AS to_username
             FROM messages m JOIN users u ON u.id = m.recipient_id
             WHERE m.sender_id = ?
             ORDER BY m.created_at DESC
             LIMIT 100`
        )
        .all(me);
    const unreadCount = db
        .prepare('SELECT COUNT(*) AS n FROM messages WHERE recipient_id = ? AND read_at IS NULL')
        .get(me).n;
    res.json({ received, sent, unreadCount });
});

// POST /api/messages — send to a friend (validated server-side).
router.post('/', (req, res) => {
    const { recipient, body } = req.body || {};
    const text = String(body || '').trim();
    if (!recipient || !text) {
        return res.status(400).json({ error: 'Recipient and message are required.' });
    }
    if (text.length > MAX_BODY) {
        return res.status(400).json({ error: `Message must be ${MAX_BODY} characters or fewer.` });
    }
    const target = db.prepare('SELECT id FROM users WHERE username = ?').get(String(recipient));
    if (!target) return res.status(404).json({ error: 'No user with that username.' });
    if (target.id === req.user.id) return res.status(400).json({ error: "You can't message yourself." });
    if (!areFriends(req.user.id, target.id)) {
        return res.status(403).json({ error: 'You can only message accepted friends.' });
    }
    const info = db
        .prepare('INSERT INTO messages (sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?)')
        .run(req.user.id, target.id, text, Date.now());
    res.json({ ok: true, id: info.lastInsertRowid });
});

// POST /api/messages/mark-read — mark all received messages read.
router.post('/mark-read', (req, res) => {
    const info = db
        .prepare('UPDATE messages SET read_at = ? WHERE recipient_id = ? AND read_at IS NULL')
        .run(Date.now(), req.user.id);
    res.json({ ok: true, updated: info.changes });
});

// DELETE /api/messages/:id — sender OR recipient may delete their copy.
// Both sides share one row, so this deletes the conversation entry for both;
// keeping a per-side soft-delete is overkill for the current scope.
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid message id.' });
    }
    const info = db
        .prepare('DELETE FROM messages WHERE id = ? AND (sender_id = ? OR recipient_id = ?)')
        .run(id, req.user.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json({ ok: true });
});

module.exports = router;
