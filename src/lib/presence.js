import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

// Activity heartbeat. Each quiz / multiplayer screen calls `usePresence(mode, opts)`
// while it's mounted; the hook fires an immediate heartbeat, then ticks every
// HEARTBEAT_MS until unmount. On unmount it fires one final heartbeat with
// `mode: null` to clear the server-side entry promptly (so friends' Eye icons
// don't linger for the 8s TTL after the player navigates away).
//
// The server's response carries `watchers` + `lastReactionId`, which we expose
// so the quiz screen knows when to mount its SpectatorsBadge and where to
// resume its own /api/spectate/:me?since=... poll from.
//
// Adaptive cadence: when nobody is watching we beat lazily (IDLE_HEARTBEAT_MS)
// so the Pi isn't drowned in presence posts. The moment a friend starts
// watching (watchers > 0) we switch to a near-real-time cadence
// (WATCHED_HEARTBEAT_MS) so the spectator sees the player's score / streak /
// current prompt change almost instantly instead of lagging a 5s tick. The
// fast cadence is self-limiting: each tick awaits the previous beat before
// arming the next, so a slow round-trip naturally throttles the rate.

const IDLE_HEARTBEAT_MS = 5000;
const WATCHED_HEARTBEAT_MS = 100; // 0.1s while spectated — feels live

const presenceApi = {
    heartbeat: (body) => api.post('/presence/heartbeat', body),
    friends: () => api.get('/presence/friends'),
};

export { presenceApi };

// `gameStateRef` is an *optional* ref containing a serializable snapshot the
// heartbeat should post. Using a ref (vs. a state value) lets the quiz update
// its score/streak/qIndex on every answer without re-firing the heartbeat —
// the next 5s tick reads the latest ref value. mpCode is similar for MP.
export function usePresence(mode, { gameStateRef, mpCode } = {}) {
    const { isAuthed } = useAuth();
    const [watchers, setWatchers] = useState(0);
    const [lastReactionId, setLastReactionId] = useState(0);
    const timerRef = useRef(null);
    const modeRef = useRef(mode);
    modeRef.current = mode;
    const mpCodeRef = useRef(mpCode);
    mpCodeRef.current = mpCode;
    // Mirror the live watcher count so the self-pacing tick can pick the next
    // delay without re-arming the effect (which would reset gameState timing).
    const watchersRef = useRef(0);

    const beat = useCallback(async (override) => {
        if (!isAuthed) return;
        const m = override !== undefined ? override : modeRef.current;
        const body = { mode: m || null };
        if (m === 'multiplayer' && mpCodeRef.current) body.mpCode = mpCodeRef.current;
        if (m && gameStateRef && gameStateRef.current) body.gameState = gameStateRef.current;
        try {
            const res = await presenceApi.heartbeat(body);
            if (res && typeof res.watchers === 'number') {
                watchersRef.current = res.watchers;
                setWatchers(res.watchers);
            }
            if (res && typeof res.lastReactionId === 'number') setLastReactionId(res.lastReactionId);
        } catch (_) {
            // A missed beat is fine — the next tick retries and the server TTL
            // tolerates a dropped beat. Critically, drop back to the LAZY
            // cadence on failure: don't keep hammering at the 0.1s watched rate
            // against a server that's erroring. A later successful beat restores
            // the watcher count (and the fast cadence) from its response.
            watchersRef.current = 0;
        }
    }, [isAuthed, gameStateRef]);

    useEffect(() => {
        if (!isAuthed || !mode) return undefined;
        let cancelled = false;
        watchersRef.current = 0; // start lazy; the first beat corrects it
        const tick = async () => {
            await beat();
            // Speed up to a near-live cadence while a friend is watching;
            // fall back to the lazy cadence the instant they leave.
            const delay = watchersRef.current > 0 ? WATCHED_HEARTBEAT_MS : IDLE_HEARTBEAT_MS;
            if (!cancelled) timerRef.current = setTimeout(tick, delay);
        };
        tick();
        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
            // Fire-and-forget clear so the friend's eye-icon goes dark within
            // ~one round-trip rather than waiting out the server TTL.
            beat(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed, mode]);

    return { watchers, lastReactionId };
}

// Convenience wrapper for quiz components: pass the latest game-state snapshot
// each render and the hook keeps the heartbeat ref in sync, so the 5s tick
// always posts the freshest score/streak/qIndex/prompt without re-arming.
export function useQuizPresence(mode, gameState, mpCode) {
    const ref = useRef(gameState);
    ref.current = gameState;
    return usePresence(mode, { gameStateRef: ref, mpCode });
}

// Standalone fetch for the Friends list. Returns `{ presence: { [friendId]: { mode, mpCode, startedAt } } }`.
export async function fetchFriendsPresence() {
    try {
        return await presenceApi.friends();
    } catch (_) {
        return { presence: {} };
    }
}

// Global poll of how many friends are currently playing — powers the header's
// at-a-glance "friends online" indicator. Runs only while signed in, on a
// relaxed cadence (this is an ambient cue, not a live scoreboard) so it adds
// just one light query every few seconds. /presence/friends already returns
// only friends with a fresh, spectatable session, so the count is "playing now".
export function usePlayingFriendsCount(pollMs = 12000) {
    const { isAuthed } = useAuth();
    const [count, setCount] = useState(0);
    const timerRef = useRef(null);
    useEffect(() => {
        if (!isAuthed) { setCount(0); return undefined; }
        let cancelled = false;
        const tick = async () => {
            const res = await fetchFriendsPresence();
            if (!cancelled) {
                const p = (res && res.presence) || {};
                setCount(Object.keys(p).length);
            }
            if (!cancelled) timerRef.current = setTimeout(tick, pollMs);
        };
        tick();
        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isAuthed, pollMs]);
    return count;
}
