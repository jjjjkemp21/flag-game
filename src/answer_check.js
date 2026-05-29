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

// Registry of every known country name/alias (normalized). Populated once on
// catalog load via setKnownAnswers. Used by the fuzzy matcher to HARD-REJECT a
// guess that exactly spells a DIFFERENT country — without this, the 80%
// similarity gate accepts real adjacent names (Gambia/Zambia, Iceland/Ireland,
// North/South Korea, Niger/Nigeria, Slovakia/Slovenia), marking a wrong
// country correct. Empty until set, in which case the reject is simply skipped.
let KNOWN_ANSWERS = new Set();

function setKnownAnswers(names) {
    KNOWN_ANSWERS = new Set(
        (names || [])
            .filter(Boolean)
            .map((n) => String(n).trim().toLowerCase())
            .filter((n) => n.length > 0)
    );
}

// Max edit distance tolerated for a fuzzy accept, scaled by answer length so a
// short name can't be matched across a 1-char gap to a different short name.
function editBudget(len) {
    if (len <= 4) return 0;
    if (len <= 8) return 1;
    return 2;
}

function checkAnswer(userGuess, flag, strictSpelling = false) {
    const normalizedGuess = (userGuess || '').trim().toLowerCase();
    if (normalizedGuess === '') return false;
    if (!flag || !flag.name) return false;

    const possibleAnswers = [
        flag.name,
        ...(flag.aliases || [])
    ].filter(Boolean);
    const ownAnswers = new Set(possibleAnswers.map((a) => a.toLowerCase()));

    // Exact match against this flag's own names/aliases is always correct,
    // regardless of strict mode.
    if (ownAnswers.has(normalizedGuess)) return true;
    if (strictSpelling) return false;

    // The guess exactly spells a DIFFERENT country — never a fuzzy match.
    if (KNOWN_ANSWERS.has(normalizedGuess)) return false;

    for (const normalizedAnswer of ownAnswers) {
        const distance = levenshtein(normalizedGuess, normalizedAnswer);
        const maxLength = Math.max(normalizedGuess.length, normalizedAnswer.length);
        if (maxLength === 0) continue;
        const similarity = 1 - (distance / maxLength);
        if (distance <= editBudget(normalizedAnswer.length) && similarity >= 0.8) {
            return true;
        }
    }
    return false;
}

export { levenshtein, checkAnswer, setKnownAnswers };
