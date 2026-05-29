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
    challengeBucks,
} = require('../battlepassCatalog');
const { priceOf, isDefault } = require('../cosmeticsCatalog');
const { MASTERY_STREAK } = require('../xp');

const router = express.Router();
router.use(requireAuth);

// The Reptile Kingdom Pass stays locked until the player has mastered this many
// flags. Mastery is the game's core learning loop, so the pass only appears once
// they've demonstrably learned — keeping the first-run UI calm for newcomers.
const MASTERY_GATE = 20;

// Metrics whose challenge progress is an absolute lifetime total rather than a
// "fresh since unlock" delta. Only flag mastery is absolute: the mastery
// challenges (Master 25 / 100 flags) read as milestones and tie progression to
// the very thing that unlocked the pass. Every other metric is baselined at
// unlock (see ensureSeasonState) so the pass genuinely starts from zero — a
// player can't bank low tiers from the play that got them to 20 mastery.
const ABSOLUTE_METRICS = new Set(['mastered']);

// Per-user battlepass state. Stored as a single JSON blob in users.battlepass_json.
// `counters` holds client-driven cumulative numbers (e.g. mc_correct) merged
// last-write-wins by max. Server-derived metrics (mastered, mp_wins, earned_xp,
// best_streak_any, high_*) are recomputed from authoritative columns on every
// read so the player can't fabricate stars by editing localStorage.
//
// `started` flips true the first time the player crosses MASTERY_GATE; at that
// moment `baseline` snapshots every metric so post-unlock progress is measured
// fresh from zero. `counters` always store the RAW cumulative value (the client
// protocol depends on it) — baselining happens only when deriving stars.
function emptyState() {
    return {
        season: SEASON_ID,
        owned: false,
        claimed: [],
        claimedChallenges: [],
        counters: {},
        started: false,
        startedAt: 0,
        baseline: {},
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
        claimedChallenges: Array.isArray(parsed.claimedChallenges)
            ? parsed.claimedChallenges.filter((id) => typeof id === 'string')
            : [],
        counters: (parsed.counters && typeof parsed.counters === 'object') ? parsed.counters : {},
        started: !!parsed.started,
        startedAt: Math.max(0, Number(parsed.startedAt) || 0),
        baseline: (parsed.baseline && typeof parsed.baseline === 'object') ? parsed.baseline : {},
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
    // "Mastered" matches the client definition in achievements: streak strictly
    // greater than MASTERY_STREAK (kept in lock-step via server/xp.js).
    const mastered = stats.filter((f) => (Number(f.streak) || 0) > MASTERY_STREAK).length;
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
        high_capitals: Math.max(0, Number(bonus.capitals) || 0),
    };
}

// Combine server metrics with the client-driven counters. Server metrics win
// for any overlapping keys (defensive).
function effectiveMetrics(userId, counters) {
    const merged = { ...(counters || {}) };
    Object.assign(merged, serverMetrics(userId));
    return merged;
}

// Load the season state and, the first time the player has crossed the mastery
// gate, snapshot a baseline of every current metric and flip `started`. After
// that snapshot, challenge progress is read as (current − baseline) so the pass
// begins from zero the moment it unlocks. Idempotent (better-sqlite3 is
// synchronous, so concurrent requests can't double-snapshot within a process).
function ensureSeasonState(userId) {
    const state = loadState(userId);
    if (state.started) return state;
    const metrics = effectiveMetrics(userId, state.counters);
    if ((Number(metrics.mastered) || 0) < MASTERY_GATE) return state;
    const baseline = {};
    for (const [k, v] of Object.entries(metrics)) {
        baseline[k] = Math.max(0, Number(v) || 0);
    }
    const next = { ...state, started: true, startedAt: Date.now(), baseline };
    saveState(userId, next);
    return next;
}

// Fresh-since-unlock value for a metric: the raw cumulative total minus the
// baseline captured at unlock, except absolute metrics (mastery) which keep the
// lifetime total. Shared by summary() AND the claim path so the displayed "done"
// state and the server-side claim gate can never disagree (an earlier version
// drifted: the claim check read the raw value while the UI showed the baselined
// one, letting a late-unlocking player claim challenges showing 0 progress).
function effectiveValue(metrics, baseline, metric) {
    const raw = Math.max(0, Number(metrics[metric]) || 0);
    const base = ABSOLUTE_METRICS.has(metric) ? 0 : Math.max(0, Number((baseline || {})[metric]) || 0);
    return Math.max(0, raw - base);
}

// Star totals + per-challenge progress. Until the pass is `started` (i.e. the
// player has 20 mastered flags) it reports zero progress; after, each challenge
// counts only what's been earned since the unlock baseline (except absolute
// metrics like mastery). `raw` carries the true cumulative metric value so the
// client's counter cache stays anchored to the server's real numbers — the
// baseline subtraction is purely a derivation here, never a reset of counters.
function summary(userId) {
    const state = ensureSeasonState(userId);
    const started = !!state.started;
    const baseline = (state.baseline && typeof state.baseline === 'object') ? state.baseline : {};
    const metrics = effectiveMetrics(userId, state.counters);
    const claimedSet = new Set(state.claimedChallenges || []);
    let stars = 0;
    const challenges = CHALLENGES.map((c) => {
        const raw = Math.max(0, Number(metrics[c.metric]) || 0);
        const eff = started ? effectiveValue(metrics, baseline, c.metric) : 0;
        const done = started && eff >= c.goal;
        if (done) stars += c.stars;
        return {
            id: c.id,
            cur: Math.min(eff, c.goal),
            // Unclamped true cumulative value — the client seeds its counter
            // cache from this so its max-merge pushes stay above the server's
            // stored counter even after baselining reduces the displayed `cur`.
            raw,
            goal: c.goal,
            done,
            stars: c.stars,
            bucks: challengeBucks(c),
            claimed: claimedSet.has(c.id),
        };
    });
    const tier = started ? tierFromStars(stars) : 0;
    return {
        season: SEASON_ID,
        seasonName: SEASON_NAME,
        owned: state.owned,
        claimed: state.claimed,
        claimedChallenges: state.claimedChallenges,
        stars,
        totalStars: TOTAL_STARS,
        tier,
        tierCount: TIER_COUNT,
        tierStarCost: TIER_STAR_COST,
        premiumPrice: PREMIUM_PRICE,
        challenges,
        // Gate state for the client (the home-screen card uses its own live flag
        // data, but the screen + defensive checks read these).
        started,
        mastered: Math.max(0, Number(metrics.mastered) || 0),
        masteryGate: MASTERY_GATE,
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
    'high_frenzy', 'high_pixelated', 'high_longestRoute', 'high_language', 'high_capitals',
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

// Shared 403 for any mutation attempted before the pass has unlocked. The
// client hides the entry point below the gate, so this only fires on a direct
// API call — but the server is the source of truth, so we enforce it here too.
function gateError(res) {
    return res.status(403).json({ error: `Master ${MASTERY_GATE} flags to unlock the Reptile Kingdom Pass.` });
}

// Buy the premium track. Deducts PREMIUM_PRICE bucks once per season.
router.post('/buy', (req, res) => {
    if (!ensureSeasonState(req.user.id).started) return gateError(res);
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
    if (!ensureSeasonState(req.user.id).started) return gateError(res);
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

// Claim the one-shot Atlas Bucks payout for a completed challenge. Body: { id }.
// Server re-derives whether the challenge is done from authoritative metrics,
// then grants the bucks and marks the id as claimed for this season.
router.post('/claim-challenge', (req, res) => {
    if (!ensureSeasonState(req.user.id).started) return gateError(res);
    const { id } = req.body || {};
    if (typeof id !== 'string' || !id) {
        return res.status(400).json({ error: 'challenge id required.' });
    }
    const def = CHALLENGES_BY_ID[id];
    if (!def) return res.status(404).json({ error: 'No such challenge.' });

    const tx = db.transaction(() => {
        const state = loadState(req.user.id);
        const already = new Set(state.claimedChallenges || []);
        if (already.has(id)) return { error: 'already-claimed' };

        // Re-derive done from authoritative metrics so a stale client can't
        // claim a challenge they haven't actually finished. Must use the SAME
        // baselined value summary() shows — otherwise a late unlocker could claim
        // challenges that display as 0/goal (the pre-unlock play was baselined out).
        const metrics = effectiveMetrics(req.user.id, state.counters);
        const baseline = (state.baseline && typeof state.baseline === 'object') ? state.baseline : {};
        const cur = effectiveValue(metrics, baseline, def.metric);
        if (cur < def.goal) return { error: 'not-done' };

        const payout = challengeBucks(def);
        const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
        const bal = Math.max(0, Number(row && row.bucks) || 0);
        db.prepare('UPDATE users SET bucks = ? WHERE id = ?').run(bal + payout, req.user.id);

        const nextClaimed = [...(state.claimedChallenges || []), id];
        saveState(req.user.id, { ...state, claimedChallenges: nextClaimed });
        return { ok: true, payout };
    });

    const out = tx();
    if (out.error === 'already-claimed') return res.status(409).json({ error: 'Already claimed.' });
    if (out.error === 'not-done')        return res.status(403).json({ error: 'Challenge not complete yet.' });

    const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
    res.json({
        claimed: true,
        id,
        payout: out.payout,
        bucks: Math.max(0, Number(row.bucks) || 0),
        ...summary(req.user.id),
    });
});

module.exports = router;
