// Mastery threshold: a flag's `streak` strictly greater than this counts as
// "mastered". Mirrors MASTERY_STREAK in src/lib/xp.js + server/xp.js.
const MASTERY_STREAK = 5;

// Spaced-repetition ladder. Early intervals are intentionally short so a player
// who wants to grind a region to mastery in one sitting actually can — later
// intervals stretch out so a well-known flag doesn't pester the player.
// Index N is the gap after the Nth correct in a row.
const STREAK_INTERVALS = [
    null,            // streak 0 — immediate
    { minutes: 1 },  // streak 1
    { minutes: 10 }, // streak 2
    { hours: 1 },    // streak 3
    { hours: 8 },    // streak 4
    { days: 1 },     // streak 5
    { days: 7 },     // streak 6 — first "mastered" rung
    { days: 30 },    // streak 7
    { days: 90 },    // streak 8+ cap
];

// First miss after a flag has been hidden this long is forgiven (no streak
// drop) — if we kept it out of sight for weeks, the rust isn't on the player.
const SOFT_MISS_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

const LEECH_THRESHOLD = 6;

// A leeched flag is parked for this long, then resurfaces so the player can
// actually clear it. Previously it was pushed 10 years out, which — combined
// with the leech filter in pickFlag — meant a leech could NEVER be answered
// again and was excluded permanently. Now leeches age back into rotation.
const LEECH_COOLOFF_MS = 3 * 24 * 60 * 60 * 1000;

// A flag is eligible for selection if it isn't leeched OR it is a leech whose
// cool-off has elapsed (so tricky flags resurface instead of vanishing).
function isSelectable(flag, f) {
    if (!flag[f.isLeech]) return true;
    return flag[f.nextReview] != null && flag[f.nextReview] <= Date.now();
}

// Maps an axis ('flag' or 'geo') onto the per-flag field names. Lets one
// selection/scheduling engine drive both flag-recognition (regular quizzes)
// and country-placement (Globe mode) without duplicating logic.
function axisFields(axis) {
    if (axis === 'geo') {
        return {
            correct: 'geoCorrect',
            incorrect: 'geoIncorrect',
            streak: 'geoStreak',
            lapses: 'geoLapses',
            isLeech: 'geoIsLeech',
            nextReview: 'geoNextReview',
            lastAnswered: 'geoLastAnswered',
        };
    }
    return {
        correct: 'correct',
        incorrect: 'incorrect',
        streak: 'streak',
        lapses: 'lapses',
        isLeech: 'isLeech',
        nextReview: 'nextReview',
        lastAnswered: 'lastAnswered',
    };
}

function runWeightedSelection(flagsToSelectFrom, axis = 'flag') {
    if (!flagsToSelectFrom || flagsToSelectFrom.length === 0) return null;
    const f = axisFields(axis);
    const weights = flagsToSelectFrom.map((flag) => {
        const correct = Number(flag[f.correct]) || 0;
        const incorrect = Number(flag[f.incorrect]) || 0;
        const streak = Number(flag[f.streak]) || 0;
        const struggleScore = incorrect / (correct + 1);
        let weight = 1 + struggleScore * 10;
        if (correct === 0 && incorrect === 0) weight += 2;
        // Un-mastered boost: a streak-0 flag gets +12, a streak-5 (one away
        // from mastery) gets +2, mastered flags get no boost.
        if (streak <= MASTERY_STREAK) weight += (MASTERY_STREAK + 1 - streak) * 2;
        return weight;
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < flagsToSelectFrom.length; i++) {
        random -= weights[i];
        if (random < 0) return flagsToSelectFrom[i];
    }
    return flagsToSelectFrom[flagsToSelectFrom.length - 1];
}

function pickFlag(flags, recently_shown_codes, axis) {
    const f = axisFields(axis);
    const now = Date.now();
    const availableFlags = flags.filter((x) => isSelectable(x, f));
    if (availableFlags.length === 0) return null;

    const lastFlagCode = recently_shown_codes.length > 0
        ? recently_shown_codes[recently_shown_codes.length - 1]
        : null;

    let primaryPool = availableFlags;
    if (lastFlagCode && availableFlags.length > 1) {
        primaryPool = availableFlags.filter((flag) => flag.code !== lastFlagCode);
    }
    if (primaryPool.length === 0) primaryPool = availableFlags;

    const notRecent = primaryPool.filter((flag) => !recently_shown_codes.includes(flag.code));

    // Tier 1: due AND not recent (the spaced-repetition happy path).
    if (notRecent.length > 0) {
        const dueAndNotRecent = notRecent.filter(
            (x) => x[f.nextReview] == null || x[f.nextReview] <= now
        );
        if (dueAndNotRecent.length > 0) return runWeightedSelection(dueAndNotRecent, axis);
        // Tier 2: if nothing's due, still prefer un-mastered flags over already-mastered
        // ones — this is what surfaces the last few flags during a mastery push.
        const unMasteredNotRecent = notRecent.filter(
            (x) => (Number(x[f.streak]) || 0) <= MASTERY_STREAK
        );
        if (unMasteredNotRecent.length > 0) return runWeightedSelection(unMasteredNotRecent, axis);
        // Tier 3: everything not-recent (mastered review).
        return runWeightedSelection(notRecent, axis);
    }

    // Pool exhausted (every available flag is in the recent window). Fall back
    // into the primary pool with the same preference order.
    const dueInPrimary = primaryPool.filter(
        (x) => x[f.nextReview] == null || x[f.nextReview] <= now
    );
    if (dueInPrimary.length > 0) return runWeightedSelection(dueInPrimary, axis);
    const unMasteredInPrimary = primaryPool.filter(
        (x) => (Number(x[f.streak]) || 0) <= MASTERY_STREAK
    );
    if (unMasteredInPrimary.length > 0) return runWeightedSelection(unMasteredInPrimary, axis);
    return runWeightedSelection(primaryPool, axis);
}

// Hard invariant: never the same flag twice in a row when an alternative
// exists. Wraps the internal picker so every code path respects it, regardless
// of which fallback tier produced the candidate.
function select_next_flag(flags, recently_shown_codes = [], axis = 'flag') {
    if (!flags || flags.length === 0) return null;
    const pick = pickFlag(flags, recently_shown_codes, axis);
    const lastFlagCode = recently_shown_codes.length > 0
        ? recently_shown_codes[recently_shown_codes.length - 1]
        : null;
    if (pick && lastFlagCode && pick.code === lastFlagCode) {
        const f = axisFields(axis);
        const alternatives = flags.filter((x) => isSelectable(x, f) && x.code !== lastFlagCode);
        if (alternatives.length > 0) return runWeightedSelection(alternatives, axis);
        return null; // genuinely a pool of 1 — caller decides what to show.
    }
    return pick;
}

function get_distractor_options(correct_flag, all_flags, num_options = 3, quiz_category = null, question_history = []) {
    const correctTags = new Set(correct_flag.tags);
    const recentFlagCodes = new Set(question_history);

    let eligibleFlags = all_flags.filter((flag) =>
        flag.name !== correct_flag.name && !recentFlagCodes.has(flag.code)
    );

    if (quiz_category && quiz_category.type === 'region') {
        const regionTag = `region:${quiz_category.value}`;
        eligibleFlags = eligibleFlags.filter((flag) => flag.tags.includes(regionTag));
    }

    const scoredFlags = eligibleFlags.map((flag) => {
        const otherTags = new Set(flag.tags);
        const intersection = new Set([...correctTags].filter((tag) => otherTags.has(tag)));
        let score = intersection.size;
        intersection.forEach((tag) => {
            if (tag.startsWith('region:')) score += 3;
            if (tag.startsWith('colors:')) score += 2;
            if (tag.startsWith('layout:')) score += 2;
        });
        return { name: flag.name, score };
    });

    scoredFlags.sort((a, b) => b.score - a.score);
    const topCandidates = scoredFlags.slice(0, 30);

    for (let i = topCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topCandidates[i], topCandidates[j]] = [topCandidates[j], topCandidates[i]];
    }

    const distractors = topCandidates.slice(0, num_options).map((f) => f.name);

    if (distractors.length < num_options) {
        const existingDistractors = new Set(distractors);
        existingDistractors.add(correct_flag.name);
        // Keep the region filter on the top-up pool too, so a region quiz can
        // never surface an out-of-region distractor if the in-region pool runs
        // short. Layout decks intentionally allow cross-region options.
        const fallbackPool = (quiz_category && quiz_category.type === 'region')
            ? all_flags.filter((f) => f.tags.includes(`region:${quiz_category.value}`))
            : all_flags;
        const remainingFlags = fallbackPool.filter((f) => !existingDistractors.has(f.name));
        while (distractors.length < num_options && remainingFlags.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingFlags.length);
            const randomFlag = remainingFlags.splice(randomIndex, 1)[0];
            distractors.push(randomFlag.name);
        }
    }

    return distractors;
}

function calculateNextReview(streak) {
    const idx = Math.min(Math.max(streak, 0), STREAK_INTERVALS.length - 1);
    const interval = STREAK_INTERVALS[idx];
    if (!interval) return Date.now();
    let ms = 0;
    if (interval.minutes) ms = interval.minutes * 60 * 1000;
    if (interval.hours) ms = interval.hours * 60 * 60 * 1000;
    if (interval.days) ms = interval.days * 24 * 60 * 60 * 1000;
    return Date.now() + ms;
}

function update_flag_stats(flags, correct_flag_object, user_was_correct, reason = 'answered') {
    // Accept either a flag object or a plain name string for backwards compatibility.
    const target = typeof correct_flag_object === 'string'
        ? { name: correct_flag_object }
        : (correct_flag_object || {});

    let flagIndex = -1;
    if (target.code) flagIndex = flags.findIndex((f) => f.code === target.code);
    if (flagIndex === -1 && target.name) flagIndex = flags.findIndex((f) => f.name === target.name);
    if (flagIndex === -1 && target.country) flagIndex = flags.findIndex((f) => f.country === target.country);

    if (flagIndex === -1) {
        console.warn('update_flag_stats: flag not found', target);
        const fallbackName = target.name || target.country || 'this flag';
        const message = {
            text: user_was_correct ? 'Correct! The answer was:' : 'The answer was:',
            answer: fallbackName,
        };
        return { message, color: user_was_correct ? 'green' : 'red', updatedFlags: flags };
    }

    const updatedFlags = JSON.parse(JSON.stringify(flags));
    const flag = updatedFlags[flagIndex];
    const now = Date.now();
    const sinceLastShown = flag.lastAnswered ? now - flag.lastAnswered : Infinity;
    flag.lastAnswered = now;

    const allAnswers = [flag.name || flag.country, ...(flag.aliases || [])].filter(Boolean);
    const answerString = allAnswers.join(' / ');
    let message, color;

    if (user_was_correct) {
        message = { text: 'Correct! The answer was:', answer: answerString };
        color = 'green';
        flag.correct += 1;
        flag.streak += 1;
        const wasLeech = flag.isLeech;
        flag.isLeech = false;
        // A recovering leech gets breathing room so a single later miss doesn't
        // instantly re-park it; ordinary correct answers just decay lapses by one.
        flag.lapses = wasLeech
            ? Math.max(0, LEECH_THRESHOLD - 2)
            : (flag.lapses ? Math.max(0, flag.lapses - 1) : 0);
        flag.nextReview = calculateNextReview(flag.streak);
    } else {
        const text = reason === 'skipped'
            ? 'Skipped. The answer was:'
            : 'Incorrect. The answer was:';
        message = { text, answer: answerString };
        color = 'red';
        flag.incorrect += 1;
        flag.lapses = (flag.lapses || 0) + 1;

        // Soft-miss: a flag we hid for over two weeks gets a free first miss.
        // The rust is on us for keeping it out of sight, not the player.
        const isSoftMiss = sinceLastShown > SOFT_MISS_AFTER_MS;
        if (!isSoftMiss) {
            flag.streak = Math.max(0, flag.streak - 1);
        }

        if (flag.lapses > LEECH_THRESHOLD) {
            flag.isLeech = true;
            flag.nextReview = now + LEECH_COOLOFF_MS;
            message.text = "This flag seems tricky, so we'll set it aside for a bit. The answer was:";
        } else {
            flag.nextReview = now;
        }
    }

    return { message, color, updatedFlags };
}

// Geography stats updater for Globe mode. Lives on the same per-flag record
// but tracks geo-knowledge independently from flag-recognition (geoCorrect /
// geoStreak / etc.). Now uses the same spaced-repetition ladder + soft-miss
// rules as the flag-recognition axis so a player can master the globe in a
// sitting and won't lose hard-won placements to a single rusty miss.
function update_geo_stats(flags, correct_flag_object, user_was_correct, reason = 'answered') {
    const target = typeof correct_flag_object === 'string'
        ? { name: correct_flag_object }
        : (correct_flag_object || {});

    let flagIndex = -1;
    if (target.code) flagIndex = flags.findIndex((f) => f.code === target.code);
    if (flagIndex === -1 && target.name) flagIndex = flags.findIndex((f) => f.name === target.name);
    if (flagIndex === -1 && target.country) flagIndex = flags.findIndex((f) => f.country === target.country);

    if (flagIndex === -1) {
        const fallbackName = target.name || target.country || 'this country';
        return {
            message: { text: user_was_correct ? 'Correct! The answer was:' : 'The answer was:', answer: fallbackName },
            color: user_was_correct ? 'green' : 'red',
            updatedFlags: flags,
        };
    }

    const updatedFlags = JSON.parse(JSON.stringify(flags));
    const flag = updatedFlags[flagIndex];
    const now = Date.now();
    const sinceLastShown = flag.geoLastAnswered ? now - flag.geoLastAnswered : Infinity;
    flag.geoLastAnswered = now;

    const answerString = [flag.name || flag.country, ...(flag.aliases || [])].filter(Boolean).join(' / ');
    let message, color;

    if (user_was_correct) {
        message = { text: 'Correct! The answer was:', answer: answerString };
        color = 'green';
        flag.geoCorrect = (flag.geoCorrect || 0) + 1;
        flag.geoStreak = (flag.geoStreak || 0) + 1;
        const wasGeoLeech = flag.geoIsLeech;
        flag.geoIsLeech = false;
        flag.geoLapses = wasGeoLeech
            ? Math.max(0, LEECH_THRESHOLD - 2)
            : (flag.geoLapses ? Math.max(0, flag.geoLapses - 1) : 0);
        flag.geoNextReview = calculateNextReview(flag.geoStreak);
    } else {
        const text = reason === 'skipped'
            ? 'Skipped. The answer was:'
            : 'Incorrect. The answer was:';
        message = { text, answer: answerString };
        color = 'red';
        flag.geoIncorrect = (flag.geoIncorrect || 0) + 1;
        flag.geoLapses = (flag.geoLapses || 0) + 1;

        const isSoftMiss = sinceLastShown > SOFT_MISS_AFTER_MS;
        if (!isSoftMiss) {
            flag.geoStreak = Math.max(0, (flag.geoStreak || 0) - 1);
        }

        if (flag.geoLapses > LEECH_THRESHOLD) {
            flag.geoIsLeech = true;
            flag.geoNextReview = now + LEECH_COOLOFF_MS;
            message.text = "This one's tricky on the globe — we'll set it aside for a bit. The answer was:";
        } else {
            flag.geoNextReview = now;
        }
    }

    return { message, color, updatedFlags };
}

export { select_next_flag, get_distractor_options, update_flag_stats, update_geo_stats };
