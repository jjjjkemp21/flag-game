import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../common/Icon';
import { Button, Pill } from '../ui/index';
import { useToast } from '../ui/Toast';
import Mascot from '../../assets/illustrations/Mascot';
import { spectate, useSpectatePoll } from '../../lib/spectate';
import { SPECTATOR_PHRASES } from '../../lib/spectatorPhrases';
import { useProfile } from '../../lib/profile';
import { useAuth } from '../../auth/AuthProvider';
import { EMOTES } from '../../lib/cosmetics';

const MODE_LABELS = {
    'multiple-choice':    'Multiple Choice',
    'free-response':      'Free Response',
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

// A reaction (emote / message) is a brief animated overlay near the centre
// of the spectator screen. We track which ones we've already shown so a
// polled item doesn't double-mount. Messages get a wider bubble so the
// text is always readable, regardless of which device size renders them.
export const REACTION_FLOAT_MS = 2800;
function ReactionFloat({ reaction, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, REACTION_FLOAT_MS);
        return () => clearTimeout(t);
    }, [onDone]);
    const isMessage = reaction.kind === 'message' && reaction.payload;
    return (
        <motion.div
            className={`spectator-reaction-float ${isMessage ? 'is-message' : 'is-emote'}`}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <Mascot
                size={48}
                mood="cheer"
                cosmetics={reaction.fromCosmetics}
                still
                emotePlay={reaction.kind === 'emote' ? { id: reaction.payload && reaction.payload.emoteId, playId: reaction.id } : null}
            />
            <div className="spectator-reaction-body">
                <span className="spectator-reaction-name">{reaction.fromUsername}</span>
                {isMessage && (
                    <span className="spectator-reaction-bubble">{reaction.payload.text}</span>
                )}
            </div>
        </motion.div>
    );
}

function SpectatorScreen({ targetId, setView }) {
    const toast = useToast();
    const profile = useProfile();
    const { user } = useAuth();
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
        // Lock the tray until the float fully fades so back-to-back emotes
        // don't stack on top of each other.
        setReactCooldownUntil(Date.now() + REACTION_FLOAT_MS);
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
        const myId = user && user.id;
        return state.spectators.filter((s) => s.id !== myId);
    }, [state, user]);

    const gameState = target && target.gameState;
    const promptFlag = gameState && gameState.promptFlagCode ? FLAG_FILE(gameState.promptFlagCode) : null;
    const promptCountry = gameState && gameState.promptCountry;
    const promptOptions = gameState && Array.isArray(gameState.options) ? gameState.options : null;
    const modeLabel = (target && target.activeMode && MODE_LABELS[target.activeMode]) || 'Playing';
    const cooldownActive = Date.now() < reactCooldownUntil;

    // Multiplayer matches carry an explicit win/loss outcome once the lobby
    // resolves; solo modes just have a `finished` flag (no opponent to lose
    // to, so "finished" = "completed").
    const mpFinished =
        gameState && gameState.mode === 'multiplayer' && gameState.state === 'finished';
    const mpWon =
        mpFinished && target && gameState.winnerId && gameState.winnerId === target.id;
    const mpLost = mpFinished && !mpWon;
    const soloFinished =
        gameState && gameState.mode !== 'multiplayer' && gameState.finished;
    const showFinishBanner = mpFinished || soloFinished;

    // Mascot mood. Win/loss outcomes pin the expression; otherwise we react
    // to the player's most recent answer (correct → cheer, wrong → sad,
    // unanswered → think).
    let mascotMood = 'think';
    if (mpWon || soloFinished) mascotMood = 'cheer';
    else if (mpLost) mascotMood = 'sad';
    else if (gameState && gameState.lastAnswerCorrect === true) mascotMood = 'cheer';
    else if (gameState && gameState.lastAnswerCorrect === false) mascotMood = 'sad';

    // Briefly flash the prompt panel green/red so the spectator gets a
    // glance-able indication of the spectatee's last answer (poll cadence
    // alone makes the mascot mood easy to miss).
    const [verdictFlash, setVerdictFlash] = useState(null);
    const lastVerdictKeyRef = useRef(null);
    useEffect(() => {
        if (!gameState) return undefined;
        const key = `${gameState.score ?? 0}|${gameState.lastAnswerCorrect}`;
        if (lastVerdictKeyRef.current === key) return undefined;
        lastVerdictKeyRef.current = key;
        if (gameState.lastAnswerCorrect === true) setVerdictFlash('correct');
        else if (gameState.lastAnswerCorrect === false) setVerdictFlash('wrong');
        else return undefined;
        const t = setTimeout(() => setVerdictFlash(null), 1200);
        return () => clearTimeout(t);
    }, [gameState]);

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
        <div className={`quiz-box spectator-screen ${verdictFlash ? `spectator-screen--${verdictFlash}` : ''}`}>
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('friends')} aria-label="Back to friends">
                    <Icon name="arrow_back" />
                </button>
                <span className="spectator-watching-pill">
                    <Icon name="visibility" />
                    <span className="spectator-watching-pill__text">
                        Watching {target ? target.username : '…'}
                    </span>
                </span>
                {verdictFlash && (
                    <span className={`spectator-verdict-pill is-${verdictFlash}`} aria-live="polite">
                        <Icon name={verdictFlash === 'correct' ? 'check_circle' : 'cancel'} />
                        {verdictFlash === 'correct' ? 'Correct!' : 'Wrong'}
                    </span>
                )}
            </div>

            <div className="spectator-main">
                <div className="spectator-mascot-wrap">
                    <Mascot
                        size={132}
                        mood={mascotMood}
                        cosmetics={target && target.cosmetics}
                    />
                    <span className="spectator-mode-pill">
                        <Icon name="sports_esports" /> {modeLabel}
                    </span>
                </div>

                {showFinishBanner && (
                    <div
                        className={`spectator-outcome-banner ${
                            mpWon ? 'is-won' : mpLost ? 'is-lost' : 'is-done'
                        }`}
                    >
                        <Icon
                            name={mpWon ? 'emoji_events' : mpLost ? 'sentiment_dissatisfied' : 'flag'}
                        />
                        <span className="spectator-outcome-banner__title">
                            {mpWon
                                ? `${target ? target.username : 'They'} won!`
                                : mpLost
                                ? `${target ? target.username : 'They'} lost`
                                : `${target ? target.username : 'They'} finished`}
                        </span>
                        {gameState && (
                            <span className="spectator-outcome-banner__sub">
                                Final score {gameState.score ?? 0}
                            </span>
                        )}
                    </div>
                )}

                {gameState && (
                    <div className="spectator-stats">
                        <Pill tone="primary"><Icon name="star" /> {gameState.score ?? 0}</Pill>
                        <Pill tone="info"><Icon name="local_fire_department" /> {gameState.streak ?? 0}</Pill>
                        {gameState.bestStreak ? (
                            <Pill tone="neutral">Best {gameState.bestStreak}</Pill>
                        ) : null}
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

                {promptOptions && promptOptions.length > 0 && (
                    <div className="spectator-options" aria-label="Their answer choices">
                        <span className="spectator-options__label">
                            <Icon name="list_alt" /> Their choices
                        </span>
                        <div className="spectator-options__grid">
                            {promptOptions.map((opt, i) => (
                                <span key={`${opt}-${i}`} className="spectator-option-chip">
                                    <span className="spectator-option-chip__letter">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="spectator-option-chip__text">{opt}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {otherSpectators.length > 0 && (
                <div className="spectator-watchers-row">
                    <span className="auth-hint">Also watching:</span>
                    {otherSpectators.map((s) => (
                        <span key={s.id} className="spectator-mini-watcher" title={s.username}>
                            <Mascot size={28} cosmetics={s.cosmetics} still />
                            <span className="spectator-mini-name">{s.username}</span>
                        </span>
                    ))}
                </div>
            )}

            {/* Reactions overlay — absolutely positioned above the mascot/stats
                so incoming messages from other spectators never get clipped by
                the emote tray or phrase grid below. */}
            <div className="spectator-reactions-stage" aria-live="polite">
                <AnimatePresence>
                    {visibleReactions.map((r) => (
                        <ReactionFloat key={r.id} reaction={r} onDone={() => dismissReaction(r.id)} />
                    ))}
                </AnimatePresence>
            </div>

            <div className="spectator-tray-wrap">
                <div className="spectator-reaction-tray" role="group" aria-label="Send a reaction">
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
                                        size={40}
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
                        className={`spectator-react-btn ${showPhrases ? 'is-open' : ''}`}
                        onClick={() => setShowPhrases((v) => !v)}
                        aria-expanded={showPhrases}
                        aria-label="Send a message"
                    >
                        <Icon name="chat_bubble" />
                        <span className="spectator-react-btn__text">Message</span>
                    </button>
                </div>

                {showPhrases && (
                    <div className="spectator-phrases-grid" role="group" aria-label="Quick messages">
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
            </div>
        </div>
    );
}

export default SpectatorScreen;
