import { useSyncExternalStore } from 'react';
import { api } from '../api/client';

// "Atlas" — a Tamagotchi-style globe pet. Three needs decay in real time and are
// refilled only by playing. Wellbeing drives mood; sustained neglect drains
// Health, and at zero Health the pet passes away (revivable by hatching a new one).
//
// State is account-tied: it persists and keeps decaying while you're away. Guests
// get a fresh, in-memory session pet that is never saved (matches the progress rule).

const PET_NAME = 'Atlas';

// Decay per real hour and per-event refill amounts (tunable).
const DECAY = { fed: 3, joy: 2.5, energy: 2 };
const REFILL = {
    correct: { fed: 14, joy: 6, energy: 4 },
    incorrect: { fed: 2, joy: 4, energy: 3 },
    play: { fed: 0, joy: 6, energy: 6 },
};
const HEALTH_DRAIN = 4; // per hour when wellbeing is very low
const HEALTH_REGEN = 6; // per hour when wellbeing is high
const LOW_WELLBEING = 20;
const HIGH_WELLBEING = 60;
const TICK_MS = 15000;

const clamp = (n) => Math.max(0, Math.min(100, n));
const now = () => Date.now();

function freshPet() {
    const t = now();
    return {
        name: PET_NAME,
        bornAt: t,
        lastTick: t,
        fed: 75,
        joy: 75,
        energy: 75,
        health: 100,
        alive: true,
        deadAt: null,
    };
}

let state = withDerived(freshPet());
let authed = false;
let pushTimer = null;
const listeners = new Set();

function deriveMood(s) {
    if (!s.alive) return 'dead';
    if (s.health < 25) return 'sick';
    if (s.energy < 20) return 'sleepy';
    if (s.fed < 20) return 'hungry';
    if (s.joy < 25) return 'sad';
    if (s.wellbeing > 80) return 'cheer';
    if (s.wellbeing > 55) return 'wave';
    return 'idle';
}

function deriveStage(s) {
    if (!s.alive) return { key: 'spirit', label: 'Resting' };
    const days = (now() - s.bornAt) / 86400000;
    if (days < 0.04) return { key: 'egg', label: 'Hatchling' };
    if (days < 1) return { key: 'sprout', label: 'Sprout' };
    if (days < 3) return { key: 'explorer', label: 'Explorer' };
    if (days < 7) return { key: 'globetrotter', label: 'Globetrotter' };
    return { key: 'legend', label: 'Legend' };
}

function withDerived(s) {
    const wellbeing = Math.round((s.fed + s.joy + s.energy) / 3);
    const next = { ...s, wellbeing };
    next.mood = deriveMood(next);
    const stage = deriveStage(next);
    next.stage = stage.key;
    next.stageLabel = stage.label;
    return next;
}

function commit(next) {
    state = withDerived(next);
    listeners.forEach((l) => l());
}

function applyDecay(s, elapsedMs) {
    const h = elapsedMs / 3600000;
    if (h <= 0) return s;
    const fed = clamp(s.fed - DECAY.fed * h);
    const joy = clamp(s.joy - DECAY.joy * h);
    const energy = clamp(s.energy - DECAY.energy * h);
    const wellbeing = (fed + joy + energy) / 3;
    let health = s.health;
    if (wellbeing < LOW_WELLBEING) health = clamp(health - HEALTH_DRAIN * h);
    else if (wellbeing > HIGH_WELLBEING) health = clamp(health + HEALTH_REGEN * h);
    let alive = s.alive;
    let deadAt = s.deadAt;
    if (alive && health <= 0) {
        alive = false;
        deadAt = now();
    }
    return { ...s, fed, joy, energy, health, alive, deadAt, lastTick: now() };
}

function persist() {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        const { name, bornAt, lastTick, fed, joy, energy, health, alive, deadAt } = state;
        api.put('/pet', { pet: { name, bornAt, lastTick, fed, joy, energy, health, alive, deadAt } })
            .catch(() => {});
    }, 1500);
}

function feed(kind, times = 1) {
    if (!state.alive) return;
    const r = REFILL[kind] || REFILL.play;
    const next = applyDecay(state, now() - state.lastTick);
    next.fed = clamp(next.fed + r.fed * times);
    next.joy = clamp(next.joy + r.joy * times);
    next.energy = clamp(next.energy + r.energy * times);
    next.health = clamp(next.health + 2); // a little love restores health
    commit(next);
    persist();
}

// ---- Public API ----

export function recordCorrect(times = 1) { feed('correct', times); }
export function recordIncorrect(times = 1) { feed('incorrect', times); }
export function recordPlay(times = 1) { feed('play', times); }

export function revivePet() {
    commit(freshPet());
    persist();
}

export function setPetAuthed(value) {
    authed = !!value;
}

// Load the account's pet (or hatch a fresh one if none), catching up on the time
// that passed while away. Anchors lastTick by saving the caught-up state.
export function loadPet(serverPet) {
    authed = true;
    if (serverPet && typeof serverPet === 'object') {
        const base = { ...freshPet(), ...serverPet };
        commit(applyDecay(base, now() - (base.lastTick || now())));
    } else {
        commit(freshPet());
    }
    persist();
}

// Guest / logout: fresh in-memory pet, never saved.
export function resetPet() {
    authed = false;
    commit(freshPet());
}

// React binding
export function usePet() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}

// Live decay tick (browser only).
if (typeof window !== 'undefined') {
    setInterval(() => {
        const elapsed = now() - state.lastTick;
        if (elapsed < 1000) return;
        commit(applyDecay(state, elapsed));
    }, TICK_MS);
}
