import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { DEFAULT_COSMETICS, normalizeCosmetics } from './cosmetics';

// Account-tied profile: region flag + equipped cosmetics. Loaded on sign-in,
// persisted to the server on change. Guests get session-only defaults.

let state = { region: null, cosmetics: { ...DEFAULT_COSMETICS } };
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
        api.put('/profile', { region: state.region, cosmetics: state.cosmetics }).catch(() => {});
    }, 1000);
}

export function setProfileAuthed(value) {
    authed = !!value;
}

export function loadProfile(serverProfile) {
    authed = true;
    state = {
        region: (serverProfile && serverProfile.region) || null,
        cosmetics: normalizeCosmetics(serverProfile && serverProfile.cosmetics),
    };
    notify();
}

export function resetProfile() {
    authed = false;
    state = { region: null, cosmetics: { ...DEFAULT_COSMETICS } };
    notify();
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

export function getCosmetics() {
    return state.cosmetics;
}

export function useProfile() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
