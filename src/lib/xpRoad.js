import { useSyncExternalStore } from 'react';
import { api } from '../api/client';

// XP Road client store. Holds the player's claimed milestone ids, unlocked
// titles, and the friend roster used to paint mini-climbers on the vine.
// Loaded by App.js on sign-in (alongside the other account-tied stores) and
// refreshed by XpRoadScreen on mount. Server is the source of truth for the
// claimed set — every /api/stats PUT auto-grants newly-crossed milestones, so
// a refresh after the next push returns the latest state.

const EMPTY = {
    loaded: false,
    claimed: [],    // milestone ids the server has paid out
    titles: [],     // titles unlocked via the road
    friends: [],    // [{ id, username, xp, cosmetics, selectedTitle }]
};

let state = { ...EMPTY };
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
function setState(patch) { state = { ...state, ...patch }; notify(); }

export async function loadXpRoad() {
    try {
        const summary = await api.get('/xproad');
        setState({
            loaded: true,
            claimed: Array.isArray(summary && summary.claimed) ? summary.claimed : [],
            titles: Array.isArray(summary && summary.titles) ? summary.titles : [],
            friends: Array.isArray(summary && summary.friends) ? summary.friends : [],
        });
        return summary;
    } catch (_) {
        setState({ loaded: true });
        return null;
    }
}

// Called by syncStats after a successful /stats PUT that returned a
// non-empty `grantedXpRoad`. Folds the new ids into the claimed set so the
// XP Road screen + hero card see the change without re-fetching. Idempotent.
export function applyGrantedFromStats(grantedIds) {
    if (!Array.isArray(grantedIds) || grantedIds.length === 0) return;
    const set = new Set(state.claimed);
    let changed = false;
    for (const id of grantedIds) {
        if (!set.has(id)) { set.add(id); changed = true; }
    }
    if (changed) setState({ claimed: [...set] });
}

export function resetXpRoad() {
    state = { ...EMPTY };
    notify();
}

export function useXpRoad() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state,
    );
}

// Synchronous getter for non-React code (e.g. the hero card consumed pre-mount).
export function getXpRoad() {
    return state;
}
