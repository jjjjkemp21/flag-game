import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAnswer } from '../answer_check';
import Icon from './Icon';
import { ScoreBubble, ProgressRing } from './ui';
import Mascot from '../assets/illustrations/Mascot';
import Confetti from '../assets/illustrations/Confetti';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { getHighScore, recordHighScore, flushBonus } from '../lib/progress';
import { refreshBattlepass } from '../lib/battlepass';
import { recordPlay } from '../lib/pet';
import { useQuizPresence } from '../lib/presence';
import SpectatorsBadge from './SpectatorsBadge';
import { variants, springs } from '../motion';

const IMAGE_BASE_URL = './assets/flags/';
const GAME_DURATION_MS = 180000;
const NEXT_FLAG_DELAY_MS = 2000;

const TOTAL_LIVES = 5;
const BLUR_LEVELS = [20, 16, 11, 6, 2, 0];
const GRAYSCALE_LEVELS = [100, 80, 60, 30, 0, 0];
const POINTS_CORRECT = [20, 10, 7, 5, 3];
const POINTS_INCORRECT = [0, -2, -1, 0, 0];
const POINTS_SKIP = -3;

function PixelatedQuiz({ allFlagsData, setView }) {
    const [currentFlag, setCurrentFlag] = useState(null);
    const [revealIndex, setRevealIndex] = useState(0);
    const [livesRemaining, setLivesRemaining] = useState(TOTAL_LIVES);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState({ text: 'Guess the country!', color: 'var(--color-ink-soft)' });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => getHighScore('pixelated'));
    const [gameTimer, setGameTimer] = useState(GAME_DURATION_MS);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [flagOver, setFlagOver] = useState(false);
    const [scoreDelta, setScoreDelta] = useState(null);
    const [isCorrect, setIsCorrect] = useState(false);
    const [flashColor, setFlashColor] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const audio = useAudio();
    const inputRef = useRef(null);
    const nextFlagTimeoutRef = useRef(null);

    const isPlaying = gameStarted && !gameOver;
    const { watchers, lastReactionId } = useQuizPresence(isPlaying ? 'pixelated-quiz' : null, {
        score, streak: 0,
        promptKind: 'flag',
        promptFlagCode: currentFlag ? currentFlag.code : undefined,
    });

    useEffect(() => {
        setHighScore(getHighScore('pixelated'));
    }, []);

    const getRandomFlag = useCallback(() => {
        if (!allFlagsData || allFlagsData.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * allFlagsData.length);
        return allFlagsData[randomIndex];
    }, [allFlagsData]);

    const nextFlag = useCallback(() => {
        setFlagOver(false);
        setIsCorrect(false);
        setFlashColor(null);
        setShowConfetti(false);
        const newFlag = getRandomFlag();
        setCurrentFlag(newFlag);
        setRevealIndex(0);
        setLivesRemaining(TOTAL_LIVES);
        setInputValue('');
        setFeedback({ text: 'Guess the country!', color: 'var(--color-ink-soft)' });
    }, [getRandomFlag]);

    const startGame = () => {
        setShowNotification(false);
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        setGameTimer(GAME_DURATION_MS);
        nextFlag();
    };

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const timerId = setInterval(() => {
            setGameTimer(prev => {
                const newTime = prev - 1000;
                if (newTime <= 5000 && newTime > 0 && newTime % 1000 === 0) {
                    audio.play('tick', { volume: 0.6 });
                }
                if (newTime <= 0) {
                    clearInterval(timerId);
                    audio.play('gameOver');
                    if (!flagOver && currentFlag) {
                        setIsCorrect(false);
                        setFlashColor('incorrect');
                        setFeedback({
                            text: `Time's up! The answer was ${currentFlag.name}.`,
                            color: 'var(--color-danger-deep)',
                        });
                        setRevealIndex(BLUR_LEVELS.length - 1);
                        setFlagOver(true);
                        clearTimeout(nextFlagTimeoutRef.current);
                        nextFlagTimeoutRef.current = setTimeout(() => setGameOver(true), NEXT_FLAG_DELAY_MS);
                    } else {
                        setGameOver(true);
                    }
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [gameStarted, gameOver, flagOver, currentFlag, audio]);

    useEffect(() => {
        if (gameStarted && !gameOver && !flagOver && inputRef.current) {
            const focusTimeout = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(focusTimeout);
        }
    }, [gameStarted, gameOver, flagOver, revealIndex, currentFlag]);

    useEffect(() => {
        if (gameOver && gameStarted) {
            if (score > highScore) {
                setHighScore(score);
                recordHighScore('pixelated', score);
                flushBonus().then(() => refreshBattlepass());
            }
        }
    }, [gameOver, gameStarted, score, highScore]);

    useEffect(() => {
        if (gameOver && gameStarted) recordPlay(1.5);
    }, [gameOver, gameStarted]);

    const triggerScoreChange = useCallback((points) => {
        setScore(s => Math.max(0, s + points));
        setScoreDelta(points);
        setTimeout(() => setScoreDelta(null), 800);
    }, []);

    const handleSkip = useCallback(() => {
        if (gameOver || flagOver) return;
        clearTimeout(nextFlagTimeoutRef.current);
        setIsCorrect(false);
        setFlashColor('incorrect');
        audio.play('incorrect');
        triggerScoreChange(POINTS_SKIP);
        setFeedback({ text: `Skipped. The answer was ${currentFlag.name}.`, color: 'var(--color-danger-deep)' });
        setRevealIndex(BLUR_LEVELS.length - 1);
        setFlagOver(true);
        nextFlagTimeoutRef.current = setTimeout(nextFlag, NEXT_FLAG_DELAY_MS);
    }, [gameOver, flagOver, currentFlag, nextFlag, triggerScoreChange, audio]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === '1' && !flagOver && gameStarted && !gameOver) {
            e.preventDefault();
            handleSkip();
        }
    }, [flagOver, gameStarted, gameOver, handleSkip]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => () => {
        if (nextFlagTimeoutRef.current) clearTimeout(nextFlagTimeoutRef.current);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (gameOver || flagOver || !currentFlag) return;

        const trimmedInput = inputValue.trim();
        const attemptIndex = TOTAL_LIVES - livesRemaining;
        const wasCorrect = trimmedInput && checkAnswer(trimmedInput, currentFlag);

        if (!wasCorrect) {
            audio.play('incorrect');
            const points = POINTS_INCORRECT[attemptIndex];
            if (points !== 0) triggerScoreChange(points);
            const newLivesRemaining = livesRemaining - 1;
            setLivesRemaining(newLivesRemaining);
            setInputValue('');

            if (newLivesRemaining <= 0) {
                setIsCorrect(false);
                setFlashColor('incorrect');
                setFeedback({ text: `Out of guesses! It was ${currentFlag.name}.`, color: 'var(--color-danger-deep)' });
                setRevealIndex(BLUR_LEVELS.length - 1);
                setFlagOver(true);
                clearTimeout(nextFlagTimeoutRef.current);
                nextFlagTimeoutRef.current = setTimeout(nextFlag, NEXT_FLAG_DELAY_MS);
            } else {
                setIsCorrect(false);
                setFlashColor('incorrect');
                const nextRevealIndex = Math.min(revealIndex + 1, BLUR_LEVELS.length - 1);
                setRevealIndex(nextRevealIndex);
                setFeedback({
                    text: !trimmedInput ? 'Empty guess. Try again.' : 'Incorrect. Try again!',
                    color: 'var(--color-danger-deep)',
                });
            }
        } else {
            audio.play('correct');
            setIsCorrect(true);
            setFlashColor('correct');
            setShowConfetti(true);
            const points = POINTS_CORRECT[attemptIndex];
            triggerScoreChange(points);
            setFeedback({ text: `Correct! It was ${currentFlag.name}.`, color: 'var(--color-success-deep)' });
            setRevealIndex(BLUR_LEVELS.length - 1);
            setFlagOver(true);
            clearTimeout(nextFlagTimeoutRef.current);
            nextFlagTimeoutRef.current = setTimeout(nextFlag, NEXT_FLAG_DELAY_MS);
        }
    };

    const handleBack = () => setView('bonus-menu');

    const currentBlur = BLUR_LEVELS[revealIndex];
    const currentGrayscale = GRAYSCALE_LEVELS[revealIndex];
    const isWavy = currentBlur > 0 && !flagOver;
    const livesLost = TOTAL_LIVES - livesRemaining;
    const timerProgress = gameTimer / GAME_DURATION_MS;
    const timerSeconds = Math.ceil(gameTimer / 1000);
    const timerTone = timerSeconds <= 15 ? 'danger' : timerSeconds <= 30 ? 'accent' : 'primary';

    return (
        <>
            <AnimatePresence>
                {(showNotification || gameOver) && (
                    <motion.div
                        className="pixel-notification-overlay"
                        variants={variants.backdrop}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <motion.div
                            className="pixel-notification-box"
                            variants={variants.modal}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {showNotification ? (
                                <>
                                    <Mascot size={88} mood="think" />
                                    <h2>Pixelated Guess</h2>
                                    <p className="pixel-high-score">High Score: {highScore}</p>
                                    <p>You have 180 seconds to guess as many flags as you can.</p>
                                    <ul className="pixel-rules-list">
                                        <li>1st Guess: +20 points</li>
                                        <li>2nd Guess: +10 points (-2 if wrong)</li>
                                        <li>3rd Guess: +7 points (-1 if wrong)</li>
                                        <li>4th Guess: +5 points</li>
                                        <li>5th Guess: +3 points</li>
                                    </ul>
                                    <p className="pixel-tip">Tip: Press '1' to skip (-3 points).</p>
                                    <button className="response-submit" onClick={() => { audio.play('click'); startGame(); }}>Start Game</button>
                                    <button className="back-button menu-back-button" onClick={handleBack}>
                                        <Icon name="arrow_back" /> Back to Menu
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Mascot size={88} mood={score > highScore ? 'cheer' : 'sad'} />
                                    <h2>Time's Up!</h2>
                                    <p className="pixel-final-score">Final Score: {score}</p>
                                    <p className="pixel-high-score">High Score: {highScore}</p>
                                    {score > highScore && (
                                        <p className="pixel-new-high-score">
                                            <Icon name="emoji_events" variant="highlight" size="lg" pop /> New High Score!
                                        </p>
                                    )}
                                    <button className="response-submit" onClick={() => { audio.play('click'); startGame(); }}>Play Again</button>
                                    <button className="back-button menu-back-button" onClick={handleBack}>
                                        <Icon name="arrow_back" /> Back to Menu
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className={`quiz-box pixelated-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}
                style={{ display: (showNotification || gameOver) ? 'none' : 'flex' }}
            >
                {!currentFlag ? (
                    <div className="loading-box">
                        <Spinner />
                        <span>Loading game…</span>
                    </div>
                ) : (
                    <>
                        <div className="pixel-game-header">
                            <button className="back-button" onClick={handleBack} aria-label="Back">
                                <Icon name="arrow_back" />
                            </button>
                            <ProgressRing value={timerProgress} size={64} stroke={6} tone={timerTone}>
                                {timerSeconds}s
                            </ProgressRing>
                            <ScoreBubble score={score} icon="star" floatingDelta={scoreDelta} />
                            <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
                        </div>

                        <div className="pixelated-flag-container" style={{ position: 'relative' }}>
                            <motion.img
                                key={`${currentFlag.code}-${revealIndex}`}
                                src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                                alt="Pixelated Flag"
                                className={`pixelated-flag-image ${isWavy ? 'wavy' : ''} ${flagOver ? 'reveal' : ''}`}
                                style={{
                                    '--base-blur': `${currentBlur}px`,
                                    '--base-grayscale-percent': `${currentGrayscale}%`,
                                }}
                                initial={{ scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={springs.gentle}
                            />
                            <AnimatePresence>
                                {showConfetti && <Confetti pieces={24} />}
                            </AnimatePresence>
                        </div>

                        <div className="lives-container" aria-label={`${livesRemaining} guesses left`}>
                            {[...Array(TOTAL_LIVES)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`life-box ${i < livesLost ? (isCorrect ? 'correct' : 'lost') : ''}`}
                                    animate={{ scale: i === livesLost - 1 && !isCorrect ? [1, 0.6, 0.75] : 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            ))}
                        </div>

                        <div className="feedback-label pixel-feedback" style={{ color: feedback.color }} aria-live="polite">
                            <div className="feedback-row">
                                {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                                {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                                <span>{feedback.text}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="response-form">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="response-input"
                                placeholder="Enter country name…"
                                disabled={flagOver || gameOver}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                            />
                            <div className="quiz-actions">
                                <button type="submit" disabled={flagOver || gameOver} className="response-submit">
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    disabled={flagOver || gameOver}
                                    className="skip-button"
                                >
                                    Skip
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}

export default PixelatedQuiz;
