// Battlepass season catalog — challenges + tier rewards. The server reads this
// to (a) validate claims (free vs. premium ownership + already-claimed guard),
// (b) grant the reward (bucks credit or cosmetic ownership), and (c) compute
// star totals from a snapshot of user state. The client renders the same data;
// keep this and src/lib/battlepassCatalog.js in lock-step.
//
// The Atlas Pass runs MULTIPLE seasons. Each season is a self-contained catalog
// (its own challenges + tier rewards) and a player keeps independent progress in
// each. `ACTIVE_SEASON_ID` is the live season; older seasons stay selectable.

const PREMIUM_PRICE = 10000;

// Stars required to reach each tier from the previous tier — shared by every
// season. 30 tiers, mild curve so the back half feels weightier without grind.
const TIER_STAR_COST = [
    600, 700, 800, 900, 1000,
    1100, 1200, 1300, 1400, 1500,
    1600, 1700, 1800, 1900, 2000,
    2100, 2200, 2300, 2400, 2500,
    2700, 2900, 3100, 3300, 3500,
    3700, 3900, 4100, 4300, 4500,
];

// ===========================================================================
// Season 1 — Reptile Kingdom
// ===========================================================================
const REPTILE_CHALLENGES = [
    { id: 'mc_50',     metric: 'mc_correct',       goal: 50,     stars: 500,  mode: 'multiple-choice', title: 'Warm-Up Round',    desc: 'Get 50 correct in Multiple Choice', icon: 'quiz' },
    { id: 'mc_200',    metric: 'mc_correct',       goal: 200,    stars: 1200, mode: 'multiple-choice', title: 'Quiz Regular',     desc: 'Get 200 correct in Multiple Choice', icon: 'quiz' },
    { id: 'mc_500',    metric: 'mc_correct',       goal: 500,    stars: 2200, mode: 'multiple-choice', title: 'Quiz Champion',    desc: 'Get 500 correct in Multiple Choice', icon: 'quiz' },
    { id: 'fr_25',     metric: 'fr_correct',       goal: 25,     stars: 600,  mode: 'free-response',   title: 'Spell It Out',     desc: 'Type 25 country names correctly', icon: 'edit_note' },
    { id: 'fr_100',    metric: 'fr_correct',       goal: 100,    stars: 1400, mode: 'free-response',   title: 'Wordsmith',        desc: 'Type 100 country names correctly', icon: 'edit_note' },
    { id: 'fr_300',    metric: 'fr_correct',       goal: 300,    stars: 2500, mode: 'free-response',   title: 'Atlas Author',     desc: 'Type 300 country names correctly', icon: 'edit_note' },
    { id: 'globe_15',  metric: 'globe_correct',    goal: 15,     stars: 700,  mode: 'globe',           title: 'Pin Drop',         desc: 'Place 15 countries on the globe', icon: 'public' },
    { id: 'globe_75',  metric: 'globe_correct',    goal: 75,     stars: 1600, mode: 'globe',           title: 'Cartographer',     desc: 'Place 75 countries on the globe', icon: 'public' },
    { id: 'globe_200', metric: 'globe_correct',    goal: 200,    stars: 2800, mode: 'globe',           title: 'World Walker',     desc: 'Place 200 countries on the globe', icon: 'public' },
    { id: 'globename_15',  metric: 'globe_name_correct', goal: 15,  stars: 800,  mode: 'globe',        title: 'Outline Reader',   desc: 'Name 15 countries from the globe', icon: 'edit_location_alt' },
    { id: 'globename_75',  metric: 'globe_name_correct', goal: 75,  stars: 1800, mode: 'globe',        title: 'Shape Whisperer',  desc: 'Name 75 countries from the globe', icon: 'edit_location_alt' },
    { id: 'globename_200', metric: 'globe_name_correct', goal: 200, stars: 3000, mode: 'globe',        title: 'Atlas Mind',       desc: 'Name 200 countries from the globe', icon: 'edit_location_alt' },
    { id: 'frenzy_50', metric: 'high_frenzy',      goal: 50,     stars: 700,  mode: 'frenzy',          title: 'Frenzy Rookie',    desc: 'Reach 50 score in Frenzy', icon: 'bolt' },
    { id: 'frenzy_300',metric: 'high_frenzy',      goal: 300,    stars: 1600, mode: 'frenzy',          title: 'Frenzy Pro',       desc: 'Reach 300 score in Frenzy', icon: 'bolt' },
    { id: 'pix_30',    metric: 'high_pixelated',   goal: 30,     stars: 700,  mode: 'pixelated',       title: 'Pixel Eye',        desc: 'Reach 30 score in Pixelated', icon: 'grid_view' },
    { id: 'pix_75',    metric: 'high_pixelated',   goal: 75,     stars: 1600, mode: 'pixelated',       title: 'Pixel Master',     desc: 'Reach 75 score in Pixelated', icon: 'grid_view' },
    { id: 'lr_10',     metric: 'high_longestRoute', goal: 10,    stars: 700,  mode: 'longest-route',   title: 'Route Hunter',     desc: 'Reach 10 score in Longest Route', icon: 'route' },
    { id: 'lr_25',     metric: 'high_longestRoute', goal: 25,    stars: 1600, mode: 'longest-route',   title: 'Route Master',     desc: 'Reach 25 score in Longest Route', icon: 'route' },
    { id: 'lang_30',   metric: 'high_language',    goal: 30,     stars: 700,  mode: 'language',        title: 'Polyglot',         desc: 'Reach 30 score in Language Quiz', icon: 'translate' },
    { id: 'lang_75',   metric: 'high_language',    goal: 75,     stars: 1600, mode: 'language',        title: 'Linguist',         desc: 'Reach 75 score in Language Quiz', icon: 'translate' },
    { id: 'cap_30',    metric: 'high_capitals',    goal: 30,     stars: 700,  mode: 'capitals',        title: 'City Slicker',     desc: 'Reach 30 score in Capitals Quiz', icon: 'location_city' },
    { id: 'cap_75',    metric: 'high_capitals',    goal: 75,     stars: 1600, mode: 'capitals',        title: 'Capital Connoisseur', desc: 'Reach 75 score in Capitals Quiz', icon: 'location_city' },
    { id: 'cap_150',   metric: 'high_capitals',    goal: 150,    stars: 2700, mode: 'capitals',        title: 'Capital Sage',     desc: 'Reach 150 score in Capitals Quiz', icon: 'location_city' },
    { id: 'streak_10', metric: 'best_streak_any',  goal: 10,     stars: 500,  mode: 'any',             title: 'Heating Up',       desc: 'Hit a 10-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'streak_25', metric: 'best_streak_any',  goal: 25,     stars: 1500, mode: 'any',             title: 'On Fire',          desc: 'Hit a 25-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'streak_50', metric: 'best_streak_any',  goal: 50,     stars: 2500, mode: 'any',             title: 'Inferno',          desc: 'Hit a 50-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'mp_3',      metric: 'mp_wins',          goal: 3,      stars: 900,  mode: 'multiplayer',     title: 'First Blood',      desc: 'Win 3 multiplayer matches', icon: 'sports_esports' },
    { id: 'mp_10',     metric: 'mp_wins',          goal: 10,     stars: 2000, mode: 'multiplayer',     title: 'MP Champion',      desc: 'Win 10 multiplayer matches', icon: 'sports_esports' },
    { id: 'master_25', metric: 'mastered',         goal: 25,     stars: 1200, mode: 'mastery',         title: 'Pupil',            desc: 'Master 25 flags', icon: 'school' },
    { id: 'master_100',metric: 'mastered',         goal: 100,    stars: 2500, mode: 'mastery',         title: 'Atlas Pro',        desc: 'Master 100 flags', icon: 'school' },
    { id: 'xp_5k',     metric: 'earned_xp',        goal: 5000,   stars: 1000, mode: 'any',             title: 'Earner',           desc: 'Earn 5,000 lifetime XP', icon: 'star' },
    { id: 'xp_25k',    metric: 'earned_xp',        goal: 25000,  stars: 2500, mode: 'any',             title: 'XP Tycoon',        desc: 'Earn 25,000 lifetime XP', icon: 'star' },
    { id: 'mc_1000',   metric: 'mc_correct',       goal: 1000,   stars: 3400, mode: 'multiple-choice', title: 'Quiz Legend',      desc: 'Get 1,000 correct in Multiple Choice', icon: 'quiz' },
    { id: 'fr_600',    metric: 'fr_correct',       goal: 600,    stars: 3400, mode: 'free-response',   title: 'Atlas Laureate',   desc: 'Type 600 country names correctly', icon: 'edit_note' },
    { id: 'globe_300', metric: 'globe_correct',    goal: 300,    stars: 3600, mode: 'globe',           title: 'Globe Conqueror',  desc: 'Place 300 countries on the globe', icon: 'public' },
    { id: 'globename_300', metric: 'globe_name_correct', goal: 300, stars: 3600, mode: 'globe',        title: 'Atlas Oracle',     desc: 'Name 300 countries from the globe', icon: 'edit_location_alt' },
    { id: 'streak_75', metric: 'best_streak_any',  goal: 75,     stars: 3200, mode: 'any',             title: 'Supernova',        desc: 'Hit a 75-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'mp_25',     metric: 'mp_wins',          goal: 25,     stars: 3200, mode: 'multiplayer',     title: 'MP Legend',        desc: 'Win 25 multiplayer matches', icon: 'sports_esports' },
    { id: 'xp_60k',    metric: 'earned_xp',        goal: 60000,  stars: 3400, mode: 'any',             title: 'XP Magnate',       desc: 'Earn 60,000 lifetime XP', icon: 'star' },
];

const REPTILE_TIERS = [
    { tier: 1,  free: { type: 'bucks', amount: 250 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_snake_eyes' } },
    { tier: 2,  free: { type: 'bucks', amount: 200 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_jade' } },
    { tier: 3,  free: { type: 'cosmetic', cat: 'glasses', id: 'bp_lizard_eyes' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_iguana' } },
    { tier: 4,  free: { type: 'cosmetic', cat: 'emote',   id: 'cheer' },  prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_serpent_eyes' } },
    { tier: 5,  free: { type: 'cosmetic', cat: 'companion', id: 'bp_companion_salamander' }, prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_emerald' } },
    { tier: 6,  free: { type: 'bucks', amount: 300 },    prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_serpent_coil' } },
    { tier: 7,  free: { type: 'cosmetic', cat: 'hat',    id: 'bp_horns_obsidian' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_gecko' } },
    { tier: 8,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_scale_helm' } },
    { tier: 9,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_jade' } },
    { tier: 10, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_python' } },
    { tier: 11, free: { type: 'cosmetic', cat: 'emote',  id: 'laugh' },   prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_dragon_gaze' } },
    { tier: 12, free: { type: 'cosmetic', cat: 'effect', id: 'bp_scales' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_komodo' } },
    { tier: 13, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_crimson' } },
    { tier: 14, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_anaconda' } },
    { tier: 15, free: { type: 'bucks', amount: 1500 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_fire' } },
    { tier: 16, free: { type: 'bucks', amount: 700 },    prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_scale_flex' } },
    { tier: 17, free: { type: 'cosmetic', cat: 'emote',  id: 'heart' },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_frill_violet' } },
    { tier: 18, free: { type: 'bucks', amount: 800 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_frost_serpent' } },
    { tier: 19, free: { type: 'bucks', amount: 900 },    prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_breath' } },
    { tier: 20, free: { type: 'bucks', amount: 2000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_basilisk' } },
    { tier: 21, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_horns_gold' } },
    { tier: 22, free: { type: 'bucks', amount: 1100 },   prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_dragon_roar' } },
    { tier: 23, free: { type: 'bucks', amount: 1300 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_cosmic_drake' } },
    { tier: 24, free: { type: 'bucks', amount: 1600 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_chameleon' } },
    { tier: 25, free: { type: 'cosmetic', cat: 'scene', id: 'bp_reptile' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_dragon_fire' } },
    { tier: 26, free: { type: 'bucks', amount: 1200 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_wyvern_crown' } },
    { tier: 27, free: { type: 'bucks', amount: 1400 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_apex_visor' } },
    { tier: 28, free: { type: 'cosmetic', cat: 'emote',  id: 'fireworks' }, prem: { type: 'cosmetic', cat: 'emote',  id: 'bp_wing_beat' } },
    { tier: 29, free: { type: 'bucks', amount: 1800 },   prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_meteor' } },
    { tier: 30, free: { type: 'bucks', amount: 3000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_world_serpent' } },
];

// ===========================================================================
// Season 2 — Olympus Ascendant (Greek mythology)
// ===========================================================================
const OLYMPUS_CHALLENGES = [
    { id: 'o_mc_30',   metric: 'mc_correct',       goal: 30,     stars: 550,  mode: 'multiple-choice', title: 'First Trial',      desc: 'Get 30 correct in Multiple Choice', icon: 'quiz' },
    { id: 'o_mc_100',  metric: 'mc_correct',       goal: 100,    stars: 1300, mode: 'multiple-choice', title: 'Quiz Adept',       desc: 'Get 100 correct in Multiple Choice', icon: 'quiz' },
    { id: 'o_mc_180',  metric: 'mc_correct',       goal: 180,    stars: 2000, mode: 'multiple-choice', title: 'Quiz Hero',        desc: 'Get 180 correct in Multiple Choice', icon: 'quiz' },
    { id: 'o_mc_250',  metric: 'mc_correct',       goal: 250,    stars: 2700, mode: 'multiple-choice', title: 'Quiz Champion',    desc: 'Get 250 correct in Multiple Choice', icon: 'quiz' },
    { id: 'o_fr_15',   metric: 'fr_correct',       goal: 15,     stars: 650,  mode: 'free-response',   title: "Scribe's Start",   desc: 'Type 15 country names correctly', icon: 'edit_note' },
    { id: 'o_fr_60',   metric: 'fr_correct',       goal: 60,     stars: 1400, mode: 'free-response',   title: 'Scribe',           desc: 'Type 60 country names correctly', icon: 'edit_note' },
    { id: 'o_fr_100',  metric: 'fr_correct',       goal: 100,    stars: 2000, mode: 'free-response',   title: 'Loremaster',       desc: 'Type 100 country names correctly', icon: 'edit_note' },
    { id: 'o_fr_150',  metric: 'fr_correct',       goal: 150,    stars: 2800, mode: 'free-response',   title: 'Oracle of Names',  desc: 'Type 150 country names correctly', icon: 'edit_note' },
    { id: 'o_globe_10',  metric: 'globe_correct',  goal: 10,     stars: 650,  mode: 'globe',           title: 'Pin Drop',         desc: 'Place 10 countries on the globe', icon: 'public' },
    { id: 'o_globe_50',  metric: 'globe_correct',  goal: 50,     stars: 1500, mode: 'globe',           title: 'Pathfinder',       desc: 'Place 50 countries on the globe', icon: 'public' },
    { id: 'o_globe_80',  metric: 'globe_correct',  goal: 80,     stars: 2100, mode: 'globe',           title: 'Cartographer',     desc: 'Place 80 countries on the globe', icon: 'public' },
    { id: 'o_globe_120', metric: 'globe_correct',  goal: 120,    stars: 3000, mode: 'globe',           title: 'World Walker',     desc: 'Place 120 countries on the globe', icon: 'public' },
    { id: 'o_globename_10',  metric: 'globe_name_correct', goal: 10,  stars: 750,  mode: 'globe',      title: 'Outline Reader',   desc: 'Name 10 countries from the globe', icon: 'edit_location_alt' },
    { id: 'o_globename_50',  metric: 'globe_name_correct', goal: 50,  stars: 1600, mode: 'globe',      title: 'Shape Seer',       desc: 'Name 50 countries from the globe', icon: 'edit_location_alt' },
    { id: 'o_globename_120', metric: 'globe_name_correct', goal: 120, stars: 3100, mode: 'globe',      title: 'Atlas Mind',       desc: 'Name 120 countries from the globe', icon: 'edit_location_alt' },
    { id: 'o_cap_20',  metric: 'high_capitals',    goal: 20,     stars: 700,  mode: 'capitals',        title: 'City Scout',       desc: 'Reach 20 score in Capitals Quiz', icon: 'location_city' },
    { id: 'o_cap_60',  metric: 'high_capitals',    goal: 60,     stars: 1600, mode: 'capitals',        title: 'Capital Keeper',   desc: 'Reach 60 score in Capitals Quiz', icon: 'location_city' },
    { id: 'o_cap_120', metric: 'high_capitals',    goal: 120,    stars: 3000, mode: 'capitals',        title: 'Capital Sage',     desc: 'Reach 120 score in Capitals Quiz', icon: 'location_city' },
    { id: 'o_frenzy_30',  metric: 'high_frenzy',   goal: 30,     stars: 750,  mode: 'frenzy',          title: 'Frenzy Rookie',    desc: 'Reach 30 score in Frenzy', icon: 'bolt' },
    { id: 'o_frenzy_150', metric: 'high_frenzy',   goal: 150,    stars: 2100, mode: 'frenzy',          title: 'Frenzy Pro',       desc: 'Reach 150 score in Frenzy', icon: 'bolt' },
    { id: 'o_pix_20',  metric: 'high_pixelated',   goal: 20,     stars: 750,  mode: 'pixelated',       title: 'Pixel Eye',        desc: 'Reach 20 score in Pixelated', icon: 'grid_view' },
    { id: 'o_pix_60',  metric: 'high_pixelated',   goal: 60,     stars: 2100, mode: 'pixelated',       title: 'Pixel Master',     desc: 'Reach 60 score in Pixelated', icon: 'grid_view' },
    { id: 'o_lr_8',    metric: 'high_longestRoute', goal: 8,     stars: 750,  mode: 'longest-route',   title: 'Route Hunter',     desc: 'Reach 8 score in Longest Route', icon: 'route' },
    { id: 'o_lr_20',   metric: 'high_longestRoute', goal: 20,    stars: 2100, mode: 'longest-route',   title: 'Route Master',     desc: 'Reach 20 score in Longest Route', icon: 'route' },
    { id: 'o_lang_20', metric: 'high_language',    goal: 20,     stars: 750,  mode: 'language',        title: 'Polyglot',         desc: 'Reach 20 score in Language Quiz', icon: 'translate' },
    { id: 'o_lang_60', metric: 'high_language',    goal: 60,     stars: 1700, mode: 'language',        title: 'Linguist',         desc: 'Reach 60 score in Language Quiz', icon: 'translate' },
    { id: 'o_lang_120',metric: 'high_language',    goal: 120,    stars: 2900, mode: 'language',        title: 'Babel Sage',       desc: 'Reach 120 score in Language Quiz', icon: 'translate' },
    { id: 'o_streak_8',  metric: 'best_streak_any', goal: 8,     stars: 550,  mode: 'any',             title: 'Heating Up',       desc: 'Hit an 8-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'o_streak_20', metric: 'best_streak_any', goal: 20,    stars: 1500, mode: 'any',             title: 'On Fire',          desc: 'Hit a 20-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'o_streak_40', metric: 'best_streak_any', goal: 40,    stars: 3100, mode: 'any',             title: 'Inferno',          desc: 'Hit a 40-answer streak in any mode', icon: 'local_fire_department' },
    { id: 'o_mp_2',    metric: 'mp_wins',          goal: 2,      stars: 850,  mode: 'multiplayer',     title: 'First Duel',       desc: 'Win 2 multiplayer matches', icon: 'sports_esports' },
    { id: 'o_mp_8',    metric: 'mp_wins',          goal: 8,      stars: 2500, mode: 'multiplayer',     title: 'Arena Champion',   desc: 'Win 8 multiplayer matches', icon: 'sports_esports' },
    { id: 'o_master_25', metric: 'mastered',       goal: 25,     stars: 1300, mode: 'mastery',         title: 'Pupil of Athena',  desc: 'Master 25 flags', icon: 'school' },
    { id: 'o_master_75', metric: 'mastered',       goal: 75,     stars: 3000, mode: 'mastery',         title: 'Master of Flags',  desc: 'Master 75 flags', icon: 'school' },
    { id: 'o_xp_3k',   metric: 'earned_xp',        goal: 3000,   stars: 950,  mode: 'any',             title: 'Earner',           desc: 'Earn 3,000 lifetime XP', icon: 'star' },
    { id: 'o_xp_15k',  metric: 'earned_xp',        goal: 15000,  stars: 2200, mode: 'any',             title: 'XP Adept',         desc: 'Earn 15,000 lifetime XP', icon: 'star' },
    { id: 'o_xp_25k',  metric: 'earned_xp',        goal: 25000,  stars: 3000, mode: 'any',             title: 'XP Tycoon',        desc: 'Earn 25,000 lifetime XP', icon: 'star' },
    { id: 'o_xp_40k',  metric: 'earned_xp',        goal: 40000,  stars: 4200, mode: 'any',             title: 'XP Magnate',       desc: 'Earn 40,000 lifetime XP', icon: 'star' },
    { id: 'o_frenzy_300', metric: 'high_frenzy',   goal: 300,    stars: 3200, mode: 'frenzy',          title: 'Frenzy Legend',    desc: 'Reach 300 score in Frenzy', icon: 'bolt' },
    { id: 'o_cap_180', metric: 'high_capitals',    goal: 180,    stars: 3600, mode: 'capitals',        title: 'Capital Oracle',   desc: 'Reach 180 score in Capitals Quiz', icon: 'location_city' },
];

const OLYMPUS_TIERS = [
    { tier: 1,  free: { type: 'bucks', amount: 250 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_helm_slits' } },
    { tier: 2,  free: { type: 'bucks', amount: 200 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_helm_bronze' } },
    { tier: 3,  free: { type: 'cosmetic', cat: 'emote',  id: 'cheer' },  prem: { type: 'cosmetic', cat: 'color',   id: 'bp_marble' } },
    { tier: 4,  free: { type: 'bucks', amount: 300 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_terracotta' } },
    { tier: 5,  free: { type: 'cosmetic', cat: 'companion', id: 'bp_companion_owl' }, prem: { type: 'cosmetic', cat: 'hat', id: 'bp_olive_wreath' } },
    { tier: 6,  free: { type: 'bucks', amount: 300 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_sea_foam' } },
    { tier: 7,  free: { type: 'bucks', amount: 350 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_oracle_eyes' } },
    { tier: 8,  free: { type: 'cosmetic', cat: 'emote',  id: 'laugh' },  prem: { type: 'cosmetic', cat: 'color',   id: 'bp_olive' } },
    { tier: 9,  free: { type: 'bucks', amount: 400 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_aegean' } },
    { tier: 10, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_bronze' } },
    { tier: 11, free: { type: 'bucks', amount: 500 },    prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_winged_helm' } },
    { tier: 12, free: { type: 'bucks', amount: 550 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_black_figure' } },
    { tier: 13, free: { type: 'bucks', amount: 600 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_wine' } },
    { tier: 14, free: { type: 'bucks', amount: 650 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_chiton' } },
    { tier: 15, free: { type: 'bucks', amount: 1500 },   prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_lightning' } },
    { tier: 16, free: { type: 'bucks', amount: 700 },    prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_helm_slits_gold' } },
    { tier: 17, free: { type: 'cosmetic', cat: 'emote',  id: 'heart' },  prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_laurel_victor' } },
    { tier: 18, free: { type: 'bucks', amount: 800 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_storm' } },
    { tier: 19, free: { type: 'bucks', amount: 850 },    prem: { type: 'cosmetic', cat: 'color',   id: 'bp_underworld' } },
    { tier: 20, free: { type: 'bucks', amount: 2000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_nectar' } },
    { tier: 21, free: { type: 'bucks', amount: 1000 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_helm_gold' } },
    { tier: 22, free: { type: 'bucks', amount: 1100 },   prem: { type: 'cosmetic', cat: 'emote',   id: 'bp_thunderbolt' } },
    { tier: 23, free: { type: 'bucks', amount: 1300 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_ambrosia' } },
    { tier: 24, free: { type: 'bucks', amount: 1600 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_celestial' } },
    { tier: 25, free: { type: 'cosmetic', cat: 'scene', id: 'bp_olympus' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_midas' } },
    { tier: 26, free: { type: 'bucks', amount: 1200 },   prem: { type: 'cosmetic', cat: 'hat',     id: 'bp_helm_obsidian' } },
    { tier: 27, free: { type: 'bucks', amount: 1400 },   prem: { type: 'cosmetic', cat: 'glasses', id: 'bp_oracle_eyes_violet' } },
    { tier: 28, free: { type: 'cosmetic', cat: 'emote',  id: 'fireworks' }, prem: { type: 'cosmetic', cat: 'color',   id: 'bp_aether' } },
    { tier: 29, free: { type: 'bucks', amount: 1800 },   prem: { type: 'cosmetic', cat: 'effect',  id: 'bp_laurel_fall' } },
    { tier: 30, free: { type: 'bucks', amount: 3000 },   prem: { type: 'cosmetic', cat: 'color',   id: 'bp_olympus_eternal' } },
];

// ---- Season assembly -------------------------------------------------------
function buildSeason(def) {
    const tierStarCost = def.tierStarCost || TIER_STAR_COST;
    const cumulative = tierStarCost.reduce((acc, n) => {
        acc.push((acc[acc.length - 1] || 0) + n);
        return acc;
    }, []);
    return {
        id: def.id,
        name: def.name,
        theme: def.theme,
        premiumPrice: def.premiumPrice || PREMIUM_PRICE,
        tierStarCost,
        cumulative,
        totalStars: cumulative[cumulative.length - 1],
        tierCount: tierStarCost.length,
        challenges: def.challenges,
        challengesById: Object.fromEntries(def.challenges.map((c) => [c.id, c])),
        tiers: def.tiers,
        tiersByNum: Object.fromEntries(def.tiers.map((t) => [t.tier, t])),
    };
}

const SEASONS = {
    'atlas-pass-reptile-1': buildSeason({
        id: 'atlas-pass-reptile-1',
        name: 'Reptile Kingdom · Season 1',
        challenges: REPTILE_CHALLENGES,
        tiers: REPTILE_TIERS,
        theme: {
            key: 'reptile',
            badge: 'Reptile Kingdom · Season 1',
            title: 'Reptile Kingdom',
            subtitle: '30 tiers of dragon-themed cosmetics. Complete challenges across every mode to climb.',
            cardSub: '30 tiers of dragon-themed cosmetics. Every mode counts.',
        },
    }),
    'atlas-pass-olympus-2': buildSeason({
        id: 'atlas-pass-olympus-2',
        name: 'Olympus Ascendant · Season 2',
        challenges: OLYMPUS_CHALLENGES,
        tiers: OLYMPUS_TIERS,
        theme: {
            key: 'olympus',
            badge: 'Olympus Ascendant · Season 2',
            title: 'Olympus Ascendant',
            subtitle: '30 tiers of Greek-mythology cosmetics. Conquer 40 challenges across every mode to ascend Olympus.',
            cardSub: '30 tiers of Greek-myth cosmetics. Ascend Mount Olympus.',
        },
    }),
};

const ACTIVE_SEASON_ID = 'atlas-pass-olympus-2';
const SEASON_ORDER = ['atlas-pass-olympus-2', 'atlas-pass-reptile-1'];
const SEASON_ENDS_AT = Date.parse('2026-07-02T00:00:00Z');

function daysUntilSeasonEnd(now = Date.now()) {
    return Math.max(0, Math.ceil((SEASON_ENDS_AT - now) / 86400000));
}

function getSeason(id) {
    return SEASONS[id] || SEASONS[ACTIVE_SEASON_ID];
}

function isKnownSeason(id) {
    return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SEASONS, id);
}

function seasonList() {
    return SEASON_ORDER.map((id) => ({ id, name: SEASONS[id].name, theme: SEASONS[id].theme }));
}

// Convert a (track, tier) into the canonical claim key stored in claimed[].
function rewardKey(track, tier) {
    return `${track}:${tier}`;
}

// Tier the player is currently on, given cumulative stars. Tier 0 = none yet.
// Seasons share TIER_STAR_COST, so the seasonId arg is accepted for clarity.
function tierFromStars(stars, seasonId = ACTIVE_SEASON_ID) {
    const cumulative = getSeason(seasonId).cumulative;
    const s = Math.max(0, Math.floor(Number(stars) || 0));
    let tier = 0;
    for (let i = 0; i < cumulative.length; i++) {
        if (s >= cumulative[i]) tier = i + 1;
        else break;
    }
    return tier;
}

// Stars required to reach the next tier (0 if already maxed).
function starsToNext(stars, seasonId = ACTIVE_SEASON_ID) {
    const season = getSeason(seasonId);
    const t = tierFromStars(stars, seasonId);
    if (t >= season.tierCount) return 0;
    return season.cumulative[t] - stars;
}

// Atlas Bucks paid out for *completing* a single challenge (in addition to the
// stars it contributes to the pass track). Derived from the challenge's star
// value so harder challenges naturally pay more. Rounded to 25 for tidy numbers.
function challengeBucks(c) {
    if (!c) return 0;
    const raw = (Number(c.stars) || 0) / 5;
    return Math.max(25, Math.round(raw / 25) * 25);
}

// Active-season convenience exports (used by the sync test + any legacy reads).
const ACTIVE = SEASONS[ACTIVE_SEASON_ID];

module.exports = {
    // Multi-season catalog
    SEASONS,
    SEASON_ORDER,
    ACTIVE_SEASON_ID,
    SEASON_ENDS_AT,
    daysUntilSeasonEnd,
    getSeason,
    isKnownSeason,
    seasonList,
    // Shared
    PREMIUM_PRICE,
    TIER_STAR_COST,
    rewardKey,
    tierFromStars,
    starsToNext,
    challengeBucks,
    // Active-season aliases (backward compatible)
    SEASON_ID: ACTIVE.id,
    SEASON_NAME: ACTIVE.name,
    TIER_COUNT: ACTIVE.tierCount,
    TOTAL_STARS: ACTIVE.totalStars,
    cumulative: ACTIVE.cumulative,
    CHALLENGES: ACTIVE.challenges,
    CHALLENGES_BY_ID: ACTIVE.challengesById,
    TIERS: ACTIVE.tiers,
};
