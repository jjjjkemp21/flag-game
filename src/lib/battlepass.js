import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import {
    ACTIVE_SEASON_ID, getSeason, CHALLENGES, CHALLENGES_BY_ID, TIERS_BY_NUM,
    TIER_COUNT, TOTAL_STARS, TIER_STAR_COST, tierFromStars, progressWithinTier,
} from './battlepassCatalog';

// Atlas Pass store. Mirrors the server's per-user summary for the CURRENTLY
// VIEWED season plus the cross-season meta (the season list, which season is
// selected for the home card, and the days-left countdown). Mutation goes
// through the API helpers below; the store re-applies whatever the server
// returns so the UI stays consistent with the source of truth.
//
// `metricBumps` is a per-session bag of pending counter deltas (shared across
// seasons — they're lifetime account counters). We coalesce quiz-correct events
// and flush every few seconds so the network isn't pinged on every keypress.

const EMPTY = {
    season: ACTIVE_SEASON_ID,
    owned: false,
    claimed: [],
    claimedChallenges: [],
    stars: 0,
    totalStars: TOTAL_STARS,
    tier: 0,
    tierCount: TIER_COUNT,
    challenges: [],       // [{ id, cur, raw, goal, done, stars, bucks, claimed }]
    started: false,
    mastered: 0,
    masteryGate: 20,
    loaded: false,
    // Cross-season meta.
    seasons: [],          // [{ id, name, theme }]
    selectedSeason: ACTIVE_SEASON_ID,
    activeSeason: ACTIVE_SEASON_ID,
    daysLeft: null,
    theme: null,
};

let state = { ...EMPTY };
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
function setState(patch) { state = { ...state, ...patch }; notify(); }

let authed = false;
let pushTimer = null;
// The season the screen is currently viewing (and the one progress flushes ask
// the server to summarise back). Defaults to the live season; load/select sync
// it to whatever the server reports as selected.
let viewSeason = ACTIVE_SEASON_ID;
const pendingBumps = {}; // metric -> highest seen counter value
const counterCache = {}; // metric -> last value we sent/got back

function applySummary(s) {
    if (!s) return;
    const challenges = Array.isArray(s.challenges) ? s.challenges : [];
    const seasonId = s.season || ACTIVE_SEASON_ID;
    const byId = getSeason(seasonId).challengesById;
    // Refresh the counter cache from the server's snapshot so future bumps know
    // the absolute high-water mark for each metric (seed from `raw`, the true
    // cumulative value, not the baselined `cur`).
    for (const c of challenges) {
        const def = byId[c.id];
        if (def) {
            const anchor = c.raw != null ? c.raw : (c.cur || 0);
            counterCache[def.metric] = Math.max(counterCache[def.metric] || 0, anchor);
        }
    }
    viewSeason = seasonId;
    setState({
        season: seasonId,
        owned: !!s.owned,
        claimed: Array.isArray(s.claimed) ? s.claimed : [],
        claimedChallenges: Array.isArray(s.claimedChallenges) ? s.claimedChallenges : [],
        stars: Math.max(0, Number(s.stars) || 0),
        totalStars: Math.max(0, Number(s.totalStars) || getSeason(seasonId).totalStars),
        tier: Math.max(0, Number(s.tier) || 0),
        tierCount: Math.max(0, Number(s.tierCount) || getSeason(seasonId).tierCount),
        challenges,
        started: !!s.started,
        mastered: Math.max(0, Number(s.mastered) || 0),
        masteryGate: Math.max(0, Number(s.masteryGate) || 20),
        loaded: true,
        seasons: Array.isArray(s.seasons) ? s.seasons : state.seasons,
        selectedSeason: s.selectedSeason || state.selectedSeason,
        activeSeason: s.activeSeason || ACTIVE_SEASON_ID,
        daysLeft: s.daysLeft != null ? Number(s.daysLeft) : state.daysLeft,
        theme: s.theme || getSeason(seasonId).theme,
    });
}

export function setAuthed(value) { authed = !!value; }

// Load a season's summary. With no argument the server returns the user's
// SELECTED season (drives the home card); pass an id to view a specific season.
export async function loadBattlepass(seasonId) {
    try {
        const q = seasonId ? `?season=${encodeURIComponent(seasonId)}` : '';
        const summary = await api.get(`/battlepass${q}`);
        applySummary(summary);
        return summary;
    } catch (_) {
        setState({ loaded: true });
        return null;
    }
}

// Switch the selected season (persists server-side, updates the home card skin)
// and view it.
export async function selectSeason(seasonId) {
    if (!seasonId) return null;
    try {
        const summary = await api.post('/battlepass/select', { season: seasonId });
        applySummary(summary);
        return summary;
    } catch (_) { return null; }
}

export function resetBattlepass() {
    Object.keys(pendingBumps).forEach((k) => delete pendingBumps[k]);
    Object.keys(counterCache).forEach((k) => delete counterCache[k]);
    viewSeason = ACTIVE_SEASON_ID;
    state = { ...EMPTY };
    notify();
}

// Bump a client-driven counter by `delta`. Server-derived metrics are recomputed
// server-side, so for those use `refreshBattlepass()` instead.
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

// Push any pending counter bumps to the server (counters are shared across
// seasons; the response summarises whichever season is being viewed).
export async function flushBattlepass() {
    if (!authed) return null;
    const counters = { ...pendingBumps };
    Object.keys(pendingBumps).forEach((k) => delete pendingBumps[k]);
    try {
        const summary = await api.post('/battlepass/progress', { counters, season: viewSeason });
        applySummary(summary);
        return summary;
    } catch (_) {
        for (const [k, v] of Object.entries(counters)) {
            pendingBumps[k] = Math.max(pendingBumps[k] || 0, v);
        }
        return null;
    }
}

// Pure refresh — no counters. Useful after a server-side event (mp win, high
// score) so the viewed season's summary picks up the new stars.
export async function refreshBattlepass() {
    if (!authed) return null;
    try {
        const summary = await api.post('/battlepass/progress', { counters: {}, season: viewSeason });
        applySummary(summary);
        return summary;
    } catch (_) { return null; }
}

export async function buyPremium() {
    const res = await api.post('/battlepass/buy', { season: viewSeason });
    applySummary(res);
    return res;
}

export async function claimReward(track, tier) {
    const res = await api.post('/battlepass/claim', { track, tier, season: viewSeason });
    applySummary(res);
    return res;
}

export async function claimChallenge(id) {
    const res = await api.post('/battlepass/claim-challenge', { id, season: viewSeason });
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
export { tierFromStars, progressWithinTier, TIER_STAR_COST, CHALLENGES, TIERS_BY_NUM, CHALLENGES_BY_ID, getSeason };
