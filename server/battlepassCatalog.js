// Battlepass season catalog — challenges + tier rewards. The server reads this
// to (a) validate claims (free vs. premium ownership + already-claimed guard),
// (b) grant the reward (bucks credit or cosmetic ownership), and (c) compute
// star totals from a snapshot of user state. The client renders the same data;
// keep this and src/lib/battlepassCatalog.js in lock-step.
//
// A "season" is a single static identifier baked into the catalog. Bumping
// SEASON_ID resets every player's progress + claims on next request (a clean
// slate for the next pass). The premium-pass purchase carries forward only
// within a season.

const SEASON_ID = 'atlas-pass-1';
const SEASON_NAME = 'Atlas Pass — Season 1';

// Players buy the premium track once per season for this many Atlas Bucks.
const PREMIUM_PRICE = 10000;

// Stars required to reach each tier from the previous tier. Tier N unlocks when
// the player's cumulative star count >= the prefix sum up to N. 25 tiers, mild
// curve so the back half feels weightier without being grindy.
const TIER_STAR_COST = [
    600, 700, 800, 900, 1000, // 1-5
    1100, 1200, 1300, 1400, 1500, // 6-10
    1600, 1700, 1800, 1900, 2000, // 11-15
    2100, 2200, 2300, 2400, 2500, // 16-20
    2700, 2900, 3100, 3300, 3500, // 21-25
];

const TIER_COUNT = TIER_STAR_COST.length;
const cumulative = TIER_STAR_COST.reduce((acc, n) => {
    acc.push((acc[acc.length - 1] || 0) + n);
    return acc;
}, []);
const TOTAL_STARS = cumulative[cumulative.length - 1];

// Challenges. `metric` names a single counter the client maintains (per-mode
// correct counts, etc.) or a server-derived stat (mastery, mp_wins, earned_xp,
// best_streak_any, high_<mode>). `goal` is the threshold; `stars` is the
// payout when the metric first crosses goal. Challenges never re-trigger.
const CHALLENGES = [
    // Multiple choice
    { id: 'mc_50',     metric: 'mc_correct',       goal: 50,     stars: 500,  mode: 'multiple-choice', title: 'Warm-Up Round',    desc: 'Get 50 correct in Multiple Choice', icon: 'quiz' },
    { id: 'mc_200',    metric: 'mc_correct',       goal: 200,    stars: 1200, mode: 'multiple-choice', title: 'Quiz Regular',     desc: 'Get 200 correct in Multiple Choice', icon: 'quiz' },
    { id: 'mc_500',    metric: 'mc_correct',       goal: 500,    stars: 2200, mode: 'multiple-choice', title: 'Quiz Champion',    desc: 'Get 500 correct in Multiple Choice', icon: 'quiz' },

    // Free response
    { id: 'fr_25',     metric: 'fr_correct',       goal: 25,     stars: 600,  mode: 'free-response',   title: 'Spell It Out',     desc: 'Type 25 country names correctly', icon: 'edit_note' },
    { id: 'fr_100',    metric: 'fr_correct',       goal: 100,    stars: 1400, mode: 'free-response',   title: 'Wordsmith',        desc: 'Type 100 country names correctly', icon: 'edit_note' },
    { id: 'fr_300',    metric: 'fr_correct',       goal: 300,    stars: 2500, mode: 'free-response',   title: 'Atlas Author',     desc: 'Type 300 country names correctly', icon: 'edit_note' },

    // Globe
    { id: 'globe_15',  metric: 'globe_correct',    goal: 15,     stars: 700,  mode: 'globe',           title: 'Pin Drop',         desc: 'Place 15 countries on the globe', icon: 'public' },
    { id: 'globe_75',  metric: 'globe_correct',    goal: 75,     stars: 1600, mode: 'globe',           title: 'Cartographer',     desc: 'Place 75 countries on the globe', icon: 'public' },
    { id: 'globe_200', metric: 'globe_correct',    goal: 200,    stars: 2800, mode: 'globe',           title: 'World Walker',     desc: 'Place 200 countries on the globe', icon: 'public' },

    // Frenzy
    { id: 'frenzy_50',  metric: 'high_frenzy',     goal: 50,     stars: 700,  mode: 'frenzy',          title: 'Frenzy Rookie',    desc: 'Reach 50 score in Frenzy', icon: 'bolt' },
    { id: 'frenzy_120', metric: 'high_frenzy',     goal: 120,    stars: 1600, mode: 'frenzy',          title: 'Frenzy Pro',       desc: 'Reach 120 score in Frenzy', icon: 'bolt' },

    // Pixelated
    { id: 'pix_30',    metric: 'high_pixelated',   goal: 30,     stars: 700,  mode: 'pixelated',       title: 'Pixel Eye',        desc: 'Reach 30 score in Pixelated', icon: 'grid_view' },
    { id: 'pix_75',    metric: 'high_pixelated',   goal: 75,     stars: 1600, mode: 'pixelated',       title: 'Pixel Master',     desc: 'Reach 75 score in Pixelated', icon: 'grid_view' },

    // Longest Route
    { id: 'lr_10',     metric: 'high_longestRoute', goal: 10,    stars: 700,  mode: 'longest-route',   title: 'Route Hunter',     desc: 'Reach 10 score in Longest Route', icon: 'route' },
    { id: 'lr_25',     metric: 'high_longestRoute', goal: 25,    stars: 1600, mode: 'longest-route',   title: 'Route Master',     desc: 'Reach 25 score in Longest Route', icon: 'route' },

    // Language
    { id: 'lang_30',   metric: 'high_language',    goal: 30,     stars: 700,  mode: 'language',        title: 'Polyglot',         desc: 'Reach 30 score in Language Quiz', icon: 'translate' },
    { id: 'lang_75',   metric: 'high_language',    goal: 75,     stars: 1600, mode: 'language',        title: 'Linguist',         desc: 'Reach 75 score in Language Quiz', icon: 'translate' },

    // Streaks (cross-mode)
    { id: 'streak_10', metric: 'best_streak_any',  goal: 10,     stars: 500,  mode: 'any',             title: 'Heating Up',       desc: 'Hit a 10-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'streak_25', metric: 'best_streak_any',  goal: 25,     stars: 1500, mode: 'any',             title: 'On Fire',          desc: 'Hit a 25-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'streak_50', metric: 'best_streak_any',  goal: 50,     stars: 2500, mode: 'any',             title: 'Inferno',          desc: 'Hit a 50-answer streak in any mode', icon: 'local_fire_department' },

    // Multiplayer
    { id: 'mp_3',      metric: 'mp_wins',          goal: 3,      stars: 900,  mode: 'multiplayer',     title: 'First Blood',      desc: 'Win 3 multiplayer matches', icon: 'sports_esports' },
    { id: 'mp_10',     metric: 'mp_wins',          goal: 10,     stars: 2000, mode: 'multiplayer',     title: 'MP Champion',      desc: 'Win 10 multiplayer matches', icon: 'sports_esports' },

    // Flag mastery
    { id: 'master_25',  metric: 'mastered',        goal: 25,     stars: 1200, mode: 'mastery',         title: 'Pupil',            desc: 'Master 25 flags', icon: 'school' },
    { id: 'master_100', metric: 'mastered',        goal: 100,    stars: 2500, mode: 'mastery',         title: 'Atlas Pro',        desc: 'Master 100 flags', icon: 'school' },

    // Lifetime XP
    { id: 'xp_5k',     metric: 'earned_xp',        goal: 5000,   stars: 1000, mode: 'any',             title: 'Earner',           desc: 'Earn 5,000 lifetime XP', icon: 'star' },
    { id: 'xp_25k',    metric: 'earned_xp',        goal: 25000,  stars: 2500, mode: 'any',             title: 'XP Tycoon',        desc: 'Earn 25,000 lifetime XP', icon: 'star' },
];

const CHALLENGES_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

// Tier rewards. Each tier has a free reward (always claimable) and a premium
// reward (requires owning the pass). Rewards: { type: 'bucks', amount } or
// { type: 'cosmetic', cat, id }. Cosmetic ids must exist in the cosmetics
// catalog — the claim route looks the cosmetic up there and grants ownership.
const TIERS = [
    { tier: 1,  free: { type: 'bucks', amount: 250 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'party_red' } },
    { tier: 2,  free: { type: 'bucks', amount: 150 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'bow_pink' } },
    { tier: 3,  free: { type: 'bucks', amount: 300 },   prem: { type: 'cosmetic', cat: 'color',  id: 'emerald' } },
    { tier: 4,  free: { type: 'bucks', amount: 200 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'round_black' } },
    { tier: 5,  free: { type: 'bucks', amount: 750 },   prem: { type: 'cosmetic', cat: 'effect', id: 'spin' } },
    { tier: 6,  free: { type: 'bucks', amount: 300 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'visor' } },
    { tier: 7,  free: { type: 'bucks', amount: 300 },   prem: { type: 'cosmetic', cat: 'color',  id: 'sunset' } },
    { tier: 8,  free: { type: 'bucks', amount: 350 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'shades_black' } },
    { tier: 9,  free: { type: 'bucks', amount: 350 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'cap_blue' } },
    { tier: 10, free: { type: 'bucks', amount: 1000 },  prem: { type: 'cosmetic', cat: 'color',  id: 'aurora' } },
    { tier: 11, free: { type: 'bucks', amount: 400 },   prem: { type: 'cosmetic', cat: 'effect', id: 'orbit' } },
    { tier: 12, free: { type: 'bucks', amount: 450 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'aviator_dark' } },
    { tier: 13, free: { type: 'bucks', amount: 500 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'pirate' } },
    { tier: 14, free: { type: 'bucks', amount: 500 },   prem: { type: 'cosmetic', cat: 'color',  id: 'rose' } },
    { tier: 15, free: { type: 'bucks', amount: 1500 },  prem: { type: 'cosmetic', cat: 'effect', id: 'sparkle' } },
    { tier: 16, free: { type: 'bucks', amount: 600 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'cowboy_brown' } },
    { tier: 17, free: { type: 'bucks', amount: 650 },   prem: { type: 'cosmetic', cat: 'color',  id: 'tiger' } },
    { tier: 18, free: { type: 'bucks', amount: 700 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'heart_pink' } },
    { tier: 19, free: { type: 'bucks', amount: 750 },   prem: { type: 'cosmetic', cat: 'hat',    id: 'crown' } },
    { tier: 20, free: { type: 'bucks', amount: 2000 },  prem: { type: 'cosmetic', cat: 'effect', id: 'bubbles' } },
    { tier: 21, free: { type: 'bucks', amount: 800 },   prem: { type: 'cosmetic', cat: 'color',  id: 'nebula' } },
    { tier: 22, free: { type: 'bucks', amount: 900 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'pixel_cyan' } },
    { tier: 23, free: { type: 'bucks', amount: 1000 },  prem: { type: 'cosmetic', cat: 'hat',    id: 'laurel' } },
    { tier: 24, free: { type: 'bucks', amount: 1200 },  prem: { type: 'cosmetic', cat: 'color',  id: 'lava' } },
    { tier: 25, free: { type: 'bucks', amount: 3000 },  prem: { type: 'cosmetic', cat: 'color',  id: 'rainbow' } },
];

// Convert a (track, tier) into the canonical claim key stored in claimed[].
function rewardKey(track, tier) {
    return `${track}:${tier}`;
}

// Compute the tier the player is currently on, given their cumulative stars.
// Tier 0 = haven't earned the first one yet.
function tierFromStars(stars) {
    const s = Math.max(0, Math.floor(Number(stars) || 0));
    let tier = 0;
    for (let i = 0; i < cumulative.length; i++) {
        if (s >= cumulative[i]) tier = i + 1;
        else break;
    }
    return tier;
}

// Stars required to reach the next tier (0 if already maxed).
function starsToNext(stars) {
    const t = tierFromStars(stars);
    if (t >= TIER_COUNT) return 0;
    return cumulative[t] - stars;
}

module.exports = {
    SEASON_ID,
    SEASON_NAME,
    PREMIUM_PRICE,
    TIER_STAR_COST,
    TIER_COUNT,
    TOTAL_STARS,
    cumulative,
    CHALLENGES,
    CHALLENGES_BY_ID,
    TIERS,
    rewardKey,
    tierFromStars,
    starsToNext,
};
