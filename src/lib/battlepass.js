import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import {
    SEASON_ID, CHALLENGES, CHALLENGES_BY_ID, TIERS_BY_NUM, TIER_COUNT, TOTAL_STARS, TIER_STAR_COST,
    tierFromStars, progressWithinTier,
} from './battlepassCatalog';

// Atlas Pass store. Mirrors the server's per-user JSON blob plus the derived
// summary fields (stars / tier / claimable challenge list). Mutation goes
// through the API helpers below; the store re-applies whatever the server
// returns so the UI stays consistent with the source of truth.
//
// `metricBumps` is a per-session bag of pending counter deltas. We coalesce
// quiz-correct events into it and flush every few seconds so the network
// isn't pinged on every keypress. The flush is also called on tab hide.

const EMPTY = {
    season: SEASON_ID,
    owned: false,
    claimed: [],
    stars: 0,
    totalStars: TOTAL_STARS,
    tier: 0,
    tierCount: TIER_COUNT,
    challenges: [],       // [{ id, cur, goal, done, stars }]
    loaded: false,
};

let state = { ...EMPTY };
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
function setState(patch) { state = { ...state, ...patch }; notify(); }

let authed = false;
let pushTimer = null;
const pendingBumps = {}; // metric -> highest seen counter value
const counterCache = {}; // metric -> last value we sent/got back

function applySummary(s) {
    if (!s) return;
    const challenges = Array.isArray(s.challenges) ? s.challenges : [];
    // Refresh the counter cache from the server's snapshot so future bumps
    // know what the absolute high-water mark is for each metric.
    for (const c of challenges) {
        const def = CHALLENGES_BY_ID[c.id];
        if (def) counterCache[def.metric] = Math.max(counterCache[def.metric] || 0, c.cur || 0);
    }
    setState({
        season: s.season || SEASON_ID,
        owned: !!s.owned,
        claimed: Array.isArray(s.claimed) ? s.claimed : [],
        stars: Math.max(0, Number(s.stars) || 0),
        totalStars: Math.max(0, Number(s.totalStars) || TOTAL_STARS),
        tier: Math.max(0, Number(s.tier) || 0),
        tierCount: Math.max(0, Number(s.tierCount) || TIER_COUNT),
        challenges,
        loaded: true,
    });
}

export function setAuthed(value) { authed = !!value; }

export async function loadBattlepass() {
    try {
        const summary = await api.get('/battlepass');
        applySummary(summary);
        return summary;
    } catch (_) {
        setState({ loaded: true });
        return null;
    }
}

export function resetBattlepass() {
    Object.keys(pendingBumps).forEach((k) => delete pendingBumps[k]);
    Object.keys(counterCache).forEach((k) => delete counterCache[k]);
    state = { ...EMPTY };
    notify();
}

// Bump a client-driven counter by `delta` (or set absolute via { absolute }).
// Server-derived metrics (high_*, mp_wins, mastered, earned_xp, best_streak_any)
// are recomputed on the server from authoritative columns, so this helper just
// pushes a no-op `progress` call to refresh the summary for those — pass null
// metric / 0 delta and use `refreshBattlepass()` for that case.
export function bumpMetric(metric, delta = 1) {
    if (!metric || typeof metric !== 'string') return;
    const n = Math.round(Number(delta) || 0);
    if (n <= 0) return;
    const prev = Math.max(counterCache[metric] || 0, pendingBumps[metric] || 0);
    const next = prev + n;
    pendingBumps[metric] = next;
    if (authed) schedulePush();
}

function schedulePush(delay = 1500) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushTimer = null; flushBattlepass(); }, delay);
}

// Push any pending counter bumps to the server. Safe to call even when there's
// nothing pending — used as a cheap "refresh" trigger after events that change
// server-side stats (mp wins, bonus high scores, mastery streaks).
export async function flushBattlepass() {
    if (!authed) return null;
    const counters = { ...pendingBumps };
    Object.keys(pendingBumps).forEach((k) => delete pendingBumps[k]);
    try {
        const summary = await api.post('/battlepass/progress', { counters });
        applySummary(summary);
        return summary;
    } catch (_) {
        // Re-stage the bumps so they aren't lost on a transient failure.
        for (const [k, v] of Object.entries(counters)) {
            pendingBumps[k] = Math.max(pendingBumps[k] || 0, v);
        }
        return null;
    }
}

// Pure refresh — no counters in the payload. Useful after a server-side event
// (mp win, high-score record) so the summary picks up the new stars.
export async function refreshBattlepass() {
    if (!authed) return null;
    try {
        const summary = await api.post('/battlepass/progress', { counters: {} });
        applySummary(summary);
        return summary;
    } catch (_) { return null; }
}

export async function buyPremium() {
    const res = await api.post('/battlepass/buy', {});
    applySummary(res);
    return res;
}

export async function claimReward(track, tier) {
    const res = await api.post('/battlepass/claim', { track, tier });
    applySummary(res);
    return res;
}

export function isClaimed(track, tier) {
    return state.claimed.includes(`${track}:${tier}`);
}

export function useBattlepass() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}

// Tier metadata helpers re-exported so the screen can stay self-contained.
export { tierFromStars, progressWithinTier, TIER_STAR_COST, CHALLENGES, TIERS_BY_NUM, CHALLENGES_BY_ID };
