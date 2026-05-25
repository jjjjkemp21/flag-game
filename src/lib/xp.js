// Client mirror of server/xp.js. Keep the two in sync.
//
// XP = lifetime earned XP (mode- and streak-scaled flag answers) + bonus-mode
// high scores. The earned-XP accumulator lives in the progress store; legacy
// accounts are seeded from the old formula server-side so totals never drop.
import { getBonus, getEarnedXp } from './progress';

export const MASTERY_STREAK = 5;

const BONUS_MODES = ['frenzy', 'pixelated', 'longestRoute', 'language'];

// Unique countries the player has ever placed correctly on the globe (Globe
// mode). Mirrors geoPlacedCount in server/xp.js. This is what the Globe
// leaderboard ranks on so a player's number grows as soon as they get a
// country right, not only when they reach the mastery streak.
export function geoPlacedCount(flagStats) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    return flags.filter((f) => (Number(f.geoCorrect) || 0) > 0).length;
}

export function bonusTotal(bonusScores) {
    const b = bonusScores || {};
    return BONUS_MODES.reduce((sum, k) => sum + (Number(b[k]) || 0), 0);
}

// Total XP for the current account/session (earned + bonus high scores).
export function computeXp() {
    return getEarnedXp() + bonusTotal(getBonus());
}

// Bonus high scores now come from the in-memory progress store (account-tied).
export function readBonusScores() {
    return getBonus();
}

// ---- Per-answer XP scaling -------------------------------------------------
// Harder modes pay more per answer; a hot streak multiplies up to 2x (reached at
// a streak of 30); brand-new flags are worth more than already-mastered ones.

export const MODE_XP = {
    'multiple-choice': 1,     // easiest
    'free-response': 1.5,     // harder — type it from memory
    'globe': 1.75,            // hardest — find the country on the globe
};

// 1.0 at streak 0, ramping to the 2x cap at a 30-answer streak.
export function streakMultiplier(streak) {
    const s = Math.min(Math.max(Number(streak) || 0, 0), 30);
    return 1 + s / 30;
}

// Base award by how well the flag is known *before* this answer.
export function baseXpForFlag(flag) {
    const correct = Number(flag && flag.correct) || 0;
    const streak = Number(flag && flag.streak) || 0;
    if (correct === 0) return 20;             // brand-new flag — biggest reward
    if (streak > MASTERY_STREAK) return 6;    // already mastered — smallest
    return 12;                                // still learning
}

// Compute the XP award for a correct answer. `flag` is the pre-update flag,
// `newStreak` is the run streak after this correct answer.
export function awardForAnswer(flag, mode, newStreak) {
    const base = baseXpForFlag(flag);
    const modeMult = MODE_XP[mode] || 1;
    const multiplier = streakMultiplier(newStreak);
    const amount = Math.max(1, Math.round(base * modeMult * multiplier));
    return { amount, multiplier, base };
}

// A gentle XP cost for a wrong answer, scaled by mode difficulty (the accumulator
// is clamped at zero, so this can never push a total negative).
export function penaltyForAnswer(mode) {
    const modeMult = MODE_XP[mode] || 1;
    return Math.max(1, Math.round(5 * modeMult));
}
