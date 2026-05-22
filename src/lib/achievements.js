// Achievements catalog + computation. Achievements are evaluated client-side
// from the player's live stats; the unlocked count and the (up to 3) showcased
// ids are synced to the account so they can appear on the leaderboard.

import { MASTERY_STREAK } from './xp';

export const CONTINENTS = [
    { key: 'africa',        label: 'Africa',        tag: 'region:africa' },
    { key: 'europe',        label: 'Europe',        tag: 'region:europe' },
    { key: 'asia',          label: 'Asia',          tag: 'region:asia' },
    { key: 'north_america', label: 'North America', tag: 'region:north_america' },
    { key: 'south_america', label: 'South America', tag: 'region:south_america' },
    { key: 'oceania',       label: 'Oceania',       tag: 'region:oceania' },
];

// Build the evaluation context from the full flagsData + bonus high scores + pet level.
export function buildContext(flagsData, bonus, petLevel) {
    const flags = Array.isArray(flagsData) ? flagsData : [];
    const continents = {};
    CONTINENTS.forEach((c) => { continents[c.key] = { mastered: 0, total: 0 }; });

    let totalCorrect = 0;
    let mastered = 0;
    for (const f of flags) {
        totalCorrect += Number(f.correct) || 0;
        const isMastered = (Number(f.streak) || 0) > MASTERY_STREAK;
        if (isMastered) mastered += 1;
        const tags = f.tags || [];
        for (const c of CONTINENTS) {
            if (tags.includes(c.tag)) {
                continents[c.key].total += 1;
                if (isMastered) continents[c.key].mastered += 1;
            }
        }
    }

    return {
        total: flags.length,
        totalCorrect,
        mastered,
        continents,
        bonus: bonus || {},
        petLevel: Number(petLevel) || 1,
    };
}

// --- Catalog ---------------------------------------------------------------
// tier: stone | bronze | silver | gold | platinum | legend
// progress(ctx) -> { cur, goal } is optional (drives a progress bar).

const continentAchievements = CONTINENTS.map((c) => ({
    id: `continent_${c.key}`,
    group: 'Continents',
    name: `${c.label} Master`,
    desc: `Master every flag in ${c.label}`,
    icon: 'public',
    tier: 'silver',
    check: (x) => x.continents[c.key].total > 0 && x.continents[c.key].mastered >= x.continents[c.key].total,
    progress: (x) => ({ cur: x.continents[c.key].mastered, goal: x.continents[c.key].total }),
}));

const masteryMilestone = (n, name, tier) => ({
    id: `mastery_${n}`,
    group: 'Mastery',
    name,
    desc: `Master ${n} flags`,
    icon: 'star',
    tier,
    check: (x) => x.mastered >= n,
    progress: (x) => ({ cur: x.mastered, goal: n }),
});

const correctMilestone = (n, name, tier) => ({
    id: `correct_${n}`,
    group: 'Accuracy',
    name,
    desc: `Answer ${n.toLocaleString()} flags correctly`,
    icon: 'check_circle',
    tier,
    check: (x) => x.totalCorrect >= n,
    progress: (x) => ({ cur: x.totalCorrect, goal: n }),
});

const bonusMilestone = (mode, n, name, icon, tier) => ({
    id: `${mode}_${n}`,
    group: 'Bonus Modes',
    name,
    desc: `Score ${n} in ${({ frenzy: 'Frenzy', pixelated: 'Pixelated', longestRoute: 'Longest Chain', language: 'Language' })[mode]}`,
    icon,
    tier,
    check: (x) => (Number(x.bonus[mode]) || 0) >= n,
    progress: (x) => ({ cur: Number(x.bonus[mode]) || 0, goal: n }),
});

const atlasMilestone = (n, name, tier) => ({
    id: `atlas_${n}`,
    group: 'Atlas',
    name,
    desc: `Raise Atlas to Level ${n}`,
    icon: 'pets',
    tier,
    check: (x) => x.petLevel >= n,
    progress: (x) => ({ cur: x.petLevel, goal: n }),
});

export const ACHIEVEMENTS = [
    { id: 'first_steps', group: 'Mastery', name: 'First Steps', desc: 'Answer your first flag correctly', icon: 'flag', tier: 'stone',
        check: (x) => x.totalCorrect >= 1, progress: (x) => ({ cur: Math.min(x.totalCorrect, 1), goal: 1 }) },
    masteryMilestone(10, 'Getting Started', 'bronze'),
    masteryMilestone(50, 'Flag Fan', 'silver'),
    masteryMilestone(100, 'Flag Scholar', 'gold'),
    masteryMilestone(200, 'Flag Sage', 'platinum'),

    ...continentAchievements,
    { id: 'all_flags', group: 'Continents', name: 'Cartographer Supreme', desc: 'Master every flag in the world', icon: 'travel_explore', tier: 'legend',
        check: (x) => x.total > 0 && x.mastered >= x.total, progress: (x) => ({ cur: x.mastered, goal: x.total }) },

    correctMilestone(100, 'Quick Study', 'bronze'),
    correctMilestone(1000, 'Sharp Eye', 'silver'),
    correctMilestone(5000, 'Flag Savant', 'gold'),

    bonusMilestone('frenzy', 100, 'Frenzy Rookie', 'bolt', 'bronze'),
    bonusMilestone('frenzy', 250, 'Frenzy Pro', 'bolt', 'silver'),
    bonusMilestone('frenzy', 500, 'Frenzy Legend', 'bolt', 'gold'),
    bonusMilestone('pixelated', 100, 'Pixel Peeker', 'blur_on', 'bronze'),
    bonusMilestone('pixelated', 250, 'Pixel Pro', 'blur_on', 'silver'),
    bonusMilestone('pixelated', 500, 'Pixel Master', 'blur_on', 'gold'),
    bonusMilestone('longestRoute', 8, 'Chain Starter', 'route', 'bronze'),
    bonusMilestone('longestRoute', 15, 'Chain Master', 'route', 'silver'),
    bonusMilestone('longestRoute', 25, 'Unbroken', 'route', 'gold'),
    bonusMilestone('language', 10, 'Linguist', 'translate', 'bronze'),
    bonusMilestone('language', 20, 'Polyglot', 'translate', 'silver'),
    bonusMilestone('language', 30, 'Babel Breaker', 'translate', 'gold'),

    atlasMilestone(5, 'Atlas Companion', 'bronze'),
    atlasMilestone(10, 'Atlas Caretaker', 'silver'),
    atlasMilestone(20, 'Atlas Guardian', 'gold'),
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// Rank tiers from least to most impressive — used to pick which achievements to
// auto-feature on the leaderboard when the player hasn't curated a showcase.
const TIER_ORDER = { stone: 0, bronze: 1, silver: 2, gold: 3, platinum: 4, legend: 5 };

// The best `n` unlocked achievements (highest tier first), preserving catalog
// order within a tier. Used as a default showcase so achievements always appear.
export function topAchievements(unlockedIds, n = 3) {
    const ids = Array.isArray(unlockedIds) ? unlockedIds : [];
    return ids
        .map((id) => ACHIEVEMENTS_BY_ID[id])
        .filter(Boolean)
        .sort((a, b) => (TIER_ORDER[b.tier] || 0) - (TIER_ORDER[a.tier] || 0))
        .slice(0, n)
        .map((a) => a.id);
}

export const ACHIEVEMENT_GROUPS = ['Mastery', 'Continents', 'Accuracy', 'Bonus Modes', 'Atlas'];

// Returns the array of unlocked achievement ids for a context.
export function evaluate(ctx) {
    return ACHIEVEMENTS.filter((a) => {
        try { return a.check(ctx); } catch (_) { return false; }
    }).map((a) => a.id);
}
