import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { MASTERY_STREAK } from './xp';

// Pride store — per-identity-flag mastery for the Pride bonus mode. Mirrors
// usStates.js: one catalog (27 LGBTQ+ identity flags) with no toggle, per-item
// spaced-repetition stats keyed by slug, account-tied persistence via
// /api/pride. Lives under Bonus Modes UI-wise but operates like a flags-style
// mastery quiz.

const PRIDE_URL = './data/pride_flags.json';

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

// stats: { [slug]: { correct, incorrect, streak, nextReview, lastAnswered } }
let state = {
    stats: {},
    catalog: [],      // [{ slug, name, group, description }]
    catalogLoaded: false,
    loaded: false,
};
let authed = false;
let catalogPromise = null;
let pushTimer = null;

const listeners = new Set();
function notify() { listeners.forEach((l) => l()); }
function setState(patch) { state = { ...state, ...patch }; notify(); }

export function setPrideAuthed(value) { authed = !!value; }

// ---- Catalog ---------------------------------------------------------------
export function ensurePrideCatalog() {
    if (state.catalogLoaded) return Promise.resolve(state.catalog);
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetch(PRIDE_URL)
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((rows) => {
            const list = (rows || []).map((r) => ({
                slug: String(r.slug || '').trim(),
                name: r.name,
                group: r.group || 'other',
                description: r.description || '',
            })).filter((r) => r.slug && r.name);
            setState({ catalog: list, catalogLoaded: true });
            return list;
        })
        .catch(() => {
            setState({ catalogLoaded: true });
            return [];
        });
    return catalogPromise;
}

export function getPrideCatalog() { return state.catalog; }
export function getPrideById(slug) { return state.catalog.find((c) => c.slug === slug) || null; }

export function availablePrideSlugs() { return state.catalog.map((c) => c.slug); }

export function prideGroups() {
    const set = new Set();
    for (const c of state.catalog) set.add(c.group);
    // Stable ordering — umbrella first (most visible), then attraction, then gender.
    const order = ['umbrella', 'attraction', 'gender'];
    return [...set].sort((a, b) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}

export function deckPrideSlugs(deck = { type: 'all' }) {
    const now = Date.now();
    if (deck && deck.type === 'group') {
        return state.catalog.filter((c) => c.group === deck.value).map((c) => c.slug);
    }
    let pool = state.catalog.map((c) => c.slug);
    if (deck && deck.type === 'review') {
        pool = pool.filter((slug) => { const nr = statOf(slug).nextReview; return nr != null && nr <= now; });
    }
    return pool;
}

export function prideDeckStats(deck = { type: 'all' }) {
    const slugs = deckPrideSlugs(deck);
    const now = Date.now();
    let mastered = 0;
    let needsReview = 0;
    for (const slug of slugs) {
        const s = statOf(slug);
        if ((s.streak || 0) > MASTERY_STREAK) mastered += 1;
        if (s.nextReview != null && s.nextReview <= now) needsReview += 1;
    }
    return { mastered, total: slugs.length, needsReview };
}

// ---- Load / reset ----------------------------------------------------------
function sanitizeStats(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [slug, s] of Object.entries(raw)) {
        if (!s || typeof s !== 'object') continue;
        out[slug] = {
            correct: Math.max(0, Math.round(Number(s.correct) || 0)),
            incorrect: Math.max(0, Math.round(Number(s.incorrect) || 0)),
            streak: Math.max(0, Math.round(Number(s.streak) || 0)),
            nextReview: s.nextReview != null ? Number(s.nextReview) : null,
            lastAnswered: s.lastAnswered != null ? Number(s.lastAnswered) : null,
        };
    }
    return out;
}

export function loadPride(stats) {
    setState({ stats: sanitizeStats(stats), loaded: true });
}

export function resetPride() {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    setState({ stats: {}, loaded: false });
}

// ---- Persistence -----------------------------------------------------------
function pushPride(delay = 1200) {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/pride', { stats: state.stats }).catch(() => { /* offline / transient */ });
    }, delay);
}

export function flushPride() {
    if (!authed) return Promise.resolve(null);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    return api.put('/pride', { stats: state.stats }).catch(() => null);
}

// ---- Stats helpers ---------------------------------------------------------
function statOf(slug) {
    return state.stats[slug] || { correct: 0, incorrect: 0, streak: 0, nextReview: null, lastAnswered: null };
}

export function getPrideStat(slug) { return statOf(slug); }

export function recordPrideAnswer(slug, wasCorrect) {
    const prev = statOf(slug);
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
    setState({ stats: { ...state.stats, [slug]: next } });
    pushPride();
    return { before, after: next.streak };
}

export function getPrideMasteredCount() {
    let n = 0;
    for (const s of Object.values(state.stats)) if ((s.streak || 0) > MASTERY_STREAK) n += 1;
    return n;
}
export function getPrideTotal() { return state.catalog.length; }

// ---- Question selection ----------------------------------------------------
function weightOf(slug) {
    const s = statOf(slug);
    const mastered = (s.streak || 0) > MASTERY_STREAK;
    return (mastered ? 1 : 6) / ((s.streak || 0) + 1);
}

function weightedPick(slugs) {
    if (!slugs.length) return null;
    const total = slugs.reduce((sum, slug) => sum + weightOf(slug), 0);
    let r = Math.random() * total;
    for (const slug of slugs) {
        r -= weightOf(slug);
        if (r <= 0) return slug;
    }
    return slugs[slugs.length - 1];
}

export function selectNextPride(availableSlugs, recentSlugs = []) {
    const pool = (availableSlugs || []).filter(Boolean);
    if (!pool.length) return null;
    const recent = new Set(recentSlugs);
    const last = recentSlugs.length ? recentSlugs[recentSlugs.length - 1] : null;
    const now = Date.now();

    let notRecent = pool.filter((slug) => !recent.has(slug));
    if (!notRecent.length) notRecent = pool.filter((slug) => slug !== last);
    if (!notRecent.length) notRecent = pool;

    const due = notRecent.filter((slug) => { const nr = statOf(slug).nextReview; return nr == null || nr <= now; });
    if (due.length) return weightedPick(due);
    const unmastered = notRecent.filter((slug) => (statOf(slug).streak || 0) <= MASTERY_STREAK);
    if (unmastered.length) return weightedPick(unmastered);
    return weightedPick(notRecent);
}

// Pick `n` distractor flag names for a multiple-choice question. Prefers
// same-group entries (a harder, more plausible set — an asexuality question
// gets sexuality distractors before falling back to gender-identity ones).
export function prideNameDistractors(correctSlug, availableSlugs, n = 3) {
    const correct = getPrideById(correctSlug);
    if (!correct) return [];
    const bySlug = new Map(state.catalog.map((c) => [c.slug, c]));
    const candidates = (availableSlugs || [])
        .filter((slug) => slug !== correctSlug)
        .map((slug) => bySlug.get(slug))
        .filter(Boolean);

    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    const sameGroup = candidates.filter((c) => c.group === correct.group);
    const otherGroup = candidates.filter((c) => c.group !== correct.group);
    const ordered = [...shuffle(sameGroup), ...shuffle(otherGroup)];

    const out = [];
    const used = new Set([correct.name]);
    for (const c of ordered) {
        if (out.length >= n) break;
        if (used.has(c.name)) continue;
        used.add(c.name);
        out.push(c.name);
    }
    return out;
}

export function usePride() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
