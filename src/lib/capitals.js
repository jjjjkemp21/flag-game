import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { MASTERY_STREAK } from './xp';

// Capitals store — the per-capital mastery track for the Capitals mode. Entirely
// separate from flag / geo mastery: each country carries its own spaced-
// repetition stats keyed by the country's (lowercased) flag code, so a player's
// progress at recognising capitals is tracked independently of the flag itself.
//
// Account-tied like the other stores: nothing is in localStorage. On sign-in App
// loads the saved stats; on logout/guest it resets. Stats persist to
// /api/capitals (debounced). The catalog (code/country/capital/flag/region) is
// built once by joining public/data/capitals.json against public/data/flags.json
// so the home-screen mastery badge + achievements can count masteries without
// mounting the quiz.

const FLAGS_URL = './data/flags.json';
const CAPITALS_URL = './data/capitals.json';

// Spaced-repetition ladder (ms) indexed by streak — mirrors the spirit of the
// flag ladder but kept local + compact (capitals have no leech/soft-miss nuance).
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
    catalog: [],      // [{ code, country, capital, flagFile, region }]
    catalogLoaded: false,
    loaded: false,
};
let authed = false;
let catalogPromise = null;
let pushTimer = null;

const listeners = new Set();
function notify() { listeners.forEach((l) => l()); }
function setState(patch) { state = { ...state, ...patch }; notify(); }

export function setCapitalsAuthed(value) { authed = !!value; }

// ---- Catalog (code/country/capital/flag/region) ----------------------------
// Built by joining the capital list against flags.json for the flag SVG + region
// tag. Drops entries whose capital equals the country name (Singapore, Monaco,
// Vatican City, Gibraltar) — a "capital of Singapore?" prompt gives itself away.
export function ensureCapitalsCatalog() {
    if (state.catalogLoaded) return Promise.resolve(state.catalog);
    if (catalogPromise) return catalogPromise;
    catalogPromise = Promise.all([
        fetch(FLAGS_URL).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
        fetch(CAPITALS_URL).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
    ])
        .then(([flags, caps]) => {
            const codeByCountry = new Map();
            const regionByCountry = new Map();
            for (const f of flags || []) {
                codeByCountry.set(f.country, f.code ? f.code.toLowerCase() : '');
                const tag = (f.tags || []).find((t) => t.startsWith('region:'));
                regionByCountry.set(f.country, tag ? tag.slice('region:'.length) : 'territory');
            }
            const list = (caps || [])
                .filter((c) => c.capital && c.capital !== c.country)
                .map((c) => ({
                    code: codeByCountry.get(c.country) || '',
                    country: c.country,
                    capital: c.capital,
                    flagFile: codeByCountry.get(c.country) ? `${codeByCountry.get(c.country)}.svg` : '',
                    region: regionByCountry.get(c.country) || 'territory',
                }))
                .filter((e) => e.code);
            setState({ catalog: list, catalogLoaded: true });
            return list;
        })
        .catch(() => {
            setState({ catalogLoaded: true });
            return [];
        });
    return catalogPromise;
}

export function getCapitalsCatalog() { return state.catalog; }
export function getCapitalById(code) { return state.catalog.find((c) => c.code === code) || null; }
export function getCapitalName(code) { const c = getCapitalById(code); return c ? c.country : code; }

// Codes the quiz may ask about, honouring the "include territories" toggle.
export function availableCapitalCodes(includeTerritories = false) {
    return state.catalog
        .filter((c) => includeTerritories || c.region !== 'territory')
        .map((c) => c.code);
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

export function loadCapitals(stats) {
    setState({ stats: sanitizeStats(stats), loaded: true });
}

export function resetCapitals() {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    setState({ stats: {}, loaded: false });
}

// ---- Persistence -----------------------------------------------------------
function pushCapitals(delay = 1200) {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/capitals', { stats: state.stats }).catch(() => {
            /* offline / transient — guest progress is intentionally ephemeral */
        });
    }, delay);
}

export function flushCapitals() {
    if (!authed) return Promise.resolve(null);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    return api.put('/capitals', { stats: state.stats }).catch(() => null);
}

// ---- Stats helpers ---------------------------------------------------------
function statOf(code) {
    return state.stats[code] || { correct: 0, incorrect: 0, streak: 0, nextReview: null, lastAnswered: null };
}

export function getCapitalStreak(code) { return statOf(code).streak; }
export function getCapitalStat(code) { return statOf(code); }

// Record an answer for a country's capital. Returns { before, after } streaks so
// the caller can detect a fresh mastery crossing. Mirrors the flag ladder: a
// correct answer advances the streak + pushes review out; a wrong answer decays
// it by one.
export function recordCapitalAnswer(code, wasCorrect) {
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
    pushCapitals();
    return { before, after: next.streak };
}

// ---- Mastery counts (for home badge + achievements) ------------------------
export function getCapitalMasteredCount() {
    let n = 0;
    for (const s of Object.values(state.stats)) if ((s.streak || 0) > MASTERY_STREAK) n += 1;
    return n;
}
export function getCapitalTotal() { return state.catalog.length; }
export function getCapitalCorrectTotal() {
    let n = 0;
    for (const s of Object.values(state.stats)) n += s.correct || 0;
    return n;
}

// ---- Question selection ----------------------------------------------------
// availableCodes: codes the quiz may ask about (territory toggle applied).
// recentCodes: the last few asked, to avoid immediate repeats.
function weightOf(code) {
    const s = statOf(code);
    const mastered = (s.streak || 0) > MASTERY_STREAK;
    // Un-mastered capitals surface far more often; within a tier, lower streaks
    // weigh heavier so the player is pushed toward the ones they don't know.
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

export function selectNextCapital(availableCodes, recentCodes = []) {
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

// Pick `n` distractor capital names for a multiple-choice question. Prefers
// capitals from the SAME region (a harder, more plausible set) then tops up from
// anywhere, deduping by capital string so two cities with the same name never
// collide and never repeating the country or the right answer.
export function capitalDistractors(correctCode, availableCodes, n = 3) {
    const correct = getCapitalById(correctCode);
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
    const usedCapitals = new Set([correct.capital]);
    const usedCountries = new Set([correct.country]);
    for (const c of ordered) {
        if (out.length >= n) break;
        if (usedCapitals.has(c.capital) || usedCountries.has(c.country)) continue;
        usedCapitals.add(c.capital);
        usedCountries.add(c.country);
        out.push(c.capital);
    }
    return out;
}

export function useCapitals() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
