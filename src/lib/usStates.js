import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { MASTERY_STREAK } from './xp';

// United States store — per-state mastery for the US sub-mode under Capital.
// Mirrors capitals.js but with a single fixed catalog (50 states, no
// "include territories" toggle). Both sub-modes (map + capitals) share one
// per-state mastery stat — like Globe's find/name pair — so progress grows no
// matter which lens the player is using.
//
// Account-tied: nothing in localStorage. Persists to /api/us-states (debounced).
// The catalog is loaded once from public/data/us_states.json.

const STATES_URL = './data/us_states.json';

const REVIEW_LADDER_MS = [
    0,                       // streak 0 — due immediately
    1 * 60 * 1000,           // 1m
    10 * 60 * 1000,          // 10m
    60 * 60 * 1000,          // 1h
    6 * 60 * 60 * 1000,      // 6h
    24 * 60 * 60 * 1000,     // 1d
    3 * 24 * 60 * 60 * 1000, // 3d
    7 * 24 * 60 * 60 * 1000, // 1w
    30 * 24 * 60 * 60 * 1000,// 1mo
];

function nextReviewFor(streak) {
    const idx = Math.min(Math.max(streak, 0), REVIEW_LADDER_MS.length - 1);
    return Date.now() + REVIEW_LADDER_MS[idx];
}

// stats: { [code]: { correct, incorrect, streak, nextReview, lastAnswered } }
let state = {
    stats: {},
    catalog: [],      // [{ code, name, capital, region, fips }]
    catalogLoaded: false,
    loaded: false,
};
let authed = false;
let catalogPromise = null;
let pushTimer = null;

const listeners = new Set();
function notify() { listeners.forEach((l) => l()); }
function setState(patch) { state = { ...state, ...patch }; notify(); }

export function setUsStatesAuthed(value) { authed = !!value; }

// ---- Catalog ---------------------------------------------------------------
export function ensureUsStatesCatalog() {
    if (state.catalogLoaded) return Promise.resolve(state.catalog);
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetch(STATES_URL)
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((rows) => {
            const list = (rows || []).map((r) => ({
                code: String(r.code || '').toLowerCase(),
                name: r.name,
                capital: r.capital,
                region: r.region || 'other',
                fips: r.fips || '',
            })).filter((r) => r.code && r.name && r.capital);
            setState({ catalog: list, catalogLoaded: true });
            return list;
        })
        .catch(() => {
            setState({ catalogLoaded: true });
            return [];
        });
    return catalogPromise;
}

export function getUsStatesCatalog() { return state.catalog; }
export function getUsStateById(code) { return state.catalog.find((c) => c.code === code) || null; }

// Codes the quiz may ask about — just the catalog, no toggle.
export function availableUsStateCodes() { return state.catalog.map((c) => c.code); }

// Regions (sorted) for the "By Region" deck tiles.
export function usStateRegions() {
    const set = new Set();
    for (const c of state.catalog) set.add(c.region);
    return [...set].sort();
}

// Codes for a chosen deck: { type: 'all' | 'review' | 'region', value }.
export function deckUsStateCodes(deck = { type: 'all' }) {
    const now = Date.now();
    if (deck && deck.type === 'region') {
        return state.catalog.filter((c) => c.region === deck.value).map((c) => c.code);
    }
    let pool = state.catalog.map((c) => c.code);
    if (deck && deck.type === 'review') {
        pool = pool.filter((code) => { const nr = statOf(code).nextReview; return nr != null && nr <= now; });
    }
    return pool;
}

// Per-deck mastery stats for the picker tiles: { mastered, total, needsReview }.
export function usStateDeckStats(deck = { type: 'all' }) {
    const codes = deckUsStateCodes(deck);
    const now = Date.now();
    let mastered = 0;
    let needsReview = 0;
    for (const code of codes) {
        const s = statOf(code);
        if ((s.streak || 0) > MASTERY_STREAK) mastered += 1;
        if (s.nextReview != null && s.nextReview <= now) needsReview += 1;
    }
    return { mastered, total: codes.length, needsReview };
}

// ---- Load / reset ----------------------------------------------------------
function sanitizeStats(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [code, s] of Object.entries(raw)) {
        if (!s || typeof s !== 'object') continue;
        out[code] = {
            correct: Math.max(0, Math.round(Number(s.correct) || 0)),
            incorrect: Math.max(0, Math.round(Number(s.incorrect) || 0)),
            streak: Math.max(0, Math.round(Number(s.streak) || 0)),
            nextReview: s.nextReview != null ? Number(s.nextReview) : null,
            lastAnswered: s.lastAnswered != null ? Number(s.lastAnswered) : null,
        };
    }
    return out;
}

export function loadUsStates(stats) {
    setState({ stats: sanitizeStats(stats), loaded: true });
}

export function resetUsStates() {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    setState({ stats: {}, loaded: false });
}

// ---- Persistence -----------------------------------------------------------
function pushUsStates(delay = 1200) {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/us-states', { stats: state.stats }).catch(() => { /* offline / transient */ });
    }, delay);
}

export function flushUsStates() {
    if (!authed) return Promise.resolve(null);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    return api.put('/us-states', { stats: state.stats }).catch(() => null);
}

// ---- Stats helpers ---------------------------------------------------------
function statOf(code) {
    return state.stats[code] || { correct: 0, incorrect: 0, streak: 0, nextReview: null, lastAnswered: null };
}

export function getUsStateStat(code) { return statOf(code); }

// Records an answer for a state. Returns { before, after } streaks so the caller
// can detect a fresh mastery crossing. Mirrors the capitals ladder.
export function recordUsStateAnswer(code, wasCorrect) {
    const prev = statOf(code);
    const before = prev.streak;
    const now = Date.now();
    let next;
    if (wasCorrect) {
        const streak = before + 1;
        next = {
            correct: prev.correct + 1,
            incorrect: prev.incorrect,
            streak,
            nextReview: nextReviewFor(streak),
            lastAnswered: now,
        };
    } else {
        const streak = Math.max(0, before - 1);
        next = {
            correct: prev.correct,
            incorrect: prev.incorrect + 1,
            streak,
            nextReview: now,
            lastAnswered: now,
        };
    }
    setState({ stats: { ...state.stats, [code]: next } });
    pushUsStates();
    return { before, after: next.streak };
}

// ---- Mastery counts --------------------------------------------------------
export function getUsStateMasteredCount() {
    let n = 0;
    for (const s of Object.values(state.stats)) if ((s.streak || 0) > MASTERY_STREAK) n += 1;
    return n;
}
export function getUsStateTotal() { return state.catalog.length; }

// ---- Question selection ----------------------------------------------------
function weightOf(code) {
    const s = statOf(code);
    const mastered = (s.streak || 0) > MASTERY_STREAK;
    return (mastered ? 1 : 6) / ((s.streak || 0) + 1);
}

function weightedPick(codes) {
    if (!codes.length) return null;
    const total = codes.reduce((sum, code) => sum + weightOf(code), 0);
    let r = Math.random() * total;
    for (const code of codes) {
        r -= weightOf(code);
        if (r <= 0) return code;
    }
    return codes[codes.length - 1];
}

export function selectNextUsState(availableCodes, recentCodes = []) {
    const pool = (availableCodes || []).filter(Boolean);
    if (!pool.length) return null;
    const recent = new Set(recentCodes);
    const last = recentCodes.length ? recentCodes[recentCodes.length - 1] : null;
    const now = Date.now();

    let notRecent = pool.filter((code) => !recent.has(code));
    if (!notRecent.length) notRecent = pool.filter((code) => code !== last);
    if (!notRecent.length) notRecent = pool;

    const due = notRecent.filter((code) => { const nr = statOf(code).nextReview; return nr == null || nr <= now; });
    if (due.length) return weightedPick(due);
    const unmastered = notRecent.filter((code) => (statOf(code).streak || 0) <= MASTERY_STREAK);
    if (unmastered.length) return weightedPick(unmastered);
    return weightedPick(notRecent);
}

// Pick `n` distractor state names for a map-mode multiple-choice fallback.
// Prefers same-region distractors first (a harder, plausible set).
export function usStateNameDistractors(correctCode, availableCodes, n = 3) {
    const correct = getUsStateById(correctCode);
    if (!correct) return [];
    const byCode = new Map(state.catalog.map((c) => [c.code, c]));
    const candidates = (availableCodes || [])
        .filter((code) => code !== correctCode)
        .map((code) => byCode.get(code))
        .filter(Boolean);

    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    const sameRegion = candidates.filter((c) => c.region === correct.region);
    const otherRegion = candidates.filter((c) => c.region !== correct.region);
    const ordered = [...shuffle(sameRegion), ...shuffle(otherRegion)];
    return ordered.slice(0, n).map((c) => c.name);
}

// Pick `n` distractor capitals for a capitals-mode question.
export function usCapitalDistractors(correctCode, availableCodes, n = 3) {
    const correct = getUsStateById(correctCode);
    if (!correct) return [];
    const byCode = new Map(state.catalog.map((c) => [c.code, c]));
    const candidates = (availableCodes || [])
        .filter((code) => code !== correctCode)
        .map((code) => byCode.get(code))
        .filter(Boolean);

    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    const sameRegion = candidates.filter((c) => c.region === correct.region);
    const otherRegion = candidates.filter((c) => c.region !== correct.region);
    const ordered = [...shuffle(sameRegion), ...shuffle(otherRegion)];

    const out = [];
    const used = new Set([correct.capital]);
    for (const c of ordered) {
        if (out.length >= n) break;
        if (used.has(c.capital)) continue;
        used.add(c.capital);
        out.push(c.capital);
    }
    return out;
}

export function useUsStates() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
