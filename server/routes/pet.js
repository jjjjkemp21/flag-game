const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
    const row = db.prepare('SELECT pet_json FROM users WHERE id = ?').get(req.user.id);
    res.json({ pet: row && row.pet_json ? JSON.parse(row.pet_json) : null });
});

router.put('/', (req, res) => {
    const { pet } = req.body || {};
    if (!pet || typeof pet !== 'object') {
        return res.status(400).json({ error: 'pet object is required.' });
    }
    db.prepare('UPDATE users SET pet_json = ? WHERE id = ?').run(JSON.stringify(pet), req.user.id);
    res.json({ ok: true });
});

module.exports = router;
