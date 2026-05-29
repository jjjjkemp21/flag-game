// End-of-run treasure chest engine. Pure functions; the chest is rolled
// client-side and the resulting Bucks are awarded through the standard
// addEarnedBucks() path (server applies the delta on the next stats push).
// We use a modest calibration so per-answer Bucks stays the dominant income
// stream — the chest is a celebratory bonus, not a payroll deposit.
//
// Rarity weights default to 70/22/7/1 (Common / Rare / Epic / Legendary).
// Accuracy + streak nudge the distribution upward without ever making
// Legendary likely from a tiny run.

export const RARITIES = {
    common:    { weight: 70, min:   5, max:  15, label: 'Common' },
    rare:      { weight: 22, min:  15, max:  40, label: 'Rare' },
    epic:      { weight:  7, min:  40, max: 100, label: 'Epic' },
    legendary: { weight:  1, min: 100, max: 250, label: 'Legendary' },
};

export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

// Mode multipliers — harder modes pay a touch more from the chest, matching
// the per-answer XP curve (MC = 1.0, FR = 1.25, Globe = 1.35, Globe-name = 1.4,
// bonus modes = 1.15). Applied as a multiplier on the final Bucks number after
// the random roll within the rarity band.
const MODE_MULT = {
    'multiple-choice': 1.0,
    'free-response': 1.25,
    'globe': 1.35,
    'globe-name': 1.4,
    'flash': 1.05,
    'reverse-mc': 1.05,
    'frenzy': 1.15,
    'pixelated': 1.15,
    'longestRoute': 1.2,
    'language': 1.15,
};

// Minimum correct answers required for the chest to roll. Below this we skip
// the celebration entirely — accidental back-presses shouldn't trigger it.
export const MIN_CORRECT_FOR_CHEST = 5;

function pickRarity(weights, rng) {
    const total = RARITY_ORDER.reduce((s, k) => s + (weights[k] || 0), 0);
    if (total <= 0) return 'common';
    let r = rng() * total;
    for (const k of RARITY_ORDER) {
        r -= (weights[k] || 0);
        if (r <= 0) return k;
    }
    return 'common';
}

// Roll a chest given the run summary. `correct` is the count of correct
// answers; `accuracy` is correct / total (0..1); `bestStreak` is the highest
// streak hit during the run; `mode` is the quiz mode key. `yieldMult` is the
// XP Road chest-tier multiplier (1.0..1.25 — see chestYieldMultFromXp in
// xpRoadCatalog), applied AFTER the mode multiplier so an Atlas at Tier V
// reads as "+25% on top of the mode bonus" rather than compounded twice.
//
// Returns null when the run was too short to qualify, so the caller can
// quickly skip the chest UI without a special case.
export function rollChest({
    correct = 0,
    accuracy = 0,
    bestStreak = 0,
    mode = 'multiple-choice',
    yieldMult = 1,
    rng = Math.random,
} = {}) {
    if (correct < MIN_CORRECT_FOR_CHEST) return null;

    // Boosts: high accuracy shifts mass toward legendary; long streaks shift
    // mass toward epic and above. Both are bounded so the floor of 1% legend
    // doesn't accidentally hit 50% on a perfect 100-question run.
    const accBoost = Math.max(0, Math.min(10, Math.round((accuracy - 0.6) * 25)));   // +0..+10 to legendary as acc 0.60→1.00 (acc maxes at 1.0)
    const streakBoost = Math.max(0, Math.min(5, Math.round((bestStreak - 8) * 0.5))); // +0..+5 to epic at bestStreak 8→18+

    const weights = {
        common:    Math.max(15, RARITIES.common.weight    - accBoost - streakBoost),
        rare:      RARITIES.rare.weight + Math.round(streakBoost / 2),
        epic:      RARITIES.epic.weight + streakBoost,
        legendary: RARITIES.legendary.weight + accBoost,
    };

    const rarity = pickRarity(weights, rng);
    const band = RARITIES[rarity];
    const raw = band.min + Math.floor(rng() * (band.max - band.min + 1));
    const mult = MODE_MULT[mode] != null ? MODE_MULT[mode] : 1;
    const yMult = Math.max(1, Number(yieldMult) || 1);
    const bucks = Math.max(1, Math.round(raw * mult * yMult));

    return { rarity, bucks, raw, mult, yieldMult: yMult };
}
