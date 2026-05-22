// Mastery rank — a title earned by how many flags you've mastered (streak > 5).
// Thresholds are absolute counts; the very top tier requires every flag.

export const MASTERY_RANKS = [
    { min: 0,   title: 'Novice',       tier: 'stone' },
    { min: 5,   title: 'Wanderer',     tier: 'bronze' },
    { min: 15,  title: 'Explorer',     tier: 'bronze' },
    { min: 30,  title: 'Navigator',    tier: 'silver' },
    { min: 60,  title: 'Cartographer', tier: 'silver' },
    { min: 100, title: 'Geographer',   tier: 'gold' },
    { min: 150, title: 'Globetrotter', tier: 'gold' },
    { min: 200, title: 'Atlas Master', tier: 'platinum' },
];

const CHAMPION = { title: 'World Champion', tier: 'legend' };

// Returns { title, tier, index }. When `total` is known and everything is
// mastered, awards the legendary "World Champion".
export function masteryRank(mastered, total) {
    const m = Number(mastered) || 0;
    if (total && m >= total) {
        return { ...CHAMPION, index: MASTERY_RANKS.length };
    }
    let rank = MASTERY_RANKS[0];
    let index = 0;
    for (let i = 0; i < MASTERY_RANKS.length; i++) {
        if (m >= MASTERY_RANKS[i].min) { rank = MASTERY_RANKS[i]; index = i; }
    }
    return { ...rank, index };
}

// Info for a progress bar toward the next rank, or null at the top.
export function nextRank(mastered, total) {
    const m = Number(mastered) || 0;
    const current = masteryRank(m, total);
    if (current.tier === 'legend') return null;
    const next = MASTERY_RANKS[current.index + 1];
    if (!next) {
        // Next step is mastering everything (World Champion).
        if (!total) return null;
        return { title: CHAMPION.title, goal: total, remaining: Math.max(0, total - m) };
    }
    return { title: next.title, goal: next.min, remaining: Math.max(0, next.min - m) };
}
