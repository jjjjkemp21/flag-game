const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const {
    SEASON_ID,
    SEASON_NAME,
    PREMIUM_PRICE,
    TIER_STAR_COST,
    TIER_COUNT,
    TOTAL_STARS,
    CHALLENGES,
    CHALLENGES_BY_ID,
    TIERS,
    rewardKey,
    tierFromStars,
} = require('../battlepassCatalog');
const { priceOf, isDefault } = require('../cosmeticsCatalog');

const router = express.Router();
router.use(requireAuth);

// Per-user battlepass state. Stored as a single JSON blob in users.battlepass_json.
// `counters` holds client-driven cumulative numbers (e.g. mc_correct) merged
// last-write-wins by max. Server-derived metrics (mastered, mp_wins, earned_xp,
// best_streak_any, high_*) are recomputed from authoritative columns on every
// read so the player can't fabricate stars by editing localStorage.
function emptyState() {
    return {
        season: SEASON_ID,
        owned: false,
        claimed: [],
        counters: {},
    };
}

function safeParse(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (_) { return fallback; }
}

function loadState(userId) {
    const row = db.prepare('SELECT battlepass_json FROM users WHERE id = ?').get(userId);
    const parsed = row && row.battlepass_json ? safeParse(row.battlepass_json, null) : null;
    if (!parsed || parsed.season !== SEASON_ID) {
        // New season (or first time): start fresh. We don't bump the column here
        // — saveState below writes the wipe back when the user next mutates.
        return emptyState();
    }
    return {
        season: SEASON_ID,
        owned: !!parsed.owned,
        claimed: Array.isArray(parsed.claimed) ? parsed.claimed.filter((k) => typeof k === 'string') : [],
        counters: (parsed.counters && typeof parsed.counters === 'object') ? parsed.counters : {},
    };
}

function saveState(userId, state) {
    db.prepare('UPDATE users SET battlepass_json = ? WHERE id = ?').run(JSON.stringify(state), userId);
}

// Pull server-authoritative metrics. The client never gets to bump these in
// counters — we always trust the DB.
function serverMetrics(userId) {
    const row = db.prepare(
        'SELECT stats_json, bonus_scores_json, streaks_json, mp_wins, earned_xp FROM users WHERE id = ?'
    ).get(userId);
    if (!row) return {};
    const stats = safeParse(row.stats_json, []) || [];
    const bonus = safeParse(row.bonus_scores_json, {}) || {};
    const streaks = safeParse(row.streaks_json, {}) || {};
    // "Mastered" matches the client definition in achievements: streak > 5.
    const mastered = stats.filter((f) => (Number(f.streak) || 0) > 5).length;
    const bestStreakAny = Object.values(streaks).reduce(
        (m, v) => Math.max(m, Number(v) || 0), 0
    );
    return {
        mastered,
        mp_wins: Math.max(0, Number(row.mp_wins) || 0),
        earned_xp: Math.max(0, Number(row.earned_xp) || 0),
        best_streak_any: bestStreakAny,
        high_frenzy: Math.max(0, Number(bonus.frenzy) || 0),
        high_pixelated: Math.max(0, Number(bonus.pixelated) || 0),
        high_longestRoute: Math.max(0, Number(bonus.longestRoute) || 0),
        high_language: Math.max(0, Number(bonus.language) || 0),
    };
}

// Combine server metrics with the client-driven counters. Server metrics win
// for any overlapping keys (defensive).
function effectiveMetrics(userId, counters) {
    const merged = { ...(counters || {}) };
    Object.assign(merged, serverMetrics(userId));
    return merged;
}

// Star totals + per-challenge progress.
function summary(userId) {
    const state = loadState(userId);
    const metrics = effectiveMetrics(userId, state.counters);
    let stars = 0;
    const challenges = CHALLENGES.map((c) => {
        const cur = Math.max(0, Number(metrics[c.metric]) || 0);
        const done = cur >= c.goal;
        if (done) stars += c.stars;
        return { id: c.id, cur: Math.min(cur, c.goal), goal: c.goal, done, stars: c.stars };
    });
    const tier = tierFromStars(stars);
    return {
        season: SEASON_ID,
        seasonName: SEASON_NAME,
        owned: state.owned,
        claimed: state.claimed,
        stars,
        totalStars: TOTAL_STARS,
        tier,
        tierCount: TIER_COUNT,
        tierStarCost: TIER_STAR_COST,
        premiumPrice: PREMIUM_PRICE,
        challenges,
    };
}

router.get('/', (req, res) => {
    res.json(summary(req.user.id));
});

// Merge counter updates from the client. We take the max of each new value vs.
// the stored one so out-of-order or duplicate POSTs are idempotent. The client
// is the source of truth for *its own* cumulative counts (mc_correct etc.) —
// server-derived metrics are ignored if posted.
const SERVER_METRIC_KEYS = new Set([
    'mastered', 'mp_wins', 'earned_xp', 'best_streak_any',
    'high_frenzy', 'high_pixelated', 'high_longestRoute', 'high_language',
]);
router.post('/progress', (req, res) => {
    const { counters } = req.body || {};
    if (!counters || typeof counters !== 'object') {
        return res.status(400).json({ error: 'counters object required.' });
    }
    const state = loadState(req.user.id);
    const next = { ...state.counters };
    for (const [k, v] of Object.entries(counters)) {
        if (SERVER_METRIC_KEYS.has(k)) continue;
        const n = Math.max(0, Math.round(Number(v) || 0));
        if (!Number.isFinite(n)) continue;
        if (n > (Number(next[k]) || 0)) next[k] = n;
    }
    saveState(req.user.id, { ...state, counters: next });
    res.json(summary(req.user.id));
});

// Buy the premium track. Deducts PREMIUM_PRICE bucks once per season.
router.post('/buy', (req, res) => {
    const tx = db.transaction(() => {
        const state = loadState(req.user.id);
        if (state.owned) return { error: 'already-owned' };
        const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
        const bal = Math.max(0, Number(row && row.bucks) || 0);
        if (bal < PREMIUM_PRICE) return { error: 'insufficient' };
        const next = { ...state, owned: true };
        db.prepare('UPDATE users SET bucks = ?, battlepass_json = ? WHERE id = ?')
            .run(bal - PREMIUM_PRICE, JSON.stringify(next), req.user.id);
        return { ok: true };
    });
    const out = tx();
    if (out.error === 'already-owned') return res.status(409).json({ error: 'Already own the premium pass.' });
    if (out.error === 'insufficient')  return res.status(402).json({ error: `Need ${PREMIUM_PRICE.toLocaleString()} Atlas Bucks.` });

    const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
    res.json({ bought: true, bucks: row.bucks, ...summary(req.user.id) });
});

// Claim a single tier reward. Body: { track: 'free' | 'prem', tier: number }.
// Validates the tier is unlocked + not already claimed, then grants the reward.
router.post('/claim', (req, res) => {
    const { track, tier } = req.body || {};
    if (track !== 'free' && track !== 'prem') {
        return res.status(400).json({ error: 'track must be "free" or "prem".' });
    }
    const n = Math.round(Number(tier) || 0);
    if (!Number.isInteger(n) || n < 1 || n > TIER_COUNT) {
        return res.status(400).json({ error: 'Invalid tier.' });
    }
    const tierDef = TIERS.find((t) => t.tier === n);
    if (!tierDef) return res.status(404).json({ error: 'No such tier.' });
    const reward = track === 'free' ? tierDef.free : tierDef.prem;
    if (!reward) return res.status(404).json({ error: 'No reward defined.' });

    const key = rewardKey(track, n);

    const tx = db.transaction(() => {
        const state = loadState(req.user.id);
        if (state.claimed.includes(key)) return { error: 'already-claimed' };
        if (track === 'prem' && !state.owned)  return { error: 'no-pass' };

        // Re-compute stars from authoritative state — never trust the client.
        const summarised = summary(req.user.id);
        if (n > summarised.tier) return { error: 'locked' };

        // Apply the reward.
        if (reward.type === 'bucks') {
            const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
            const bal = Math.max(0, Number(row && row.bucks) || 0);
            db.prepare('UPDATE users SET bucks = ? WHERE id = ?').run(bal + reward.amount, req.user.id);
        } else if (reward.type === 'cosmetic') {
            if (priceOf(reward.cat, reward.id) === null) return { error: 'bad-cosmetic' };
            if (!isDefault(reward.cat, reward.id)) {
                const row = db.prepare('SELECT owned_cosmetics_json FROM users WHERE id = ?').get(req.user.id);
                const owned = new Set(safeParse(row && row.owned_cosmetics_json, []) || []);
                owned.add(`${reward.cat}:${reward.id}`);
                db.prepare('UPDATE users SET owned_cosmetics_json = ? WHERE id = ?')
                    .run(JSON.stringify([...owned]), req.user.id);
            }
        } else {
            return { error: 'unknown-reward' };
        }

        const nextClaimed = [...state.claimed, key];
        saveState(req.user.id, { ...state, claimed: nextClaimed });
        return { ok: true };
    });

    const out = tx();
    if (out.error === 'already-claimed') return res.status(409).json({ error: 'Already claimed.' });
    if (out.error === 'no-pass')         return res.status(402).json({ error: 'Premium pass required.' });
    if (out.error === 'locked')          return res.status(403).json({ error: 'Tier not unlocked yet.' });
    if (out.error === 'bad-cosmetic')    return res.status(500).json({ error: 'Reward refers to unknown cosmetic.' });
    if (out.error === 'unknown-reward')  return res.status(500).json({ error: 'Unknown reward type.' });

    const row = db.prepare('SELECT bucks, owned_cosmetics_json FROM users WHERE id = ?').get(req.user.id);
    res.json({
        claimed: true,
        reward,
        bucks: Math.max(0, Number(row.bucks) || 0),
        ownedCosmetics: safeParse(row.owned_cosmetics_json, []) || [],
        ...summary(req.user.id),
    });
});

module.exports = router;
