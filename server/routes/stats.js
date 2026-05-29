const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware');
const { totalXp, legacyBaseXp } = require('../xp');
const { XP_ROAD_MILESTONES } = require('../xpRoadCatalog');

const router = express.Router();

// Auto-grant any XP Road milestones the player's new earned XP has just
// crossed. Mutates the passed arrays/totals in place and returns the list of
// granted milestone ids so the caller can include it in the API response.
// Idempotent: a milestone is granted at most once thanks to the claimed-set
// check, even if earned_xp is pushed identically several times in a row.
function applyXpRoadGrants(earnedXp, claimedSet, ownedSet, titlesSet, totals) {
    const granted = [];
    for (const mi of XP_ROAD_MILESTONES) {
        if (earnedXp < mi.xp) break; // milestones are catalog-ordered by xp asc
        if (claimedSet.has(mi.id)) continue;
        claimedSet.add(mi.id);
        granted.push(mi.id);
        if (mi.bucks > 0) {
            totals.bucks += mi.bucks;
            totals.bucksLifetime += mi.bucks;
        }
        if (mi.cosmetic && mi.cosmetic.cat && mi.cosmetic.id) {
            ownedSet.add(`${mi.cosmetic.cat}:${mi.cosmetic.id}`);
        }
        if (mi.title) {
            titlesSet.add(mi.title);
        }
    }
    return granted;
}

// Resolve the earned_xp baseline for a row: the stored value, or — for legacy
// accounts where it's still NULL — the old formula's flag-answer portion so XP
// carries over exactly.
function earnedBaseline(row) {
    if (row.earned_xp !== null && row.earned_xp !== undefined) return row.earned_xp;
    const stats = row.stats_json ? safeParse(row.stats_json, []) : [];
    return legacyBaseXp(stats);
}

function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch (_) { return fallback; }
}

// Apply a stats update for a user id. Shared by the authed PUT and the
// unload-time beacon. Only provided fields change; XP is recomputed from the
// resulting combined state. Auto-grants any newly-crossed XP Road milestones
// (bucks credited, cosmetics added to the owned set, titles unlocked) and
// returns the granted ids so the client can show a celebration.
function applyUpdate(userId, body) {
    const { flagStats, bonusScores, earnedXp, bucksEarnedLifetime } = body || {};
    if (flagStats !== undefined && !Array.isArray(flagStats)) {
        return { error: 'flagStats must be an array.' };
    }

    const row = db
        .prepare(
            'SELECT stats_json, bonus_scores_json, earned_xp, bucks, bucks_earned_lifetime, claimed_xproad_json, owned_cosmetics_json, xp_road_titles_json FROM users WHERE id = ?'
        )
        .get(userId);
    if (!row) return { error: 'User not found.' };

    const newFlagStats = Array.isArray(flagStats)
        ? flagStats
        : (row.stats_json ? safeParse(row.stats_json, []) : []);
    const newBonus = bonusScores && typeof bonusScores === 'object'
        ? bonusScores
        : (row.bonus_scores_json ? safeParse(row.bonus_scores_json, {}) : {});

    // Last-write-wins (consistent with flag stats): use the client's absolute
    // earned_xp when provided, else keep the existing/seeded baseline.
    const newEarned = Number.isFinite(Number(earnedXp))
        ? Math.max(0, Math.round(Number(earnedXp)))
        : earnedBaseline(row);

    // Bucks earned lifetime is monotonic. The delta between incoming and stored
    // is credited to the spendable `bucks` balance (admin grants + purchases on
    // the same balance are preserved because we only add the delta, never
    // overwrite). Clients send the absolute lifetime number on every push.
    let newBucksLifetime = Math.max(0, Math.round(Number(row.bucks_earned_lifetime) || 0));
    let nextBucks = Math.max(0, Math.round(Number(row.bucks) || 0));
    if (Number.isFinite(Number(bucksEarnedLifetime))) {
        const incoming = Math.max(0, Math.round(Number(bucksEarnedLifetime)));
        if (incoming > newBucksLifetime) {
            nextBucks += incoming - newBucksLifetime;
            newBucksLifetime = incoming;
        }
    }

    // XP Road auto-grants. Reads the three tracking columns, applies any
    // newly-crossed milestones, and we write all three back in the same UPDATE
    // below. The bucks totals are mutated in-place through `totals`.
    const claimedSet = new Set(safeParse(row.claimed_xproad_json, []) || []);
    const ownedSet = new Set(safeParse(row.owned_cosmetics_json, []) || []);
    const titlesSet = new Set(safeParse(row.xp_road_titles_json, []) || []);
    const totals = { bucks: nextBucks, bucksLifetime: newBucksLifetime };
    const grantedXpRoad = applyXpRoadGrants(newEarned, claimedSet, ownedSet, titlesSet, totals);
    nextBucks = totals.bucks;
    newBucksLifetime = totals.bucksLifetime;

    const xp = totalXp(newEarned, newBonus);

    db.prepare(
        `UPDATE users SET stats_json = ?, bonus_scores_json = ?, earned_xp = ?, xp = ?, bucks = ?, bucks_earned_lifetime = ?,
            claimed_xproad_json = ?, owned_cosmetics_json = ?, xp_road_titles_json = ?
         WHERE id = ?`
    ).run(
        JSON.stringify(newFlagStats), JSON.stringify(newBonus), newEarned, xp, nextBucks, newBucksLifetime,
        JSON.stringify([...claimedSet]),
        JSON.stringify([...ownedSet]),
        JSON.stringify([...titlesSet]),
        userId,
    );

    return {
        ok: true,
        xp,
        earnedXp: newEarned,
        bucks: nextBucks,
        bucksEarnedLifetime: newBucksLifetime,
        grantedXpRoad,
    };
}

// Unload beacon: navigator.sendBeacon can't set an Authorization header, so the
// token rides in the query string. Registered before requireAuth.
router.post('/beacon', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).end();
    let uid;
    try {
        uid = jwt.verify(token, JWT_SECRET).uid;
    } catch (_) {
        return res.status(401).end();
    }
    applyUpdate(uid, req.body);
    res.status(204).end();
});

router.use(requireAuth);

router.get('/', (req, res) => {
    const row = db
        .prepare(
            'SELECT stats_json, bonus_scores_json, xp, earned_xp, bucks_earned_lifetime, claimed_xproad_json, xp_road_titles_json FROM users WHERE id = ?'
        )
        .get(req.user.id);
    res.json({
        flagStats: row.stats_json ? JSON.parse(row.stats_json) : null,
        bonusScores: row.bonus_scores_json ? JSON.parse(row.bonus_scores_json) : null,
        xp: row.xp,
        earnedXp: earnedBaseline(row),
        bucksEarnedLifetime: Math.max(0, Math.round(Number(row.bucks_earned_lifetime) || 0)),
        claimedXpRoad: safeParse(row.claimed_xproad_json, []) || [],
        xpRoadTitles: safeParse(row.xp_road_titles_json, []) || [],
    });
});

router.put('/', (req, res) => {
    const result = applyUpdate(req.user.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

// Full Reset Data — wipes per-account progress (flag stats, streaks, pet,
// cosmetics, achievements) so the account becomes a "blank slate" while
// staying logged in. XP and Atlas Bucks are intentionally preserved — the
// player keeps the rewards they've earned even after a reset, so the trade-in
// economy never "punishes" a clean-up.
router.post('/reset', (req, res) => {
    // XP and Atlas Bucks are intentionally preserved (see banner above the
    // /reset comment that used to live here — they're rewards, not progress).
    // claimed_xproad_json + xp_road_titles_json are NOT cleared either: the
    // player keeps cosmetics they already unlocked via the XP Road and their
    // chest yield tier doesn't reset, matching the "you keep what you earned"
    // policy. Wiping flag stats won't change earned_xp anyway, so no
    // milestone is "lost" by the reset.
    db.prepare(
        `UPDATE users SET
            stats_json = NULL,
            streaks_json = NULL,
            pet_json = NULL,
            pet_level = 1,
            cosmetics_json = NULL,
            achievements_json = NULL,
            region = NULL,
            mp_wins = 0,
            selected_title = NULL,
            battlepass_json = NULL
        WHERE id = ?`
    ).run(req.user.id);
    res.json({ ok: true });
});

module.exports = router;
