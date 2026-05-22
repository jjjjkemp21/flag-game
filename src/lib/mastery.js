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

// A title for a value within a set of ascending { min, title, tier } tiers.
function tieredTitle(value, tiers) {
    const v = Number(value) || 0;
    let pick = tiers[0];
    for (const t of tiers) { if (v >= t.min) pick = t; }
    return { title: pick.title, tier: pick.tier };
}

// Pet life-stage -> badge tier, so the Atlas leaderboard shows the SAME stage
// label players see on their pet panel (deriveStage in src/lib/pet.js).
const STAGE_TIERS = {
    Hatchling:    'stone',
    Sprout:       'bronze',
    Explorer:     'silver',
    Globetrotter: 'gold',
    Legend:       'platinum',
    Resting:      'stone',
};

// Bonus-mode tiers keyed to the achievement thresholds for each mode.
const BONUS_TIERS = {
    frenzy:       [{ min: 0, title: 'Newcomer', tier: 'stone' }, { min: 100, title: 'Frenzy Rookie', tier: 'bronze' }, { min: 250, title: 'Frenzy Pro', tier: 'silver' }, { min: 500, title: 'Frenzy Legend', tier: 'gold' }],
    pixelated:    [{ min: 0, title: 'Newcomer', tier: 'stone' }, { min: 100, title: 'Pixel Peeker', tier: 'bronze' }, { min: 250, title: 'Pixel Pro', tier: 'silver' }, { min: 500, title: 'Pixel Master', tier: 'gold' }],
    longestRoute: [{ min: 0, title: 'Newcomer', tier: 'stone' }, { min: 8,  title: 'Chain Starter', tier: 'bronze' }, { min: 15, title: 'Chain Master', tier: 'silver' }, { min: 25, title: 'Unbroken', tier: 'gold' }],
    language:     [{ min: 0, title: 'Newcomer', tier: 'stone' }, { min: 10, title: 'Linguist', tier: 'bronze' }, { min: 20, title: 'Polyglot', tier: 'silver' }, { min: 30, title: 'Babel Breaker', tier: 'gold' }],
};

// The rank title to show under a leaderboard row for a given scope, so the label
// always matches the value being ranked. Overall/Friends keep the mastery rank;
// Atlas and the bonus modes get a title for that metric. `entry` is a leaderboard
// entry; `value` is the row's metric value for the scope.
const MP_WIN_TIERS = [
    { min: 0,  title: 'Rookie',     tier: 'stone' },
    { min: 5,  title: 'Contender',  tier: 'bronze' },
    { min: 15, title: 'Challenger', tier: 'silver' },
    { min: 30, title: 'Champion',   tier: 'gold' },
];

export function scopeRank(scope, entry, total) {
    if (scope === 'atlas') {
        const stage = entry.petStage || 'Hatchling';
        return { title: stage, tier: STAGE_TIERS[stage] || 'stone' };
    }
    if (scope === 'mpwins') return tieredTitle(entry.value || 0, MP_WIN_TIERS);
    if (BONUS_TIERS[scope]) return tieredTitle(entry.value || 0, BONUS_TIERS[scope]);
    return masteryRank(entry.masteredCount || 0, total); // overall / friends
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
