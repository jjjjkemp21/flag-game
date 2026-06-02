import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { DEFAULT_COSMETICS, EMOTE_LOADOUT_SIZE, EMOTES, normalizeCosmetics, clampPos, isDefaultItem } from './cosmetics';
import { isOwnedKey } from './currency';
import { topAchievements } from './achievements';

// Account-tied profile: region flag, equipped cosmetics, and achievements
// (the up-to-3 showcased ids + the unlocked set). Loaded on sign-in, persisted
// to the server on change. Guests get session-only defaults.

const freshAchievements = () => ({ showcase: [], unlocked: [] });

let state = { region: null, cosmetics: { ...DEFAULT_COSMETICS }, achievements: freshAchievements(), streaks: {}, selectedTitle: null, allowSpectate: true };
let authed = false;
let pushTimer = null;
const listeners = new Set();

function notify() {
    listeners.forEach((l) => l());
}

function profilePayload() {
    // If the player hasn't curated a showcase, feature their best unlocked
    // achievements so something always shows on the leaderboard / profile.
    const explicit = state.achievements.showcase;
    const showcase = explicit.length > 0
        ? explicit
        : topAchievements(state.achievements.unlocked, 3);
    return {
        region: state.region,
        cosmetics: state.cosmetics,
        achievements: { showcase, count: state.achievements.unlocked.length },
        streaks: state.streaks,
        selectedTitle: state.selectedTitle,
        allowSpectate: state.allowSpectate,
    };
}

function persist() {
    if (!authed) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        api.put('/profile', profilePayload()).catch(() => {});
    }, 1000);
}

// Immediate, non-debounced profile push. Resolves once the server has the new
// state — callers chain refreshBattlepass() onto it so the pass UI sees fresh
// streaks_json before re-reading. Cancels any pending debounced push.
export function flushProfile() {
    if (!authed) return Promise.resolve(null);
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    return api.put('/profile', profilePayload()).catch(() => null);
}

export function setProfileAuthed(value) {
    authed = !!value;
}

export function loadProfile(serverProfile) {
    authed = true;
    const ach = (serverProfile && serverProfile.achievements) || {};
    state = {
        region: (serverProfile && serverProfile.region) || null,
        // Pass the ownership predicate so a stored equip for an item the
        // player no longer (or never) owns falls back to the slot default.
        cosmetics: normalizeCosmetics(serverProfile && serverProfile.cosmetics, isOwnedKey),
        // unlocked is recomputed locally from live stats right after load.
        achievements: { showcase: Array.isArray(ach.showcase) ? ach.showcase.slice(0, 3) : [], unlocked: [] },
        streaks: (serverProfile && serverProfile.streaks && typeof serverProfile.streaks === 'object') ? serverProfile.streaks : {},
        selectedTitle: (serverProfile && serverProfile.selectedTitle) || null,
        // Defaults to true on a fresh account; only an explicit `false` opts
        // the player out of being spectated.
        allowSpectate: serverProfile && serverProfile.allowSpectate === false ? false : true,
    };
    notify();
}

export function resetProfile() {
    authed = false;
    state = { region: null, cosmetics: { ...DEFAULT_COSMETICS }, achievements: freshAchievements(), streaks: {}, selectedTitle: null, allowSpectate: true };
    notify();
}

// Record a per-mode best run streak. No-ops unless it beats the stored best, so
// it's cheap to call after every correct answer. Persisted to the account.
// Returns `true` when a new best was set, so callers can chain an immediate
// flush + battlepass refresh only on real changes.
export function recordBestStreak(mode, value) {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    if (v <= (state.streaks[mode] || 0)) return false;
    state = { ...state, streaks: { ...state.streaks, [mode]: v } };
    notify();
    persist();
    return true;
}

export function setRegion(code) {
    state = { ...state, region: code || null };
    notify();
    persist();
}

// Equip a cosmetic the player owns. Items that aren't owned are silently
// ignored — the StoreScreen calls a separate buy flow and only equips after
// purchase, so a no-op here just means the click hit a card the player
// hasn't bought yet.
export function setCosmetic(category, id) {
    if (!isDefaultItem(category, id) && !isOwnedKey(category, id)) return;
    state = { ...state, cosmetics: { ...state.cosmetics, [category]: id } };
    notify();
    persist();
}

// Replace a single emote-loadout slot. Used by the SpectatorScreen + StoreScreen
// emote tab when the player picks which emotes are in their quick-react bar.
// Validates ownership; assigning an unowned id is a no-op (matches setCosmetic).
export function setEmoteLoadout(slotIndex, id) {
    const i = Math.max(0, Math.min(EMOTE_LOADOUT_SIZE - 1, Math.floor(Number(slotIndex) || 0)));
    const next = id || 'none';
    if (next !== 'none' && !EMOTES[next]) return;
    if (next !== 'none' && !isOwnedKey('emote', next)) return;
    const current = Array.isArray(state.cosmetics.emoteLoadout)
        ? [...state.cosmetics.emoteLoadout]
        : ['wave', 'none', 'none', 'none'];
    while (current.length < EMOTE_LOADOUT_SIZE) current.push('none');
    if (current[i] === next) return;
    current[i] = next;
    state = { ...state, cosmetics: { ...state.cosmetics, emoteLoadout: current.slice(0, EMOTE_LOADOUT_SIZE) } };
    notify();
    persist();
}

// Toggle an emote in the loadout: if already equipped, remove it; otherwise
// drop it into the first empty slot. When all slots are full it replaces the
// first slot (oldest), which matches the "newest emote, easiest to grab"
// intuition for the reaction tray.
export function toggleEmoteInLoadout(id) {
    if (!id || !EMOTES[id] || !isOwnedKey('emote', id)) return;
    const current = Array.isArray(state.cosmetics.emoteLoadout)
        ? [...state.cosmetics.emoteLoadout]
        : ['wave', 'none', 'none', 'none'];
    while (current.length < EMOTE_LOADOUT_SIZE) current.push('none');
    const existing = current.indexOf(id);
    if (existing >= 0) {
        current[existing] = 'none';
    } else {
        const empty = current.indexOf('none');
        if (empty >= 0) current[empty] = id;
        else current[0] = id;
    }
    state = { ...state, cosmetics: { ...state.cosmetics, emoteLoadout: current.slice(0, EMOTE_LOADOUT_SIZE) } };
    notify();
    persist();
}

// Name (or rename) a companion. Stored per-companion-id under
// cosmetics.companionNames so each owned companion keeps its own name. An empty
// name clears it (falls back to the catalog label). Capped to 20 chars.
export function setCompanionName(companionId, name) {
    if (!companionId || companionId === 'none') return;
    const t = (name == null ? '' : String(name)).trim().slice(0, 20);
    const names = { ...(state.cosmetics.companionNames || {}) };
    if (t) names[companionId] = t;
    else delete names[companionId];
    state = { ...state, cosmetics: { ...state.cosmetics, companionNames: names } };
    notify();
    persist();
}

// Move/scale a cosmetic slot ('hat' | 'glasses' | 'mouth' | 'effect' |
// 'companion'). Clamped to canvas bounds.
export function setCosmeticPos(slot, pos) {
    const key = slot === 'hat' ? 'hatPos'
        : slot === 'glasses' ? 'glassesPos'
        : slot === 'mouth' ? 'mouthPos'
        : slot === 'companion' ? 'companionPos'
        : 'effectPos';
    state = { ...state, cosmetics: { ...state.cosmetics, [key]: clampPos(pos, slot) } };
    notify();
    persist();
}

// Strip every equipped cosmetic back to its slot default (teal globe, no hat /
// glasses / mouth / effect / companion / scene, default emote loadout) and
// reset all placement transforms. Owned items are untouched — this only clears
// what's currently equipped, so everything stays available to re-equip in the
// shop. Surfaced from Settings behind a confirmation dialog.
export function unequipAllCosmetics() {
    state = { ...state, cosmetics: { ...DEFAULT_COSMETICS } };
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

// Privacy: allow / disallow friends from spectating my live matches. When
// `false`, friends can still see me as "Playing X" on the Friends tab but the
// Eye icon is hidden and the spectator endpoint refuses to start a session.
export function setAllowSpectate(value) {
    const v = !!value;
    if (v === state.allowSpectate) return;
    state = { ...state, allowSpectate: v };
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

export function useProfile() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => state
    );
}
