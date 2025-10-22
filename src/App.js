function runWeightedSelection(flagsToSelectFrom) {
    if (!flagsToSelectFrom || flagsToSelectFrom.length === 0) {
        return null;
    }
    const weights = flagsToSelectFrom.map(flag => {
        const struggleScore = flag.incorrect / (flag.correct + 1);
        let weight = 1 + struggleScore * 10;

        if (flag.correct === 0 && flag.incorrect === 0) {
            weight += 2;
        }
        return weight;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < flagsToSelectFrom.length; i++) {
        random -= weights[i];
        if (random < 0) {
            return flagsToSelectFrom[i];
        }
    }

    return flagsToSelectFrom[flagsToSelectFrom.length - 1];
}

function select_next_flag(flags, recently_shown_codes = []) {
    if (!flags || flags.length === 0) {
        return null;
    }

    const now = Date.now();
    const availableFlags = flags.filter(f => !f.isLeech);
    if (availableFlags.length === 0) {
        return null;
    }

    const lastFlagCode = recently_shown_codes.length > 0 ? recently_shown_codes[recently_shown_codes.length - 1] : null;

    let primaryPool = availableFlags;
    if (lastFlagCode && availableFlags.length > 1) {
        primaryPool = availableFlags.filter(flag => flag.code !== lastFlagCode);
    }

    if (primaryPool.length === 0) {
        primaryPool = availableFlags;
    }

    const notRecentFlags = primaryPool.filter(flag => !recently_shown_codes.includes(flag.code));

    if (notRecentFlags.length > 0) {
        const dueAndNotRecent = notRecentFlags.filter(flag => flag.nextReview === null || flag.nextReview <= now);
        if (dueAndNotRecent.length > 0) {
            return runWeightedSelection(dueAndNotRecent);
        }
        
        return runWeightedSelection(notRecentFlags);
    }
    
    const dueInPrimaryPool = primaryPool.filter(flag => flag.nextReview === null || flag.nextReview <= now);
    if (dueInPrimaryPool.length > 0) {
        return runWeightedSelection(dueInPrimaryPool);
    }

    return runWeightedSelection(primaryPool);
}

function get_distractor_options(correct_flag, all_flags, num_options = 3, quiz_category = null, question_history = []) {
    const correctTags = new Set(correct_flag.tags);
    const recentFlagCodes = new Set(question_history);

    let eligibleFlags = all_flags.filter(flag =>
        flag.name !== correct_flag.name &&
        !recentFlagCodes.has(flag.code)
    );

    if (quiz_category && quiz_category.type === 'region') {
        const regionTag = `region:${quiz_category.value}`;
        eligibleFlags = eligibleFlags.filter(flag => flag.tags.includes(regionTag));
    }

    const scoredFlags = eligibleFlags.map(flag => {
        const otherTags = new Set(flag.tags);
        const intersection = new Set([...correctTags].filter(tag => otherTags.has(tag)));
        
        let score = intersection.size;

        intersection.forEach(tag => {
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
    
    const distractors = topCandidates.slice(0, num_options).map(f => f.name);

    if (distractors.length < num_options) {
        const existingDistractors = new Set(distractors);
        existingDistractors.add(correct_flag.name);
        const remainingFlags = all_flags.filter(f => !existingDistractors.has(f.name));
        while(distractors.length < num_options && remainingFlags.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingFlags.length);
            const randomFlag = remainingFlags.splice(randomIndex, 1)[0];
            distractors.push(randomFlag.name);
        }
    }

    return distractors;
}


const STREAK_INTERVALS = [
    { hours: 4 },
    { hours: 8 },
    { days: 1 },
    { days: 3 },
    { days: 7 },
    { days: 14 },
    { days: 30 },
    { days: 60 }
];

function calculateNextReview(streak) {
    const interval = STREAK_INTERVALS[Math.min(streak, STREAK_INTERVALS.length - 1)];
    let milliseconds = 0;
    if (interval.hours) milliseconds = interval.hours * 60 * 60 * 1000;
    if (interval.days) milliseconds = interval.days * 24 * 60 * 60 * 1000;
    return Date.now() + milliseconds;
}

function update_flag_stats(flags, correct_flag_name, user_was_correct, reason = 'answered') {
    const flagIndex = flags.findIndex(f => f.name === correct_flag_name);
    if (flagIndex === -1) {
        const message = { text: "Error: Flag not found." };
        return { message, color: "red", updatedFlags: flags };
    }

    const updatedFlags = JSON.parse(JSON.stringify(flags));
    const flag = updatedFlags[flagIndex];
    let message, color;

    flag.lastAnswered = Date.now();

    if (user_was_correct) {
        message = { text: "✅ Correct!" };
        color = "green";
        flag.correct += 1;
        flag.streak += 1;
        flag.isLeech = false;
        flag.lapses = flag.lapses ? Math.max(0, flag.lapses - 1) : 0;
        flag.nextReview = calculateNextReview(flag.streak);
    } else {
        const text = reason === 'skipped'
            ? `❌ Skipped. The answer was:`
            : `❌ Incorrect. The answer was:`;
        message = { text, answer: correct_flag_name };
        color = "red";
        flag.incorrect += 1;
        flag.lapses = (flag.lapses || 0) + 1;

        if (flag.streak > 2) {
            flag.streak = Math.floor(flag.streak * 0.5);
        } else {
            flag.streak = 0;
        }

        const LEECH_THRESHOLD = 4;
        if (flag.lapses > LEECH_THRESHOLD) {
            flag.isLeech = true;
            flag.nextReview = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000); 
            message.text = `This flag seems tricky, so we'll set it aside for now. The answer was:`;
        } else {
            flag.nextReview = Date.now();
        }
    }

    return { message, color, updatedFlags };
}

export { select_next_flag, get_distractor_options, update_flag_stats };