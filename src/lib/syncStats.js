import { api } from '../api/client';
import { readBonusScores } from './xp';
import { getEarnedXp } from './progress';

const STAT_FIELDS = [
    'correct', 'incorrect', 'streak', 'lapses', 'isLeech', 'nextReview', 'lastAnswered',
    // Geography stats (Globe mode) — independent from flag-recognition stats so a
    // player can be a flag expert without yet knowing where a country lives, and
    // vice versa. Rides on the same per-flag record (no DB schema change needed:
    // server stores the whole array as stats_json).
    'geoCorrect', 'geoIncorrect', 'geoStreak', 'geoLapses', 'geoLastAnswered',
    'geoNextReview', 'geoIsLeech',
];

// Pull the minimal per-flag progress records out of the full flagsData array.
export function extractFlagStats(flagsData) {
    return (flagsData || [])
        .filter((f) => f && f.code)
        .map((f) => ({
            code: f.code,
            correct: f.correct || 0,
            incorrect: f.incorrect || 0,
            streak: f.streak || 0,
            lapses: f.lapses || 0,
            isLeech: !!f.isLeech,
            nextReview: f.nextReview ?? null,
            lastAnswered: f.lastAnswered ?? null,
            geoCorrect: f.geoCorrect || 0,
            geoIncorrect: f.geoIncorrect || 0,
            geoStreak: f.geoStreak || 0,
            geoLapses: f.geoLapses || 0,
            geoLastAnswered: f.geoLastAnswered ?? null,
            geoNextReview: f.geoNextReview ?? null,
            geoIsLeech: !!f.geoIsLeech,
        }));
}

const ZERO = {
    correct: 0,
    incorrect: 0,
    streak: 0,
    lapses: 0,
    isLeech: false,
    nextReview: null,
    lastAnswered: null,
    geoCorrect: 0,
    geoIncorrect: 0,
    geoStreak: 0,
    geoLapses: 0,
    geoLastAnswered: null,
    geoNextReview: null,
    geoIsLeech: false,
};

// Return the flags with all progress fields reset (used for guests / logout).
export function zeroFlagStats(flagsData) {
    return (flagsData || []).map((flag) => ({ ...flag, ...ZERO }));
}

// Apply stat records onto the full flagsData (which carries metadata).
export function applyStatsToFlags(flagsData, statRecords) {
    const byCode = new Map((statRecords || []).map((r) => [r.code, r]));
    return (flagsData || []).map((flag) => {
        const rec = byCode.get(flag.code);
        if (!rec) return flag;
        const merged = { ...flag };
        for (const field of STAT_FIELDS) {
            if (rec[field] !== undefined) merged[field] = rec[field];
        }
        return merged;
    });
}

let pushTimer = null;

function payload(flagsData) {
    return {
        flagStats: extractFlagStats(flagsData),
        bonusScores: readBonusScores(),
        earnedXp: getEarnedXp(),
    };
}

// Debounced upload of the current progress to the backend. Safe to call on every
// stats change; only the last call within the window actually fires.
export function pushStats(flagsData, delay = 1500) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/stats', payload(flagsData)).catch(() => {
            /* offline / transient — will sync again on the next change */
        });
    }, delay);
}

// Immediate flush — cancels any pending debounce and sends now. Used when the
// page is being hidden/closed so a long session's last answers aren't lost.
// Falls back to sendBeacon, which survives unload when fetch would be cancelled.
export function flushStats(flagsData) {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    const body = payload(flagsData);
    try {
        const token = localStorage.getItem('flagQuestToken');
        const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
        // sendBeacon can't set an Authorization header, so pass the token as a
        // query param (the /stats route accepts it as a fallback on beacons).
        if (navigator.sendBeacon && token) {
            const ok = navigator.sendBeacon(`/api/stats/beacon?token=${encodeURIComponent(token)}`, blob);
            if (ok) return;
        }
    } catch (_) { /* fall through to fetch */ }
    api.put('/stats', body).catch(() => {});
}
