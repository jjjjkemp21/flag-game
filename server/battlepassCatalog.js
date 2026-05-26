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

const SEASON_ID = 'atlas-pass-reptile-1';
const SEASON_NAME = 'Reptile Kingdom · Season 1';

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

    // Globe — placement
    { id: 'globe_15',  metric: 'globe_correct',    goal: 15,     stars: 700,  mode: 'globe',           title: 'Pin Drop',         desc: 'Place 15 countries on the globe', icon: 'public' },
    { id: 'globe_75',  metric: 'globe_correct',    goal: 75,     stars: 1600, mode: 'globe',           title: 'Cartographer',     desc: 'Place 75 countries on the globe', icon: 'public' },
    { id: 'globe_200', metric: 'globe_correct',    goal: 200,    stars: 2800, mode: 'globe',           title: 'World Walker',     desc: 'Place 200 countries on the globe', icon: 'public' },

    // Globe — name the highlighted country (no flag shown)
    { id: 'globename_15',  metric: 'globe_name_correct', goal: 15,  stars: 800,  mode: 'globe',        title: 'Outline Reader',   desc: 'Name 15 countries from the globe', icon: 'edit_location_alt' },
    { id: 'globename_75',  metric: 'globe_name_correct', goal: 75,  stars: 1800, mode: 'globe',        title: 'Shape Whisperer',  desc: 'Name 75 countries from the globe', icon: 'edit_location_alt' },
    { id: 'globename_200', metric: 'globe_name_correct', goal: 200, stars: 3000, mode: 'globe',        title: 'Atlas Mind',       desc: 'Name 200 countries from the globe', icon: 'edit_location_alt' },

    // Frenzy
    { id: 'frenzy_50',  metric: 'high_frenzy',     goal: 50,     stars: 700,  mode: 'frenzy',          title: 'Frenzy Rookie',    desc: 'Reach 50 score in Frenzy', icon: 'bolt' },
    { id: 'frenzy_300', metric: 'high_frenzy',     goal: 300,    stars: 1600, mode: 'frenzy',          title: 'Frenzy Pro',       desc: 'Reach 300 score in Frenzy', icon: 'bolt' },

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
// Season 1 — "Reptile Kingdom". All cosmetic rewards are bp_* exclusives that
// can ONLY be obtained by claiming a tier. Free track skews toward bucks plus
// a handful of starter reptile cosmetics so the free path still grants visual
// progression. Premium reserves the dragons/animated colours for capstones.
const TIERS = [
    { tier: 1,  free: { type: 'bucks', amount: 250 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_snake_eyes' } },
    { tier: 2,  free: { type: 'bucks', amount: 200 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_jade' } },
    { tier: 3,  free: { type: 'cosmetic', cat: 'glasses', id: 'bp_lizard_eyes' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_iguana' } },
    // Tier 4 free: a starter emote on the free track so every player gets a
    // taste of the new system without needing to grind the prem-only ones.
    { tier: 4,  free: { type: 'cosmetic', cat: 'emote',   id: 'cheer' },  prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_serpent_eyes' } },
    { tier: 5,  free: { type: 'bucks', amount: 750 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_emerald' } },
    // Tier 6 prem: the first BP-exclusive emote — Serpent Coil — matches the
    // atmospheric reptile theme that previously belonged to the Swamp Mist
    // effect this slot used to grant.
    { tier: 6,  free: { type: 'bucks', amount: 300 },    prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_serpent_coil' } },
    { tier: 7,  free: { type: 'cosmetic', cat: 'hat',    id: 'bp_horns_obsidian' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_gecko' } },
    { tier: 8,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_scale_helm' } },
    { tier: 9,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_jade' } },
    { tier: 10, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_python' } },
    // Tier 11 free: a mid-tier emote on the free track.
    { tier: 11, free: { type: 'cosmetic', cat: 'emote',  id: 'laugh' },   prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_dragon_gaze' } },
    { tier: 12, free: { type: 'cosmetic', cat: 'effect', id: 'bp_scales' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_komodo' } },
    { tier: 13, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_crimson' } },
    { tier: 14, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_anaconda' } },
    { tier: 15, free: { type: 'bucks', amount: 1500 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_fire' } },
    // Tier 16 prem: BP-exclusive Scale Flex (mid-high tier showpiece emote).
    { tier: 16, free: { type: 'bucks', amount: 700 },    prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_scale_flex' } },
    // Tier 17 free: an upper-mid emote on the free track.
    { tier: 17, free: { type: 'cosmetic', cat: 'emote',  id: 'heart' },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_violet' } },
    { tier: 18, free: { type: 'bucks', amount: 800 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_frost_serpent' } },
    { tier: 19, free: { type: 'bucks', amount: 900 },    prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_breath' } },
    { tier: 20, free: { type: 'bucks', amount: 2000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_basilisk' } },
    { tier: 21, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_gold' } },
    // Tier 22 prem: the marquee BP-exclusive Dragon's Roar — a high-tier
    // capstone emote ahead of the season finale.
    { tier: 22, free: { type: 'bucks', amount: 1100 },   prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_dragon_roar' } },
    { tier: 23, free: { type: 'bucks', amount: 1300 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_cosmic_drake' } },
    { tier: 24, free: { type: 'bucks', amount: 1600 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_chameleon' } },
    { tier: 25, free: { type: 'cosmetic', cat: 'scene', id: 'bp_reptile' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_dragon_fire' } },
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

// Atlas Bucks paid out for *completing* a single challenge (in addition to the
// stars it contributes to the pass track). Derived from the challenge's star
// value so harder challenges naturally pay more. Rounded to 25 for tidy numbers.
function challengeBucks(c) {
    if (!c) return 0;
    const raw = (Number(c.stars) || 0) / 5;
    return Math.max(25, Math.round(raw / 25) * 25);
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
    challengeBucks,
};
