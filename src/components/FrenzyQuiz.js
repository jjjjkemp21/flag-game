import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAnswer } from '../answer_check';
import Icon from './Icon';
import { ScoreBubble, ProgressRing } from './ui';
import Mascot from '../assets/illustrations/Mascot';
import { useAudio } from '../audio/AudioProvider';
import { getHighScore, recordHighScore, flushBonus } from '../lib/progress';
import { bumpQuestMetric, reportHwm } from '../lib/quests';
import { addEarnedBucks } from '../lib/currency';
import { rollChest, MIN_CORRECT_FOR_CHEST } from '../lib/chest';
import { currentChestYieldMult } from '../lib/xpRoadCatalog';
import ChestReveal from './ChestReveal';
import { refreshBattlepass } from '../lib/battlepass';
import { recordPlay } from '../lib/pet';
import { useQuizPresence } from '../lib/presence';
import SpectatorsBadge from './SpectatorsBadge';
import { variants, springs } from '../motion';

const IMAGE_BASE_URL = './assets/flags/';
const GAME_DURATION_MS = 180000;
const FLAG_TIMER_MS = 30000;
const COOLDOWN_MS = 5000;
const SLOT_COUNT = 4;
const CORRECT_POINTS = 10;
const INCORRECT_POINTS = -5;

const initialSlotState = {
    flag: null,
    inputValue: '',
    timer: FLAG_TIMER_MS,
    cooldown: 0,
    isCorrect: null,
};

function FrenzyQuiz({ allFlagsData, setView }) {
    const [slots, setSlots] = useState(() => Array(SLOT_COUNT).fill(initialSlotState));
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => getHighScore('frenzy'));
    const [gameTimer, setGameTimer] = useState(GAME_DURATION_MS);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [chest, setChest] = useState(null);
    const [scoreDelta, setScoreDelta] = useState(null);
    const [shake, setShake] = useState(false);
    const [countdown, setCountdown] = useState(null); // 3..1 pre-game, then null
    const audio = useAudio();
    const inputRefs = useRef([]);
    const gameTimerRef = useRef(null);
    const lastTickRef = useRef(null);
    const tickedRef = useRef(false);

    const isPlaying = gameStarted && !gameOver;
    const { watchers, lastReactionId } = useQuizPresence(isPlaying ? 'frenzy-quiz' : null, {
        score, streak: 0,
    });
    // Authoritative copy of the slots so the animation frame can read + write them
    // synchronously without depending on React's async state. Every writer goes
    // through commitSlots so the ref and state never diverge.
    const slotsRef = useRef(slots);
    const liveRef = useRef({});
    const commitSlots = useCallback((next) => {
        slotsRef.current = next;
        setSlots(next);
    }, []);

    useEffect(() => {
        setHighScore(getHighScore('frenzy'));
    }, []);

    const getUniqueFlag = useCallback((currentFlags) => {
        if (!allFlagsData || allFlagsData.length === 0) return null;
        let newFlag;
        const currentCodes = currentFlags.map(f => f?.code).filter(Boolean);
        do {
            newFlag = allFlagsData[Math.floor(Math.random() * allFlagsData.length)];
        } while (currentCodes.includes(newFlag.code));
        return newFlag;
    }, [allFlagsData]);

    // Actually start the round (called when the pre-game countdown hits zero).
    const launch = () => {
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        setGameTimer(GAME_DURATION_MS);
        const initialFlags = [];
        for (let i = 0; i < SLOT_COUNT; i++) {
            const newFlag = getUniqueFlag(initialFlags);
            initialFlags.push(newFlag);
        }
        commitSlots(initialFlags.map(flag => ({ ...initialSlotState, flag })));
        lastTickRef.current = null;
        tickedRef.current = false;
        setCountdown(null);
    };

    // Kick off the 3-2-1 countdown before the round begins.
    const startGame = () => {
        setShowNotification(false);
        setGameOver(false);
        setGameStarted(false);
        setCountdown(3);
    };

    // Drive the pre-game countdown: tick once a second, then launch at zero.
    useEffect(() => {
        if (countdown == null) return undefined;
        if (countdown <= 0) {
            launch();
            return undefined;
        }
        audio.play('tick');
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    const handleBack = () => setView('menu');

    const handleKeyDown = useCallback((e) => {
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key, 10) - 1;
            if (inputRefs.current[index]) {
                e.preventDefault();
                inputRefs.current[index].focus();
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        const gameTimer = gameTimerRef.current;
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(gameTimer);
        };
    }, [handleKeyDown]);

    const triggerScoreDelta = useCallback((points) => {
        setScoreDelta(points);
        setTimeout(() => setScoreDelta(null), 800);
    }, []);

    const triggerShake = useCallback(() => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }, []);

    const triggerIncorrect = useCallback((index, isExpired = false) => {
        setScore(s => Math.max(0, s + INCORRECT_POINTS));
        if (!isExpired) triggerShake();
        audio.play('incorrect');
        triggerScoreDelta(INCORRECT_POINTS);
        commitSlots(slotsRef.current.map((slot, i) =>
            i === index ? { ...slot, cooldown: COOLDOWN_MS, isCorrect: false, timer: 0 } : slot
        ));
    }, [triggerShake, triggerScoreDelta, audio, commitSlots]);

    useEffect(() => {
        if (gameOver) {
            if (score > highScore) {
                setHighScore(score);
                recordHighScore('frenzy', score);
                // Push the new high synchronously so the battlepass refresh
                // reads it instead of the previous (stale) bonus_scores_json.
                flushBonus().then(() => refreshBattlepass());
            }
            bumpQuestMetric('bonus_play', 1);
            bumpQuestMetric('frenzy_play', 1);
            reportHwm('frenzy_score', score);
            // End-of-run chest. Frenzy has no explicit accuracy metric, so we
            // approximate it from score relative to a "good run" threshold of
            // 30 — anything at or above that biases the chest toward higher
            // rarities, matching how the standard quizzes' accuracy boost works.
            const correct = Math.max(MIN_CORRECT_FOR_CHEST, score);
            const accuracy = Math.min(1, score / 30);
            const rolled = rollChest({ correct, accuracy, bestStreak: Math.floor(score / 5), mode: 'frenzy', yieldMult: currentChestYieldMult() });
            if (rolled) {
                addEarnedBucks(rolled.bucks);
                setChest(rolled);
            }
        }
    }, [gameOver, score, highScore]);

    useEffect(() => {
        if (gameOver) recordPlay(1.5);
    }, [gameOver]);

    // Keep the latest helpers in a ref so the animation loop never needs them in
    // its dependency array — re-subscribing the loop on every render (e.g. when
    // the audio context object changes identity) can starve requestAnimationFrame
    // and freeze the timer bars even as the clock keeps counting down.
    liveRef.current = { getUniqueFlag, audio, triggerScoreDelta };

    useEffect(() => {
        if (!gameStarted || gameOver) return undefined;
        let raf = 0;

        const tick = (timestamp) => {
            if (lastTickRef.current == null) lastTickRef.current = timestamp;
            const delta = timestamp - lastTickRef.current;
            lastTickRef.current = timestamp;
            const { getUniqueFlag: pick, audio: sfx, triggerScoreDelta: flashDelta } = liveRef.current;

            setGameTimer(prev => {
                const newTime = prev - delta;
                if (newTime <= 5000 && !tickedRef.current) {
                    sfx.play('tick');
                    tickedRef.current = true;
                    setTimeout(() => { tickedRef.current = false; }, 800);
                }
                if (newTime <= 0) {
                    sfx.play('gameOver');
                    setGameOver(true);
                    return 0;
                }
                return newTime;
            });

            // Advance slot timers/cooldowns synchronously off the ref so we can also
            // tally expiries this frame (instead of triggering setState inside a
            // setState updater, which doesn't compose).
            const prev = slotsRef.current;
            const currentFlags = prev.map(s => s.flag);
            let expired = 0;
            const next = prev.map((slot) => {
                if (slot.cooldown > 0) {
                    const newCooldown = slot.cooldown - delta;
                    if (newCooldown <= 0) {
                        return { flag: pick(currentFlags), inputValue: '', timer: FLAG_TIMER_MS, cooldown: 0, isCorrect: null };
                    }
                    return { ...slot, cooldown: newCooldown };
                }
                if (slot.timer > 0) {
                    const newTimer = slot.timer - delta;
                    if (newTimer <= 0) {
                        expired += 1;
                        return { ...slot, timer: 0, cooldown: COOLDOWN_MS, isCorrect: false };
                    }
                    return { ...slot, timer: newTimer };
                }
                return slot;
            });
            commitSlots(next);

            if (expired > 0) {
                setScore(s => Math.max(0, s + INCORRECT_POINTS * expired));
                sfx.play('incorrect');
                flashDelta(INCORRECT_POINTS);
            }

            raf = requestAnimationFrame(tick);
            gameTimerRef.current = raf;
        };

        raf = requestAnimationFrame(tick);
        gameTimerRef.current = raf;
        return () => cancelAnimationFrame(raf);
    }, [gameStarted, gameOver, commitSlots]);

    const handleSubmit = (e, index) => {
        e.preventDefault();
        const slot = slotsRef.current[index];
        if (slot.cooldown > 0 || gameOver || !gameStarted) return;

        if (checkAnswer(slot.inputValue, slot.flag)) {
            audio.play('correct');
            setScore(s => s + CORRECT_POINTS);
            triggerScoreDelta(CORRECT_POINTS);
            commitSlots(slotsRef.current.map((s, i) =>
                i === index ? { ...s, cooldown: COOLDOWN_MS, isCorrect: true, timer: 0 } : s
            ));
            setTimeout(() => inputRefs.current[index]?.blur(), 100);
        } else {
            triggerIncorrect(index);
        }
    };

    const handleInputChange = (e, index) => {
        const value = e.target.value;
        commitSlots(slotsRef.current.map((s, i) =>
            i === index ? { ...s, inputValue: value } : s
        ));
    };

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (showNotification) {
        return (
            <div className="frenzy-notification-overlay">
                <motion.div
                    className="frenzy-notification-box"
                    variants={variants.modal}
                    initial="initial"
                    animate="animate"
                >
                    <Mascot size={88} mood="cheer" />
                    <h2>Frenzy Mode!</h2>
                    <p className="frenzy-high-score">High Score: {highScore}</p>
                    <p>Guess as many flags as you can in 3 minutes!</p>
                    <p>Each flag has a 30-second timer. Correct guesses add 10 points. Wrong guesses or expired timers lose 5 points.</p>
                    <p className="frenzy-tip">Tip: Press '1-4' to swap between flags!</p>
                    <button className="response-submit" onClick={() => { audio.play('click'); startGame(); }}>Start Game</button>
                    <button className="back-button menu-back-button" onClick={handleBack}>
                        <Icon name="arrow_back" /> Back to Menu
                    </button>
                </motion.div>
            </div>
        );
    }

    if (gameOver) {
        const unansweredSlots = slots.filter(s => s.flag && (s.cooldown === 0 || s.isCorrect === null));
        return (
            <div className="frenzy-notification-overlay">
                <motion.div
                    className="frenzy-notification-box"
                    variants={variants.modal}
                    initial="initial"
                    animate="animate"
                >
                    <Mascot size={88} mood={score > highScore ? 'cheer' : 'sad'} />
                    <h2>Game Over!</h2>
                    <p className="frenzy-final-score">Final Score: {score}</p>
                    <p className="frenzy-high-score">High Score: {highScore}</p>
                    {score > highScore && (
                        <p className="frenzy-new-high-score">
                            <Icon name="emoji_events" variant="highlight" size="lg" pop /> New High Score!
                        </p>
                    )}
                    {unansweredSlots.length > 0 && (
                        <div className="frenzy-unanswered">
                            <p className="frenzy-unanswered-title">Flags you didn't finish:</p>
                            <ul className="frenzy-unanswered-list">
                                {unansweredSlots.map((s, i) => <li key={i}>{s.flag.name}</li>)}
                            </ul>
                        </div>
                    )}
                    <button className="response-submit" onClick={() => { audio.play('click'); startGame(); }}>Play Again</button>
                    <button className="back-button menu-back-button" onClick={handleBack}>
                        <Icon name="arrow_back" /> Back to Menu
                    </button>
                </motion.div>
            </div>
        );
    }

    if (countdown != null && !gameStarted) {
        return (
            <div className="frenzy-notification-overlay">
                <motion.div
                    key={countdown}
                    className="frenzy-countdown"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={springs.bouncy}
                >
                    {countdown > 0 ? countdown : 'Go!'}
                </motion.div>
                <p className="frenzy-countdown-hint">Get ready…</p>
            </div>
        );
    }

    const timerProgress = gameTimer / GAME_DURATION_MS;
    const timerSeconds = Math.ceil(gameTimer / 1000);
    const timerTone = timerSeconds <= 15 ? 'danger' : timerSeconds <= 30 ? 'accent' : 'primary';

    return (
        <motion.div
            className={`frenzy-quiz-container ${shake ? 'shake' : ''}`}
            animate={shake ? { x: [0, -8, 6, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="frenzy-header">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <ProgressRing value={timerProgress} size={72} stroke={7} tone={timerTone}>
                    {formatTime(gameTimer)}
                </ProgressRing>
                <ScoreBubble score={score} icon="star" floatingDelta={scoreDelta} />
                <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
            </div>
            <div className="frenzy-grid">
                {slots.map((slot, index) => {
                    const slotTimerPct = slot.timer / FLAG_TIMER_MS;
                    const slotSeconds = Math.ceil(slot.timer / 1000);
                    const barClass = slotSeconds <= 5 ? 'danger' : slotSeconds <= 10 ? 'warn' : '';
                    return (
                        <div key={index} className="frenzy-slot">
                            <AnimatePresence>
                                {slot.cooldown > 0 && (
                                    <motion.div
                                        className={`frenzy-cooldown-overlay ${slot.isCorrect === true ? 'correct' : slot.isCorrect === false ? 'incorrect' : 'expired'}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="frenzy-cooldown-content">
                                            {slot.isCorrect === true && (
                                                <>
                                                    <Icon name="check_circle" variant="correct" size="xl" pop />
                                                    <span>Correct!</span>
                                                    <span className="frenzy-cooldown-answer">{slot.flag?.name}</span>
                                                </>
                                            )}
                                            {slot.isCorrect === false && (
                                                <>
                                                    <Icon name="cancel" variant="incorrect" size="xl" pop />
                                                    <span>Incorrect</span>
                                                    <span className="frenzy-cooldown-answer">{slot.flag?.name || ''}</span>
                                                </>
                                            )}
                                            {slot.isCorrect === null && (
                                                <>
                                                    <Icon name="timer_off" variant="incorrect" size="xl" pop />
                                                    <span>Time's up!</span>
                                                    <span className="frenzy-cooldown-answer">{slot.flag?.name || ''}</span>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {slot.flag && (
                                <>
                                    <motion.img
                                        src={`${IMAGE_BASE_URL}${slot.flag.file}`}
                                        alt={`Flag ${index + 1}`}
                                        className="frenzy-flag-image"
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={springs.gentle}
                                    />
                                    <div className="frenzy-timer-bar-container">
                                        <div
                                            className={`frenzy-timer-bar ${barClass}`}
                                            style={{ transform: `scaleX(${Math.max(0, slotTimerPct)})` }}
                                        />
                                    </div>
                                    <form onSubmit={(e) => handleSubmit(e, index)} className="frenzy-form">
                                        <input
                                            ref={(el) => inputRefs.current[index] = el}
                                            type="text"
                                            value={slot.inputValue}
                                            onChange={(e) => handleInputChange(e, index)}
                                            className="response-input frenzy-input"
                                            placeholder={`Flag ${index + 1}…`}
                                            disabled={slot.cooldown > 0}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                        />
                                    </form>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title="Frenzy complete!"
                subtitle={`Score ${score}`}
                showRarity
                onClose={() => setChest(null)}
            />
        </motion.div>
    );
}

export default FrenzyQuiz;
