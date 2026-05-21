import React, { useState } from 'react';
import Icon from './Icon';
import { Toggle, Modal } from './ui';
import { useAudio } from '../audio/AudioProvider';

function Settings({ theme, setTheme, strictSpelling, setStrictSpelling, onResetStats, setView }) {
    const audio = useAudio();
    const [resetOpen, setResetOpen] = useState(false);

    const onSetTheme = (isDark) => setTheme(isDark ? 'dark' : 'light');
    const onSetVolume = (e) => audio.setVolume(parseFloat(e.target.value));

    return (
        <div className="settings-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <h2 className="text-center">Settings</h2>

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
