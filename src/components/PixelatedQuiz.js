import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PixelatedQuiz.css';
import './QuizStyles.css';

const IMAGE_BASE_URL = './assets/flags/';
const GAME_DURATION_MS = 180000;
const NEXT_FLAG_DELAY_MS = 1000;
const PIXELATED_HIGH_SCORE_KEY = 'pixelatedHighScore';

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
    const [feedback, setFeedback] = useState({ text: 'Guess the country!', color: 'var(--text-color)' });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameTimer, setGameTimer] = useState(GAME_DURATION_MS);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [flagOver, setFlagOver] = useState(false);
    const [scoreAnimation, setScoreAnimation] = useState({ points: 0, active: false });
    const [isCorrect, setIsCorrect] = useState(false);

    const inputRef = useRef(null);
    const gameTimerRef = useRef(null);
    const lastTickRef = useRef(null);
    const nextFlagTimeoutRef = useRef(null);

    useEffect(() => {
        const savedHighScore = localStorage.getItem(PIXELATED_HIGH_SCORE_KEY);
        setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
    }, []);

    const getRandomFlag = useCallback(() => {
        if (!allFlagsData || allFlagsData.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * allFlagsData.length);
        return allFlagsData[randomIndex];
    }, [allFlagsData]);

    const nextFlag = useCallback(() => {
        setFlagOver(false);
        setIsCorrect(false);
        const newFlag = getRandomFlag();
        setCurrentFlag(newFlag);
        setRevealIndex(0);
        setLivesRemaining(TOTAL_LIVES);
        setInputValue('');
        setFeedback({ text: 'Guess the country!', color: 'var(--text-color)' });
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [getRandomFlag]);

    const startGame = () => {
        setShowNotification(false);
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        setGameTimer(GAME_DURATION_MS);
        nextFlag();
        lastTickRef.current = performance.now();
    };

    useEffect(() => {
        if (!gameStarted || gameOver) {
            if (gameTimerRef.current) cancelAnimationFrame(gameTimerRef.current);
            return;
        }

        const tick = (timestamp) => {
            if (!lastTickRef.current) {
                lastTickRef.current = timestamp;
            }
            const delta = timestamp - lastTickRef.current;
            lastTickRef.current = timestamp;

            setGameTimer(prev => {
                const newTime = prev - delta;
                if (newTime <= 0) {
                    setGameOver(true);
                    return 0;
                }
                return newTime;
            });
            gameTimerRef.current = requestAnimationFrame(tick);
        };
        gameTimerRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(gameTimerRef.current);
    }, [gameStarted, gameOver]);

    useEffect(() => {
        if (gameOver && gameStarted) {
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem(PIXELATED_HIGH_SCORE_KEY, score.toString());
            }
        }
    }, [gameOver, gameStarted, score, highScore]);

    const triggerScoreAnimation = useCallback((points) => {
        setScore(s => Math.max(0, s + points));
        setScoreAnimation({ points: points, active: true });
        setTimeout(() => {
            setScoreAnimation({ points: 0, active: false });
        }, 1000);
    }, []);

    const handleSkip = useCallback(() => {
        if (gameOver || flagOver) return;
        clearTimeout(nextFlagTimeoutRef.current);
        setIsCorrect(false);
        triggerScoreAnimation(POINTS_SKIP);
        setFeedback({ text: `Skipped! It was ${currentFlag.name}.`, color: 'var(--incorrect-color)' });
        setRevealIndex(BLUR_LEVELS.length - 1);
        setFlagOver(true);
        nextFlagTimeoutRef.current = setTimeout(nextFlag, NEXT_FLAG_DELAY_MS);
    }, [gameOver, flagOver, currentFlag, nextFlag, triggerScoreAnimation]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === '1' && !flagOver && gameStarted && !gameOver) {
            e.preventDefault();
            handleSkip();
        }
    }, [flagOver, gameStarted, gameOver, handleSkip]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        return () => {
            if (nextFlagTimeoutRef.current) {
                clearTimeout(nextFlagTimeoutRef.current);
            }
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (gameOver || flagOver || !currentFlag) return;

        const trimmedInput = inputValue.trim();
        const correctAnswer = currentFlag.name.toLowerCase();
        const attemptIndex = TOTAL_LIVES - livesRemaining;

        if (!trimmedInput || trimmedInput.toLowerCase() !== correctAnswer) {
            const points = POINTS_INCORRECT[attemptIndex];
            if (points !== 0) {
                triggerScoreAnimation(points);
            }
            const newLivesRemaining = livesRemaining - 1;
            setLivesRemaining(newLivesRemaining);
            setInputValue('');

            if (newLivesRemaining <= 0) {
                setIsCorrect(false);
                setFeedback({ text: `❌ Out of guesses! It was ${currentFlag.name}.`, color: 'var(--incorrect-color)' });
                setRevealIndex(BLUR_LEVELS.length - 1);
                setFlagOver(true);
                clearTimeout(nextFlagTimeoutRef.current);
                nextFlagTimeoutRef.current = setTimeout(nextFlag, NEXT_FLAG_DELAY_MS);
            } else {
                setIsCorrect(false);
                const nextRevealIndex = Math.min(revealIndex + 1, BLUR_LEVELS.length - 1);
                setRevealIndex(nextRevealIndex);
                setFeedback({
                    text: !trimmedInput ? '❌ Empty guess! Try again.' : '❌ Incorrect. Try again!',
                    color: 'var(--incorrect-color)'
                });
                setTimeout(() => inputRef.current?.focus(), 0);
            }
        } else {
            setIsCorrect(true);
            const points = POINTS_CORRECT[attemptIndex];
            triggerScoreAnimation(points);
            setFeedback({ text: `✅ Correct! It was ${currentFlag.name}.`, color: 'var(--correct-color)' });
            setRevealIndex(BLUR_LEVELS.length - 1);
            setFlagOver(true);
            clearTimeout(nextFlagTimeoutRef.current);
            nextFlagTimeoutRef.current = setTimeout(nextFlag, NEXT_FLAG_DELAY_MS);
        }
    };

    const handleBack = () => {
        setView('menu');
    };

    const formatTime = (ms) => {
        const seconds = (ms / 1000).toFixed(0);
        return `${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (showNotification) {
        return (
            <div className="pixel-notification-overlay">
                <div className="pixel-notification-box quiz-box">
                    <h2>Pixelated Guess!</h2>
                    <p className="pixel-high-score">High Score: {highScore}</p>
                    <p>You have 60 seconds to guess as many flags as you can.</p>
                    <p>Scoring depends on your guess:</p>
                    <ul className="pixel-rules-list">
                        <li>1st Guess: +20 points</li>
                        <li>2nd Guess: +10 points (-2 if wrong)</li>
                        <li>3rd Guess: +7 points (-1 if wrong)</li>
                        <li>4th Guess: +5 points </li>
                        <li>5th Guess: +3 points </li>
                    </ul>
                    <p className="pixel-tip">Tip: Press '1' to quickly Skip (-3 points).</p>
                    <button className="response-submit" onClick={startGame}>Start Game</button>
                    <button className="back-button" onClick={handleBack} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                </div>
            </div>
        );
    }

    if (gameOver) {
        return (
            <div className="pixel-notification-overlay">
                <div className="pixel-game-over pixel-notification-box quiz-box">
                    <h2>Time's Up!</h2>
                    <p className="pixel-final-score">Final Score: {score}</p>
                    <p className="pixel-high-score">High Score: {highScore}</p>
                    {score > highScore && (
                        <p className="pixel-new-high-score">🎉 New High Score! 🎉</p>
                    )}
                    <button className="response-submit" onClick={startGame}>Play Again</button>
                    <button className="back-button" onClick={handleBack} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                </div>
            </div>
        );
    }

    if (!currentFlag) {
        return <div className="quiz-box"><h2>Loading Game...</h2></div>;
    }

    const currentBlur = BLUR_LEVELS[revealIndex];
    const currentGrayscale = GRAYSCALE_LEVELS[revealIndex];
    const isWavy = currentBlur > 0 && !flagOver;
    const livesLost = TOTAL_LIVES - livesRemaining;

    return (
        <div className="quiz-box pixelated-quiz-box">
            <div className="pixel-game-header">
                <button className="back-button" onClick={handleBack}>←</button>
                <div className="pixel-game-timer">
                    Time: {formatTime(gameTimer)}
                </div>
                <div className="pixel-score">
                    Score: {score}
                    {scoreAnimation.active && (
                        <span className={`score-change ${scoreAnimation.points > 0 ? 'correct' : 'incorrect'}`}>
                            {scoreAnimation.points > 0 ? '+' : ''}{scoreAnimation.points}
                        </span>
                    )}
                </div>
            </div>

            <div className="pixelated-flag-container">
                <img
                    key={`${currentFlag.code}-${revealIndex}`}
                    src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                    alt="Pixelated Flag"
                    className={`pixelated-flag-image ${isWavy ? 'wavy' : ''} ${flagOver ? 'reveal' : ''}`}
                    style={{
                        '--base-blur': `${currentBlur}px`,
                        '--base-grayscale-percent': `${currentGrayscale}%`
                    }}
                />
            </div>

            <div className="lives-container">
                {[...Array(TOTAL_LIVES)].map((_, i) => (
                    <div
                        key={i}
                        className={`life-box ${
                            i < livesLost ? (isCorrect ? 'correct' : 'lost') : ''
                        }`}
                    ></div>
                ))}
            </div>

            <p className="feedback-label" style={{ color: feedback.color, minHeight: '30px', marginBottom: '15px' }}>
                {feedback.text}
            </p>

            <form onSubmit={handleSubmit} className="response-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="response-input"
                    placeholder="Enter country name..."
                    disabled={flagOver || gameOver}
                    autoFocus
                />
                <div className="quiz-actions">
                    <button type="submit" disabled={flagOver || gameOver} className="response-submit">
                        Submit Guess
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
        </div>
    );
}

export default PixelatedQuiz;