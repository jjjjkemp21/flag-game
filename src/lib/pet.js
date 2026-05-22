import { useSyncExternalStore } from 'react';
import { api } from '../api/client';

// "Atlas" — a Tamagotchi-style globe pet. Three needs decay in real time and are
// refilled only by playing. Wellbeing drives mood; sustained neglect drains
// Health, and at zero Health the pet passes away (revivable by hatching a new one).
//
// State is account-tied: it persists and keeps decaying while you're away. Guests
// get a fresh, in-memory session pet that is never saved (matches the progress rule).

const PET_NAME = 'Atlas';

// Decay per real hour and per-event refill amounts (tunable). Atlas is needy:
// stats fall fast and each answer tops them up only a little, so keeping it happy
// takes regular play.
const DECAY = { fed: 7, joy: 6, energy: 5 };
const REFILL = {
    correct: { fed: 8, joy: 4, energy: 3 },
    incorrect: { fed: 2, joy: 3, energy: 2 },
    play: { fed: 0, joy: 5, energy: 5 },
};
const HEALTH_DRAIN = 5; // per hour when wellbeing is very low
const HEALTH_REGEN = 5; // per hour when wellbeing is high
const LOW_WELLBEING = 28;
const HIGH_WELLBEING = 65;
const TICK_MS = 15000;

// Overfeeding: feeding while already full builds "chub", which slowly burns off
// when you're away. High chub just makes Atlas chubby — it never affects health
// or causes death.
const CHUB_DECAY = 2.5;       // per hour
const CHUB_GAIN = 3;          // per correct answer while already full
const FULL_THRESHOLD = 85;    // "full" cutoff that triggers chub gain
const OBESE_THRESHOLD = 70;   // chub at/above this => chubby cheeks

// Care XP -> level. Care XP grows by playing and drives the "Atlas Level"
// leaderboard. It is wiped if Atlas passes away and you hatch a new egg — a
// fresh companion starts back at Level 1.
const LEVEL_XP = 120;
const CARE = { correct: 6, incorrect: 2, play: 5 };

// Atlas Battle (multiplayer) outcomes act on a SEPARATE battle-HP track so a lost
// duel can knock Atlas out without ever triggering the neglect death. A KO is
// purely a battle state and heals back as you play other modes.
const BATTLE_WIN_HEAL = 15;        // small reward for winning
const BATTLE_HEAL_PER_PLAY = 6;    // battle-HP recovered per answer/play
const KO_RECOVER_AT = 50;          // battle-HP needed to get back up after a KO
const BRUISED_BELOW = 45;          // show the beat-up look under this battle-HP

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
        careXp: 0,
        chub: 0,
        battleHp: 100,
        ko: false,
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
    next.careXp = s.careXp || 0;
    next.level = Math.floor(next.careXp / LEVEL_XP) + 1;
    next.chub = Math.max(0, Math.min(100, s.chub || 0));
    next.obese = next.chub >= OBESE_THRESHOLD;
    next.battleHp = Math.max(0, Math.min(100, s.battleHp == null ? 100 : s.battleHp));
    next.ko = !!s.ko && next.battleHp < KO_RECOVER_AT;
    next.bruised = next.ko || next.battleHp < BRUISED_BELOW;
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
    const chub = clamp((s.chub || 0) - CHUB_DECAY * h);
    return { ...s, fed, joy, energy, health, chub, alive, deadAt, lastTick: now() };
}

function persist() {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        const { name, bornAt, lastTick, fed, joy, energy, health, alive, deadAt, careXp, level, chub, battleHp, ko } = state;
        api.put('/pet', { pet: { name, bornAt, lastTick, fed, joy, energy, health, alive, deadAt, careXp, level, chub, battleHp, ko } })
            .catch(() => {});
    }, 1500);
}

function feed(kind, times = 1) {
    if (!state.alive) return;
    const r = REFILL[kind] || REFILL.play;
    const next = applyDecay(state, now() - state.lastTick);
    const wasFull = next.fed >= FULL_THRESHOLD;
    next.fed = clamp(next.fed + r.fed * times);
    next.joy = clamp(next.joy + r.joy * times);
    next.energy = clamp(next.energy + r.energy * times);
    next.health = clamp(next.health + 2); // a little love restores health
    // Playing also nurses Atlas back from a battle KO (separate from health).
    next.battleHp = clamp((next.battleHp == null ? 100 : next.battleHp) + BATTLE_HEAL_PER_PLAY * times);
    next.careXp = (next.careXp || 0) + (CARE[kind] || 0) * times;
    // Stuffing Atlas while it's already full puts on chub (purely cosmetic).
    if (kind === 'correct' && wasFull) {
        next.chub = Math.min(100, (next.chub || 0) + CHUB_GAIN * times);
    }
    commit(next);
    persist();
}

// ---- Public API ----

export function recordCorrect(times = 1) { feed('correct', times); }
export function recordIncorrect(times = 1) { feed('incorrect', times); }
export function recordPlay(times = 1) { feed('play', times); }

// Apply an Atlas Battle (multiplayer 1v1) result. A loss damages battle-HP and
// can knock Atlas out (revivable by playing); a win heals a little. Never touches
// the neglect health/alive state, so a battle can't actually kill Atlas.
export function recordBattleResult(won) {
    const next = applyDecay(state, now() - state.lastTick);
    const cur = next.battleHp == null ? 100 : next.battleHp;
    if (won) {
        // Survived the duel — patch up a little.
        next.battleHp = clamp(cur + BATTLE_WIN_HEAL);
        next.ko = false;
    } else {
        // The battle ends on a KO, so the loser's Atlas is the one knocked out.
        next.battleHp = 0;
        next.ko = true;
    }
    commit(next);
    persist();
}

// Hatch a brand-new egg after Atlas has passed away. All progress — care XP,
// level, age — is wiped; the new companion starts fresh at Level 1.
export function revivePet() {
    commit(freshPet());
    persist();
}

export function setPetName(name) {
    const clean = String(name || '').trim().slice(0, 20);
    if (!clean) return;
    commit({ ...state, name: clean });
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

// Snapshot accessor for non-React callers (e.g. achievement computation).
export function getPet() {
    return state;
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
