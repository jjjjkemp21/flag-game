import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client';

// API wrappers for the spectator flow. The GET endpoint takes a `since` query
// parameter so each poll returns only new reactions since the previous one,
// keeping the payload small even when the buffer is full.
export const spectate = {
    start: (userId) => api.post(`/spectate/${userId}/start`),
    stop:  (userId) => api.post(`/spectate/${userId}/stop`),
    poll:  (userId, since = 0) => api.get(`/spectate/${userId}?since=${encodeURIComponent(since)}`),
    react: (userId, body) => api.post(`/spectate/${userId}/react`, body),
    // Target-only: boot a specific spectator out of your match.
    kick:  (userId, spectatorId) => api.post(`/spectate/${userId}/kick/${spectatorId}`),
};

const POLL_MS = 1500;

// Spectator-side poll hook. Returns the latest state, errors, and a `refresh`
// for manual pulls. `since` is tracked internally so the caller doesn't have
// to thread it through.
export function useSpectatePoll(targetUserId, active) {
    const [state, setState] = useState(null);
    const [error, setError] = useState(null);
    const sinceRef = useRef(0);
    const timerRef = useRef(null);

    const refresh = useCallback(async () => {
        if (!targetUserId) return null;
        try {
            const s = await spectate.poll(targetUserId, sinceRef.current);
            if (s && typeof s.nextSince === 'number') sinceRef.current = s.nextSince;
            setState(s);
            setError(null);
            return s;
        } catch (err) {
            const msg = err && err.data && err.data.error ? err.data.error : (err.message || 'Lost connection.');
            setError(msg);
            return null;
        }
    }, [targetUserId]);

    useEffect(() => {
        if (!active || !targetUserId) return undefined;
        sinceRef.current = 0;
        let cancelled = false;
        const tick = async () => {
            await refresh();
            if (!cancelled) timerRef.current = setTimeout(tick, POLL_MS);
        };
        tick();
        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [active, targetUserId, refresh]);

    return { state, error, refresh };
}

// Target-side poll: same endpoint, the caller passes their own user id and
// gates the poll on `watchers > 0` (from the presence heartbeat). When nobody
// is watching the poll is idle so we don't burn requests on the Pi.
export function useSpectateAsTarget(myUserId, hasWatchers, startSince = 0) {
    const [state, setState] = useState(null);
    const sinceRef = useRef(startSince);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!myUserId || !hasWatchers) {
            setState(null);
            sinceRef.current = startSince;
            return undefined;
        }
        let cancelled = false;
        const tick = async () => {
            try {
                const s = await spectate.poll(myUserId, sinceRef.current);
                if (s && typeof s.nextSince === 'number') sinceRef.current = s.nextSince;
                if (!cancelled) setState(s);
            } catch (_) { /* tolerated; the next tick retries */ }
            if (!cancelled) timerRef.current = setTimeout(tick, POLL_MS);
        };
        tick();
        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // startSince is captured once when the watcher count flips on; updating
        // it mid-stream would replay older reactions, so we don't depend on it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUserId, hasWatchers]);

    return state;
}
