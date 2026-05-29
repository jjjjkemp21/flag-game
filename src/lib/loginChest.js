import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { setBucksLocal, getBucks } from './currency';

// Daily login chest store. Hits GET /api/login-chest on sign-in / app mount;
// the server rolls today's chest on first request of a new UTC day. Claim
// credits Bucks directly on the spendable balance (does not touch
// bucks_earned_lifetime — login chests are gifts, not gameplay income).

const EMPTY = {
    loaded: false,
    pending: null,   // { day, streak, bucks, claimed }
    streak: 0,
    cycleDay: null,
    payouts: [10, 15, 20, 30, 40, 60, 150],
};

let state = { ...EMPTY };
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
function setState(patch) { state = { ...state, ...patch }; notify(); }

export async function loadLoginChest() {
    try {
        const summary = await api.get('/login-chest');
        setState({
            loaded: true,
            pending: summary && summary.pending ? summary.pending : null,
            streak: Math.max(0, Number(summary && summary.streak) || 0),
            cycleDay: summary ? summary.cycleDay : null,
            payouts: Array.isArray(summary && summary.payouts) ? summary.payouts : EMPTY.payouts,
        });
        return summary;
    } catch (_) {
        setState({ loaded: true });
        return null;
    }
}

export async function claimLoginChest() {
    const out = await api.post('/login-chest/claim', {});
    setBucksLocal((getBucks() || 0) + Math.max(0, Math.round(Number(out.claimed) || 0)));
    // Use server's authoritative balance if it disagrees with our optimistic add.
    if (Number.isFinite(Number(out.bucks))) setBucksLocal(Math.round(Number(out.bucks)));
    setState({ pending: null });
    return out;
}

export function resetLoginChest() { state = { ...EMPTY }; notify(); }

export function useLoginChest() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state,
    );
}
