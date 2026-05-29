import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { FREE_STARTER_ITEMS } from './cosmetics';

// Atlas Bucks (currency) + cosmetic ownership store.
//
// Economy v2 (2026-05-28): Bucks are no longer claimed from XP — they land
// directly during play (per correct answer, end-of-run chest, new high score).
// `bucksEarnedLifetime` is the monotonic lifetime gameplay-earned total; the
// client pushes it absolute via PUT /api/stats and the server credits the
// delta to the spendable `bucks` balance. Admin grants and purchases on the
// same balance are preserved because the server only adds the delta.
//
// `migrationGrant` is the one-shot amount the server credited to legacy
// claimants at v2 cutover. While non-zero, the patch-notes modal still owes
// an appearance — dismissMigration() clears it server-side.

// Defaults are free + always equippable, so we treat them as implicitly owned
// without needing them to show up in the server's owned_cosmetics_json.
const DEFAULT_OWNED = {
    color: 'teal',
    hat: 'none',
    glasses: 'none',
    mouth: 'none',
    effect: 'none',
    scene: 'default',
    emote: 'none',
};

let state = {
    bucks: 0,
    bucksEarnedLifetime: 0,
    migrationGrant: 0,
    owned: new Set(),
    loaded: false,
};

const listeners = new Set();
function notify() { listeners.forEach((l) => l()); }

function setState(patch) {
    state = { ...state, ...patch };
    notify();
}

function applySummary(s) {
    setState({
        bucks: Math.max(0, Math.round(Number(s.bucks) || 0)),
        bucksEarnedLifetime: Math.max(0, Math.round(Number(s.bucksEarnedLifetime) || 0)),
        migrationGrant: Math.max(0, Math.round(Number(s.migrationGrant) || 0)),
        owned: new Set(Array.isArray(s.ownedCosmetics) ? s.ownedCosmetics : []),
        loaded: true,
    });
}

export async function loadCurrency() {
    try {
        const summary = await api.get('/currency');
        applySummary(summary);
        return summary;
    } catch (_) {
        setState({ loaded: true });
        return null;
    }
}

// Hydrate from a user payload (publicUser) — saves a round-trip on login.
export function hydrateFromUser(user) {
    if (!user) return;
    setState({
        bucks: Math.max(0, Math.round(Number(user.bucks) || 0)),
        bucksEarnedLifetime: Math.max(0, Math.round(Number(user.bucksEarnedLifetime) || 0)),
        migrationGrant: Math.max(0, Math.round(Number(user.migrationGrant) || 0)),
        owned: new Set(Array.isArray(user.ownedCosmetics) ? user.ownedCosmetics : []),
        loaded: true,
    });
}

export function resetCurrency() {
    state = {
        bucks: 0,
        bucksEarnedLifetime: 0,
        migrationGrant: 0,
        owned: new Set(),
        loaded: false,
    };
    notify();
}

// Increment the local lifetime gameplay-earned counter and mirror to the
// spendable balance so the topbar chip ticks up immediately. The persist path
// (via progress.pushBonus) pushes the absolute lifetime number; the server
// adds the matching delta to the canonical `bucks` balance, which the next
// summary read confirms.
export function addEarnedBucks(amount) {
    const a = Math.max(0, Math.round(Number(amount) || 0));
    if (a === 0) return state.bucks;
    setState({
        bucks: state.bucks + a,
        bucksEarnedLifetime: state.bucksEarnedLifetime + a,
    });
    return state.bucks;
}

export function getBucksEarnedLifetime() {
    return state.bucksEarnedLifetime;
}

// One-shot patch-notes dismiss for economy v2. Clears server-side so the
// modal won't appear on the next sign-in.
export async function dismissMigration() {
    try {
        const out = await api.post('/currency/dismiss-migration', {});
        applySummary(out);
    } catch (_) {
        // Even on transient failure, clear locally so the user isn't pestered
        // again this session — server retry on next /currency load.
        setState({ migrationGrant: 0 });
    }
}

export async function buyCosmetic(category, id) {
    const result = await api.post('/currency/buy', { category, id });
    applySummary(result);
    return result;
}

// Default catalog items (color:teal, hat:none, glasses:none, effect:none) are
// always owned without needing to be tracked server-side. Free starters
// (emote:wave) work the same way — owned implicitly.
export function isOwnedKey(category, id) {
    if (!category || !id) return false;
    if (DEFAULT_OWNED[category] === id) return true;
    if (FREE_STARTER_ITEMS[category] && FREE_STARTER_ITEMS[category].has(id)) return true;
    return state.owned.has(`${category}:${id}`);
}

export function getOwnedSet() {
    return state.owned;
}

export function getBucks() {
    return state.bucks;
}

// Bump the local bucks balance directly. Used after multiplayer payouts, which
// credit the server-side balance as part of finish() — we mirror it here so
// the topbar chip + shop reflect the new total without an extra round-trip.
export function setBucksLocal(amount) {
    const v = Math.max(0, Math.round(Number(amount) || 0));
    if (v === state.bucks) return;
    setState({ bucks: v });
}

export function useCurrency() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}

// Subscribe without re-rendering (for non-React callers that just need a peek).
export function getCurrencyState() { return state; }
