import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { MASTERY_STREAK } from './xp';

// Bodies-of-Water store — the per-body mastery track for the Globe-rendered
// multiple-choice water quiz. Entirely separate from flag/geo mastery: each
// water body (ocean / sea / gulf / strait / lake / river) carries its own
// spaced-repetition stats keyed by the body's id (see public/data/waters.json).
//
// Account-tied like the other stores: nothing is in localStorage. On sign-in
// App loads the saved stats; on logout/guest it resets. Stats persist to
// /api/waters (debounced). The lightweight catalog (id/name/type, no geometry)
// is fetched once from public/data/waters-catalog.json so the home-screen
// mastery badge + achievements can count masteries without the 3D globe.

// Spaced-repetition ladder (ms) indexed by streak — mirrors the spirit of the
// flag ladder but kept local + compact (water has no leech/soft-miss nuance).
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

// stats: { [id]: { correct, incorrect, streak, nextReview, lastAnswered } }
let state = {
    stats: {},
    catalog: [],      // [{ id, name, type }]
    catalogLoaded: false,
    loaded: false,
};
let authed = false;
let catalogPromise = null;
let pushTimer = null;

const listeners = new Set();
function notify() { listeners.forEach((l) => l()); }
function setState(patch) { state = { ...state, ...patch }; notify(); }

export function setWatersAuthed(value) { authed = !!value; }

// ---- Catalog (id/name/type) ------------------------------------------------
export function ensureWaterCatalog() {
    if (state.catalogLoaded) return Promise.resolve(state.catalog);
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetch('./data/waters-catalog.json')
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((cat) => {
            const list = Array.isArray(cat) ? cat : [];
            setState({ catalog: list, catalogLoaded: true });
            return list;
        })
        .catch(() => {
            setState({ catalogLoaded: true });
            return [];
        });
    return catalogPromise;
}

export function getWaterCatalog() { return state.catalog; }
export function getWaterById(id) { return state.catalog.find((w) => w.id === id) || null; }
export function getWaterName(id) { const w = getWaterById(id); return w ? w.name : id; }

// ---- Load / reset ----------------------------------------------------------
function sanitizeStats(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [id, s] of Object.entries(raw)) {
        if (!s || typeof s !== 'object') continue;
        out[id] = {
            correct: Math.max(0, Math.round(Number(s.correct) || 0)),
            incorrect: Math.max(0, Math.round(Number(s.incorrect) || 0)),
            streak: Math.max(0, Math.round(Number(s.streak) || 0)),
            nextReview: s.nextReview != null ? Number(s.nextReview) : null,
            lastAnswered: s.lastAnswered != null ? Number(s.lastAnswered) : null,
        };
    }
    return out;
}

export function loadWaters(stats) {
    setState({ stats: sanitizeStats(stats), loaded: true });
}

export function resetWaters() {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    setState({ stats: {}, loaded: false });
}

// ---- Persistence -----------------------------------------------------------
function pushWaters(delay = 1200) {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/waters', { stats: state.stats }).catch(() => {
            /* offline / transient — guest progress is intentionally ephemeral */
        });
    }, delay);
}

export function flushWaters() {
    if (!authed) return Promise.resolve(null);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    return api.put('/waters', { stats: state.stats }).catch(() => null);
}

// ---- Stats helpers ---------------------------------------------------------
function statOf(id) {
    return state.stats[id] || { correct: 0, incorrect: 0, streak: 0, nextReview: null, lastAnswered: null };
}

export function getWaterStreak(id) { return statOf(id).streak; }

// Record an answer for a water body. Returns the new streak so the caller can
// detect a fresh mastery crossing. Mirrors the flag ladder: a correct answer
// advances the streak + pushes review out; a wrong answer decays it by one.
export function recordWaterAnswer(id, wasCorrect) {
    const prev = statOf(id);
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
    setState({ stats: { ...state.stats, [id]: next } });
    pushWaters();
    return { before, after: next.streak };
}

// ---- Mastery counts (for home badge + achievements) ------------------------
// `total` is the catalog size (every body is askable once the globe loads).
export function getWaterMasteredCount() {
    let n = 0;
    for (const s of Object.values(state.stats)) if ((s.streak || 0) > MASTERY_STREAK) n += 1;
    return n;
}
export function getWaterTotal() { return state.catalog.length; }
export function getWaterCorrectTotal() {
    let n = 0;
    for (const s of Object.values(state.stats)) n += s.correct || 0;
    return n;
}

// ---- Question selection ----------------------------------------------------
// availableIds: ids the globe can actually render (intersected with the
// catalog). recentIds: the last few asked, to avoid immediate repeats.
function weightOf(id) {
    const s = statOf(id);
    const mastered = (s.streak || 0) > MASTERY_STREAK;
    // Un-mastered bodies surface far more often; within a tier, lower streaks
    // weigh heavier so the player is pushed toward the bodies they don't know.
    return (mastered ? 1 : 6) / ((s.streak || 0) + 1);
}

function weightedPick(ids) {
    if (!ids.length) return null;
    const total = ids.reduce((sum, id) => sum + weightOf(id), 0);
    let r = Math.random() * total;
    for (const id of ids) {
        r -= weightOf(id);
        if (r <= 0) return id;
    }
    return ids[ids.length - 1];
}

export function selectNextWater(availableIds, recentIds = []) {
    const pool = (availableIds || []).filter(Boolean);
    if (!pool.length) return null;
    const recent = new Set(recentIds);
    const last = recentIds.length ? recentIds[recentIds.length - 1] : null;
    const now = Date.now();

    let notRecent = pool.filter((id) => !recent.has(id));
    if (!notRecent.length) notRecent = pool.filter((id) => id !== last);
    if (!notRecent.length) notRecent = pool;

    const due = notRecent.filter((id) => { const nr = statOf(id).nextReview; return nr == null || nr <= now; });
    if (due.length) return weightedPick(due);
    const unmastered = notRecent.filter((id) => (statOf(id).streak || 0) <= MASTERY_STREAK);
    if (unmastered.length) return weightedPick(unmastered);
    return weightedPick(notRecent);
}

// Pick `n` distractor names for a multiple-choice question. Prefers bodies of
// the SAME type (sea vs sea) so the options are plausible, topping up with any
// other body if a type pool runs short. Returns display names.
export function waterDistractorNames(correctId, availableIds, n = 3) {
    const correct = getWaterById(correctId);
    const pool = (availableIds || []).filter((id) => id !== correctId);
    const byId = new Map(state.catalog.map((w) => [w.id, w]));
    const candidates = pool.map((id) => byId.get(id)).filter(Boolean);

    const sameType = candidates.filter((w) => correct && w.type === correct.type);
    const otherType = candidates.filter((w) => !correct || w.type !== correct.type);
    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    const ordered = [...shuffle(sameType), ...shuffle(otherType)];
    const names = [];
    const seen = new Set(correct ? [correct.name] : []);
    for (const w of ordered) {
        if (names.length >= n) break;
        if (seen.has(w.name)) continue;
        seen.add(w.name);
        names.push(w.name);
    }
    return names;
}

export function useWaters() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
