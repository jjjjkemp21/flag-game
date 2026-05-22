import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import { Button } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { usePet, setPetName } from '../lib/pet';
import { useProfile, setRegion, setCosmetic } from '../lib/profile';
import { CATEGORIES, isUnlocked } from '../lib/cosmetics';

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

    return (
        <div className="quiz-box store-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <h2 className="text-center">Atlas Shop</h2>

            <div className="store-preview">
                <Mascot size={120} mood={pet.alive ? pet.mood : 'idle'} cosmetics={profile.cosmetics} />
                <p className="auth-hint">You have <strong>{xp} XP</strong> to unlock cosmetics.</p>
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

            {/* Cosmetics */}
            {CATEGORIES.map((cat) => (
                <div className="store-section" key={cat.key}>
                    <h3 className="settings-section-title"><Icon name={cat.icon} /> {cat.label}</h3>
                    <div className="cosmetic-grid">
                        {Object.entries(cat.items).map(([id, item]) => {
                            const unlocked = isUnlocked(xp, item);
                            const equipped = profile.cosmetics[cat.key] === id;
                            return (
                                <button
                                    key={id}
                                    className={`cosmetic-card ${equipped ? 'is-equipped' : ''} ${unlocked ? '' : 'is-locked'}`}
                                    onClick={() => onEquip(cat.key, id, item)}
                                    aria-label={item.name}
                                >
                                    {cat.key === 'color' && (
                                        <span
                                            className={`cosmetic-swatch ${item.anim ? 'cosmetic-swatch--anim' : ''}`}
                                            style={{
                                                background: `linear-gradient(135deg, ${item.stops[0]}, ${item.stops[1]}, ${item.stops[2]})`,
                                                backgroundSize: item.anim ? '220% 220%' : undefined,
                                            }}
                                        />
                                    )}
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
            ))}
        </div>
    );
}

export default StoreScreen;
