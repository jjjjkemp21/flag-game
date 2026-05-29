// Localhost-only dev backend. Provides canned responses for every endpoint
// the client calls, so the app is fully clickable without the Pi running.
// State persists to localStorage so claims/equips/buys feel real across
// reloads. Never enabled in production — see api/client.js for the gate.

import {
    SEASON_ID, SEASON_NAME, CHALLENGES, TIERS_BY_NUM,
    TIER_COUNT, TOTAL_STARS, TIER_STAR_COST, PREMIUM_PRICE, tierFromStars,
} from '../lib/battlepassCatalog';

const STORE_KEY = 'flagQuestDevMock_v1';

const defaultState = () => ({
    user: {
        id: 1,
        username: 'devuser',
        is_admin: true,
        xp: 12000,
        bucks: 5000,
        ownedCosmetics: [],
        region: null,
        cosmetics: null,
        petLevel: 4,
        selectedTitle: null,
    },
    earnedXp: 12000,
    bucksMintedXp: 0,
    flagStats: null,
    bonusScores: null,
    pet: {
        name: 'Atlas',
        bornAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
        lastTick: Date.now(),
        fed: 0.7, joy: 0.7, energy: 0.7, health: 1,
        careXp: 320, level: 4, chub: 0, battleHp: 100, ko: 0,
    },
    profile: {
        region: null,
        cosmetics: null,
        achievements: { showcase: [], count: 0 },
        streaks: {},
        selectedTitle: null,
    },
    bp: {
        owned: false,
        claimed: [],
        claimedChallenges: [],
        counters: {},
    },
    announcements: [],
    feedback: [],
});

function readStore() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return defaultState();
        const merged = { ...defaultState(), ...JSON.parse(raw) };
        // Shallow merge nested objects so new fields land on existing saves.
        merged.user = { ...defaultState().user, ...(merged.user || {}) };
        merged.pet = { ...defaultState().pet, ...(merged.pet || {}) };
        merged.profile = { ...defaultState().profile, ...(merged.profile || {}) };
        merged.bp = { ...defaultState().bp, ...(merged.bp || {}) };
        return merged;
    } catch (_) {
        return defaultState();
    }
}

function writeStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (_) { /* quota / disabled */ }
}

let store = readStore();
const save = () => writeStore(store);

// ---- Helpers ---------------------------------------------------------------

function userPayload() {
    return { ...store.user, ownedCosmetics: [...store.user.ownedCosmetics] };
}

function currencySummary() {
    return {
        bucks: store.user.bucks,
        bucksEarnedLifetime: Math.max(0, Math.round(store.bucksEarnedLifetime || 0)),
        migrationGrant: 0,
        ownedCosmetics: [...store.user.ownedCosmetics],
    };
}

function challengeBucks(c) {
    // Server uses a small payout proportional to the challenge's star value.
    return Math.max(50, Math.round((c.stars || 0) * 0.5));
}

function bpSummary() {
    const counters = store.bp.counters || {};
    const claimedSet = new Set(store.bp.claimedChallenges);
    let stars = 0;
    const challenges = CHALLENGES.map((c) => {
        const cur = Math.max(0, Number(counters[c.metric]) || 0);
        const done = cur >= c.goal;
        if (done) stars += c.stars;
        return {
            id: c.id,
            cur: Math.min(cur, c.goal),
            goal: c.goal,
            done,
            stars: c.stars,
            bucks: challengeBucks(c),
            claimed: claimedSet.has(c.id),
        };
    });
    return {
        season: SEASON_ID,
        seasonName: SEASON_NAME,
        owned: !!store.bp.owned,
        claimed: [...store.bp.claimed],
        claimedChallenges: [...store.bp.claimedChallenges],
        stars,
        totalStars: TOTAL_STARS,
        tier: tierFromStars(stars),
        tierCount: TIER_COUNT,
        tierStarCost: TIER_STAR_COST,
        premiumPrice: PREMIUM_PRICE,
        challenges,
    };
}

// ---- Route table -----------------------------------------------------------

const routes = [
    // ---- Auth ----------------------------------------------------------
    { m: 'POST', p: /^\/auth\/login$/,    h: ({ body }) => {
        if (body && body.username) store.user.username = String(body.username).slice(0, 32);
        save();
        return { token: 'dev-mock-token', user: userPayload() };
    }},
    { m: 'POST', p: /^\/auth\/register$/, h: ({ body }) => {
        if (body && body.username) store.user.username = String(body.username).slice(0, 32);
        save();
        return { token: 'dev-mock-token', user: userPayload(), recoveryCodes: ['DEV-MOCK-CODE'] };
    }},
    { m: 'GET',  p: /^\/auth\/me$/,       h: () => ({ user: userPayload() }) },
    { m: 'POST', p: /^\/auth\/username$/, h: ({ body }) => {
        if (body && body.username) store.user.username = String(body.username).slice(0, 32);
        save();
        return { user: userPayload() };
    }},
    { m: 'POST', p: /^\/auth\/claim-admin$/, h: () => { store.user.is_admin = true; save(); return { user: userPayload() }; }},
    { m: 'POST', p: /^\/auth\/forgot\/lookup$/, h: () => ({ questions: [{ id: 'mock', prompt: 'Dev mock — any answer works' }] }) },
    { m: 'POST', p: /^\/auth\/forgot\/verify$/, h: () => ({ resetToken: 'dev-mock-reset' }) },
    { m: 'POST', p: /^\/auth\/reset$/,    h: () => ({ ok: true }) },

    // ---- Stats ---------------------------------------------------------
    { m: 'GET',  p: /^\/stats$/,          h: () => ({
        flagStats: store.flagStats,
        bonusScores: store.bonusScores,
        xp: store.user.xp,
        earnedXp: store.earnedXp,
    })},
    { m: 'PUT',  p: /^\/stats$/,          h: ({ body }) => {
        if (body && body.flagStats !== undefined) store.flagStats = body.flagStats;
        if (body && body.bonusScores !== undefined) store.bonusScores = body.bonusScores;
        if (body && typeof body.earnedXp === 'number') {
            store.earnedXp = Math.max(store.earnedXp, body.earnedXp);
            store.user.xp = Math.max(store.user.xp, body.earnedXp);
        }
        save();
        return { ok: true, xp: store.user.xp, earnedXp: store.earnedXp };
    }},
    { m: 'POST', p: /^\/stats\/reset$/,   h: () => {
        store.flagStats = null;
        store.bonusScores = null;
        store.bp.counters = {};
        save();
        return { ok: true };
    }},

    // ---- Pet -----------------------------------------------------------
    { m: 'GET',  p: /^\/pet$/,            h: () => ({ pet: store.pet }) },
    { m: 'PUT',  p: /^\/pet$/,            h: ({ body }) => {
        if (body && body.pet) store.pet = { ...store.pet, ...body.pet };
        save();
        return { ok: true };
    }},

    // ---- Profile -------------------------------------------------------
    { m: 'GET',  p: /^\/profile$/,        h: () => ({ ...store.profile }) },
    { m: 'PUT',  p: /^\/profile$/,        h: ({ body }) => {
        if (!body) return { ok: true };
        if (body.region !== undefined) store.profile.region = body.region;
        if (body.cosmetics !== undefined) {
            store.profile.cosmetics = body.cosmetics;
            store.user.cosmetics = body.cosmetics;
        }
        if (body.achievements !== undefined) store.profile.achievements = body.achievements;
        if (body.streaks !== undefined) store.profile.streaks = body.streaks;
        if (body.selectedTitle !== undefined) {
            store.profile.selectedTitle = body.selectedTitle;
            store.user.selectedTitle = body.selectedTitle;
        }
        save();
        return { ok: true };
    }},

    // ---- Currency -----------------------------------------------------
    { m: 'GET',  p: /^\/currency$/,       h: () => currencySummary() },
    { m: 'POST', p: /^\/currency\/claim$/, h: () => {
        // Legacy endpoint — economy v2 removed the trade-in. Mock the 410 the
        // real server returns so offline-mode surfaces the same error.
        const err = new Error('The XP trade-in is gone — Atlas Bucks now land directly as you play.');
        err.status = 410;
        throw err;
    }},
    { m: 'POST', p: /^\/currency\/dismiss-migration$/, h: () => currencySummary() },
    { m: 'POST', p: /^\/currency\/buy$/,  h: ({ body }) => {
        const key = body && body.category && body.id ? `${body.category}:${body.id}` : null;
        if (key && !store.user.ownedCosmetics.includes(key)) {
            store.user.ownedCosmetics.push(key);
        }
        save();
        return { bought: true, ...currencySummary() };
    }},
    { m: 'POST', p: /^\/currency\/admin\/grant$/, h: ({ body }) => {
        const delta = Math.trunc(Number(body && body.amount) || 0);
        const before = store.user.bucks;
        store.user.bucks = Math.max(0, before + delta);
        save();
        return {
            ok: true,
            username: (body && body.username) || store.user.username,
            granted: store.user.bucks - before,
            bucks: store.user.bucks,
        };
    }},

    // ---- Battlepass ---------------------------------------------------
    { m: 'GET',  p: /^\/battlepass$/,     h: () => bpSummary() },
    { m: 'POST', p: /^\/battlepass\/progress$/, h: ({ body }) => {
        const counters = (body && body.counters) || {};
        for (const [k, v] of Object.entries(counters)) {
            store.bp.counters[k] = Math.max(store.bp.counters[k] || 0, Number(v) || 0);
        }
        save();
        return bpSummary();
    }},
    { m: 'POST', p: /^\/battlepass\/buy$/, h: () => {
        if (!store.bp.owned) {
            if (store.user.bucks < PREMIUM_PRICE) {
                const err = new Error('Not enough Atlas Bucks for the pass');
                err.status = 402;
                throw err;
            }
            store.user.bucks -= PREMIUM_PRICE;
            store.bp.owned = true;
            save();
        }
        return { bought: true, bucks: store.user.bucks, ...bpSummary() };
    }},
    { m: 'POST', p: /^\/battlepass\/claim$/, h: ({ body }) => {
        const track = body && body.track;
        const tier = Number(body && body.tier) || 0;
        const def = TIERS_BY_NUM[tier];
        if (!def) { const e = new Error('Unknown tier'); e.status = 400; throw e; }
        const sum = bpSummary();
        if (tier > sum.tier) { const e = new Error('Tier locked'); e.status = 403; throw e; }
        if (track === 'prem' && !store.bp.owned) { const e = new Error('Premium pass required'); e.status = 402; throw e; }
        const key = `${track}:${tier}`;
        if (store.bp.claimed.includes(key)) { const e = new Error('Already claimed'); e.status = 409; throw e; }
        const reward = track === 'free' ? def.free : def.prem;
        store.bp.claimed.push(key);
        if (reward.type === 'bucks') {
            store.user.bucks += reward.amount;
        } else if (reward.type === 'cosmetic') {
            const ck = `${reward.cat}:${reward.id}`;
            if (!store.user.ownedCosmetics.includes(ck)) store.user.ownedCosmetics.push(ck);
        }
        save();
        return {
            reward,
            bucks: store.user.bucks,
            ownedCosmetics: [...store.user.ownedCosmetics],
            ...bpSummary(),
        };
    }},
    { m: 'POST', p: /^\/battlepass\/claim-challenge$/, h: ({ body }) => {
        const id = body && body.id;
        const def = CHALLENGES.find((c) => c.id === id);
        if (!def) { const e = new Error('Unknown challenge'); e.status = 400; throw e; }
        const cur = Number(store.bp.counters[def.metric]) || 0;
        if (cur < def.goal) { const e = new Error('Not complete'); e.status = 403; throw e; }
        if (store.bp.claimedChallenges.includes(id)) { const e = new Error('Already claimed'); e.status = 409; throw e; }
        const payout = challengeBucks(def);
        store.bp.claimedChallenges.push(id);
        store.user.bucks += payout;
        save();
        return { payout, bucks: store.user.bucks, ...bpSummary() };
    }},

    // ---- Announcements ------------------------------------------------
    { m: 'GET',  p: /^\/announcements$/,  h: () => ({ announcements: store.announcements, unreadCount: 0 }) },
    { m: 'POST', p: /^\/announcements$/,  h: ({ body }) => {
        const item = { id: Date.now(), title: body?.title || '', body: body?.body || '', created_at: new Date().toISOString() };
        store.announcements.unshift(item);
        save();
        return { ok: true, id: item.id };
    }},
    { m: 'POST', p: /^\/announcements\/mark-read$/, h: () => ({ ok: true }) },
    { m: 'DELETE', p: /^\/announcements\/\d+$/, h: ({ path }) => {
        const id = Number(path.split('/').pop());
        store.announcements = store.announcements.filter((a) => a.id !== id);
        save();
        return { ok: true };
    }},
    { m: 'DELETE', p: /^\/announcements$/, h: () => { store.announcements = []; save(); return { ok: true }; }},

    // ---- Feedback -----------------------------------------------------
    { m: 'GET',  p: /^\/feedback$/,       h: () => ({ feedback: store.feedback }) },
    { m: 'POST', p: /^\/feedback$/,       h: ({ body }) => {
        store.feedback.unshift({
            id: Date.now(),
            category: body?.category || 'general',
            body: body?.body || '',
            created_at: new Date().toISOString(),
            resolved: false,
            username: store.user.username,
        });
        save();
        return { ok: true };
    }},
    { m: 'POST', p: /^\/feedback\/\d+\/resolve$/, h: ({ path }) => {
        const id = Number(path.split('/')[2]);
        const f = store.feedback.find((x) => x.id === id);
        if (f) { f.resolved = true; save(); }
        return { ok: true };
    }},
    { m: 'DELETE', p: /^\/feedback\/\d+$/, h: ({ path }) => {
        const id = Number(path.split('/').pop());
        store.feedback = store.feedback.filter((f) => f.id !== id);
        save();
        return { ok: true };
    }},

    // ---- Direct messages (mock has no friends, so all sends 403) ------
    { m: 'GET',  p: /^\/messages$/,       h: () => ({ received: [], sent: [], unreadCount: 0 }) },
    { m: 'POST', p: /^\/messages$/,       h: () => { const e = new Error('You can only message accepted friends.'); e.status = 403; throw e; }},
    { m: 'POST', p: /^\/messages\/mark-read$/, h: () => ({ ok: true, updated: 0 }) },
    { m: 'DELETE', p: /^\/messages\/\d+$/, h: () => ({ ok: true }) },

    // ---- Social: friends + leaderboard --------------------------------
    { m: 'GET',  p: /^\/friends$/,        h: () => ({ friends: [], incoming: [], outgoing: [] }) },
    { m: 'POST', p: /^\/friends\/request$/, h: () => ({ ok: true }) },
    { m: 'POST', p: /^\/friends\/respond$/, h: () => ({ ok: true }) },
    { m: 'DELETE', p: /^\/friends\/\d+$/, h: () => ({ ok: true }) },
    { m: 'GET',  p: /^\/users\/search/,   h: () => ({ users: [] }) },
    { m: 'GET',  p: /^\/leaderboard/,     h: ({ path }) => {
        const scopeMatch = /[?&]scope=([^&]+)/.exec(path);
        const scope = scopeMatch ? scopeMatch[1] : 'xp';
        const me = {
            id: store.user.id, username: store.user.username, value: store.user.xp,
            cosmetics: store.user.cosmetics || null, petLevel: store.user.petLevel,
            petName: store.pet.name, masteredCount: 0, showcase: [], achievementCount: 0,
            selectedTitle: store.user.selectedTitle, rank: 1,
        };
        return { scope, entries: [me], myRank: 1, myValue: me.value };
    }},

    // ---- Multiplayer: no in-memory server, so degrade gracefully ------
    { m: 'POST', p: /^\/mp\//,            h: () => { const e = new Error('Multiplayer requires the live server'); e.status = 503; throw e; }},
    { m: 'GET',  p: /^\/mp\//,            h: () => { const e = new Error('Multiplayer requires the live server'); e.status = 503; throw e; }},
    { m: 'PUT',  p: /^\/mp\//,            h: () => { const e = new Error('Multiplayer requires the live server'); e.status = 503; throw e; }},
];

export function mockRequest(method, path, body) {
    // Strip query string for matching; handlers can re-parse if they need it.
    const pathOnly = path.split('?')[0];
    const route = routes.find((r) => r.m === method && r.p.test(pathOnly));
    if (!route) {
        const e = new Error(`Dev mock has no handler for ${method} ${path}`);
        e.status = 404;
        return Promise.reject(e);
    }
    try {
        const data = route.h({ body, path: pathOnly, method });
        return Promise.resolve(data);
    } catch (err) {
        return Promise.reject(err);
    }
}

// Console escape hatch: window.__resetDevMock() wipes the local dev state
// so you can re-test the new-user flow without DevTools spelunking.
if (typeof window !== 'undefined') {
    window.__resetDevMock = () => {
        store = defaultState();
        save();
        // eslint-disable-next-line no-console
        console.log('[dev-mock] state reset — reload to re-init.');
    };
}
