import { useSyncExternalStore } from 'react';
import { api } from '../api/client';

// Atlas Bucks (currency) + cosmetic ownership store.
//
// Bucks are the spendable currency. Players trade in earned XP for Bucks at
// CURRENCY_RATE (1 XP → 1 Buck). XP itself never decreases — `bucks_minted_xp`
// on the server tracks how much XP has already been claimed so the same XP
// can't be traded twice. Bought cosmetics live in `owned` as "category:id"
// strings; defaults (color:teal, none:none, etc.) are always considered owned.

export const CURRENCY_RATE = 1; // XP earned per Atlas Buck

// Defaults are free + always equippable, so we treat them as implicitly owned
// without needing them to show up in the server's owned_cosmetics_json.
const DEFAULT_OWNED = {
    color: 'teal',
    hat: 'none',
    glasses: 'none',
    effect: 'none',
};

let state = {
    bucks: 0,
    claimableBucks: 0,
    mintedXp: 0,
    earnedXp: 0,
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
        claimableBucks: Math.max(0, Math.round(Number(s.claimableBucks) || 0)),
        mintedXp: Math.max(0, Math.round(Number(s.mintedXp) || 0)),
        earnedXp: Math.max(0, Math.round(Number(s.earnedXp) || 0)),
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
        owned: new Set(Array.isArray(user.ownedCosmetics) ? user.ownedCosmetics : []),
        loaded: true,
    });
}

export function resetCurrency() {
    state = {
        bucks: 0,
        claimableBucks: 0,
        mintedXp: 0,
        earnedXp: 0,
        owned: new Set(),
        loaded: false,
    };
    notify();
}

// Trade in XP for Atlas Bucks. Pass a positive integer to convert only that
// many bucks' worth of XP; omit to claim everything available.
export async function claimBucks(amount) {
    const body = amount != null ? { amount } : {};
    const result = await api.post('/currency/claim', body);
    applySummary(result);
    return result;
}

export async function buyCosmetic(category, id) {
    const result = await api.post('/currency/buy', { category, id });
    applySummary(result);
    return result;
}

// Default catalog items (color:teal, hat:none, glasses:none, effect:none) are
// always owned without needing to be tracked server-side.
export function isOwnedKey(category, id) {
    if (!category || !id) return false;
    if (DEFAULT_OWNED[category] === id) return true;
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
