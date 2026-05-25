const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware');
const { priceOf, isDefault, isBpOnly } = require('../cosmeticsCatalog');

const router = express.Router();
router.use(requireAuth);

// Cap on a single admin grant — generous enough for any reasonable reward but
// low enough that a typo can't mint an account into the millions in one click.
const MAX_ADMIN_GRANT = 1_000_000;

// Currency model — XP and Atlas Bucks are independent.
//
// `earned_xp` tracks lifetime, scaled flag-answer XP and never decreases.
// `bucks_minted_xp` tracks how much of that earned XP has already been
// "traded in" for Atlas Bucks. The trade-in mints (earned_xp - minted_xp) ÷
// RATE bucks into `bucks` and bumps `bucks_minted_xp` so the same XP can't
// be claimed twice. The XP balance itself is untouched — the player keeps
// their XP for leaderboards / mastery while the bucks become spendable.

// 1 Atlas Buck per earned XP — a fair and easy-to-reason-about rate that
// matches the numeric prices the cosmetics catalogue was already calibrated
// for (old XP unlock thresholds are now buck prices).
const XP_PER_BUCK = 1;

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
        'SELECT bucks, bucks_minted_xp, earned_xp, owned_cosmetics_json FROM users WHERE id = ?'
    ).get(userId);
    const earned = Math.max(0, Math.round(Number(row && row.earned_xp) || 0));
    const minted = Math.max(0, Math.round(Number(row && row.bucks_minted_xp) || 0));
    const claimable = Math.max(0, Math.floor((earned - minted) / XP_PER_BUCK));
    return {
        bucks: Math.max(0, Math.round(Number(row && row.bucks) || 0)),
        claimableBucks: claimable,
        mintedXp: minted,
        earnedXp: earned,
        rate: XP_PER_BUCK,
        ownedCosmetics: safeParseArr(row && row.owned_cosmetics_json),
    };
}

router.get('/', (req, res) => {
    res.json(summary(req.user.id));
});

// Trade-in: convert unclaimed earned XP into Atlas Bucks at XP_PER_BUCK.
// The player's XP balance is unchanged — we just remember how much XP has
// been "spent" toward a mint so the same XP isn't claimed twice.
// Optional body.amount lets the client trade only a portion (clamped to
// [1, claimable]); omitting it trades the whole claimable balance.
router.post('/claim', (req, res) => {
    const hasAmount = req.body && req.body.amount != null && req.body.amount !== '';
    const requested = hasAmount ? Math.floor(Number(req.body.amount)) : null;
    if (hasAmount && (!Number.isFinite(requested) || requested <= 0)) {
        return res.status(400).json({ error: 'Amount must be a positive whole number.' });
    }
    const tx = db.transaction(() => {
        const row = db.prepare('SELECT bucks, bucks_minted_xp, earned_xp FROM users WHERE id = ?').get(req.user.id);
        const earned = Math.max(0, Math.round(Number(row && row.earned_xp) || 0));
        const minted = Math.max(0, Math.round(Number(row && row.bucks_minted_xp) || 0));
        const claimable = Math.max(0, Math.floor((earned - minted) / XP_PER_BUCK));
        if (claimable <= 0) return { claimed: 0 };
        const toClaim = requested !== null ? Math.min(requested, claimable) : claimable;
        const newBucks = Math.max(0, Math.round(Number(row && row.bucks) || 0)) + toClaim;
        const newMinted = minted + toClaim * XP_PER_BUCK;
        db.prepare('UPDATE users SET bucks = ?, bucks_minted_xp = ? WHERE id = ?')
            .run(newBucks, newMinted, req.user.id);
        return { claimed: toClaim };
    });
    const { claimed } = tx();
    res.json({ claimed, ...summary(req.user.id) });
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
