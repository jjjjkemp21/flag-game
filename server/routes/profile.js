const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
    const row = db.prepare('SELECT region, cosmetics_json FROM users WHERE id = ?').get(req.user.id);
    res.json({
        region: row.region || null,
        cosmetics: row.cosmetics_json ? JSON.parse(row.cosmetics_json) : null,
    });
});

// Partial update of region and/or equipped cosmetics.
router.put('/', (req, res) => {
    const { region, cosmetics } = req.body || {};
    if (region !== undefined) {
        const code = region === null ? null : String(region).slice(0, 8);
        db.prepare('UPDATE users SET region = ? WHERE id = ?').run(code, req.user.id);
    }
    if (cosmetics && typeof cosmetics === 'object') {
        db.prepare('UPDATE users SET cosmetics_json = ? WHERE id = ?')
            .run(JSON.stringify(cosmetics), req.user.id);
    }
    res.json({ ok: true });
});

module.exports = router;
