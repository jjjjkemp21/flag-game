function levenshtein(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1);
    for (let i = 0; i <= bn; i++) {
        matrix[i] = [i];
    }
    const bMatrix = matrix[0];
    for (let j = 1; j <= an; j++) {
        bMatrix[j] = j;
    }
    for (let i = 1; i <= bn; i++) {
        for (let j = 1; j <= an; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }
    return matrix[bn][an];
}

function checkAnswer(userGuess, flag, strictSpelling = false) {
    const normalizedGuess = (userGuess || '').trim().toLowerCase();
    if (normalizedGuess === '') return false;
    if (!flag || !flag.name) return false;

    const possibleAnswers = [
        flag.name,
        ...(flag.aliases || [])
    ].filter(Boolean);

    if (strictSpelling) {
        const normalizedAnswers = possibleAnswers.map(ans => ans.toLowerCase());
        return normalizedAnswers.includes(normalizedGuess);
    }

    for (const answer of possibleAnswers) {
        const normalizedAnswer = answer.toLowerCase();
        const distance = levenshtein(normalizedGuess, normalizedAnswer);
        const maxLength = Math.max(normalizedGuess.length, normalizedAnswer.length);
        if (maxLength === 0) continue;
        const similarity = 1 - (distance / maxLength);
        if (similarity >= 0.8) return true;
    }
    return false;
}

export { levenshtein, checkAnswer };
