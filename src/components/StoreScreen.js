import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from './Icon';
import { Button } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';
import { useAuth } from '../auth/AuthProvider';
import { usePet, setPetName } from '../lib/pet';
import { useProfile, setRegion, setCosmetic, setCosmeticPos } from '../lib/profile';
import { CATEGORIES, priceOf, isDefaultItem, DEFAULT_POS } from '../lib/cosmetics';
import { useCurrency, loadCurrency, claimBucks, buyCosmetic, isOwnedKey, CURRENCY_RATE } from '../lib/currency';

const FLAG_BASE = './assets/flags/';

function StoreScreen({ setView, flagsData }) {
    const { isAuthed, user, patchUser } = useAuth();
    const toast = useToast();
    const pet = usePet();
    const profile = useProfile();
    const currency = useCurrency();
    const [nameDraft, setNameDraft] = useState(pet.name);
    const xp = user?.xp || 0;
    const bucks = currency.bucks;
    const claimable = currency.claimableBucks;

    const countries = useMemo(
        () => (flagsData || [])
            .map((f) => ({ code: f.code, name: f.country || f.name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [flagsData]
    );

    // Owned vs. shop (not-yet-bought) cosmetics.
    const [shopTab, setShopTab] = useState('owned');

    // Cosmetic placement (drag to move, slider to scale).
    const [adjust, setAdjust] = useState('hat');
    const dragRef = useRef(null);
    const hasHat = profile.cosmetics.hat && profile.cosmetics.hat !== 'none';
    const hasGlasses = profile.cosmetics.glasses && profile.cosmetics.glasses !== 'none';
    const slot = adjust === 'glasses' ? 'glasses' : 'hat';

    // Keep the active slot pointed at something that's actually equipped.
    useEffect(() => {
        if (adjust === 'hat' && !hasHat && hasGlasses) setAdjust('glasses');
        else if (adjust === 'glasses' && !hasGlasses && hasHat) setAdjust('hat');
    }, [adjust, hasHat, hasGlasses]);

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

    // Trading in XP for bucks: server mints (earned - already-minted) ÷ rate
    // bucks. XP balance is untouched. patchUser updates the topbar chip.
    const onTradeIn = async () => {
        if (claimable <= 0) {
            toast.info('No new XP to trade in yet.');
            return;
        }
        try {
            const out = await claimBucks();
            patchUser({ bucks: out.bucks });
            toast.success(`Traded XP for ${out.claimed.toLocaleString()} Atlas Bucks!`);
        } catch (err) {
            toast.danger(err.message || 'Could not trade XP right now.');
        }
    };

    // Try to buy — on success, auto-equip the item so the click feels direct.
    const onBuy = async (categoryKey, id, item) => {
        const cost = priceOf(item);
        if (bucks < cost) {
            toast.danger(`Need ${cost.toLocaleString()} Atlas Bucks — trade in some XP first.`);
            return;
        }
        try {
            const out = await buyCosmetic(categoryKey, id);
            patchUser({ bucks: out.bucks, ownedCosmetics: Array.from(out.ownedCosmetics || []) });
            setCosmetic(categoryKey, id);
            toast.success(`Bought ${item.name}!`);
        } catch (err) {
            toast.danger(err.message || 'Could not buy that.');
        }
    };

    const onEquip = (categoryKey, id, item) => {
        if (!isDefaultItem(categoryKey, id) && !isOwnedKey(categoryKey, id)) {
            return onBuy(categoryKey, id, item);
        }
        setCosmetic(categoryKey, id);
    };

    const posOf = (s) => (s === 'hat' ? profile.cosmetics.hatPos : profile.cosmetics.glassesPos) || DEFAULT_POS;

    // Pointer drag over the preview maps movement (px) to viewBox units
    // (viewBox 96 rendered at 120px → 0.8 units per px).
    const onPointerDown = (e) => {
        if (!hasHat && !hasGlasses) return;
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
    const onResetPos = () => setCosmeticPos(slot, { ...DEFAULT_POS });

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
                    className="store-preview__stage"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    style={{ touchAction: 'none', cursor: (hasHat || hasGlasses) ? 'grab' : 'default' }}
                >
                    <Mascot size={120} mood={pet.alive ? pet.mood : 'idle'} cosmetics={profile.cosmetics} chubby={pet.obese} bruised={pet.bruised} />
                </div>

                {/* Wallet: bucks balance + XP-trade-in. The "trade-in" is the
                    only way to get bucks from your XP — XP itself never drops. */}
                <div className="ab-wallet">
                    <div className="ab-wallet__balance" aria-label="Atlas Bucks balance">
                        <AtlasBucksIcon size={26} />
                        <span className="ab-wallet__num">{bucks.toLocaleString()}</span>
                        <span className="ab-wallet__label">Atlas Bucks</span>
                    </div>
                    <div className="ab-wallet__trade">
                        <span className="ab-wallet__xp">{xp.toLocaleString()} XP</span>
                        <Button
                            variant={claimable > 0 ? 'primary' : 'secondary'}
                            size="sm"
                            icon="paid"
                            onClick={onTradeIn}
                            disabled={claimable <= 0}
                        >
                            Trade XP{claimable > 0 ? ` (+${claimable.toLocaleString()})` : ''}
                        </Button>
                    </div>
                    <p className="ab-wallet__hint">
                        {CURRENCY_RATE} XP = 1 Atlas Buck · your XP stays after trading.
                    </p>
                </div>

                {(hasHat || hasGlasses) && (
                    <div className="cosmetic-adjust">
                        <div className="cosmetic-adjust__head">
                            <Icon name="open_with" /> Drag Atlas to move the {slot === 'hat' ? 'hat' : 'glasses'}
                        </div>
                        {hasHat && hasGlasses && (
                            <div className="adjust-tabs">
                                <button
                                    className={`adjust-tab ${slot === 'hat' ? 'is-active' : ''}`}
                                    onClick={() => setAdjust('hat')}
                                >
                                    <Icon name="theater_comedy" /> Hat
                                </button>
                                <button
                                    className={`adjust-tab ${slot === 'glasses' ? 'is-active' : ''}`}
                                    onClick={() => setAdjust('glasses')}
                                >
                                    <Icon name="eyeglasses" /> Glasses
                                </button>
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
                        <Button variant="ghost" size="sm" icon="restart_alt" onClick={onResetPos}>
                            Reset position
                        </Button>
                    </div>
                )}
            </div>

            {/* Rename */}
            <div className="store-section">
                <h3 className="store-section-title"><Icon name="badge" /> Name</h3>
                <div className="friend-add">
                    <input
                        className="auth-field__input"
                        value={nameDraft}
                        maxLength={20}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Name your companion"
                    />
                    <Button variant="primary" icon="edit" onClick={onRename}>Rename</Button>
                </div>
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
                    onClick={() => setShopTab('owned')}
                >
                    <Icon name="check_circle" /> Owned
                </button>
                <button
                    className={`lb-filter__btn ${shopTab === 'shop' ? 'is-active' : ''}`}
                    onClick={() => setShopTab('shop')}
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
                return (
                <div className="store-section store-section--cards" key={cat.key}>
                    <div className="store-section-head">
                        <h3 className="store-section-title store-section-title--big">
                            <Icon name={cat.icon} /> {cat.label}
                        </h3>
                        <span className="store-section-count">{entries.length}</span>
                    </div>
                    <div className="cosmetic-grid">
                        {entries.map(([id, item]) => {
                            const owned = isItemOwned(cat.key, id);
                            const equipped = profile.cosmetics[cat.key] === id;
                            const cost = priceOf(item);
                            const canAfford = bucks >= cost;
                            // Preview the item on Atlas: colors recolor the globe; hats /
                            // glasses sit on the player's current globe color.
                            const previewCos = cat.key === 'color'
                                ? { color: id }
                                : { color: profile.cosmetics.color, [cat.key]: id };
                            return (
                                <button
                                    key={id}
                                    className={`cosmetic-card ${equipped ? 'is-equipped' : ''} ${owned ? '' : 'is-locked'}`}
                                    onClick={() => onEquip(cat.key, id, item)}
                                    aria-label={item.name}
                                >
                                    <span className="cosmetic-preview">
                                        <Mascot size={52} mood="idle" cosmetics={previewCos} still />
                                    </span>
                                    <span className="cosmetic-name">{item.name}{item.anim ? ' ✨' : ''}</span>
                                    {equipped ? (
                                        <span className="cosmetic-tag cosmetic-tag--on"><Icon name="check" /> Equipped</span>
                                    ) : owned ? (
                                        <span className="cosmetic-tag">Equip</span>
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
        </div>
    );
}

export default StoreScreen;
