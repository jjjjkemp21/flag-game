// XP Road — read-only endpoint for the climbing screen.
// Returns the caller's claimed-milestone set + unlocked XP-Road titles, plus
// the friend roster with each friend's xp/cosmetics/selectedTitle so the screen
// can paint mini-climbers on the vine without a second roundtrip.
//
// Reward auto-grants are NOT issued here — those happen on every /api/stats
// PUT (see applyXpRoadGrants in routes/stats.js). This route is purely a
// snapshot of where the player + their friends currently are on the road.

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

function safeParse(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (_) { return fallback; }
}

router.get('/', (req, res) => {
    const me = req.user.id;
    const myRow = db
        .prepare(
            'SELECT xp, earned_xp, claimed_xproad_json, xp_road_titles_json, cosmetics_json, selected_title FROM users WHERE id = ?'
        )
        .get(me);
    if (!myRow) return res.status(404).json({ error: 'User not found.' });

    // Friend climbers — accepted friendships, in XP order. Limit cols to the
    // ones the climbing-screen actually needs.
    const friends = db
        .prepare(
            `SELECT u.id, u.username, u.xp, u.cosmetics_json, u.selected_title
             FROM friendships f
             JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
             WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
             ORDER BY u.xp DESC`
        )
        .all(me, me, me)
        .map((r) => ({
            id: r.id,
            username: r.username,
            xp: Math.max(0, Number(r.xp) || 0),
            cosmetics: r.cosmetics_json ? safeParse(r.cosmetics_json, null) : null,
            selectedTitle: r.selected_title || null,
        }));

    res.json({
        xp: Math.max(0, Number(myRow.xp) || 0),
        earnedXp: Math.max(0, Number(myRow.earned_xp) || 0),
        claimed: safeParse(myRow.claimed_xproad_json, []) || [],
        titles: safeParse(myRow.xp_road_titles_json, []) || [],
        friends,
    });
});

module.exports = router;
