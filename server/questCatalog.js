// Quest catalog — templates rolled into the per-user quests_json daily / weekly
// slots. Each template specifies a counter metric, a target goal, a Bucks
// reward, a tier for visual styling, and a human-readable title. The client
// emits `bumpQuestMetric` (counter) or `reportHwm` (high-water-mark) for the
// same events the battlepass uses; both systems track counters independently so
// claiming a quest doesn't affect pass progress and vice-versa.
//
// Tiers map to the same six-step palette achievements use (stone → legend);
// daily/weekly pools cap at platinum since "legendary daily" feels off. Icons
// are pulled from the achievement vocabulary so the visual language stays
// consistent across the two systems.

// Metrics whose progress is high-water-mark (server takes max, not sum). The
// route iterates over all active quests on every progress push; this set tells
// it which ones to coalesce with max() instead of adding. Mirrors the client's
// reportHwm() helper.
const HWM_METRICS = new Set([
    'best_streak_today',
    'frenzy_score',
    'pixelated_score',
    'language_score',
    'capitals_score',
    'longest_score',
]);

// --- DAILY POOL ------------------------------------------------------------
// Three rolled per day. Variety across modes (MC / FR / Globe / bonus / MP)
// and difficulty (bronze warm-ups → platinum stretch goals) keeps the daily
// triple from feeling samey across a month of rotation.
const DAILY_POOL = [
    // Bronze — quick warm-ups, low goals, low rewards.
    { id: 'q_mc_correct_15',   tier: 'bronze', icon: 'quiz',
        title: 'Multiple Choice: 15 correct',
        metric: 'mc_correct',  goal: 15, bucks: 40 },
    { id: 'q_fr_correct_10',   tier: 'bronze', icon: 'edit_note',
        title: 'Free Response: 10 correct',
        metric: 'fr_correct',  goal: 10, bucks: 50 },
    { id: 'q_globe_correct_5', tier: 'bronze', icon: 'public',
        title: 'Globe: place 5 countries',
        metric: 'globe_correct', goal: 5, bucks: 55 },
    { id: 'q_any_correct_30',  tier: 'bronze', icon: 'check_circle',
        title: 'Any mode: 30 correct answers',
        metric: 'any_correct', goal: 30, bucks: 35 },
    { id: 'q_bonus_play',      tier: 'bronze', icon: 'casino',
        title: 'Play any bonus mode',
        metric: 'bonus_play',  goal: 1, bucks: 40 },
    { id: 'q_mp_play',         tier: 'bronze', icon: 'sports_esports',
        title: 'Play a multiplayer match',
        metric: 'mp_play',     goal: 1, bucks: 40 },
    { id: 'q_frenzy_play',     tier: 'bronze', icon: 'bolt',
        title: 'Run a Frenzy round',
        metric: 'frenzy_play', goal: 1, bucks: 35 },
    { id: 'q_pixelated_play',  tier: 'bronze', icon: 'blur_on',
        title: 'Play Pixelated',
        metric: 'pixelated_play', goal: 1, bucks: 35 },
    { id: 'q_language_play',   tier: 'bronze', icon: 'translate',
        title: 'Play Language',
        metric: 'language_play', goal: 1, bucks: 35 },
    { id: 'q_capitals_play',   tier: 'bronze', icon: 'location_city',
        title: 'Play Capitals',
        metric: 'capitals_play', goal: 1, bucks: 35 },
    { id: 'q_longest_play',    tier: 'bronze', icon: 'route',
        title: 'Try a Longest Chain run',
        metric: 'longest_play', goal: 1, bucks: 35 },
    { id: 'q_streak_5',        tier: 'bronze', icon: 'local_fire_department',
        title: 'Reach a streak of 5 in any mode',
        metric: 'best_streak_today', goal: 5, bucks: 35 },

    // Silver — medium grinds; the meaty middle of the daily.
    { id: 'q_mc_correct_30',   tier: 'silver', icon: 'quiz',
        title: 'Multiple Choice: 30 correct',
        metric: 'mc_correct',  goal: 30, bucks: 60 },
    { id: 'q_fr_correct_20',   tier: 'silver', icon: 'edit_note',
        title: 'Free Response: 20 correct',
        metric: 'fr_correct',  goal: 20, bucks: 75 },
    { id: 'q_globe_correct_10', tier: 'silver', icon: 'public',
        title: 'Globe: place 10 countries',
        metric: 'globe_correct', goal: 10, bucks: 85 },
    { id: 'q_any_correct_60',  tier: 'silver', icon: 'check_circle',
        title: 'Any mode: 60 correct answers',
        metric: 'any_correct', goal: 60, bucks: 60 },
    { id: 'q_streak_10',       tier: 'silver', icon: 'local_fire_department',
        title: 'Reach a streak of 10 in any mode',
        metric: 'best_streak_today', goal: 10, bucks: 65 },
    { id: 'q_new_flag',        tier: 'silver', icon: 'flag',
        title: 'Master a new flag',
        metric: 'master_new',  goal: 1, bucks: 80 },
    { id: 'q_mp_play_3',       tier: 'silver', icon: 'sports_esports',
        title: 'Play 3 multiplayer matches',
        metric: 'mp_play',     goal: 3, bucks: 75 },
    { id: 'q_frenzy_score_25', tier: 'silver', icon: 'bolt',
        title: 'Score 25 in Frenzy',
        metric: 'frenzy_score', goal: 25, bucks: 75 },
    { id: 'q_pixelated_score_20', tier: 'silver', icon: 'blur_on',
        title: 'Score 20 in Pixelated',
        metric: 'pixelated_score', goal: 20, bucks: 75 },
    { id: 'q_language_score_10', tier: 'silver', icon: 'translate',
        title: 'Score 10 in Language',
        metric: 'language_score', goal: 10, bucks: 75 },
    { id: 'q_capitals_score_10', tier: 'silver', icon: 'location_city',
        title: 'Score 10 in Capitals',
        metric: 'capitals_score', goal: 10, bucks: 75 },
    { id: 'q_longest_score_5', tier: 'silver', icon: 'route',
        title: 'Reach 5 flags in Longest Chain',
        metric: 'longest_score', goal: 5, bucks: 80 },
    { id: 'q_bonus_play_2',    tier: 'silver', icon: 'casino',
        title: 'Play 2 bonus mode runs',
        metric: 'bonus_play',  goal: 2, bucks: 60 },

    // Gold — meaningful sessions, juicy rewards.
    { id: 'q_mc_correct_60',   tier: 'gold', icon: 'quiz',
        title: 'Multiple Choice: 60 correct',
        metric: 'mc_correct',  goal: 60, bucks: 100 },
    { id: 'q_fr_correct_40',   tier: 'gold', icon: 'edit_note',
        title: 'Free Response: 40 correct',
        metric: 'fr_correct',  goal: 40, bucks: 120 },
    { id: 'q_globe_correct_20', tier: 'gold', icon: 'travel_explore',
        title: 'Globe: place 20 countries',
        metric: 'globe_correct', goal: 20, bucks: 140 },
    { id: 'q_any_correct_120', tier: 'gold', icon: 'check_circle',
        title: 'Any mode: 120 correct answers',
        metric: 'any_correct', goal: 120, bucks: 110 },
    { id: 'q_streak_20',       tier: 'gold', icon: 'local_fire_department',
        title: 'Reach a streak of 20 in any mode',
        metric: 'best_streak_today', goal: 20, bucks: 130 },
    { id: 'q_master_new_3',    tier: 'gold', icon: 'workspace_premium',
        title: 'Master 3 new flags',
        metric: 'master_new',  goal: 3, bucks: 160 },
    { id: 'q_mp_win',          tier: 'gold', icon: 'emoji_events',
        title: 'Win a multiplayer match',
        metric: 'mp_win',      goal: 1, bucks: 130 },
    { id: 'q_frenzy_score_50', tier: 'gold', icon: 'bolt',
        title: 'Score 50 in Frenzy',
        metric: 'frenzy_score', goal: 50, bucks: 140 },
    { id: 'q_pixelated_score_40', tier: 'gold', icon: 'blur_on',
        title: 'Score 40 in Pixelated',
        metric: 'pixelated_score', goal: 40, bucks: 140 },
    { id: 'q_language_score_18', tier: 'gold', icon: 'translate',
        title: 'Score 18 in Language',
        metric: 'language_score', goal: 18, bucks: 140 },
    { id: 'q_perfect_run',     tier: 'gold', icon: 'star',
        title: 'Finish a perfect Longest Chain run',
        metric: 'perfect_run', goal: 1, bucks: 150 },

    // Platinum — stretch goals; not every day will pick these.
    { id: 'q_streak_30',       tier: 'platinum', icon: 'local_fire_department',
        title: 'Reach a streak of 30 in any mode',
        metric: 'best_streak_today', goal: 30, bucks: 220 },
    { id: 'q_globe_correct_35', tier: 'platinum', icon: 'travel_explore',
        title: 'Globe: place 35 countries',
        metric: 'globe_correct', goal: 35, bucks: 230 },
    { id: 'q_any_correct_200', tier: 'platinum', icon: 'check_circle',
        title: 'Any mode: 200 correct answers',
        metric: 'any_correct', goal: 200, bucks: 220 },
    { id: 'q_longest_score_10', tier: 'platinum', icon: 'route',
        title: 'Reach 10 flags in Longest Chain',
        metric: 'longest_score', goal: 10, bucks: 240 },
];

// --- WEEKLY POOL -----------------------------------------------------------
// Two rolled per week. Goals are deliberately higher than the daily caps so
// these are still alive on day 5–7 and reward sustained play, not one big
// session that finishes both inside an hour.
const WEEKLY_POOL = [
    // Silver — base-rate stuff most active players will hit.
    { id: 'w_correct_200',     tier: 'silver', icon: 'check_circle',
        title: 'Answer 200 flags correctly this week',
        metric: 'any_correct', goal: 200, bucks: 250 },
    { id: 'w_mp_play_5',       tier: 'silver', icon: 'sports_esports',
        title: 'Play 5 multiplayer matches this week',
        metric: 'mp_play',     goal: 5, bucks: 240 },
    { id: 'w_bonus_play_5',    tier: 'silver', icon: 'casino',
        title: 'Play 5 bonus mode runs this week',
        metric: 'bonus_play',  goal: 5, bucks: 260 },
    { id: 'w_fr_correct_120',  tier: 'silver', icon: 'edit_note',
        title: 'Free Response: 120 correct this week',
        metric: 'fr_correct',  goal: 120, bucks: 280 },

    // Gold — the standard weekly difficulty.
    { id: 'w_correct_400',     tier: 'gold', icon: 'check_circle',
        title: 'Answer 400 flags correctly this week',
        metric: 'any_correct', goal: 400, bucks: 380 },
    { id: 'w_master_5',        tier: 'gold', icon: 'workspace_premium',
        title: 'Master 5 new flags this week',
        metric: 'master_new',  goal: 5, bucks: 420 },
    { id: 'w_mp_wins_3',       tier: 'gold', icon: 'emoji_events',
        title: 'Win 3 multiplayer matches this week',
        metric: 'mp_win',      goal: 3, bucks: 380 },
    { id: 'w_streak_25',       tier: 'gold', icon: 'local_fire_department',
        title: 'Reach a streak of 25 in any mode',
        metric: 'best_streak_today', goal: 25, bucks: 360 },
    { id: 'w_runs_perfect_3',  tier: 'gold', icon: 'star',
        title: 'Finish 3 perfect-accuracy Longest Chain runs',
        metric: 'perfect_run', goal: 3, bucks: 440 },
    { id: 'w_globe_correct_80', tier: 'gold', icon: 'travel_explore',
        title: 'Globe: place 80 countries this week',
        metric: 'globe_correct', goal: 80, bucks: 460 },
    { id: 'w_frenzy_score_75', tier: 'gold', icon: 'bolt',
        title: 'Score 75 in a Frenzy run',
        metric: 'frenzy_score', goal: 75, bucks: 380 },
    { id: 'w_pixelated_score_60', tier: 'gold', icon: 'blur_on',
        title: 'Score 60 in a Pixelated run',
        metric: 'pixelated_score', goal: 60, bucks: 380 },
    { id: 'w_language_score_20', tier: 'gold', icon: 'translate',
        title: 'Score 20 in a Language run',
        metric: 'language_score', goal: 20, bucks: 380 },

    // Platinum — week-long grinds for the dedicated.
    { id: 'w_correct_700',     tier: 'platinum', icon: 'check_circle',
        title: 'Answer 700 flags correctly this week',
        metric: 'any_correct', goal: 700, bucks: 600 },
    { id: 'w_master_10',       tier: 'platinum', icon: 'workspace_premium',
        title: 'Master 10 new flags this week',
        metric: 'master_new',  goal: 10, bucks: 700 },
    { id: 'w_mp_wins_6',       tier: 'platinum', icon: 'emoji_events',
        title: 'Win 6 multiplayer matches this week',
        metric: 'mp_win',      goal: 6, bucks: 650 },
    { id: 'w_globe_correct_150', tier: 'platinum', icon: 'travel_explore',
        title: 'Globe: place 150 countries this week',
        metric: 'globe_correct', goal: 150, bucks: 750 },
];

// Deterministic-ish RNG so a given user_id + date string always picks the same
// quests. Avoids re-rolling within a day on every read; the date-rollover
// check in the route still drives the actual roll.
function seededShuffle(arr, seed) {
    let s = seed >>> 0;
    const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return h;
}

// Materialize a template into a per-user quest instance. Only the fields the
// client actually reads are persisted — `metric` is needed server-side for
// progress, `tier` and `icon` are needed for rendering.
function instantiate(t) {
    return {
        id: t.id, icon: t.icon, tier: t.tier || 'silver', title: t.title,
        metric: t.metric, goal: t.goal, bucks: t.bucks,
        cur: 0, done: false, claimed: false,
    };
}

function rollDaily(userId, dateStr) {
    const seed = hashStr(`${userId}:${dateStr}:daily`);
    return seededShuffle(DAILY_POOL, seed).slice(0, 3).map(instantiate);
}

function rollWeekly(userId, weekStartStr) {
    const seed = hashStr(`${userId}:${weekStartStr}:weekly`);
    return seededShuffle(WEEKLY_POOL, seed).slice(0, 2).map(instantiate);
}

module.exports = { DAILY_POOL, WEEKLY_POOL, HWM_METRICS, rollDaily, rollWeekly };
