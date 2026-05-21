// Single source of truth for the XP formula. Mirrored on the client in src/lib/xp.js.
// Keep the two in sync.

const MASTERY_STREAK = 5; // streak strictly greater than this counts as "mastered"

function computeXp(flagStats, bonusScores) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    const bonus = bonusScores || {};

    let totalCorrect = 0;
    let mastered = 0;
    for (const f of flags) {
        totalCorrect += Number(f.correct) || 0;
        if ((Number(f.streak) || 0) > MASTERY_STREAK) mastered += 1;
    }

    const bonusTotal =
        (Number(bonus.frenzy) || 0) +
        (Number(bonus.pixelated) || 0) +
        (Number(bonus.longestRoute) || 0) +
        (Number(bonus.language) || 0);

    return totalCorrect * 10 + mastered * 50 + bonusTotal;
}

function masteredCount(flagStats) {
    const flags = Array.isArray(flagStats) ? flagStats : [];
    return flags.filter((f) => (Number(f.streak) || 0) > MASTERY_STREAK).length;
}

module.exports = { computeXp, masteredCount, MASTERY_STREAK };
