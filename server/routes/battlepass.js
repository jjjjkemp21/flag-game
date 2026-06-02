const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const {
    SEASONS,
    SEASON_ORDER,
    ACTIVE_SEASON_ID,
    PREMIUM_PRICE,
    getSeason,
    isKnownSeason,
    seasonList,
    daysUntilSeasonEnd,
    rewardKey,
    tierFromStars,
    challengeBucks,
} = require('../battlepassCatalog');
const { priceOf, isDefault } = require('../cosmeticsCatalog');
const { MASTERY_STREAK } = require('../xp');

const router = express.Router();
router.use(requireAuth);

// The pass stays locked until the player has mastered this many flags. Mastery
// is the game's core learning loop, so the pass only appears once they've
// demonstrably learned — keeping the first-run UI calm for newcomers.
const MASTERY_GATE = 20;

// Only flag mastery is an absolute lifetime total; every other metric is
// baselined per season at unlock (see ensureSeasonState) so each season's pass
// genuinely starts from zero.
const ABSOLUTE_METRICS = new Set(['mastered']);

// Per-user battlepass state lives in a single JSON blob in users.battlepass_json.
// New (v2) shape supports multiple seasons:
//   { v:2, counters:{...}, selectedSeason:id, seasons:{ [id]: <seasonState> } }
// `counters` are the client-driven cumulative numbers (mc_correct etc.) and are
// SHARED across seasons (they're lifetime account totals); server-derived metrics
// (mastered, mp_wins, earned_xp, best_streak_any, high_*) are recomputed from
// authoritative columns on every read. Each season keeps its own owned/claimed/
// started/baseline so progress in one never touches another.
function emptySeasonState() {
    return { owned: false, claimed: [], claimedChallenges: [], started: false, startedAt: 0, baseline: {} };
}

function emptyBlob() {
    return { v: 2, counters: {}, selectedSeason: ACTIVE_SEASON_ID, seasons: {} };
}

function safeParse(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (_) { return fallback; }
}

function normalizeSeasonState(raw) {
    if (!raw || typeof raw !== 'object') return emptySeasonState();
    return {
        owned: !!raw.owned,
        claimed: Array.isArray(raw.claimed) ? raw.claimed.filter((k) => typeof k === 'string') : [],
        claimedChallenges: Array.isArray(raw.claimedChallenges)
            ? raw.claimedChallenges.filter((id) => typeof id === 'string') : [],
        started: !!raw.started,
        startedAt: Math.max(0, Number(raw.startedAt) || 0),
        baseline: (raw.baseline && typeof raw.baseline === 'object') ? raw.baseline : {},
    };
}

// Load + normalize the whole blob, migrating the legacy single-season flat shape
// ({ season, owned, claimed, counters, started, baseline }) into the v2 shape.
// The legacy season's progress is preserved under seasons[<that id>]; the default
// selected season becomes the live one so the dropdown opens on the new pass.
function loadBlob(userId) {
    const row = db.prepare('SELECT battlepass_json FROM users WHERE id = ?').get(userId);
    const parsed = row && row.battlepass_json ? safeParse(row.battlepass_json, null) : null;
    if (!parsed || typeof parsed !== 'object') return emptyBlob();

    if (parsed.seasons && typeof parsed.seasons === 'object') {
        // Already v2 — normalize each known season.
        const seasons = {};
        for (const [id, st] of Object.entries(parsed.seasons)) {
            if (isKnownSeason(id)) seasons[id] = normalizeSeasonState(st);
        }
        return {
            v: 2,
            counters: (parsed.counters && typeof parsed.counters === 'object') ? parsed.counters : {},
            selectedSeason: isKnownSeason(parsed.selectedSeason) ? parsed.selectedSeason : ACTIVE_SEASON_ID,
            seasons,
        };
    }

    // Legacy flat shape — migrate.
    const blob = emptyBlob();
    blob.counters = (parsed.counters && typeof parsed.counters === 'object') ? parsed.counters : {};
    const legacyId = isKnownSeason(parsed.season) ? parsed.season : null;
    if (legacyId) {
        blob.seasons[legacyId] = normalizeSeasonState(parsed);
    }
    return blob;
}

function saveBlob(userId, blob) {
    db.prepare('UPDATE users SET battlepass_json = ? WHERE id = ?').run(JSON.stringify(blob), userId);
}

function getSeasonState(blob, seasonId) {
    return normalizeSeasonState(blob.seasons[seasonId]);
}

// Pull server-authoritative metrics. The client never gets to bump these.
function serverMetrics(userId) {
    const row = db.prepare(
        'SELECT stats_json, bonus_scores_json, streaks_json, mp_wins, earned_xp FROM users WHERE id = ?'
    ).get(userId);
    if (!row) return {};
    const stats = safeParse(row.stats_json, []) || [];
    const bonus = safeParse(row.bonus_scores_json, {}) || {};
    const streaks = safeParse(row.streaks_json, {}) || {};
    const mastered = stats.filter((f) => (Number(f.streak) || 0) > MASTERY_STREAK).length;
    const bestStreakAny = Object.values(streaks).reduce((m, v) => Math.max(m, Number(v) || 0), 0);
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

const MC_STREAK_KEYS = ['multiple-choice', 'mirror', 'flash', 'reverse-mc'];

function splitByWeight(total, wA, wB) {
    if (total <= 0) return [0, 0];
    if (wA + wB <= 0) return [total, 0];
    const a = Math.round(total * (wA / (wA + wB)));
    return [a, total - a];
}

// Raise the four client-driven counters to at least the value implied by the
// authoritative per-flag stats (self-healing drift fix — see git history).
function reconciledCounters(userId, stored) {
    const out = { ...(stored || {}) };
    const row = db.prepare('SELECT stats_json, streaks_json FROM users WHERE id = ?').get(userId);
    if (!row) return out;
    const stats = safeParse(row.stats_json, []) || [];
    const streaks = safeParse(row.streaks_json, {}) || {};
    const n = (v) => Math.max(0, Number(v) || 0);
    const textCorrect = stats.reduce((a, f) => a + n(f.correct), 0);
    const geoCorrect = stats.reduce((a, f) => a + n(f.geoCorrect), 0);
    const wMc = MC_STREAK_KEYS.reduce((a, k) => a + n(streaks[k]), 0);
    const wFr = n(streaks['free-response']);
    const wGlobe = n(streaks['globe']);
    const wName = n(streaks['globe-name']);
    const [mcFloor, frFloor] = splitByWeight(textCorrect, wMc, wFr);
    const [globeFloor, nameFloor] = splitByWeight(geoCorrect, wGlobe, wName);
    out.mc_correct = Math.max(n(out.mc_correct), mcFloor);
    out.fr_correct = Math.max(n(out.fr_correct), frFloor);
    out.globe_correct = Math.max(n(out.globe_correct), globeFloor);
    out.globe_name_correct = Math.max(n(out.globe_name_correct), nameFloor);
    return out;
}

// Combine server metrics with the (drift-reconciled, shared) client counters.
function effectiveMetrics(userId, counters) {
    const merged = { ...reconciledCounters(userId, counters) };
    Object.assign(merged, serverMetrics(userId));
    return merged;
}

// Snapshot a baseline of every metric the first time the player crosses the
// mastery gate for THIS season, and flip its `started`. Idempotent. Mutates +
// persists the blob; returns the (possibly updated) blob.
function ensureSeasonStarted(userId, blob, seasonId) {
    const st = getSeasonState(blob, seasonId);
    if (st.started) { blob.seasons[seasonId] = st; return blob; }
    const metrics = effectiveMetrics(userId, blob.counters);
    if ((Number(metrics.mastered) || 0) < MASTERY_GATE) { blob.seasons[seasonId] = st; return blob; }
    const baseline = {};
    for (const [k, v] of Object.entries(metrics)) baseline[k] = Math.max(0, Number(v) || 0);
    blob.seasons[seasonId] = { ...st, started: true, startedAt: Date.now(), baseline };
    saveBlob(userId, blob);
    return blob;
}

// Fresh-since-unlock value for a metric (raw minus this season's baseline),
// except absolute metrics (mastery) which keep the lifetime total.
function effectiveValue(metrics, baseline, metric) {
    const raw = Math.max(0, Number(metrics[metric]) || 0);
    const base = ABSOLUTE_METRICS.has(metric) ? 0 : Math.max(0, Number((baseline || {})[metric]) || 0);
    return Math.max(0, raw - base);
}

// Top-level meta attached to every summary so the client can render the season
// dropdown + countdown without a second call.
function passMeta(blob) {
    return {
        seasons: seasonList(),
        activeSeason: ACTIVE_SEASON_ID,
        selectedSeason: isKnownSeason(blob.selectedSeason) ? blob.selectedSeason : ACTIVE_SEASON_ID,
        daysLeft: daysUntilSeasonEnd(),
    };
}

// Star totals + per-challenge progress for one season.
function summary(userId, seasonId) {
    const id = isKnownSeason(seasonId) ? seasonId : ACTIVE_SEASON_ID;
    const season = getSeason(id);
    let blob = loadBlob(userId);
    blob = ensureSeasonStarted(userId, blob, id);
    const st = getSeasonState(blob, id);
    const started = !!st.started;
    const baseline = (st.baseline && typeof st.baseline === 'object') ? st.baseline : {};
    const metrics = effectiveMetrics(userId, blob.counters);
    const claimedSet = new Set(st.claimedChallenges || []);
    let stars = 0;
    const challenges = season.challenges.map((c) => {
        const raw = Math.max(0, Number(metrics[c.metric]) || 0);
        const eff = started ? effectiveValue(metrics, baseline, c.metric) : 0;
        const done = started && eff >= c.goal;
        if (done) stars += c.stars;
        return {
            id: c.id,
            cur: Math.min(eff, c.goal),
            raw,
            goal: c.goal,
            done,
            stars: c.stars,
            bucks: challengeBucks(c),
            claimed: claimedSet.has(c.id),
        };
    });
    const tier = started ? tierFromStars(stars, id) : 0;
    return {
        season: id,
        seasonName: season.name,
        theme: season.theme,
        owned: st.owned,
        claimed: st.claimed,
        claimedChallenges: st.claimedChallenges,
        stars,
        totalStars: season.totalStars,
        tier,
        tierCount: season.tierCount,
        tierStarCost: season.tierStarCost,
        premiumPrice: PREMIUM_PRICE,
        challenges,
        started,
        mastered: Math.max(0, Number(metrics.mastered) || 0),
        masteryGate: MASTERY_GATE,
        ...passMeta(blob),
    };
}

// Resolve the season to operate on from a request (?season / body.season),
// defaulting to the user's selected season, then the active season.
function resolveSeason(req, blob) {
    const q = (req.query && req.query.season) || (req.body && req.body.season);
    if (isKnownSeason(q)) return q;
    if (blob && isKnownSeason(blob.selectedSeason)) return blob.selectedSeason;
    return ACTIVE_SEASON_ID;
}

router.get('/', (req, res) => {
    const blob = loadBlob(req.user.id);
    const id = resolveSeason(req, blob);
    res.json(summary(req.user.id, id));
});

// Switch the selected season (drives the home card skin + which pass the screen
// opens on). Persisted so it carries across devices.
router.post('/select', (req, res) => {
    const { season } = req.body || {};
    if (!isKnownSeason(season)) return res.status(400).json({ error: 'Unknown season.' });
    const blob = loadBlob(req.user.id);
    blob.selectedSeason = season;
    saveBlob(req.user.id, blob);
    res.json(summary(req.user.id, season));
});

// Server-derived metrics the client must not be able to bump directly.
const SERVER_METRIC_KEYS = new Set([
    'mastered', 'mp_wins', 'earned_xp', 'best_streak_any',
    'high_frenzy', 'high_pixelated', 'high_longestRoute', 'high_language', 'high_capitals',
]);
router.post('/progress', (req, res) => {
    const { counters } = req.body || {};
    if (!counters || typeof counters !== 'object') {
        return res.status(400).json({ error: 'counters object required.' });
    }
    const blob = loadBlob(req.user.id);
    const next = { ...blob.counters };
    for (const [k, v] of Object.entries(counters)) {
        if (SERVER_METRIC_KEYS.has(k)) continue;
        const n = Math.max(0, Math.round(Number(v) || 0));
        if (!Number.isFinite(n)) continue;
        if (n > (Number(next[k]) || 0)) next[k] = n;
    }
    blob.counters = next;
    saveBlob(req.user.id, blob);
    res.json(summary(req.user.id, resolveSeason(req, blob)));
});

function gateError(res) {
    return res.status(403).json({ error: `Master ${MASTERY_GATE} flags to unlock the Atlas Pass.` });
}

// Buy the premium track for a season. Deducts PREMIUM_PRICE bucks once per season.
router.post('/buy', (req, res) => {
    const seasonId = resolveSeason(req, loadBlob(req.user.id));
    if (!summary(req.user.id, seasonId).started) return gateError(res);
    const tx = db.transaction(() => {
        const blob = loadBlob(req.user.id);
        const st = getSeasonState(blob, seasonId);
        if (st.owned) return { error: 'already-owned' };
        const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
        const bal = Math.max(0, Number(row && row.bucks) || 0);
        if (bal < PREMIUM_PRICE) return { error: 'insufficient' };
        blob.seasons[seasonId] = { ...st, owned: true };
        db.prepare('UPDATE users SET bucks = ?, battlepass_json = ? WHERE id = ?')
            .run(bal - PREMIUM_PRICE, JSON.stringify(blob), req.user.id);
        return { ok: true };
    });
    const out = tx();
    if (out.error === 'already-owned') return res.status(409).json({ error: 'Already own the premium pass.' });
    if (out.error === 'insufficient')  return res.status(402).json({ error: `Need ${PREMIUM_PRICE.toLocaleString()} Atlas Bucks.` });

    const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
    res.json({ bought: true, bucks: row.bucks, ...summary(req.user.id, seasonId) });
});

// Claim a single tier reward. Body: { track:'free'|'prem', tier, season? }.
router.post('/claim', (req, res) => {
    const seasonId = resolveSeason(req, loadBlob(req.user.id));
    const season = getSeason(seasonId);
    if (!summary(req.user.id, seasonId).started) return gateError(res);
    const { track, tier } = req.body || {};
    if (track !== 'free' && track !== 'prem') {
        return res.status(400).json({ error: 'track must be "free" or "prem".' });
    }
    const n = Math.round(Number(tier) || 0);
    if (!Number.isInteger(n) || n < 1 || n > season.tierCount) {
        return res.status(400).json({ error: 'Invalid tier.' });
    }
    const tierDef = season.tiersByNum[n];
    if (!tierDef) return res.status(404).json({ error: 'No such tier.' });
    const reward = track === 'free' ? tierDef.free : tierDef.prem;
    if (!reward) return res.status(404).json({ error: 'No reward defined.' });

    const key = rewardKey(track, n);

    const tx = db.transaction(() => {
        const blob = loadBlob(req.user.id);
        const st = getSeasonState(blob, seasonId);
        if (st.claimed.includes(key)) return { error: 'already-claimed' };
        if (track === 'prem' && !st.owned) return { error: 'no-pass' };

        // Re-compute stars from authoritative state — never trust the client.
        const summarised = summary(req.user.id, seasonId);
        if (n > summarised.tier) return { error: 'locked' };

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

        blob.seasons[seasonId] = { ...st, claimed: [...st.claimed, key] };
        saveBlob(req.user.id, blob);
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
        ...summary(req.user.id, seasonId),
    });
});

// Claim the one-shot Atlas Bucks payout for a completed challenge. Body: { id, season? }.
router.post('/claim-challenge', (req, res) => {
    const seasonId = resolveSeason(req, loadBlob(req.user.id));
    const season = getSeason(seasonId);
    if (!summary(req.user.id, seasonId).started) return gateError(res);
    const { id } = req.body || {};
    if (typeof id !== 'string' || !id) {
        return res.status(400).json({ error: 'challenge id required.' });
    }
    const def = season.challengesById[id];
    if (!def) return res.status(404).json({ error: 'No such challenge.' });

    const tx = db.transaction(() => {
        const blob = loadBlob(req.user.id);
        const st = getSeasonState(blob, seasonId);
        const already = new Set(st.claimedChallenges || []);
        if (already.has(id)) return { error: 'already-claimed' };

        const metrics = effectiveMetrics(req.user.id, blob.counters);
        const baseline = (st.baseline && typeof st.baseline === 'object') ? st.baseline : {};
        const cur = effectiveValue(metrics, baseline, def.metric);
        if (cur < def.goal) return { error: 'not-done' };

        const payout = challengeBucks(def);
        const row = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
        const bal = Math.max(0, Number(row && row.bucks) || 0);
        db.prepare('UPDATE users SET bucks = ? WHERE id = ?').run(bal + payout, req.user.id);

        blob.seasons[seasonId] = { ...st, claimedChallenges: [...(st.claimedChallenges || []), id] };
        saveBlob(req.user.id, blob);
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
        ...summary(req.user.id, seasonId),
    });
});

module.exports = router;
