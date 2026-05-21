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

// Merge two stat record arrays. Per flag we keep the most progress: max of the
// counters, and the review state from whichever record was answered most recently.
export function mergeFlagStats(localStats, remoteStats) {
    const byCode = new Map();
    for (const rec of localStats || []) byCode.set(rec.code, { ...rec });

    for (const rec of remoteStats || []) {
        const existing = byCode.get(rec.code);
        if (!existing) {
            byCode.set(rec.code, { ...rec });
            continue;
        }
        const localNewer = (existing.lastAnswered || 0) >= (rec.lastAnswered || 0);
        const recent = localNewer ? existing : rec;
        byCode.set(rec.code, {
            code: rec.code,
            correct: Math.max(existing.correct || 0, rec.correct || 0),
            incorrect: Math.max(existing.incorrect || 0, rec.incorrect || 0),
            streak: Math.max(existing.streak || 0, rec.streak || 0),
            lapses: Math.max(existing.lapses || 0, rec.lapses || 0),
            isLeech: !!(existing.isLeech || rec.isLeech),
            nextReview: recent.nextReview ?? null,
            lastAnswered: recent.lastAnswered ?? null,
        });
    }
    return Array.from(byCode.values());
}

// Apply merged stat records back onto the full flagsData (which carries metadata).
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
                /* offline / transient — local progress is still safe in localStorage */
            });
    }, delay);
}
