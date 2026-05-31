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
//
// Economy v2 (2026-05-28): XP rates doubled. The legacy XP→Bucks claim is gone;
// Atlas Bucks now land directly per answer at the OLD rate (= half the new XP
// rate). `awardBucksForAnswer()` returns that companion Bucks number.

export const MODE_XP = {
    'multiple-choice': 2,     // was 1
    'free-response': 3,       // was 1.5
    'globe': 3.5,             // was 1.75
    'globe-name': 4,          // was 2
    'capitals': 3,            // capital recall — its own mastery track
    'us-states-map': 3.5,     // tap-on-2D-map — same difficulty band as Globe find
    'us-states-capitals': 3,  // US state capitals — same band as world capitals
    'us-states-flags': 2.5,   // state-flag recognition — between world MC (2) and FR (3)
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

// Companion Bucks award for a correct answer. The new XP rate is 2x the old
// rate; Bucks land at the OLD rate (= XP amount / 2). Returns a whole number
// (floor) so a 1-XP answer still pays 0 Bucks instead of rounding up to 1 —
// otherwise every minimum-XP answer would over-reward Bucks vs. the old
// trade-in economy. Wrong answers never refund or subtract Bucks.
export function awardBucksForAnswer(xpAward) {
    const xp = Math.max(0, Math.round(Number(xpAward && xpAward.amount) || 0));
    return Math.floor(xp / 2);
}
