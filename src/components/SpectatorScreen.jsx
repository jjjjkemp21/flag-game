import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';
import { Button, Pill } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import { spectate, useSpectatePoll } from '../lib/spectate';
import { SPECTATOR_PHRASES } from '../lib/spectatorPhrases';
import { useProfile } from '../lib/profile';
import { EMOTES } from '../lib/cosmetics';

const MODE_LABELS = {
    'multiple-choice':    'Multiple Choice',
    'free-response':      'Free Response',
    'mirror':             'Mirror',
    'flash':              'Flash',
    'reverse-mc':         'Reverse MC',
    'globe':              'Globe',
    'pixelated-quiz':     'Pixelated',
    'frenzy-quiz':        'Frenzy',
    'longest-route-quiz': 'Longest Route',
    'language-quiz':      'Language',
    'multiplayer':        'Multiplayer',
};

const IMAGE_BASE_URL = './assets/flags/';
const FLAG_FILE = (code) => (code ? `${IMAGE_BASE_URL}${code.toLowerCase()}.svg` : null);

// A reaction (emote / message) is a brief animated overlay near the corner
// where the spectator's mini-Mascot appears. We track which ones we've
// already shown so a polled item doesn't double-mount.
function ReactionFloat({ reaction, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <motion.div
            className="spectator-reaction-float"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -28 }}
            transition={{ duration: 0.35 }}
        >
            <Mascot
                size={56}
                mood="cheer"
                cosmetics={reaction.fromCosmetics}
                still
                emotePlay={reaction.kind === 'emote' ? { id: reaction.payload && reaction.payload.emoteId, playId: reaction.id } : null}
            />
            <span className="spectator-reaction-name">{reaction.fromUsername}</span>
            {reaction.kind === 'message' && reaction.payload && (
                <span className="spectator-reaction-bubble">{reaction.payload.text}</span>
            )}
        </motion.div>
    );
}

function SpectatorScreen({ targetId, setView }) {
    const toast = useToast();
    const profile = useProfile();
    const [showPhrases, setShowPhrases] = useState(false);
    const [reactCooldownUntil, setReactCooldownUntil] = useState(0);
    const [visibleReactions, setVisibleReactions] = useState([]);
    const [previewPlayId, setPreviewPlayId] = useState(0);
    const seenReactionIdsRef = useRef(new Set());
    const startedRef = useRef(false);

    const { state, error, refresh } = useSpectatePoll(targetId, !!targetId);

    // The 4 emotes the player has slotted into their loadout (from profile).
    // Empty slots ('none') are still rendered as disabled buttons so the bar
    // doesn't shift around as the player swaps emotes in/out.
    const loadout = (profile.cosmetics && profile.cosmetics.emoteLoadout) || ['wave', 'none', 'none', 'none'];

    // Start the spectator session once on mount, leave on unmount. Avoids the
    // race where useSpectatePoll's first GET arrives before /start gets to add
    // us to the spectator map (which would briefly show the wrong watchers list).
    // After start, auto-fire a wave so the target gets a "X just joined" cue —
    // the wave is the free starter emote so every spectator owns it.
    useEffect(() => {
        if (!targetId || startedRef.current) return;
        startedRef.current = true;
        spectate.start(targetId)
            .then(() => {
                refresh();
                // Fire-and-forget greeting wave. Errors here are swallowed —
                // failing to send the welcome wave shouldn't block spectating.
                spectate.react(targetId, { kind: 'emote', emoteId: 'wave' }).catch(() => {});
            })
            .catch((err) => {
                const msg = err && err.data && err.data.error ? err.data.error : 'Could not start spectating.';
                toast.danger(msg);
            });
        return () => {
            spectate.stop(targetId).catch(() => {});
        };
    }, [targetId, refresh, toast]);

    // Surface new reactions from the polled state into the local "floating" list.
    // Cap the visible stack at MAX_VISIBLE_REACTIONS so a flood of emotes/messages
    // doesn't stack into an unreadable column. Keeps the most recent ones.
    const MAX_VISIBLE_REACTIONS = 4;
    useEffect(() => {
        if (!state || !Array.isArray(state.reactions)) return;
        const fresh = state.reactions.filter((r) => !seenReactionIdsRef.current.has(r.id));
        if (fresh.length === 0) return;
        fresh.forEach((r) => seenReactionIdsRef.current.add(r.id));
        setVisibleReactions((prev) => [...prev, ...fresh].slice(-MAX_VISIBLE_REACTIONS));
    }, [state]);

    const dismissReaction = useCallback((id) => {
        setVisibleReactions((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const sendReaction = useCallback(async (body) => {
        if (Date.now() < reactCooldownUntil) return;
        setReactCooldownUntil(Date.now() + 1500);
        // Tiny haptic preview on the player's own mascot icon — fires the
        // emote locally so they get instant feedback while the server
        // round-trip is in flight.
        if (body.kind === 'emote') setPreviewPlayId((n) => n + 1);
        try {
            await spectate.react(targetId, body);
            refresh();
        } catch (err) {
            const msg = err && err.data && err.data.error ? err.data.error : 'Could not send reaction.';
            toast.danger(msg);
        }
    }, [targetId, reactCooldownUntil, refresh, toast]);

    const target = state && state.target;
    const otherSpectators = useMemo(() => {
        if (!state || !state.spectators) return [];
        // The poll returns ALL spectators including the caller — filter to the others.
        return state.spectators;
    }, [state]);

    const gameState = target && target.gameState;
    const promptFlag = gameState && gameState.promptFlagCode ? FLAG_FILE(gameState.promptFlagCode) : null;
    const promptCountry = gameState && gameState.promptCountry;
    const modeLabel = (target && target.activeMode && MODE_LABELS[target.activeMode]) || 'Playing';
    const mascotMood = gameState && gameState.lastAnswerCorrect ? 'cheer' : 'think';
    const finished = gameState && gameState.finished;
    const cooldownActive = Date.now() < reactCooldownUntil;

    if (error && !target) {
        return (
            <div className="quiz-box spectator-screen">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('friends')} aria-label="Back to friends">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="visibility_off" size="xl" />
                    <h2>Not watching anyone</h2>
                    <p>{error}</p>
                    <Button variant="primary" icon="group" onClick={() => setView('friends')}>Back to friends</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-box spectator-screen">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('friends')} aria-label="Back to friends">
                    <Icon name="arrow_back" /> Back
                </button>
                <span className="spectator-watching-pill">
                    <Icon name="visibility" /> Watching {target ? target.username : '…'}
                </span>
            </div>

            <div className="spectator-main">
                <div className="spectator-mascot-wrap">
                    <Mascot
                        size={144}
                        mood={mascotMood}
                        cosmetics={target && target.cosmetics}
                    />
                    <span className="spectator-mode-pill">
                        <Icon name="sports_esports" /> {modeLabel}
                    </span>
                </div>

                {gameState && (
                    <div className="spectator-stats">
                        <Pill tone="primary"><Icon name="star" /> {gameState.score ?? 0}</Pill>
                        <Pill tone="info"><Icon name="local_fire_department" /> {gameState.streak ?? 0}</Pill>
                        {gameState.bestStreak ? (
                            <Pill tone="ghost">Best {gameState.bestStreak}</Pill>
                        ) : null}
                        {finished ? <Pill tone="success">Finished</Pill> : null}
                    </div>
                )}

                {!gameState && (
                    <p className="auth-hint">Loading match…</p>
                )}

                {promptFlag && (
                    <div className="spectator-prompt">
                        <span className="spectator-prompt-label">Current flag</span>
                        <img src={promptFlag} alt="" className="spectator-prompt-flag" />
                    </div>
                )}
                {!promptFlag && promptCountry && (
                    <div className="spectator-prompt">
                        <span className="spectator-prompt-label">Current country</span>
                        <span className="spectator-prompt-country">{promptCountry}</span>
                    </div>
                )}
            </div>

            {otherSpectators.length > 0 && (
                <div className="spectator-watchers-row">
                    <span className="auth-hint">Also watching:</span>
                    {otherSpectators.map((s) => (
                        <span key={s.id} className="spectator-mini-watcher" title={s.username}>
                            <Mascot size={32} cosmetics={s.cosmetics} still />
                            <span className="spectator-mini-name">{s.username}</span>
                        </span>
                    ))}
                </div>
            )}

            <div className="spectator-reaction-tray">
                {loadout.map((emoteId, slotIndex) => {
                    const meta = EMOTES[emoteId];
                    const isEmpty = !emoteId || emoteId === 'none' || !meta;
                    return (
                        <button
                            key={slotIndex}
                            type="button"
                            className={`spectator-emote-slot ${isEmpty ? 'is-empty' : ''}`}
                            onClick={() => !isEmpty && sendReaction({ kind: 'emote', emoteId })}
                            disabled={isEmpty || cooldownActive}
                            aria-label={isEmpty ? `Empty emote slot ${slotIndex + 1}` : `Send ${meta.name}`}
                            title={isEmpty ? 'Equip an emote from the Atlas Shop' : meta.name}
                        >
                            {isEmpty ? (
                                <span className="spectator-emote-slot__empty">
                                    <Icon name="add" />
                                </span>
                            ) : (
                                <Mascot
                                    size={48}
                                    cosmetics={profile.cosmetics}
                                    still
                                    emotePlay={{ id: emoteId, playId: `${slotIndex}-${previewPlayId}` }}
                                />
                            )}
                            {!isEmpty && <span className="spectator-emote-slot__name">{meta.name}</span>}
                        </button>
                    );
                })}
                <button
                    type="button"
                    className="spectator-react-btn"
                    onClick={() => setShowPhrases((v) => !v)}
                    aria-expanded={showPhrases}
                    aria-label="Send a message"
                >
                    <Icon name="chat_bubble" /> Message
                </button>
            </div>

            {showPhrases && (
                <div className="spectator-phrases-grid">
                    {SPECTATOR_PHRASES.map((text, i) => (
                        <button
                            key={i}
                            type="button"
                            className="spectator-phrase-chip"
                            disabled={cooldownActive}
                            onClick={() => {
                                sendReaction({ kind: 'message', messageId: i });
                                setShowPhrases(false);
                            }}
                        >
                            {text}
                        </button>
                    ))}
                </div>
            )}

            <div className="spectator-reactions-stage" aria-live="polite">
                <AnimatePresence>
                    {visibleReactions.map((r) => (
                        <ReactionFloat key={r.id} reaction={r} onDone={() => dismissReaction(r.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SpectatorScreen;
