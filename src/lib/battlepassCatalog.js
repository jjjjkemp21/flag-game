// Client mirror of server/battlepassCatalog.js. Keep these two in lock-step —
// the server validates claims against its copy, the client uses this one to
// render the pass UI and to know which metric a challenge tracks.

export const SEASON_ID = 'atlas-pass-reptile-1';
export const SEASON_NAME = 'Reptile Kingdom · Season 1';
export const PREMIUM_PRICE = 10000;

export const TIER_STAR_COST = [
    600, 700, 800, 900, 1000,
    1100, 1200, 1300, 1400, 1500,
    1600, 1700, 1800, 1900, 2000,
    2100, 2200, 2300, 2400, 2500,
    2700, 2900, 3100, 3300, 3500,
];

export const TIER_COUNT = TIER_STAR_COST.length;
export const CUMULATIVE_STARS = TIER_STAR_COST.reduce((acc, n) => {
    acc.push((acc[acc.length - 1] || 0) + n);
    return acc;
}, []);
export const TOTAL_STARS = CUMULATIVE_STARS[CUMULATIVE_STARS.length - 1];

export const CHALLENGES = [
    { id: 'mc_50',     metric: 'mc_correct',       goal: 50,     stars: 500,  mode: 'multiple-choice', title: 'Warm-Up Round',    desc: 'Get 50 correct in Multiple Choice', icon: 'quiz' },
    { id: 'mc_200',    metric: 'mc_correct',       goal: 200,    stars: 1200, mode: 'multiple-choice', title: 'Quiz Regular',     desc: 'Get 200 correct in Multiple Choice', icon: 'quiz' },
    { id: 'mc_500',    metric: 'mc_correct',       goal: 500,    stars: 2200, mode: 'multiple-choice', title: 'Quiz Champion',    desc: 'Get 500 correct in Multiple Choice', icon: 'quiz' },
    { id: 'fr_25',     metric: 'fr_correct',       goal: 25,     stars: 600,  mode: 'free-response',   title: 'Spell It Out',     desc: 'Type 25 country names correctly', icon: 'edit_note' },
    { id: 'fr_100',    metric: 'fr_correct',       goal: 100,    stars: 1400, mode: 'free-response',   title: 'Wordsmith',        desc: 'Type 100 country names correctly', icon: 'edit_note' },
    { id: 'fr_300',    metric: 'fr_correct',       goal: 300,    stars: 2500, mode: 'free-response',   title: 'Atlas Author',     desc: 'Type 300 country names correctly', icon: 'edit_note' },
    { id: 'globe_15',  metric: 'globe_correct',    goal: 15,     stars: 700,  mode: 'globe',           title: 'Pin Drop',         desc: 'Place 15 countries on the globe', icon: 'public' },
    { id: 'globe_75',  metric: 'globe_correct',    goal: 75,     stars: 1600, mode: 'globe',           title: 'Cartographer',     desc: 'Place 75 countries on the globe', icon: 'public' },
    { id: 'globe_200', metric: 'globe_correct',    goal: 200,    stars: 2800, mode: 'globe',           title: 'World Walker',     desc: 'Place 200 countries on the globe', icon: 'public' },
    { id: 'frenzy_50', metric: 'high_frenzy',      goal: 50,     stars: 700,  mode: 'frenzy',          title: 'Frenzy Rookie',    desc: 'Reach 50 score in Frenzy', icon: 'bolt' },
    { id: 'frenzy_120',metric: 'high_frenzy',      goal: 120,    stars: 1600, mode: 'frenzy',          title: 'Frenzy Pro',       desc: 'Reach 120 score in Frenzy', icon: 'bolt' },
    { id: 'pix_30',    metric: 'high_pixelated',   goal: 30,     stars: 700,  mode: 'pixelated',       title: 'Pixel Eye',        desc: 'Reach 30 score in Pixelated', icon: 'grid_view' },
    { id: 'pix_75',    metric: 'high_pixelated',   goal: 75,     stars: 1600, mode: 'pixelated',       title: 'Pixel Master',     desc: 'Reach 75 score in Pixelated', icon: 'grid_view' },
    { id: 'lr_10',     metric: 'high_longestRoute', goal: 10,    stars: 700,  mode: 'longest-route',   title: 'Route Hunter',     desc: 'Reach 10 score in Longest Route', icon: 'route' },
    { id: 'lr_25',     metric: 'high_longestRoute', goal: 25,    stars: 1600, mode: 'longest-route',   title: 'Route Master',     desc: 'Reach 25 score in Longest Route', icon: 'route' },
    { id: 'lang_30',   metric: 'high_language',    goal: 30,     stars: 700,  mode: 'language',        title: 'Polyglot',         desc: 'Reach 30 score in Language Quiz', icon: 'translate' },
    { id: 'lang_75',   metric: 'high_language',    goal: 75,     stars: 1600, mode: 'language',        title: 'Linguist',         desc: 'Reach 75 score in Language Quiz', icon: 'translate' },
    { id: 'streak_10', metric: 'best_streak_any',  goal: 10,     stars: 500,  mode: 'any',             title: 'Heating Up',       desc: 'Hit a 10-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'streak_25', metric: 'best_streak_any',  goal: 25,     stars: 1500, mode: 'any',             title: 'On Fire',          desc: 'Hit a 25-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'streak_50', metric: 'best_streak_any',  goal: 50,     stars: 2500, mode: 'any',             title: 'Inferno',          desc: 'Hit a 50-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'mp_3',      metric: 'mp_wins',          goal: 3,      stars: 900,  mode: 'multiplayer',     title: 'First Blood',      desc: 'Win 3 multiplayer matches', icon: 'sports_esports' },
    { id: 'mp_10',     metric: 'mp_wins',          goal: 10,     stars: 2000, mode: 'multiplayer',     title: 'MP Champion',      desc: 'Win 10 multiplayer matches', icon: 'sports_esports' },
    { id: 'master_25', metric: 'mastered',         goal: 25,     stars: 1200, mode: 'mastery',         title: 'Pupil',            desc: 'Master 25 flags', icon: 'school' },
    { id: 'master_100',metric: 'mastered',         goal: 100,    stars: 2500, mode: 'mastery',         title: 'Atlas Pro',        desc: 'Master 100 flags', icon: 'school' },
    { id: 'xp_5k',     metric: 'earned_xp',        goal: 5000,   stars: 1000, mode: 'any',             title: 'Earner',           desc: 'Earn 5,000 lifetime XP', icon: 'star' },
    { id: 'xp_25k',    metric: 'earned_xp',        goal: 25000,  stars: 2500, mode: 'any',             title: 'XP Tycoon',        desc: 'Earn 25,000 lifetime XP', icon: 'star' },
];

export const CHALLENGES_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

// Season 1 — Reptile Kingdom. Premium gets the showpiece dragons/animated
// colours; the free track is mostly bucks plus a few starter reptile pieces.
export const TIERS = [
    { tier: 1,  free: { type: 'bucks', amount: 250 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_snake_eyes' } },
    { tier: 2,  free: { type: 'bucks', amount: 200 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_jade' } },
    { tier: 3,  free: { type: 'cosmetic', cat: 'glasses', id: 'bp_lizard_eyes' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_iguana' } },
    { tier: 4,  free: { type: 'bucks', amount: 300 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_serpent_eyes' } },
    { tier: 5,  free: { type: 'bucks', amount: 750 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_emerald' } },
    { tier: 6,  free: { type: 'bucks', amount: 300 },    prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_mist' } },
    { tier: 7,  free: { type: 'cosmetic', cat: 'hat',    id: 'bp_horns_obsidian' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_gecko' } },
    { tier: 8,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_scale_helm' } },
    { tier: 9,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_jade' } },
    { tier: 10, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_python' } },
    { tier: 11, free: { type: 'bucks', amount: 500 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_dragon_gaze' } },
    { tier: 12, free: { type: 'cosmetic', cat: 'effect', id: 'bp_scales' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_komodo' } },
    { tier: 13, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_crimson' } },
    { tier: 14, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_anaconda' } },
    { tier: 15, free: { type: 'bucks', amount: 1500 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_fire' } },
    { tier: 16, free: { type: 'bucks', amount: 700 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_drake_visor' } },
    { tier: 17, free: { type: 'bucks', amount: 700 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_violet' } },
    { tier: 18, free: { type: 'bucks', amount: 800 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_frost_serpent' } },
    { tier: 19, free: { type: 'bucks', amount: 900 },    prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_breath' } },
    { tier: 20, free: { type: 'bucks', amount: 2000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_basilisk' } },
    { tier: 21, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_gold' } },
    { tier: 22, free: { type: 'bucks', amount: 1100 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_scale_helm_gold' } },
    { tier: 23, free: { type: 'bucks', amount: 1300 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_cosmic_drake' } },
    { tier: 24, free: { type: 'bucks', amount: 1600 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_chameleon' } },
    { tier: 25, free: { type: 'bucks', amount: 3000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_dragon_fire' } },
];

export const TIERS_BY_NUM = Object.fromEntries(TIERS.map((t) => [t.tier, t]));

export function rewardKey(track, tier) {
    return `${track}:${tier}`;
}

// Tier the player is currently on. Tier 0 means "no tier reached yet".
export function tierFromStars(stars) {
    const s = Math.max(0, Math.floor(Number(stars) || 0));
    let tier = 0;
    for (let i = 0; i < CUMULATIVE_STARS.length; i++) {
        if (s >= CUMULATIVE_STARS[i]) tier = i + 1;
        else break;
    }
    return tier;
}

// How many stars between the just-finished tier and the next one (0 if maxed).
export function progressWithinTier(stars) {
    const t = tierFromStars(stars);
    if (t >= TIER_COUNT) return { tier: t, into: 0, span: 0, pct: 1 };
    const prev = t === 0 ? 0 : CUMULATIVE_STARS[t - 1];
    const next = CUMULATIVE_STARS[t];
    const span = next - prev;
    const into = stars - prev;
    return { tier: t, into, span, pct: span > 0 ? Math.min(1, into / span) : 0 };
}
