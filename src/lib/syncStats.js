import { api } from '../api/client';
import { readBonusScores } from './xp';

const STAT_FIELDS = ['correct', 'incorrect', 'streak', 'lapses', 'isLeech', 'nextReview', 'lastAnswered'];

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

// Debounced upload of the current progress to the backend. Safe to call on every
// stats change; only the last call within the window actually fires.
export function pushStats(flagsData, delay = 1500) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api
            .put('/stats', {
                flagStats: extractFlagStats(flagsData),
                bonusScores: readBonusScores(),
            })
            .catch(() => {
                /* offline / transient — will sync again on the next change */
            });
    }, delay);
}
