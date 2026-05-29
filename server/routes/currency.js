const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware');
const { priceOf, isDefault, isBpOnly } = require('../cosmeticsCatalog');

const router = express.Router();
router.use(requireAuth);

// Cap on a single admin grant — generous enough for any reasonable reward but
// low enough that a typo can't mint an account into the millions in one click.
const MAX_ADMIN_GRANT = 1_000_000;

// Currency model — XP and Atlas Bucks are siblings, not parent/child.
//
// Economy v2 (2026-05-28): the XP→Bucks trade-in is gone. Bucks land directly
// during play (per correct answer, end-of-run chest, new high-score). The
// lifetime gameplay-earned total lives in `bucks_earned_lifetime`; clients
// push it absolute to PUT /api/stats and the server credits the delta to
// `bucks` so admin grants + purchases aren't clobbered.
//
// `bucks_minted_xp` is retained because the one-shot migration set it to
// each user's earned_xp at v2 cutover — kept so the same migration row can
// never re-grant on re-deploy. New accounts and gameplay never write to it.
// `migration_v2_grant` holds the one-shot patch-notes amount until dismissed.

function safeParseArr(s) {
    if (!s) return [];
    try {
        const v = JSON.parse(s);
        return Array.isArray(v) ? v : [];
    } catch (_) { return []; }
}

function loadOwned(userId) {
    const row = db.prepare('SELECT owned_cosmetics_json FROM users WHERE id = ?').get(userId);
    return new Set(safeParseArr(row && row.owned_cosmetics_json));
}

function saveOwned(userId, set) {
    db.prepare('UPDATE users SET owned_cosmetics_json = ? WHERE id = ?')
        .run(JSON.stringify([...set]), userId);
}

function summary(userId) {
    const row = db.prepare(
        'SELECT bucks, bucks_earned_lifetime, migration_v2_grant, owned_cosmetics_json FROM users WHERE id = ?'
    ).get(userId);
    return {
        bucks: Math.max(0, Math.round(Number(row && row.bucks) || 0)),
        bucksEarnedLifetime: Math.max(0, Math.round(Number(row && row.bucks_earned_lifetime) || 0)),
        migrationGrant: Math.max(0, Math.round(Number(row && row.migration_v2_grant) || 0)),
        ownedCosmetics: safeParseArr(row && row.owned_cosmetics_json),
    };
}

router.get('/', (req, res) => {
    res.json(summary(req.user.id));
});

// Legacy XP→Bucks claim endpoint. Removed in economy v2 (2026-05-28) — Bucks
// now land directly during play. Returns 410 Gone so any straggling clients
// surface an actionable error instead of silently no-oping.
router.post('/claim', (req, res) => {
    res.status(410).json({
        error: 'The XP trade-in is gone — Atlas Bucks now land directly as you play.',
    });
});

// Dismiss the one-shot v2 patch-notes modal. Clears migration_v2_grant so the
// modal never appears again for this user.
router.post('/dismiss-migration', (req, res) => {
    db.prepare('UPDATE users SET migration_v2_grant = 0 WHERE id = ?').run(req.user.id);
    res.json(summary(req.user.id));
});

// Buy a cosmetic. Validates the catalog id + price, deducts the cost from the
// player's bucks, and adds the "category:id" key to their owned set.
router.post('/buy', (req, res) => {
    const { category, id } = req.body || {};
    if (typeof category !== 'string' || typeof id !== 'string') {
        return res.status(400).json({ error: 'Need a category and id.' });
    }
    const price = priceOf(category, id);
    if (price === null) {
        return res.status(404).json({ error: 'No such cosmetic.' });
    }
    // Atlas Pass cosmetics can never be purchased — they're only unlocked by
    // claiming a battlepass tier. Refuse even if the client somehow sends one.
    if (isBpOnly(category, id)) {
        return res.status(403).json({ error: 'This item is only available through the Atlas Pass.' });
    }
    if (price === 0 || isDefault(category, id)) {
        // Defaults are always free + already owned — nothing to do but report success.
        return res.json({ bought: true, ...summary(req.user.id) });
    }
    const key = `${category}:${id}`;
    const tx = db.transaction(() => {
        const row = db.prepare('SELECT bucks, owned_cosmetics_json FROM users WHERE id = ?').get(req.user.id);
        const owned = new Set(safeParseArr(row && row.owned_cosmetics_json));
        if (owned.has(key)) return { error: 'already-owned' };
        const balance = Math.max(0, Math.round(Number(row && row.bucks) || 0));
        if (balance < price) return { error: 'insufficient' };
        owned.add(key);
        const nextBalance = balance - price;
        db.prepare('UPDATE users SET bucks = ?, owned_cosmetics_json = ? WHERE id = ?')
            .run(nextBalance, JSON.stringify([...owned]), req.user.id);
        return { ok: true };
    });
    const out = tx();
    if (out.error === 'already-owned') return res.status(409).json({ error: 'You already own this.' });
    if (out.error === 'insufficient') return res.status(402).json({ error: 'Not enough Atlas Bucks.' });
    res.json({ bought: true, ...summary(req.user.id) });
});

// Admin grant: directly add (or remove) Atlas Bucks on any user by username.
// Only touches the `bucks` balance — `bucks_minted_xp` is left alone so the
// recipient's XP→bucks trade-in accounting stays correct. Negative amounts are
// allowed (clamped so the balance never goes below 0) so admins can also
// claw back an accidental over-grant.
router.post('/admin/grant', requireAdmin, (req, res) => {
    const { username, amount } = req.body || {};
    if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username is required.' });
    }
    const delta = Math.trunc(Number(amount));
    if (!Number.isFinite(delta) || delta === 0) {
        return res.status(400).json({ error: 'Amount must be a non-zero number.' });
    }
    if (Math.abs(delta) > MAX_ADMIN_GRANT) {
        return res.status(400).json({ error: `Amount must be between -${MAX_ADMIN_GRANT} and ${MAX_ADMIN_GRANT}.` });
    }
    const target = db
        .prepare('SELECT id, username, bucks FROM users WHERE username = ? COLLATE NOCASE')
        .get(username.trim());
    if (!target) return res.status(404).json({ error: 'No user with that username.' });

    const current = Math.max(0, Math.round(Number(target.bucks) || 0));
    const nextBalance = Math.max(0, current + delta);
    db.prepare('UPDATE users SET bucks = ? WHERE id = ?').run(nextBalance, target.id);
    res.json({
        ok: true,
        username: target.username,
        granted: nextBalance - current,
        bucks: nextBalance,
    });
});

module.exports = router;
