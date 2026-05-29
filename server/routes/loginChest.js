const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// Daily login chest with a 7-day escalating cycle. Day-of-cycle is computed
// from `login_streak`:
//   day = ((login_streak - 1) % 7) + 1   (1..7)
// Streak increments on the first request of a new UTC day if the prior chest
// was claimed *yesterday*, resets to 1 otherwise. The actual chest blob is
// staged in `pending_login_chest_json` so the client can open / animate it
// before claiming.

const PAYOUTS = [10, 15, 20, 30, 40, 60, 150]; // Day 1..7

function utcDateStr(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function dayDiff(aStr, bStr) {
    if (!aStr || !bStr) return Infinity;
    const a = new Date(`${aStr}T00:00:00Z`).getTime();
    const b = new Date(`${bStr}T00:00:00Z`).getTime();
    return Math.round((b - a) / 86400000);
}

function safeParse(s) {
    if (!s) return null;
    try { return JSON.parse(s); } catch (_) { return null; }
}

// Roll today's chest if it hasn't been rolled yet. Returns the pending blob
// (or null if nothing new). Idempotent: calling multiple times in the same
// UTC day just returns the same pending blob without re-rolling or
// re-incrementing the streak.
function ensureTodaysChest(userId) {
    const row = db.prepare(
        'SELECT last_login_chest_date, login_streak, pending_login_chest_json FROM users WHERE id = ?'
    ).get(userId);
    if (!row) return null;

    const today = utcDateStr();
    const last = row.last_login_chest_date || null;

    // Already rolled today — return whatever is pending (may be null if
    // already claimed, in which case the client just sees no chest).
    if (last === today) return safeParse(row.pending_login_chest_json);

    // New UTC day: determine the new streak. Continue if exactly yesterday,
    // reset to 1 otherwise. login_streak is monotonically increasing within
    // a continuous run, so we only modulo when computing the cycle day.
    const prev = Math.max(0, Number(row.login_streak) || 0);
    const newStreak = dayDiff(last, today) === 1 ? prev + 1 : 1;
    const cycleDay = ((newStreak - 1) % 7) + 1;
    const chest = { day: cycleDay, streak: newStreak, bucks: PAYOUTS[cycleDay - 1], claimed: false };
    db.prepare(
        'UPDATE users SET last_login_chest_date = ?, login_streak = ?, pending_login_chest_json = ? WHERE id = ?'
    ).run(today, newStreak, JSON.stringify(chest), userId);
    return chest;
}

router.get('/', (req, res) => {
    const chest = ensureTodaysChest(req.user.id);
    const row = db.prepare('SELECT login_streak FROM users WHERE id = ?').get(req.user.id);
    res.json({
        pending: chest && !chest.claimed ? chest : null,
        streak: Math.max(0, Number(row && row.login_streak) || 0),
        cycleDay: chest ? chest.day : null,
        payouts: PAYOUTS,
    });
});

router.post('/claim', (req, res) => {
    const row = db.prepare(
        'SELECT bucks, pending_login_chest_json FROM users WHERE id = ?'
    ).get(req.user.id);
    const pending = safeParse(row && row.pending_login_chest_json);
    if (!pending || pending.claimed) {
        return res.status(400).json({ error: 'No chest to claim.' });
    }
    const newBucks = Math.max(0, Math.round(Number(row.bucks) || 0)) + Math.max(0, Math.round(Number(pending.bucks) || 0));
    db.prepare(
        'UPDATE users SET bucks = ?, pending_login_chest_json = NULL WHERE id = ?'
    ).run(newBucks, req.user.id);
    res.json({ claimed: pending.bucks, bucks: newBucks, day: pending.day });
});

module.exports = router;
