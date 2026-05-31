// Achievements catalog + computation. Achievements are evaluated client-side
// from the player's live stats; the unlocked count and the (up to 3) showcased
// ids are synced to the account so they can appear on the leaderboard.

import { MASTERY_STREAK } from './xp';
import { getCapitalMasteredCount, getCapitalTotal, getCapitalCorrectTotal } from './capitals';

export const CONTINENTS = [
    { key: 'africa',        label: 'Africa',        tag: 'region:africa' },
    { key: 'europe',        label: 'Europe',        tag: 'region:europe' },
    { key: 'asia',          label: 'Asia',          tag: 'region:asia' },
    { key: 'north_america', label: 'North America', tag: 'region:north_america' },
    { key: 'south_america', label: 'South America', tag: 'region:south_america' },
    { key: 'oceania',       label: 'Oceania',       tag: 'region:oceania' },
    { key: 'territory',     label: 'Territories',   tag: 'region:territory' },
];

// ISO-A2 codes of catalog flags whose country actually has a polygon in
// Natural Earth's ne_110m_admin_0_countries.geojson (what Globe mode loads).
// A 2-letter code in the catalog doesn't automatically mean the globe can
// render it — micro-states (SG, MT, VA, BM, etc.) are dropped from the 110m
// dataset for legibility at world scale. Used to compute the geo-eligible
// total without waiting for the 3D globe to load.
export const GLOBE_RENDERABLE_ISO2 = new Set([
    'AE','AF','AL','AM','AO','AQ','AR','AT','AU','AZ','BA','BD','BE','BF','BG','BI','BJ','BN','BO','BR',
    'BS','BT','BW','BY','BZ','CA','CD','CF','CG','CH','CI','CL','CM','CN','CO','CR','CU','CY','CZ','DE',
    'DJ','DK','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FR','GA','GB','GE','GH','GL',
    'GM','GN','GQ','GR','GT','GW','GY','HN','HR','HT','HU','ID','IE','IL','IN','IQ','IR','IS','IT','JM',
    'JO','JP','KE','KG','KH','KP','KR','KW','KZ','LA','LB','LK','LR','LS','LT','LU','LV','LY','MA','MD',
    'ME','MG','MK','ML','MM','MN','MR','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NZ',
    'OM','PA','PE','PG','PH','PK','PL','PR','PS','PT','PY','QA','RO','RS','RU','RW','SA','SB','SD','SE',
    'SI','SK','SL','SN','SO','SR','SS','SV','SY','SZ','TD','TG','TH','TJ','TL','TM','TN','TR','TT',
    'TW','TZ','UA','UG','US','UY','UZ','VE','VN','VU','XK','YE','ZA','ZM','ZW',
]);

// Convenience: how many countries Globe mode can render (size of the set
// above). Surfaced as a constant so callers don't have to know it's a Set.
export const GLOBE_RENDERABLE_COUNT = GLOBE_RENDERABLE_ISO2.size;

// Build the evaluation context from the full flagsData + bonus high scores +
// pet level + lifetime earned XP. Geography stats (Globe mode) live on the
// same per-flag record so we walk the list once and accumulate both axes.
export function buildContext(flagsData, bonus, petLevel, earnedXp) {
    const flags = Array.isArray(flagsData) ? flagsData : [];
    const continents = {};
    const geoContinents = {};
    CONTINENTS.forEach((c) => {
        continents[c.key] = { mastered: 0, total: 0 };
        geoContinents[c.key] = { mastered: 0, total: 0 };
    });

    let totalCorrect = 0;
    let mastered = 0;
    let geoTotalCorrect = 0;
    let geoMastered = 0;
    // Globe mode can only see flags whose ISO-A2 has a polygon in Natural
    // Earth's 110m dataset (see GLOBE_RENDERABLE_ISO2). Sub-national codes
    // (GB-WLS, ES-CT, SH-AC), supranationals (EU, UN), and a handful of
    // micro-states the 110m dataset drops (SG, MT, VA, etc.) all fall out,
    // so the "place every country" goal has to count them separately.
    let geoEligibleTotal = 0;
    for (const f of flags) {
        totalCorrect += Number(f.correct) || 0;
        const isMastered = (Number(f.streak) || 0) > MASTERY_STREAK;
        if (isMastered) mastered += 1;
        geoTotalCorrect += Number(f.geoCorrect) || 0;
        const isGeoMastered = (Number(f.geoStreak) || 0) > MASTERY_STREAK;
        const code = (f.code || '').toUpperCase();
        const isGeoEligible = GLOBE_RENDERABLE_ISO2.has(code);
        if (isGeoEligible) {
            geoEligibleTotal += 1;
            // Only globe-renderable flags count toward the geo-mastery meter, so
            // its numerator can never exceed geoEligibleTotal (the "X / 174").
            if (isGeoMastered) geoMastered += 1;
        }
        const tags = f.tags || [];
        for (const c of CONTINENTS) {
            if (tags.includes(c.tag)) {
                continents[c.key].total += 1;
                if (isMastered) continents[c.key].mastered += 1;
                // Per-continent geo totals: only count flags the globe can
                // actually render so the "Place every country in X" goal
                // stays reachable for continents that mix sovereign
                // countries with territories / supranationals.
                if (isGeoEligible) {
                    geoContinents[c.key].total += 1;
                    if (isGeoMastered) geoContinents[c.key].mastered += 1;
                }
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
        earnedXp: Math.max(0, Number(earnedXp) || 0),
        geoTotalCorrect,
        geoMastered,
        geoEligibleTotal,
        geoContinents,
        // Capitals mastery — its own track, read live from the capitals store
        // (kept out of the per-flag walk above since capitals aren't flags).
        // See src/lib/capitals.js.
        capitalMastered: getCapitalMasteredCount(),
        capitalTotal: getCapitalTotal(),
        capitalCorrect: getCapitalCorrectTotal(),
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

// `yieldPct` (optional) denotes the end-of-run chest-yield bonus this mastery
// tier unlocks, so the Achievements screen makes the reward explicit. The bonus
// itself is computed from the same thresholds in chestYieldMultFromMastery().
const masteryMilestone = (n, name, tier, yieldPct) => ({
    id: `mastery_${n}`,
    group: 'Mastery',
    name,
    desc: `Master ${n} flags${yieldPct ? ` · +${yieldPct}% chest yield` : ''}`,
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
    desc: `Score ${n} in ${({ frenzy: 'Frenzy', pixelated: 'Pixelated', longestRoute: 'Longest Chain', language: 'Language', capitals: 'Capitals' })[mode]}`,
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

// Globe-mode achievements. Mirrors the flag-mastery ladder but counts geography
// mastery (countries the player has placed correctly on the 3D globe). The
// per-continent variants are gated to continents with at least one country in
// the catalog so they only unlock once the deck actually contains them.
const geoMasteryMilestone = (n, name, tier) => ({
    id: `geo_mastery_${n}`,
    group: 'Globe',
    name,
    desc: `Place ${n} countries on the globe`,
    icon: 'public',
    tier,
    check: (x) => x.geoMastered >= n,
    progress: (x) => ({ cur: x.geoMastered, goal: n }),
});

const geoCorrectMilestone = (n, name, tier) => ({
    id: `geo_correct_${n}`,
    group: 'Globe',
    name,
    desc: `Correctly place ${n.toLocaleString()} countries on the globe`,
    icon: 'travel_explore',
    tier,
    check: (x) => x.geoTotalCorrect >= n,
    progress: (x) => ({ cur: x.geoTotalCorrect, goal: n }),
});

// Capitals mode — its own mastery ladder (master = recall a country's capital
// past the shared mastery streak). Separate group so it reads as a distinct
// track, parallel to Globe's geography axis. See src/lib/capitals.js.
const capitalMasteryMilestone = (n, name, tier) => ({
    id: `capital_mastery_${n}`,
    group: 'Capitals',
    name,
    desc: `Master ${n} capitals`,
    icon: 'location_city',
    tier,
    check: (x) => x.capitalMastered >= n,
    progress: (x) => ({ cur: x.capitalMastered, goal: n }),
});

const geoContinentAchievements = CONTINENTS.map((c) => ({
    id: `geo_continent_${c.key}`,
    group: 'Globe',
    name: `${c.label} Atlas`,
    desc: `Place every country in ${c.label} on the globe`,
    icon: 'explore',
    tier: 'silver',
    check: (x) => x.geoContinents[c.key].total > 0 && x.geoContinents[c.key].mastered >= x.geoContinents[c.key].total,
    progress: (x) => ({ cur: x.geoContinents[c.key].mastered, goal: x.geoContinents[c.key].total }),
}));

export const ACHIEVEMENTS = [
    { id: 'first_steps', group: 'Mastery', name: 'First Steps', desc: 'Answer your first flag correctly', icon: 'flag', tier: 'stone',
        check: (x) => x.totalCorrect >= 1, progress: (x) => ({ cur: Math.min(x.totalCorrect, 1), goal: 1 }) },
    masteryMilestone(10, 'Getting Started', 'bronze', 5),
    masteryMilestone(50, 'Flag Fan', 'silver', 10),
    masteryMilestone(100, 'Flag Scholar', 'gold', 15),
    masteryMilestone(230, 'Flag Sage', 'platinum', 20),

    ...continentAchievements,
    { id: 'all_flags', group: 'Continents', name: 'Cartographer Supreme', desc: 'Master every flag in the world · +25% chest yield', icon: 'travel_explore', tier: 'legend',
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
    bonusMilestone('capitals', 25, 'City Mapper', 'location_city', 'bronze'),
    bonusMilestone('capitals', 75, 'Capital Collector', 'location_city', 'silver'),
    bonusMilestone('capitals', 150, 'Capital Sage', 'location_city', 'gold'),

    atlasMilestone(5, 'Atlas Companion', 'bronze'),
    atlasMilestone(10, 'Atlas Caretaker', 'silver'),
    atlasMilestone(20, 'Atlas Guardian', 'gold'),

    // Globe mode — geography mastery axis.
    { id: 'geo_first_landing', group: 'Globe', name: 'First Landing', desc: 'Correctly place your first country on the globe', icon: 'flag', tier: 'stone',
        check: (x) => x.geoTotalCorrect >= 1, progress: (x) => ({ cur: Math.min(x.geoTotalCorrect, 1), goal: 1 }) },
    geoMasteryMilestone(10,  'Map Reader',       'bronze'),
    geoMasteryMilestone(50,  'World Wanderer',   'silver'),
    geoMasteryMilestone(100, 'Globe Trotter',    'gold'),
    geoMasteryMilestone(160, 'Earth Scholar',    'platinum'),
    geoCorrectMilestone(100,  'Sure Hand',       'bronze'),
    geoCorrectMilestone(1000, 'Steady Compass',  'silver'),
    geoCorrectMilestone(5000, 'True North',      'gold'),
    ...geoContinentAchievements,
    { id: 'geo_all_flags', group: 'Globe', name: 'Atlas Cartographer', desc: 'Master every country and territory the globe can render', icon: 'public', tier: 'legend',
        check: (x) => x.geoEligibleTotal > 0 && x.geoMastered >= x.geoEligibleTotal, progress: (x) => ({ cur: x.geoMastered, goal: x.geoEligibleTotal }) },

    // Capitals — name each country's capital. Its own per-capital mastery axis.
    { id: 'capital_first', group: 'Capitals', name: 'First Capital', desc: 'Correctly name your first capital', icon: 'location_city', tier: 'stone',
        check: (x) => x.capitalCorrect >= 1, progress: (x) => ({ cur: Math.min(x.capitalCorrect, 1), goal: 1 }) },
    capitalMasteryMilestone(10, 'City Scout', 'bronze'),
    capitalMasteryMilestone(25, 'Capital Navigator', 'silver'),
    capitalMasteryMilestone(50, 'Capital Cartographer', 'gold'),
    capitalMasteryMilestone(100, 'Capital Authority', 'platinum'),
    { id: 'capital_all', group: 'Capitals', name: 'Capital of the World', desc: 'Master every capital', icon: 'public', tier: 'legend',
        check: (x) => x.capitalTotal > 0 && x.capitalMastered >= x.capitalTotal, progress: (x) => ({ cur: x.capitalMastered, goal: x.capitalTotal }) },
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

export const ACHIEVEMENT_GROUPS = ['Mastery', 'Continents', 'Accuracy', 'Globe', 'Capitals', 'Bonus Modes', 'Atlas'];

// Returns the array of unlocked achievement ids for a context.
export function evaluate(ctx) {
    return ACHIEVEMENTS.filter((a) => {
        try { return a.check(ctx); } catch (_) { return false; }
    }).map((a) => a.id);
}
