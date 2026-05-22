// The current run streak (consecutive correct answers) for the standard quizzes.
// Persisted to localStorage so it survives leaving the page or reloading mid-run,
// instead of resetting to zero. Shared across Multiple Choice and Free Response.

const KEY = 'flagGameStreak';

export function getStreak() {
    try {
        const v = parseInt(localStorage.getItem(KEY) || '0', 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    } catch (_) {
        return 0;
    }
}

export function saveStreak(value) {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    try { localStorage.setItem(KEY, String(n)); } catch (_) { /* ignore */ }
    return n;
}

export function resetStreak() {
    return saveStreak(0);
}
