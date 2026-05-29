import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { setBucksLocal, getBucks } from './currency';

// Quests store — daily (3) + weekly (2) Bucks quests. Mirrors the battlepass
// store's pattern: client-side counter coalescing into pendingBumps, a
// debounced flush pushes them to the server, server returns the authoritative
// blob. Server-trusted: the client cannot directly set `cur` or `done`.

const EMPTY = {
    daily: { date: null, quests: [] },
    weekly: { weekStart: null, quests: [] },
    loaded: false,
    // Quest IDs that just transitioned to done (and aren't yet claimed) since
    // we last applied a blob. The QuestCompleteModal listens to this and pops
    // a celebration one quest at a time. Initialized empty; populated only by
    // diffs after the first applyBlob (so logging in with stale unclaimed
    // quests doesn't flood the user — the header badge handles that case).
    noticeQueue: [],
};

let state = { ...EMPTY };
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
function setState(patch) { state = { ...state, ...patch }; notify(); }

let authed = false;
const pendingBumps = {}; // metric -> sum of deltas waiting to flush
let pushTimer = null;
// Track the set of quest IDs that were already done+unclaimed at the time of
// the last applyBlob so we can diff against the next snapshot. `null` means
// "no baseline yet" → the first applyBlob initializes without queueing
// notices (avoids popping for quests completed in a previous session).
let lastSeenDone = null;

export function setAuthed(value) { authed = !!value; }

function collectQuests(blob) {
    return [
        ...((blob.daily && blob.daily.quests) || []),
        ...((blob.weekly && blob.weekly.quests) || []),
    ];
}

function applyBlob(blob) {
    if (!blob) return;
    const all = collectQuests(blob);
    const nowDone = new Set(all.filter((q) => q.done && !q.claimed).map((q) => q.id));

    let nextQueue = state.noticeQueue || [];
    if (lastSeenDone !== null) {
        const fresh = [];
        for (const id of nowDone) {
            if (!lastSeenDone.has(id) && !nextQueue.includes(id)) fresh.push(id);
        }
        if (fresh.length) nextQueue = [...nextQueue, ...fresh];
    }
    // Drop any queued IDs that are no longer done+unclaimed (claimed elsewhere,
    // rolled over at midnight, etc.) so the modal can't stall on a stale entry.
    nextQueue = nextQueue.filter((id) => nowDone.has(id));
    lastSeenDone = nowDone;

    setState({
        daily: blob.daily || EMPTY.daily,
        weekly: blob.weekly || EMPTY.weekly,
        loaded: true,
        noticeQueue: nextQueue,
    });
}

export async function loadQuests() {
    try {
        const blob = await api.get('/quests');
        applyBlob(blob);
        return blob;
    } catch (_) {
        setState({ loaded: true });
        return null;
    }
}

export function resetQuests() {
    Object.keys(pendingBumps).forEach((k) => delete pendingBumps[k]);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    lastSeenDone = null;
    state = { ...EMPTY, noticeQueue: [] };
    notify();
}

export function dismissQuestNotice(id) {
    if (!id) return;
    const next = (state.noticeQueue || []).filter((qid) => qid !== id);
    if (next.length === (state.noticeQueue || []).length) return;
    setState({ noticeQueue: next });
}

export function getQuestById(id) {
    if (!id) return null;
    const all = [...state.daily.quests, ...state.weekly.quests];
    return all.find((q) => q.id === id) || null;
}

export function bumpQuestMetric(metric, delta = 1) {
    if (!metric || typeof metric !== 'string') return;
    const n = Math.max(0, Math.round(Number(delta) || 0));
    if (n <= 0) return;
    pendingBumps[metric] = (pendingBumps[metric] || 0) + n;
    if (authed) schedulePush();
}

// High-water-mark metrics: server takes max() against the stored counter
// rather than summing. Caller passes the current value; subsequent calls in
// the same flush window also coalesce as max(), so submitting the same value
// twice is harmless.
export function reportHwm(metric, value) {
    if (!metric || typeof metric !== 'string') return;
    const v = Math.max(0, Math.round(Number(value) || 0));
    if (v <= 0) return;
    pendingBumps[metric] = Math.max(pendingBumps[metric] || 0, v);
    if (authed) schedulePush();
}

export function reportStreakHwm(value) {
    reportHwm('best_streak_today', value);
}

function schedulePush(delay = 1500) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushTimer = null; flushQuests(); }, delay);
}

export async function flushQuests() {
    if (!authed) return null;
    const counters = { ...pendingBumps };
    Object.keys(pendingBumps).forEach((k) => delete pendingBumps[k]);
    if (Object.keys(counters).length === 0) return null;
    try {
        const blob = await api.post('/quests/progress', { counters });
        applyBlob(blob);
        return blob;
    } catch (_) {
        // Re-stage so transient failures aren't lost.
        for (const [k, v] of Object.entries(counters)) {
            pendingBumps[k] = (pendingBumps[k] || 0) + v;
        }
        return null;
    }
}

export async function claimQuest(id) {
    const out = await api.post('/quests/claim', { id });
    if (Number.isFinite(Number(out.bucks))) setBucksLocal(Math.round(Number(out.bucks)));
    else if (Number.isFinite(Number(out.claimed))) setBucksLocal((getBucks() || 0) + Math.round(Number(out.claimed)));
    // Refresh the blob so the claimed flag reflects server truth.
    await loadQuests();
    return out;
}

export function claimableCount() {
    const all = [...state.daily.quests, ...state.weekly.quests];
    return all.filter((q) => q.done && !q.claimed).length;
}

// First entry of the notice queue, hydrated to the full quest record. Returns
// null when there's nothing to show. The QuestCompleteModal subscribes via
// useQuests() and reads this; dismissing or claiming removes the entry so the
// next one (if any) pops next render.
export function peekQuestNotice() {
    const id = (state.noticeQueue || [])[0];
    if (!id) return null;
    return getQuestById(id);
}

export function useQuests() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state,
    );
}
