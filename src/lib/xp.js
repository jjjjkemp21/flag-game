// Client mirror of server/xp.js. Keep the two in sync.

export const MASTERY_STREAK = 5;

export function computeXp(flagStats, bonusScores) {
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

// Read the per-mode high scores that live in localStorage.
export function readBonusScores() {
    const num = (k) => Number(localStorage.getItem(k)) || 0;
    return {
        frenzy: num('frenzyHighScore'),
        pixelated: num('pixelatedHighScore'),
        longestRoute: num('longestRouteHighScore'),
        language: num('languageHighScore'),
    };
}
