import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client';
import { checkAnswer } from '../answer_check';

// ---- API wrappers ----------------------------------------------------------
export const mp = {
    create: (config) => api.post('/mp/lobby', { config }),
    join: (code) => api.post(`/mp/lobby/${code}/join`),
    leave: (code) => api.post(`/mp/lobby/${code}/leave`),
    setConfig: (code, config) => api.put(`/mp/lobby/${code}/config`, { config }),
    start: (code) => api.post(`/mp/lobby/${code}/start`),
    reset: (code) => api.post(`/mp/lobby/${code}/reset`),
    progress: (code, body) => api.post(`/mp/lobby/${code}/progress`, body),
    get: (code) => api.get(`/mp/lobby/${code}`),
};

// ---- Config metadata (shared by the lobby UI) ------------------------------
export const MP_MODES = [
    { key: 'race',   title: 'Race',         icon: 'flag',  desc: 'First to N correct wins', maxPlayers: 8 },
    { key: 'blitz',  title: '1v1 Blitz',    icon: 'timer', desc: 'Most correct before time runs out', maxPlayers: 2 },
    { key: 'streak', title: 'Streak Duel',  icon: 'local_fire_department', desc: 'Highest answer streak before time runs out', maxPlayers: 8 },
    { key: 'battle', title: 'Atlas Battle', icon: 'sports_mma', desc: 'Each correct hits your rival\'s Atlas — KO to win', maxPlayers: 2 },
];

// Modes that end when a player hits the target score (vs. timed modes).
export const TARGET_MODES = ['race', 'battle'];

export const DEFAULT_MP_CONFIG = {
    mode: 'race',
    content: 'flags',     // 'flags' | 'languages'
    questionType: 'mc',   // 'mc' | 'text'
    strict: false,        // free-text: require exact spelling
    scope: 'all',         // 'all' | region key (flags only)
    target: 50,           // race: correct answers to win
    duration: 60,         // blitz / streak: seconds
    maxPlayers: 8,
    // Atlas Bucks wager — each player antes this many bucks at start,
    // winner takes the whole pot. 0 disables wagering.
    ante: 0,
};

// Wager bounds. Server clamps at the same upper cap (see normalizeConfig in
// server/routes/multiplayer.js); keep them in lock-step so the client can
// surface the limit in the UI without a server round-trip.
export const ANTE_MAX = 10000;

export function modeMeta(key) {
    return MP_MODES.find((m) => m.key === key) || MP_MODES[0];
}

// ---- Deterministic question stream -----------------------------------------
// All players share a seed so they draw the same questions in the same order,
// making the race fair. Each "round" is a fresh seeded shuffle of the pool, so
// there are no repeats until the whole pool is exhausted.

function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffledOrder(n, seed) {
    const rng = mulberry32(seed);
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

function flagPool(flagsData, scope) {
    const list = (flagsData || []).filter((f) => f && f.code && f.file);
    const scoped = scope && scope !== 'all'
        ? list.filter((f) => (f.tags || []).includes(`region:${scope}`))
        : list;
    return [...(scoped.length ? scoped : list)].sort((a, b) => a.code.localeCompare(b.code));
}

// Build a question engine for a match. `get(i)` is pure given the seed.
// For `content: 'globe'` the caller can pass `globeIso2` (a Set of ISO-A2 codes
// supported by the loaded 3D globe) so we only ask about countries the globe
// can actually render. Until that's known the engine still builds — get(i) just
// skips ineligible items.
export function makeEngine({ config, seed, flagsData, languagesData, phrasesData, globeIso2 }) {
    const FLAG_BASE = './assets/flags/';
    const isLang = config.content === 'languages';
    const isGlobe = config.content === 'globe';
    let pool;
    if (isLang) pool = languagesData || [];
    else if (isGlobe) pool = globePool(flagsData, config.scope, globeIso2);
    else pool = flagPool(flagsData, config.scope);
    const n = pool.length;
    const orders = new Map();
    const orderFor = (round) => {
        if (!orders.has(round)) orders.set(round, shuffledOrder(n, (seed ^ (round * 0x9E3779B1)) >>> 0));
        return orders.get(round);
    };

    const get = (i) => {
        if (n === 0) return null;
        const round = Math.floor(i / n);
        const within = i % n;
        const item = pool[orderFor(round)[within]];
        const qRng = mulberry32((seed + i * 0x85EBCA6B) >>> 0);

        if (isLang) {
            const phrases = (phrasesData && phrasesData[item.name]) || [];
            const phrase = phrases.length ? phrases[Math.floor(qRng() * phrases.length)] : item.name;
            const answer = item.name;
            let options = null;
            if (config.questionType === 'mc') {
                const distractors = (item.distractors || []).slice(0, 3);
                options = shuffleArr([answer, ...distractors], qRng);
            }
            return { kind: 'language', phrase, answer, options };
        }

        if (isGlobe) {
            // Globe questions: render the flag as the prompt; the answer is an
            // ISO-A2 code matched by clicking the country on the 3D globe.
            return {
                kind: 'globe',
                image: `${FLAG_BASE}${item.file}`,
                answer: item.name || item.country,
                answerIso2: (item.code || '').toUpperCase(),
            };
        }

        const answer = item.name || item.country;
        let options = null;
        if (config.questionType === 'mc') {
            const others = [];
            const seen = new Set([answer]);
            let guard = 0;
            while (others.length < 3 && guard < 200) {
                guard += 1;
                const cand = pool[Math.floor(qRng() * n)];
                const name = cand.name || cand.country;
                if (!seen.has(name)) { seen.add(name); others.push(name); }
            }
            options = shuffleArr([answer, ...others], qRng);
        }
        return { kind: 'flag', image: `${FLAG_BASE}${item.file}`, answer, options, aliases: item.aliases || [] };
    };

    return { count: n, get };
}

// Globe pool: same scoping as flags, then filter to entries whose ISO-A2 code
// is one the loaded 3D globe can actually render (passed in as a Set).
function globePool(flagsData, scope, globeIso2) {
    const base = flagPool(flagsData, scope);
    if (!globeIso2 || globeIso2.size === 0) return base;
    return base.filter((f) => f && f.code && globeIso2.has(f.code.toUpperCase()));
}

// Check a globe pick: case-insensitive ISO-A2 compare.
export function checkGlobePick(iso2, question) {
    return (iso2 || '').toUpperCase() === (question?.answerIso2 || '').toUpperCase();
}

function shuffleArr(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Check a free-text answer for either content type (reuses the flag fuzzy match).
export function checkText(input, question, strict = false) {
    return checkAnswer(input, { name: question.answer, aliases: question.aliases || [] }, strict);
}

// ---- Polling hook ----------------------------------------------------------
// Polls a lobby on an interval and exposes the latest state. `active` gates it so
// we stop once we leave. Returns { state, error, refresh }.
export function useLobbyPoll(code, active, intervalMs = 1200) {
    const [state, setState] = useState(null);
    const [error, setError] = useState(null);
    const timer = useRef(null);

    const refresh = useCallback(async () => {
        if (!code) return null;
        try {
            const s = await mp.get(code);
            setState(s);
            setError(null);
            return s;
        } catch (err) {
            setError(err.message || 'Lost connection to the lobby.');
            return null;
        }
    }, [code]);

    useEffect(() => {
        if (!active || !code) return undefined;
        let cancelled = false;
        const tick = async () => {
            await refresh();
            if (!cancelled) timer.current = setTimeout(tick, intervalMs);
        };
        tick();
        return () => {
            cancelled = true;
            if (timer.current) clearTimeout(timer.current);
        };
    }, [active, code, intervalMs, refresh]);

    return { state, error, refresh, setState };
}
