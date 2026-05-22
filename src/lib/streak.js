// Per-gamemode run streaks (consecutive correct answers). Each mode keeps its own
// current streak so a hot run in Multiple Choice doesn't carry into Free Response.
// Current streaks are persisted to localStorage so they survive leaving the page;
// best-per-mode streaks are mirrored into the account (see profile store) so they
// can appear on the leaderboard.

const CUR_KEY = 'flagGameStreaks';      // { [mode]: currentStreak }
const BEST_KEY = 'flagGameBestStreaks'; // { [mode]: bestStreak }
const LEGACY_KEY = 'flagGameStreak';    // old single shared streak

function readMap(key) {
    try {
        const raw = localStorage.getItem(key);
        const obj = raw ? JSON.parse(raw) : null;
        return obj && typeof obj === 'object' ? obj : {};
    } catch (_) {
        return {};
    }
}

function writeMap(key, map) {
    try { localStorage.setItem(key, JSON.stringify(map)); } catch (_) { /* ignore */ }
}

// One-time migration: fold the old shared streak into both standard modes.
(function migrateLegacy() {
    try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy == null) return;
        const n = Math.max(0, parseInt(legacy, 10) || 0);
        const cur = readMap(CUR_KEY);
        if (n > 0) {
            if (cur['multiple-choice'] == null) cur['multiple-choice'] = n;
            if (cur['free-response'] == null) cur['free-response'] = n;
            writeMap(CUR_KEY, cur);
        }
        localStorage.removeItem(LEGACY_KEY);
    } catch (_) { /* ignore */ }
})();

export function getStreak(mode) {
    const v = readMap(CUR_KEY)[mode];
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveStreak(mode, value) {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    const cur = readMap(CUR_KEY);
    cur[mode] = n;
    writeMap(CUR_KEY, cur);
    // Track the best-ever streak for this mode locally too.
    if (n > getBestStreak(mode)) {
        const best = readMap(BEST_KEY);
        best[mode] = n;
        writeMap(BEST_KEY, best);
    }
    return n;
}

export function resetStreak(mode) {
    return saveStreak(mode, 0);
}

export function getBestStreak(mode) {
    const v = readMap(BEST_KEY)[mode];
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

export function getBestStreaks() {
    return { ...readMap(BEST_KEY) };
}
