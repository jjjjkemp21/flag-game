import { api } from '../api/client';

// In-memory progress store for bonus-mode high scores. Progress is tied to the
// account: nothing is written to localStorage. For guests it lives only for the
// current session; for logged-in users it is loaded from / pushed to the server.

const EMPTY = { frenzy: 0, pixelated: 0, longestRoute: 0, language: 0 };

let bonus = { ...EMPTY };
let authed = false;
let pushTimer = null;

export function setAuthed(value) {
    authed = !!value;
}

export function loadBonus(scores) {
    bonus = { ...EMPTY, ...(scores || {}) };
}

export function resetBonus() {
    bonus = { ...EMPTY };
}

export function getBonus() {
    return { ...bonus };
}

export function getHighScore(name) {
    return bonus[name] || 0;
}

function pushBonus(delay = 1200) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/stats', { bonusScores: getBonus() }).catch(() => {
            /* offline / transient — guest progress is intentionally ephemeral */
        });
    }, delay);
}

// Record a new score for a bonus mode. Only persisted (to the account) when
// logged in; guests just keep it in memory until reload/logout.
export function recordHighScore(name, value) {
    const v = Number(value) || 0;
    if (v > (bonus[name] || 0)) {
        bonus[name] = v;
        if (authed) pushBonus();
    }
    return bonus[name];
}
