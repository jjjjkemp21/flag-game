// Client mirror of server/xp.js. Keep the two in sync.
import { getBonus } from './progress';

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

// Bonus high scores now come from the in-memory progress store (account-tied).
export function readBonusScores() {
    return getBonus();
}
