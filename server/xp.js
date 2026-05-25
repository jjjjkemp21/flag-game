// Single source of truth for the XP formula. Mirrored on the client in src/lib/xp.js.
// Keep the two in sync.
//
// XP = earned_xp (mode- and streak-scaled flag answers, accumulated on the
// client and stored absolutely) + bonus-mode high scores. Legacy accounts that
// predate earned_xp are seeded from the old derived formula so totals never drop.

const MASTERY_STREAK = 5; // streak strictly greater than this counts as "mastered"
const BONUS_MODES = ['frenzy', 'pixelated', 'longestRoute', 'language'];

function masteredCount(flagStats) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    return flags.filter((f) => (Number(f.streak) || 0) > MASTERY_STREAK).length;
}

// Countries the player has placed correctly on the globe (Globe mode). Uses the
// geoStreak field which rides on the same per-flag stat record alongside the
// flag-recognition streak. Stats_json carries both axes so this needs no DB
// schema change.
function geoMasteredCount(flagStats) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    return flags.filter((f) => (Number(f.geoStreak) || 0) > MASTERY_STREAK).length;
}

// Unique countries the player has ever placed correctly on the globe, mastered
// or not. This is the metric the Globe leaderboard ranks on — it grows the
// moment a player gets a country right, instead of waiting for a 6-in-a-row
// mastery streak, which is what made the leaderboard read "0" for everyone.
function geoPlacedCount(flagStats) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    return flags.filter((f) => (Number(f.geoCorrect) || 0) > 0).length;
}

function bonusTotal(bonusScores) {
    const b = bonusScores || {};
    return BONUS_MODES.reduce((sum, k) => sum + (Number(b[k]) || 0), 0);
}

// The old formula's flag-answer portion — used to seed earned_xp for accounts
// created before per-answer scaling existed, so their XP carries over exactly.
function legacyBaseXp(flagStats) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    let totalCorrect = 0;
    let mastered = 0;
    for (const f of flags) {
        totalCorrect += Number(f.correct) || 0;
        if ((Number(f.streak) || 0) > MASTERY_STREAK) mastered += 1;
    }
    return totalCorrect * 10 + mastered * 50;
}

function totalXp(earnedXp, bonusScores) {
    return Math.max(0, Math.round(Number(earnedXp) || 0)) + bonusTotal(bonusScores);
}

module.exports = {
    masteredCount,
    geoMasteredCount,
    geoPlacedCount,
    bonusTotal,
    legacyBaseXp,
    totalXp,
    MASTERY_STREAK,
};
