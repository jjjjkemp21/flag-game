const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
    const list = db
        .prepare('SELECT id, title, body, created_at FROM announcements ORDER BY id DESC LIMIT 100')
        .all();
    const unreadCount = list.filter((a) => a.id > req.user.last_read_announcement_id).length;
    res.json({ announcements: list, unreadCount });
});

router.post('/mark-read', (req, res) => {
    const newest = db.prepare('SELECT MAX(id) AS maxId FROM announcements').get().maxId || 0;
    db.prepare('UPDATE users SET last_read_announcement_id = ? WHERE id = ?').run(newest, req.user.id);
    res.json({ ok: true, lastReadAnnouncementId: newest });
});

router.post('/', requireAdmin, (req, res) => {
    const { title, body } = req.body || {};
    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required.' });
    }
    const info = db
        .prepare('INSERT INTO announcements (title, body, created_at, created_by) VALUES (?, ?, ?, ?)')
        .run(String(title), String(body), Date.now(), req.user.id);
    res.json({ ok: true, id: info.lastInsertRowid });
});

// Wipe every announcement (admin only). Also resets every user's
// last_read_announcement_id and the AUTOINCREMENT counter so any future
// announcement starts from id = 1 and reads as unread for everyone. The
// undo path is "post a new announcement" — this is intentionally permanent.
router.delete('/', requireAdmin, (req, res) => {
    const info = db.prepare('DELETE FROM announcements').run();
    db.exec('UPDATE users SET last_read_announcement_id = 0');
    try {
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'announcements'");
    } catch (_) { /* table doesn't exist if AUTOINCREMENT never used */ }
    res.json({ ok: true, deleted: info.changes });
});

module.exports = router;
