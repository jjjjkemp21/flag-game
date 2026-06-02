const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware');
const { totalXp, legacyBaseXp } = require('../xp');

const router = express.Router();

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
// resulting combined state.
function applyUpdate(userId, body) {
    const { flagStats, bonusScores, earnedXp, bucksEarnedLifetime } = body || {};
    if (flagStats !== undefined && !Array.isArray(flagStats)) {
        return { error: 'flagStats must be an array.' };
    }

    const row = db
        .prepare(
            'SELECT stats_json, bonus_scores_json, earned_xp, bucks, bucks_earned_lifetime FROM users WHERE id = ?'
        )
        .get(userId);
    if (!row) return { error: 'User not found.' };

    const storedStats = row.stats_json ? safeParse(row.stats_json, []) : [];
    // Flag stats are merged monotonically: an incoming payload may RAISE a
    // flag's counters but never lower them. This makes a stale or zeroed client
    // push (e.g. one fired before the account's progress finished loading, or a
    // second tab that loaded mid-wipe and keeps re-syncing zeros) unable to
    // erase real history — the failure mode that repeatedly wiped a player's
    // stats and un-mastered every flag.
    //
    // streak/geoStreak are INCLUDED here so MASTERY IS STICKY: once a flag is
    // mastered (streak > MASTERY_STREAK) it can never be clawed back by a low
    // re-sync. The trade-off is intentional — a wrong answer no longer lowers
    // the *stored* streak (the client still resets it live during a run; the
    // reset just isn't persisted downward). Mastery, mastery titles, the
    // chest-yield bonus, and the streak-derived achievements therefore only ever
    // grow. The /stats/reset endpoint NULLs stats_json directly, so a real reset
    // isn't blocked by this (there's no stored history left to preserve).
    const MONO_FIELDS = ['correct', 'incorrect', 'lapses', 'geoCorrect', 'geoIncorrect', 'geoLapses', 'streak', 'geoStreak'];
    let newFlagStats;
    if (Array.isArray(flagStats)) {
        const prevByCode = new Map(storedStats.map((s) => [s && s.code, s]));
        newFlagStats = flagStats.map((f) => {
            const prev = prevByCode.get(f && f.code);
            if (!prev) return f;
            const merged = { ...f };
            for (const k of MONO_FIELDS) merged[k] = Math.max(Number(f[k]) || 0, Number(prev[k]) || 0);
            return merged;
        });
        // Keep any stored flags the client omitted so a partial push never drops history.
        const incoming = new Set(flagStats.map((f) => f && f.code));
        for (const s of storedStats) if (s && s.code && !incoming.has(s.code)) newFlagStats.push(s);
    } else {
        newFlagStats = storedStats;
    }
    // Bonus high scores are a max-type metric (like streaks) — never let an
    // incoming value LOWER a stored best, and clamp each to a non-negative
    // integer. A plain last-write-wins here let a stale snapshot clobber a
    // higher score and let a doctored client set arbitrary leaderboard values.
    const prevBonus = row.bonus_scores_json ? safeParse(row.bonus_scores_json, {}) : {};
    const newBonus = { ...prevBonus };
    if (bonusScores && typeof bonusScores === 'object') {
        for (const [mode, val] of Object.entries(bonusScores)) {
            const n = Math.max(0, Math.round(Number(val) || 0));
            if (n > (newBonus[mode] || 0)) newBonus[mode] = n;
        }
    }

    // Last-write-wins (consistent with flag stats): use the client's absolute
    // earned_xp when provided, else keep the existing/seeded baseline.
    const newEarned = Number.isFinite(Number(earnedXp))
        ? Math.max(0, Math.round(Number(earnedXp)))
        : earnedBaseline(row);

    // Earned XP is a monotonic accumulator: it only ever grows through play, so
    // an incoming value LOWER than what's stored always means a stale or zeroed
    // client snapshot — never a legitimate decrease. Floor it at the stored
    // earned_xp (via earnedBaseline, which falls back to the legacy formula for
    // accounts whose earned_xp is still NULL) AND at the legacy value implied by
    // the now-monotonic flag stats. This mirrors the protection already given to
    // flag counters and bonus scores, and is what makes an admin/restore-set XP
    // durable: a low re-sync from the player's browser can no longer claw it back
    // down. (The old floor was legacyBaseXp alone — ~16k for Lee — which let his
    // client overwrite a restored 135k right back down to that base.)
    const guardedEarned = Math.max(newEarned, legacyBaseXp(newFlagStats), earnedBaseline(row));

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

    // Total XP = earned XP + bonus high scores (the same quantity the client
    // displays). Recomputed here so the stored `xp` column stays authoritative.
    const xp = totalXp(guardedEarned, newBonus);

    db.prepare(
        `UPDATE users SET stats_json = ?, bonus_scores_json = ?, earned_xp = ?, xp = ?, bucks = ?, bucks_earned_lifetime = ?
         WHERE id = ?`
    ).run(
        JSON.stringify(newFlagStats), JSON.stringify(newBonus), guardedEarned, xp, nextBucks, newBucksLifetime,
        userId,
    );

    return {
        ok: true,
        xp,
        earnedXp: guardedEarned,
        bucks: nextBucks,
        bucksEarnedLifetime: newBucksLifetime,
    };
}

// Unload beacon: navigator.sendBeacon can't set an Authorization header, so the
// token rides in the query string. Registered before requireAuth.
router.post('/beacon', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).end();
    let uid;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // Reject reset tokens (which also carry a uid); accept legacy kind-less
        // access tokens.
        if (payload.kind && payload.kind !== 'access') return res.status(401).end();
        uid = payload.uid;
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
            'SELECT stats_json, bonus_scores_json, xp, earned_xp, bucks_earned_lifetime FROM users WHERE id = ?'
        )
        .get(req.user.id);
    res.json({
        flagStats: row.stats_json ? JSON.parse(row.stats_json) : null,
        bonusScores: row.bonus_scores_json ? JSON.parse(row.bonus_scores_json) : null,
        xp: row.xp,
        earnedXp: earnedBaseline(row),
        bucksEarnedLifetime: Math.max(0, Math.round(Number(row.bucks_earned_lifetime) || 0)),
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
    // XP and Atlas Bucks are intentionally preserved — they're rewards, not
    // progress. Wiping flag stats won't change earned_xp; the chest-yield bonus
    // simply follows the (now-reset) mastery count back down to its base.
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
            battlepass_json = NULL,
            capital_stats_json = NULL,
            us_state_stats_json = NULL,
            pride_stats_json = NULL
        WHERE id = ?`
    ).run(req.user.id);
    res.json({ ok: true });
});

module.exports = router;
