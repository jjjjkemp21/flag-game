import { api } from '../api/client';
import { addEarnedBucks, getBucksEarnedLifetime } from './currency';

// In-memory progress store for bonus-mode high scores. Progress is tied to the
// account: nothing is written to localStorage. For guests it lives only for the
// current session; for logged-in users it is loaded from / pushed to the server.

const EMPTY = { frenzy: 0, pixelated: 0, longestRoute: 0, language: 0, capitals: 0 };

let bonus = { ...EMPTY };
// Lifetime XP earned from answering flags (mode- and streak-scaled). Bonus-mode
// high scores are added on top in the XP formula, so this holds only the
// flag-answer portion. Account-tied: loaded from / pushed to the server.
let earnedXp = 0;
let authed = false;
let pushTimer = null;

export function setAuthed(value) {
    authed = !!value;
}

export function loadBonus(scores) {
    bonus = { ...EMPTY, ...(scores || {}) };
}

export function resetBonus() {
    bonus = { ...EMPTY };
}

export function getBonus() {
    return { ...bonus };
}

// ---- Earned XP accumulator ----
export function loadEarnedXp(value) {
    earnedXp = Math.max(0, Math.round(Number(value) || 0));
}

export function resetEarnedXp() {
    earnedXp = 0;
}

export function getEarnedXp() {
    return earnedXp;
}

// Add a scaled per-answer award. Persists to the account (debounced) when logged
// in; the normal stats push also carries the absolute value, so this is safe to
// call freely. Returns the new total.
export function addEarnedXp(amount) {
    const a = Math.round(Number(amount) || 0);
    if (a === 0) return earnedXp;
    // Allow negative deltas (a wrong answer costs XP), but never below zero.
    earnedXp = Math.max(0, earnedXp + a);
    if (authed) pushBonus();
    return earnedXp;
}

export function getHighScore(name) {
    return bonus[name] || 0;
}

function pushBonus(delay = 1200) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/stats', {
            bonusScores: getBonus(),
            earnedXp,
            bucksEarnedLifetime: getBucksEarnedLifetime(),
        }).catch(() => {
            /* offline / transient — guest progress is intentionally ephemeral */
        });
    }, delay);
}

// Immediate, non-debounced push of the bonus scores. Returns a promise that
// resolves once the server has the new value — callers chain refreshBattlepass()
// onto it so the pass UI sees the new high before re-reading bonus_scores_json.
export function flushBonus() {
    if (!authed) return Promise.resolve(null);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    return api.put('/stats', {
        bonusScores: getBonus(),
        earnedXp,
        bucksEarnedLifetime: getBucksEarnedLifetime(),
    }).catch(() => null);
}

// Record a new score for a bonus mode. Only persisted (to the account) when
// logged in; guests just keep it in memory until reload/logout. Economy v2:
// a new high also credits Bucks at the OLD rate (half the delta), since the
// XP rate doubled but Bucks track the pre-v2 reward scale.
export function recordHighScore(name, value) {
    const v = Number(value) || 0;
    const prev = bonus[name] || 0;
    if (v > prev) {
        bonus[name] = v;
        const bucksDelta = Math.floor((v - prev) / 2);
        if (bucksDelta > 0) addEarnedBucks(bucksDelta);
        if (authed) pushBonus();
    }
    return bonus[name];
}

