import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '../common/Icon';
import { Button, Modal } from '../ui/index';
import { useToast } from '../ui/Toast';
import Mascot from '../../assets/illustrations/Mascot';
import Scene from '../../assets/illustrations/Scene';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import { useAuth } from '../../auth/AuthProvider';
import { usePet, setPetName } from '../../lib/pet';
import { useProfile, setRegion, setCosmetic, setCosmeticPos, toggleEmoteInLoadout, setCompanionName } from '../../lib/profile';
import { CATEGORIES, COMPANIONS, EMOTES, EMOTE_LOADOUT_SIZE, priceOf, isDefaultItem, isEffectSizable, DEFAULT_POS, companionNameFor, COMPANION_NAME_MAX } from '../../lib/cosmetics';
import { EMOTE_DURATION_S } from '../../assets/illustrations/Cosmetics';
import { useCurrency, loadCurrency, buyCosmetic, isOwnedKey } from '../../lib/currency';

// Auto-replay interval = animation length + a short idle gap so the burst
// finishes before it restarts. Sourced from EMOTE_DURATION_S so this stays in
// sync if the underlying SMIL duration is tweaked.
const EMOTE_REPLAY_MS = Math.round(EMOTE_DURATION_S * 1000) + 500;

const FLAG_BASE = './assets/flags/';

// Small wrapper that auto-plays an emote on a loop inside an emote-card preview
// so the player can see what each one looks like without clicking. Interval is
// per-instance so different cards stay in sync with their own remount cycle.
function EmoteCardPreview({ emoteId, cosmetics, size = 52 }) {
    const [playId, setPlayId] = useState(0);
    useEffect(() => {
        if (!emoteId || emoteId === 'none') return undefined;
        const t = setInterval(() => setPlayId((p) => p + 1), EMOTE_REPLAY_MS);
        return () => clearInterval(t);
    }, [emoteId]);
    return (
        <Mascot
            size={size}
            cosmetics={cosmetics}
            still
            emotePlay={emoteId && emoteId !== 'none' ? { id: emoteId, playId } : null}
        />
    );
}

function StoreScreen({ setView, flagsData }) {
    const { isAuthed, patchUser } = useAuth();
    const toast = useToast();
    const pet = usePet();
    const profile = useProfile();
    const currency = useCurrency();
    const [nameDraft, setNameDraft] = useState(pet.name);
    // Re-sync the rename draft when the pet's name loads/changes — useState only
    // reads its initializer once, so without this the field can keep the default
    // 'Atlas' if the store mounts before the account's pet finishes loading
    // (and pressing Rename would re-save the stale name).
    useEffect(() => { setNameDraft(pet.name); }, [pet.name]);
    const bucks = currency.bucks;

    // Companion naming. `companionDraft` mirrors the equipped companion's stored
    // name for the inline rename field; `namePrompt` holds the just-bought
    // companion so we can pop the "name your new companion" modal after a buy.
    const equippedCompanion = profile.cosmetics.companion;
    const companionLabel = (COMPANIONS[equippedCompanion] && COMPANIONS[equippedCompanion].name) || 'companion';
    const currentCompanionName = companionNameFor(profile.cosmetics) || '';
    const [companionDraft, setCompanionDraft] = useState(currentCompanionName);
    useEffect(() => { setCompanionDraft(currentCompanionName); }, [currentCompanionName, equippedCompanion]);
    const [namePrompt, setNamePrompt] = useState(null); // { id, label, draft }

    const countries = useMemo(
        () => (flagsData || [])
            .map((f) => ({ code: f.code, name: f.country || f.name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [flagsData]
    );

    // Owned vs. shop (not-yet-bought) cosmetics.
    const [shopTab, setShopTab] = useState('owned');

    // Preview + buy-confirm. Clicking an unowned card slots the item onto the
    // big Atlas (`previewItem`) and opens a confirmation modal (`confirmBuy`)
    // — purchases never happen on a single click; the modal's Buy button is
    // the only path that spends bucks. Cancel/Escape clears both.
    const [previewItem, setPreviewItem] = useState(null);
    const [confirmBuy, setConfirmBuy] = useState(null);
    const [buying, setBuying] = useState(false);
    const isEmotePreview = previewItem?.cat === 'emote' && previewItem?.id && previewItem.id !== 'none';
    const [previewPlayId, setPreviewPlayId] = useState(0);
    useEffect(() => {
        if (!isEmotePreview) return undefined;
        setPreviewPlayId((p) => p + 1);
        const t = setInterval(() => setPreviewPlayId((p) => p + 1), EMOTE_REPLAY_MS);
        return () => clearInterval(t);
    }, [isEmotePreview, previewItem?.id]);
    const displayCosmetics = previewItem
        ? { ...profile.cosmetics, [previewItem.cat]: previewItem.id }
        : profile.cosmetics;
    const previewMeta = previewItem
        ? (() => {
            const cat = CATEGORIES.find((c) => c.key === previewItem.cat);
            const item = cat?.items?.[previewItem.id];
            return item ? { cat, item, cost: priceOf(item) } : null;
        })()
        : null;

    // Cosmetic placement (drag to move, slider to scale).
    const [adjust, setAdjust] = useState('hat');
    const dragRef = useRef(null);
    const hasHat = profile.cosmetics.hat && profile.cosmetics.hat !== 'none';
    const hasGlasses = profile.cosmetics.glasses && profile.cosmetics.glasses !== 'none';
    const hasMouth = profile.cosmetics.mouth && profile.cosmetics.mouth !== 'none';
    const hasEffect = isEffectSizable(profile.cosmetics.effect);
    const hasCompanion = profile.cosmetics.companion && profile.cosmetics.companion !== 'none';
    const anyAdjustable = hasHat || hasGlasses || hasMouth || hasEffect || hasCompanion;
    // Number of slot tabs shown, and how many columns to lay them out in so they
    // stack into balanced rows instead of one wide row with a lonely orphan:
    // 5 → 3+2, 4 → 2+2, 2-3 → a single row.
    const adjustTabCount = (hasHat ? 1 : 0) + (hasGlasses ? 1 : 0) + (hasMouth ? 1 : 0) + (hasEffect ? 1 : 0) + (hasCompanion ? 1 : 0);
    const adjustTabCols = adjustTabCount <= 3 ? adjustTabCount : (adjustTabCount === 4 ? 2 : 3);
    const slot = ['hat', 'glasses', 'mouth', 'effect', 'companion'].includes(adjust) ? adjust : 'hat';

    // Keep the active slot pointed at something that's actually equipped.
    useEffect(() => {
        const equipped = { hat: hasHat, glasses: hasGlasses, mouth: hasMouth, effect: hasEffect, companion: hasCompanion };
        if (!equipped[adjust]) {
            const next = ['hat', 'glasses', 'mouth', 'effect', 'companion'].find((k) => equipped[k]);
            if (next) setAdjust(next);
        }
    }, [adjust, hasHat, hasGlasses, hasMouth, hasEffect, hasCompanion]);

    // Pull the latest currency summary on mount so the trade-in shows the
    // accurate `claimable` even if the shop is opened before App's post-login
    // sync has finished (e.g. on a fresh page load).
    useEffect(() => {
        if (isAuthed) loadCurrency().catch(() => {});
    }, [isAuthed]);

    if (!isAuthed) {
        return (
            <div className="quiz-box store-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="storefront" size="xl" />
                    <h2>Atlas Shop</h2>
                    <p>Log in to customize Atlas, set your country, and buy cosmetics with Atlas Bucks.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    const onRename = () => {
        const n = nameDraft.trim();
        if (!n) return;
        setPetName(n);
        toast.success(`Renamed to ${n}!`);
    };

    const onRenameCompanion = () => {
        if (!equippedCompanion || equippedCompanion === 'none') return;
        const n = companionDraft.trim();
        setCompanionName(equippedCompanion, n);
        toast.success(n ? `Your ${companionLabel} is now ${n}!` : `Cleared your ${companionLabel}'s name.`);
    };

    // Save from the post-purchase name modal, then close it.
    const onSaveNamePrompt = () => {
        if (!namePrompt) return;
        setCompanionName(namePrompt.id, namePrompt.draft);
        const n = namePrompt.draft.trim();
        if (n) toast.success(`Say hello to ${n}!`);
        setNamePrompt(null);
    };

    // Economy v2: the XP→Bucks trade-in is gone. Bucks now land directly as the
    // player answers correctly, finishes runs, sets new high scores, and claims
    // login / quest rewards. patchUser is still relied on by purchases below.

    // Card click handler. Owned/default items equip immediately (no money
    // moves, no confirmation needed). Unowned items open the confirmation
    // modal with a live preview on Atlas — a real purchase only happens when
    // the player presses the Buy button inside the modal.
    const onEquip = (categoryKey, id, item) => {
        if (isDefaultItem(categoryKey, id) || isOwnedKey(categoryKey, id)) {
            // Emotes are a loadout (up to 4 equipped at once), not a single
            // slot. Clicking an owned emote toggles it in/out of the loadout.
            if (categoryKey === 'emote') {
                if (id !== 'none') toggleEmoteInLoadout(id);
            } else {
                setCosmetic(categoryKey, id);
            }
            setPreviewItem(null);
            setConfirmBuy(null);
            return;
        }
        setPreviewItem({ cat: categoryKey, id });
        setConfirmBuy({ cat: categoryKey, id, item });
    };

    const closeConfirmBuy = () => {
        if (buying) return;
        setConfirmBuy(null);
        setPreviewItem(null);
    };

    const onConfirmBuy = async () => {
        if (!confirmBuy || buying) return;
        const { cat, id, item } = confirmBuy;
        const cost = priceOf(item);
        if (bucks < cost) {
            toast.danger(`Need ${(cost - bucks).toLocaleString()} more Atlas Bucks.`);
            return;
        }
        setBuying(true);
        try {
            const out = await buyCosmetic(cat, id);
            patchUser({ bucks: out.bucks, ownedCosmetics: Array.from(out.ownedCosmetics || []) });
            // Emotes auto-equip into the first empty loadout slot (or replace
            // slot 0 if all four are full). Other cosmetics use the single-
            // slot equip flow.
            if (cat === 'emote') {
                toggleEmoteInLoadout(id);
            } else {
                setCosmetic(cat, id);
            }
            setConfirmBuy(null);
            setPreviewItem(null);
            toast.success(`Bought ${item.name}!`);
            // A freshly-bought companion gets a name right away — pop the prompt
            // (pre-filled with any name it already had, e.g. a re-buy edge case).
            if (cat === 'companion') {
                setNamePrompt({ id, label: item.name, draft: companionNameFor({ companion: id, companionNames: profile.cosmetics.companionNames }) || '' });
            }
        } catch (err) {
            toast.danger(err.message || 'Could not buy that.');
        } finally {
            setBuying(false);
        }
    };

    const posOf = (s) => (
        s === 'hat' ? profile.cosmetics.hatPos
        : s === 'glasses' ? profile.cosmetics.glassesPos
        : s === 'mouth' ? profile.cosmetics.mouthPos
        : s === 'companion' ? profile.cosmetics.companionPos
        : profile.cosmetics.effectPos
    ) || DEFAULT_POS;

    // Pointer drag over the preview maps movement (px) to viewBox units
    // (viewBox 96 rendered at 120px → 0.8 units per px).
    const onPointerDown = (e) => {
        if (!anyAdjustable) return;
        const base = posOf(slot);
        dragRef.current = { sx: e.clientX, sy: e.clientY, bx: base.x || 0, by: base.y || 0, s: base.s == null ? 1 : base.s };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        setCosmeticPos(slot, { x: d.bx + (e.clientX - d.sx) * 0.8, y: d.by + (e.clientY - d.sy) * 0.8, s: d.s });
    };
    const onPointerUp = () => { dragRef.current = null; };

    const onSize = (e) => {
        const base = posOf(slot);
        setCosmeticPos(slot, { x: base.x || 0, y: base.y || 0, s: parseFloat(e.target.value) });
    };

    const isItemOwned = (categoryKey, id) => isDefaultItem(categoryKey, id) || isOwnedKey(categoryKey, id);

    return (
        <div className="quiz-box store-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <h2 className="text-center">Atlas Shop</h2>

            <div className="store-preview">
                <div
                    className={`store-preview__stage ${displayCosmetics?.scene && displayCosmetics.scene !== 'default' ? 'store-preview__stage--scene' : ''}`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    style={{ touchAction: 'none', cursor: anyAdjustable ? 'grab' : 'default' }}
                >
                    <Scene id={displayCosmetics?.scene} />
                    <Mascot
                        size={120}
                        mood={pet.mood}
                        cosmetics={displayCosmetics}
                        chubby={pet.obese}
                        bruised={pet.bruised}
                        emotePlay={isEmotePreview ? { id: previewItem.id, playId: previewPlayId } : null}
                    />
                </div>

                {companionNameFor(displayCosmetics) && (
                    <div className="companion-name-caption">
                        <Icon name="pets" /> {companionNameFor(displayCosmetics)}
                    </div>
                )}

                {previewMeta && (
                    <div className="store-preview-banner" role="status">
                        <Icon name="visibility" />
                        <span className="store-preview-banner__text">
                            Previewing <strong>{previewMeta.item.name}</strong> ·{' '}
                            <span className="store-preview-banner__cost">
                                <AtlasBucksIcon size={12} /> {previewMeta.cost.toLocaleString()}
                            </span>
                        </span>
                        <button
                            type="button"
                            className="store-preview-banner__clear"
                            onClick={() => setPreviewItem(null)}
                            aria-label="Clear preview"
                        >
                            <Icon name="close" />
                        </button>
                    </div>
                )}

                {anyAdjustable && (
                    <div className="cosmetic-adjust">
                        <div className="cosmetic-adjust__head">
                            <Icon name="open_with" /> Drag Atlas to move the {slot}
                        </div>
                        {adjustTabCount >= 2 && (
                            <div className="adjust-tabs" style={{ gridTemplateColumns: `repeat(${adjustTabCols}, auto)` }}>
                                {hasHat && (
                                    <button
                                        className={`adjust-tab ${slot === 'hat' ? 'is-active' : ''}`}
                                        onClick={() => setAdjust('hat')}
                                    >
                                        <Icon name="theater_comedy" /> Hat
                                    </button>
                                )}
                                {hasGlasses && (
                                    <button
                                        className={`adjust-tab ${slot === 'glasses' ? 'is-active' : ''}`}
                                        onClick={() => setAdjust('glasses')}
                                    >
                                        <Icon name="eyeglasses" /> Glasses
                                    </button>
                                )}
                                {hasMouth && (
                                    <button
                                        className={`adjust-tab ${slot === 'mouth' ? 'is-active' : ''}`}
                                        onClick={() => setAdjust('mouth')}
                                    >
                                        <Icon name="sentiment_satisfied" /> Mouth
                                    </button>
                                )}
                                {hasEffect && (
                                    <button
                                        className={`adjust-tab ${slot === 'effect' ? 'is-active' : ''}`}
                                        onClick={() => setAdjust('effect')}
                                    >
                                        <Icon name="auto_awesome" /> Effect
                                    </button>
                                )}
                                {hasCompanion && (
                                    <button
                                        className={`adjust-tab ${slot === 'companion' ? 'is-active' : ''}`}
                                        onClick={() => setAdjust('companion')}
                                    >
                                        <Icon name="pets" /> Companion
                                    </button>
                                )}
                            </div>
                        )}
                        <label className="adjust-size">
                            <Icon name="zoom_out_map" /> Size
                            <input
                                type="range"
                                min="0.6"
                                max="1.7"
                                step="0.05"
                                value={posOf(slot).s == null ? 1 : posOf(slot).s}
                                onChange={onSize}
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Names — Atlas, plus the equipped companion (if any). */}
            <div className="store-section">
                <h3 className="store-section-title"><Icon name="badge" /> Names</h3>
                <div className="friend-add">
                    <input
                        className="auth-field__input"
                        value={nameDraft}
                        maxLength={20}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Name your Atlas"
                    />
                    <Button variant="primary" icon="edit" onClick={onRename} disabled={!nameDraft.trim() || nameDraft.trim() === pet.name}>Rename</Button>
                </div>
                {hasCompanion && (
                    <div className="friend-add" style={{ marginTop: 8 }}>
                        <input
                            className="auth-field__input"
                            value={companionDraft}
                            maxLength={COMPANION_NAME_MAX}
                            onChange={(e) => setCompanionDraft(e.target.value)}
                            placeholder={`Name your ${companionLabel}`}
                        />
                        <Button variant="primary" icon="pets" onClick={onRenameCompanion} disabled={companionDraft.trim() === currentCompanionName}>Name</Button>
                    </div>
                )}
            </div>

            {/* Region */}
            <div className="store-section">
                <h3 className="store-section-title"><Icon name="public" /> Region</h3>
                <div className="region-row">
                    {profile.region && (
                        <img
                            className="region-flag"
                            src={`${FLAG_BASE}${profile.region.toLowerCase()}.svg`}
                            alt={profile.region}
                        />
                    )}
                    <select
                        className="auth-field__input"
                        value={profile.region || ''}
                        onChange={(e) => setRegion(e.target.value || null)}
                    >
                        <option value="">No region</option>
                        {countries.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Owned vs. Shop toggle */}
            <div className="lb-filter store-tabs">
                <button
                    className={`lb-filter__btn ${shopTab === 'owned' ? 'is-active' : ''}`}
                    onClick={() => { setShopTab('owned'); setPreviewItem(null); setConfirmBuy(null); }}
                >
                    <Icon name="check_circle" /> Owned
                </button>
                <button
                    className={`lb-filter__btn ${shopTab === 'shop' ? 'is-active' : ''}`}
                    onClick={() => { setShopTab('shop'); setPreviewItem(null); setConfirmBuy(null); }}
                >
                    <Icon name="shopping_bag" /> Shop
                </button>
            </div>

            {/* Cosmetics — grouped by category. Section headers are wrapped in a
                .store-section-head divider so each group reads as its own card. */}
            {CATEGORIES.map((cat) => {
                const entries = Object.entries(cat.items)
                    // Atlas Pass exclusives never appear in the "Shop" tab — they
                    // can only be unlocked by claiming a pass tier. Once owned,
                    // they DO show up in "Owned" so the player can equip them.
                    .filter(([id, item]) => !(item.bpOnly && shopTab === 'shop'))
                    // Emote "none" is the empty-slot placeholder, not a cosmetic
                    // to display in the store.
                    .filter(([id]) => !(cat.key === 'emote' && id === 'none'))
                    .filter(([id, item]) => isItemOwned(cat.key, id) === (shopTab === 'owned'))
                    // Sort by price ascending — cheapest first in both tabs, so
                    // the player can see "what's next to grab" without scrolling
                    // through expensive items they can't afford yet. Within the
                    // same price (e.g. multiple 0-cost defaults), fall back to
                    // alphabetical for stable ordering.
                    .sort((a, b) => {
                        const pa = priceOf(a[1]);
                        const pb = priceOf(b[1]);
                        if (pa !== pb) return pa - pb;
                        return (a[1].name || a[0]).localeCompare(b[1].name || b[0]);
                    });
                if (entries.length === 0) return null;
                const loadout = (profile.cosmetics && profile.cosmetics.emoteLoadout) || [];
                return (
                <div className="store-section store-section--cards" key={cat.key}>
                    <div className="store-section-head">
                        <h3 className="store-section-title store-section-title--big">
                            <Icon name={cat.icon} /> {cat.label}
                        </h3>
                        <span className="store-section-count">{entries.length}</span>
                    </div>
                    {cat.key === 'emote' && shopTab === 'owned' && (
                        <div className="emote-loadout-strip" aria-label="Equipped emote loadout">
                            <span className="emote-loadout-strip__label">
                                <Icon name="bolt" /> Quick-react bar
                            </span>
                            <div className="emote-loadout-strip__slots">
                                {Array.from({ length: EMOTE_LOADOUT_SIZE }, (_, i) => {
                                    const slotId = loadout[i] || 'none';
                                    const meta = EMOTES[slotId];
                                    const isEmpty = !meta || slotId === 'none';
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`emote-loadout-slot ${isEmpty ? 'is-empty' : ''}`}
                                            onClick={() => !isEmpty && toggleEmoteInLoadout(slotId)}
                                            aria-label={isEmpty ? `Slot ${i + 1}: empty` : `Slot ${i + 1}: ${meta.name} — click to remove`}
                                            title={isEmpty ? 'Equip an emote below' : `${meta.name} — click to remove`}
                                            disabled={isEmpty}
                                        >
                                            {isEmpty ? (
                                                <Icon name="add" />
                                            ) : (
                                                <EmoteCardPreview emoteId={slotId} cosmetics={profile.cosmetics} size={40} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="cosmetic-grid">
                        {entries.map(([id, item]) => {
                            const owned = isItemOwned(cat.key, id);
                            const equipped = cat.key === 'emote'
                                ? loadout.includes(id)
                                : profile.cosmetics[cat.key] === id;
                            const cost = priceOf(item);
                            const canAfford = bucks >= cost;
                            const isPreviewing = previewItem && previewItem.cat === cat.key && previewItem.id === id;
                            // Preview the item on Atlas: colors recolor the globe; hats /
                            // glasses sit on the player's current globe color. Scenes
                            // wrap the mascot with the scene SVG behind it. Emotes show
                            // a per-card auto-replaying Mascot in the player's current
                            // cosmetics so they can see how it looks on their Atlas.
                            const previewCos = cat.key === 'color'
                                ? { color: id }
                                : cat.key === 'scene'
                                    ? { color: profile.cosmetics.color, scene: id }
                                    : { color: profile.cosmetics.color, [cat.key]: id };
                            const slotIndex = cat.key === 'emote' ? loadout.indexOf(id) : -1;
                            return (
                                <button
                                    key={id}
                                    className={`cosmetic-card ${equipped ? 'is-equipped' : ''} ${owned ? '' : 'is-locked'} ${isPreviewing ? 'is-preview' : ''}`}
                                    onClick={() => onEquip(cat.key, id, item)}
                                    aria-label={item.name}
                                >
                                    <span className={`cosmetic-preview ${cat.key === 'scene' ? 'cosmetic-preview--scene' : ''}`}>
                                        {cat.key === 'scene' && <Scene id={id} />}
                                        {cat.key === 'emote' ? (
                                            <EmoteCardPreview emoteId={id} cosmetics={profile.cosmetics} />
                                        ) : (
                                            <Mascot size={52} mood="idle" cosmetics={previewCos} still />
                                        )}
                                    </span>
                                    <span className="cosmetic-name">{item.name}{item.anim ? ' ✨' : ''}</span>
                                    {equipped ? (
                                        <span className="cosmetic-tag cosmetic-tag--on">
                                            <Icon name="check" /> {cat.key === 'emote' && slotIndex >= 0 ? `Slot ${slotIndex + 1}` : 'Equipped'}
                                        </span>
                                    ) : owned ? (
                                        <span className="cosmetic-tag">{cat.key === 'emote' ? 'Add to bar' : 'Equip'}</span>
                                    ) : (
                                        <span className={`cosmetic-tag cosmetic-tag--buy ${canAfford ? '' : 'cosmetic-tag--cant'}`}>
                                            <AtlasBucksIcon size={12} /> {cost.toLocaleString()}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                );
            })}

            {/* Buy confirmation modal — the only path that actually spends
                bucks. Clicking a card just opens this with a live Atlas
                preview; the player must explicitly confirm to purchase. */}
            <Modal
                open={!!confirmBuy}
                onClose={closeConfirmBuy}
                title={confirmBuy ? `Buy ${confirmBuy.item.name}?` : 'Buy item'}
            >
                {confirmBuy && (() => {
                    const cost = priceOf(confirmBuy.item);
                    const canAfford = bucks >= cost;
                    const after = bucks - cost;
                    const modalPreview = confirmBuy.cat === 'color'
                        ? { color: confirmBuy.id }
                        : { ...profile.cosmetics, [confirmBuy.cat]: confirmBuy.id };
                    const isSceneBuy = confirmBuy.cat === 'scene';
                    const isEmoteBuy = confirmBuy.cat === 'emote';
                    return (
                        <div className="store-buy-confirm">
                            <div className={`store-buy-confirm__stage ${isSceneBuy ? 'store-buy-confirm__stage--scene' : ''}`}>
                                {isSceneBuy && <Scene id={confirmBuy.id} />}
                                {isEmoteBuy ? (
                                    <EmoteCardPreview emoteId={confirmBuy.id} cosmetics={profile.cosmetics} size={128} />
                                ) : (
                                    <Mascot size={128} mood="cheer" cosmetics={modalPreview} still />
                                )}
                            </div>
                            <div className="store-buy-confirm__meta">
                                <div className="store-buy-confirm__row">
                                    <span><Icon name="local_offer" /> Price</span>
                                    <strong className="store-buy-confirm__cost">
                                        <AtlasBucksIcon size={18} labelled /> {cost.toLocaleString()}
                                    </strong>
                                </div>
                                <div className="store-buy-confirm__row">
                                    <span><Icon name="account_balance_wallet" /> Your balance</span>
                                    <strong>
                                        <AtlasBucksIcon size={14} labelled /> {bucks.toLocaleString()}
                                    </strong>
                                </div>
                                <div className={`store-buy-confirm__row ${canAfford ? '' : 'is-bad'}`}>
                                    <span><Icon name={canAfford ? 'check_circle' : 'error'} /> After purchase</span>
                                    <strong>
                                        {canAfford
                                            ? <><AtlasBucksIcon size={14} labelled /> {after.toLocaleString()}</>
                                            : `Short ${(cost - bucks).toLocaleString()}`}
                                    </strong>
                                </div>
                            </div>
                            <div className="store-buy-confirm__actions">
                                <Button
                                    variant="secondary"
                                    icon="close"
                                    onClick={closeConfirmBuy}
                                    disabled={buying}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    icon="shopping_cart"
                                    onClick={onConfirmBuy}
                                    disabled={!canAfford || buying}
                                >
                                    {buying
                                        ? 'Buying…'
                                        : canAfford
                                            ? `Buy for ${cost.toLocaleString()}`
                                            : `Need ${(cost - bucks).toLocaleString()} more`}
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Post-purchase: name your new companion. Closing without a name
                just leaves it unnamed (the catalog label is used as a fallback);
                the player can always set one later in the Names section. */}
            <Modal
                open={!!namePrompt}
                onClose={() => setNamePrompt(null)}
                title={namePrompt ? `Name your ${namePrompt.label}` : 'Name your companion'}
            >
                {namePrompt && (
                    <div className="companion-name-prompt">
                        <div className="companion-name-prompt__stage">
                            <Mascot
                                size={120}
                                mood="cheer"
                                cosmetics={{ ...profile.cosmetics, companion: namePrompt.id }}
                                still
                            />
                            {namePrompt.draft.trim() && (
                                <div className="companion-name-caption">
                                    <Icon name="pets" /> {namePrompt.draft.trim()}
                                </div>
                            )}
                        </div>
                        <p className="companion-name-prompt__hint">
                            What should we call your new {namePrompt.label}?
                        </p>
                        <input
                            className="auth-field__input"
                            autoFocus
                            value={namePrompt.draft}
                            maxLength={COMPANION_NAME_MAX}
                            onChange={(e) => setNamePrompt((p) => ({ ...p, draft: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') onSaveNamePrompt(); }}
                            placeholder={`e.g. ${namePrompt.label}`}
                        />
                        <div className="companion-name-prompt__actions">
                            <Button variant="secondary" icon="schedule" onClick={() => setNamePrompt(null)}>
                                Later
                            </Button>
                            <Button variant="primary" icon="check" onClick={onSaveNamePrompt} disabled={!namePrompt.draft.trim()}>
                                Save name
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default StoreScreen;
