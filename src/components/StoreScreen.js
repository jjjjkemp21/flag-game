import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from './Icon';
import { Button } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { usePet, setPetName } from '../lib/pet';
import { useProfile, setRegion, setCosmetic, setCosmeticPos } from '../lib/profile';
import { CATEGORIES, isUnlocked, DEFAULT_POS } from '../lib/cosmetics';

const FLAG_BASE = './assets/flags/';

function StoreScreen({ setView, flagsData }) {
    const { isAuthed, user } = useAuth();
    const toast = useToast();
    const pet = usePet();
    const profile = useProfile();
    const [nameDraft, setNameDraft] = useState(pet.name);
    const xp = user?.xp || 0;

    const countries = useMemo(
        () => (flagsData || [])
            .map((f) => ({ code: f.code, name: f.country || f.name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [flagsData]
    );

    // Owned vs. shop (not-yet-unlocked) cosmetics.
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
                    <p>Log in to customize Atlas, set your country, and unlock cosmetics by earning XP.</p>
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

    const onEquip = (categoryKey, id, item) => {
        if (!isUnlocked(xp, item)) {
            toast.danger(`Unlocks at ${item.xp} XP`);
            return;
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
                <p className="auth-hint">You have <strong>{xp} XP</strong> to unlock cosmetics.</p>

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
                <h3 className="settings-section-title">Name</h3>
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
                <h3 className="settings-section-title">Region</h3>
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
                    <Icon name="shopping_bag" /> Not owned
                </button>
            </div>

            {/* Cosmetics */}
            {CATEGORIES.map((cat) => {
                const entries = Object.entries(cat.items)
                    .filter(([, item]) => isUnlocked(xp, item) === (shopTab === 'owned'));
                if (entries.length === 0) return null;
                return (
                <div className="store-section" key={cat.key}>
                    <h3 className="settings-section-title"><Icon name={cat.icon} /> {cat.label}</h3>
                    <div className="cosmetic-grid">
                        {entries.map(([id, item]) => {
                            const unlocked = isUnlocked(xp, item);
                            const equipped = profile.cosmetics[cat.key] === id;
                            // Preview the item on Atlas: colors recolor the globe; hats /
                            // glasses sit on the player's current globe color.
                            const previewCos = cat.key === 'color'
                                ? { color: id }
                                : { color: profile.cosmetics.color, [cat.key]: id };
                            return (
                                <button
                                    key={id}
                                    className={`cosmetic-card ${equipped ? 'is-equipped' : ''} ${unlocked ? '' : 'is-locked'}`}
                                    onClick={() => onEquip(cat.key, id, item)}
                                    aria-label={item.name}
                                >
                                    <span className="cosmetic-preview">
                                        <Mascot size={52} mood="idle" cosmetics={previewCos} still />
                                    </span>
                                    <span className="cosmetic-name">{item.name}{item.anim ? ' ✨' : ''}</span>
                                    {equipped ? (
                                        <span className="cosmetic-tag cosmetic-tag--on"><Icon name="check" /> Equipped</span>
                                    ) : unlocked ? (
                                        <span className="cosmetic-tag">Equip</span>
                                    ) : (
                                        <span className="cosmetic-tag cosmetic-tag--lock"><Icon name="lock" /> {item.xp} XP</span>
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
