import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { DEFAULT_COSMETICS, normalizeCosmetics, clampPos } from './cosmetics';
import { topAchievements } from './achievements';

// Account-tied profile: region flag, equipped cosmetics, and achievements
// (the up-to-3 showcased ids + the unlocked set). Loaded on sign-in, persisted
// to the server on change. Guests get session-only defaults.

const freshAchievements = () => ({ showcase: [], unlocked: [] });

let state = { region: null, cosmetics: { ...DEFAULT_COSMETICS }, achievements: freshAchievements(), streaks: {}, selectedTitle: null };
let authed = false;
let pushTimer = null;
const listeners = new Set();

function notify() {
    listeners.forEach((l) => l());
}

function persist() {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        // If the player hasn't curated a showcase, feature their best unlocked
        // achievements so something always shows on the leaderboard / profile.
        const explicit = state.achievements.showcase;
        const showcase = explicit.length > 0
            ? explicit
            : topAchievements(state.achievements.unlocked, 3);
        api.put('/profile', {
            region: state.region,
            cosmetics: state.cosmetics,
            achievements: { showcase, count: state.achievements.unlocked.length },
            streaks: state.streaks,
            selectedTitle: state.selectedTitle,
        }).catch(() => {});
    }, 1000);
}

export function setProfileAuthed(value) {
    authed = !!value;
}

export function loadProfile(serverProfile) {
    authed = true;
    const ach = (serverProfile && serverProfile.achievements) || {};
    state = {
        region: (serverProfile && serverProfile.region) || null,
        cosmetics: normalizeCosmetics(serverProfile && serverProfile.cosmetics),
        // unlocked is recomputed locally from live stats right after load.
        achievements: { showcase: Array.isArray(ach.showcase) ? ach.showcase.slice(0, 3) : [], unlocked: [] },
        streaks: (serverProfile && serverProfile.streaks && typeof serverProfile.streaks === 'object') ? serverProfile.streaks : {},
        selectedTitle: (serverProfile && serverProfile.selectedTitle) || null,
    };
    notify();
}

export function resetProfile() {
    authed = false;
    state = { region: null, cosmetics: { ...DEFAULT_COSMETICS }, achievements: freshAchievements(), streaks: {}, selectedTitle: null };
    notify();
}

// Record a per-mode best run streak. No-ops unless it beats the stored best, so
// it's cheap to call after every correct answer. Persisted to the account.
export function recordBestStreak(mode, value) {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    if (v <= (state.streaks[mode] || 0)) return;
    state = { ...state, streaks: { ...state.streaks, [mode]: v } };
    notify();
    persist();
}

export function setRegion(code) {
    state = { ...state, region: code || null };
    notify();
    persist();
}

export function setCosmetic(category, id) {
    state = { ...state, cosmetics: { ...state.cosmetics, [category]: id } };
    notify();
    persist();
}

// Move/scale a cosmetic slot ('hat' | 'glasses'). Clamped to canvas bounds.
export function setCosmeticPos(slot, pos) {
    const key = slot === 'hat' ? 'hatPos' : 'glassesPos';
    state = { ...state, cosmetics: { ...state.cosmetics, [key]: clampPos(pos) } };
    notify();
    persist();
}

// Record the locally-computed set of unlocked achievement ids. Reconciles the
// showcase to stay a subset of what's unlocked. No-ops when nothing changed so
// it can be called freely on every stats change without churn.
export function setAchievementsUnlocked(ids) {
    const unlocked = Array.isArray(ids) ? ids : [];
    const prev = state.achievements.unlocked;
    const same = unlocked.length === prev.length && unlocked.every((id) => prev.includes(id));
    const showcase = state.achievements.showcase.filter((id) => unlocked.includes(id));
    const showcaseSame = showcase.length === state.achievements.showcase.length;
    if (same && showcaseSame) return;
    state = { ...state, achievements: { showcase, unlocked } };
    notify();
    persist();
}

// Player picks a mastery-rank title to display on leaderboards / MP / topbar.
// `null` (or empty) clears the choice and falls back to the auto-derived rank
// for the current leaderboard scope.
export function setSelectedTitle(title) {
    const next = title === null || title === '' || title === undefined
        ? null
        : String(title).slice(0, 40);
    if (next === state.selectedTitle) return;
    state = { ...state, selectedTitle: next };
    notify();
    persist();
}

// User picks which unlocked achievements to feature (max 3).
export function setShowcase(ids) {
    const unlocked = state.achievements.unlocked;
    const showcase = (Array.isArray(ids) ? ids : []).filter((id) => unlocked.includes(id)).slice(0, 3);
    state = { ...state, achievements: { ...state.achievements, showcase } };
    notify();
    persist();
}

export function getCosmetics() {
    return state.cosmetics;
}

export function useProfile() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
