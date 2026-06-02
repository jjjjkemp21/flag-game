import React, { useState } from 'react';
import Icon from '../common/Icon';
import { Toggle, Modal, Button } from '../ui/index';
import { useToast } from '../ui/Toast';
import { useAudio } from '../../audio/AudioProvider';
import { useAuth } from '../../auth/AuthProvider';
import { useProfile, setAllowSpectate, unequipAllCosmetics } from '../../lib/profile';
import { api } from '../../api/client';

function Settings({ theme, setTheme, strictSpelling, setStrictSpelling, includeTerritories, setIncludeTerritories, onResetStats, onReplayTutorial, setView }) {
    const audio = useAudio();
    const toast = useToast();
    const { isAuthed, user, patchUser } = useAuth();
    const profile = useProfile();
    const [resetOpen, setResetOpen] = useState(false);
    const [unequipOpen, setUnequipOpen] = useState(false);
    const [nameDraft, setNameDraft] = useState(user?.username || '');
    const [savingName, setSavingName] = useState(false);

    const onSetTheme = (isDark) => setTheme(isDark ? 'dark' : 'light');
    const onSetVolume = (e) => audio.setVolume(parseFloat(e.target.value));

    const onChangeUsername = async () => {
        const next = nameDraft.trim();
        if (!next || next === user?.username) return;
        setSavingName(true);
        try {
            const { user: updated } = await api.post('/auth/username', { username: next });
            // Apply the full server-returned user object so the cache stays in sync
            // (xp, region, pet level, etc.). Server keeps everything keyed by user_id
            // and only updates the username column, so no progress is touched here.
            patchUser(updated);
            toast.success('Username updated!');
        } catch (err) {
            toast.danger(err.message || 'Could not change username.');
        } finally {
            setSavingName(false);
        }
    };

    return (
        <div className="settings-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <h2 className="text-center">Settings</h2>

            {isAuthed && (
                <section className="settings-section">
                    <h3 className="settings-section-title">Account</h3>
                    <div className="setting-row">
                        <div className="setting-row__label">
                            <span className="setting-row__title">Username</span>
                            <span className="setting-row__desc">3–20 letters, numbers, or underscores. Must be unique.</span>
                        </div>
                    </div>
                    <div className="friend-add">
                        <input
                            className="auth-field__input"
                            value={nameDraft}
                            maxLength={20}
                            onChange={(e) => setNameDraft(e.target.value)}
                            placeholder="Your username"
                        />
                        <Button
                            variant="primary"
                            icon="badge"
                            onClick={onChangeUsername}
                            disabled={savingName || !nameDraft.trim() || nameDraft.trim() === user?.username}
                        >
                            Save
                        </Button>
                    </div>
                </section>
            )}

            <section className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>
                <div className="setting-row">
                    <div className="setting-row__label">
                        <span className="setting-row__title">Dark Mode</span>
                        <span className="setting-row__desc">Switch the visual theme.</span>
                    </div>
                    <Toggle checked={theme === 'dark'} onChange={onSetTheme} ariaLabel="Toggle dark mode" />
                </div>
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title">Sound</h3>
                <div className="setting-row">
                    <div className="setting-row__label">
                        <span className="setting-row__title">Sound effects</span>
                        <span className="setting-row__desc">UI clicks, chimes, and game feedback.</span>
                    </div>
                    <Toggle
                        checked={!audio.isMuted}
                        onChange={(on) => audio.setMuted(!on)}
                        ariaLabel="Toggle sound effects"
                    />
                </div>
                {!audio.isMuted && (
                    <div className="setting-row">
                        <div className="setting-row__label">
                            <span className="setting-row__title">Volume</span>
                            <span className="setting-row__desc">Mix level for SFX.</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={audio.volume}
                            onChange={onSetVolume}
                            aria-label="Volume"
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                    </div>
                )}
                <div className="setting-row">
                    <div className="setting-row__label">
                        <span className="setting-row__title">Try a sound</span>
                        <span className="setting-row__desc">Preview the success chime.</span>
                    </div>
                    <button
                        className="ui-button ui-button--secondary ui-button--sm"
                        onClick={() => audio.play('correct')}
                    >
                        <Icon name="volume_up" /> Play
                    </button>
                </div>
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title">Gameplay</h3>
                <div className="setting-row">
                    <div className="setting-row__label">
                        <span className="setting-row__title">Strict spelling</span>
                        <span className="setting-row__desc">Require exact answers.</span>
                    </div>
                    <Toggle
                        checked={strictSpelling}
                        onChange={(on) => setStrictSpelling(on)}
                        ariaLabel="Toggle strict spelling"
                    />
                </div>
                <div className="setting-row">
                    <div className="setting-row__label">
                        <span className="setting-row__title">Include territories</span>
                        <span className="setting-row__desc">Add dependent territories &amp; subnational flags to every mode's deck. Off by default.</span>
                    </div>
                    <Toggle
                        checked={!!includeTerritories}
                        onChange={(on) => setIncludeTerritories(on)}
                        ariaLabel="Toggle including territories"
                    />
                </div>
            </section>

            {isAuthed && (
                <section className="settings-section">
                    <h3 className="settings-section-title">Privacy</h3>
                    <div className="setting-row">
                        <div className="setting-row__label">
                            <span className="setting-row__title">Allow friends to spectate me</span>
                            <span className="setting-row__desc">
                                Friends can still see when you're playing, but the Eye button
                                disappears from their Friends list.
                            </span>
                        </div>
                        <Toggle
                            checked={profile.allowSpectate !== false}
                            onChange={(on) => setAllowSpectate(on)}
                            ariaLabel="Allow friends to spectate me"
                        />
                    </div>
                </section>
            )}

            {isAuthed && (
                <section className="settings-section">
                    <h3 className="settings-section-title">Cosmetics</h3>
                    <div className="setting-row">
                        <div className="setting-row__label">
                            <span className="setting-row__title">Unequip all cosmetics</span>
                            <span className="setting-row__desc">
                                Strip Atlas back to the default look. Your owned items aren't
                                deleted — you can re-equip them anytime from the shop.
                            </span>
                        </div>
                        <Button
                            variant="secondary"
                            icon="layers_clear"
                            onClick={() => { audio.play('click'); setUnequipOpen(true); }}
                        >
                            Unequip all
                        </Button>
                    </div>
                </section>
            )}

            <section className="settings-section">
                <h3 className="settings-section-title">Getting started</h3>
                <div className="setting-row">
                    <div className="setting-row__label">
                        <span className="setting-row__title">Replay tutorial</span>
                        <span className="setting-row__desc">Walk through the basics and a couple of guided rounds again.</span>
                    </div>
                    <Button
                        variant="secondary"
                        icon="school"
                        onClick={() => { audio.play('click'); onReplayTutorial?.(); }}
                    >
                        Replay
                    </Button>
                </div>
            </section>

            <section className="settings-section">
                <h3 className="settings-section-title">Data</h3>
                <button
                    onClick={() => { audio.play('click'); setResetOpen(true); }}
                    className="reset-button"
                >
                    <Icon name="restart_alt" /> Reset All Progress
                </button>
            </section>

            <Modal open={unequipOpen} onClose={() => setUnequipOpen(false)} title="Unequip all cosmetics?">
                <p style={{ color: 'var(--color-ink-soft)' }}>
                    This removes every equipped cosmetic — hat, glasses, mouth, effect,
                    companion, scene, and globe color — and resets their positions. Your
                    owned items stay in your collection, so you can re-equip them anytime.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                    <button
                        className="ui-button ui-button--secondary ui-button--md"
                        onClick={() => setUnequipOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="ui-button ui-button--danger ui-button--md"
                        onClick={() => {
                            setUnequipOpen(false);
                            unequipAllCosmetics();
                            toast.success('Unequipped all cosmetics.');
                        }}
                    >
                        <Icon name="layers_clear" /> Unequip all
                    </button>
                </div>
            </Modal>

            <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all progress?">
                <p style={{ color: 'var(--color-ink-soft)' }}>
                    This will erase your streaks, review schedule, and all high scores. This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                    <button
                        className="ui-button ui-button--secondary ui-button--md"
                        onClick={() => setResetOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="ui-button ui-button--danger ui-button--md"
                        onClick={() => { setResetOpen(false); onResetStats(); }}
                    >
                        <Icon name="restart_alt" /> Reset
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default Settings;
