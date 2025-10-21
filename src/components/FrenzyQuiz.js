import React, { useState, useEffect, useCallback, useRef } from 'react';
import './FrenzyQuiz.css';
import './QuizStyles.css';

const IMAGE_BASE_URL = './assets/flags/';
const GAME_DURATION_MS = 180000;
const FLAG_TIMER_MS = 30000;
const COOLDOWN_MS = 5000;
const SLOT_COUNT = 4;
const CORRECT_POINTS = 10;
const INCORRECT_POINTS = -5;
const FRENZY_HIGH_SCORE_KEY = 'frenzyHighScore';

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
    const [highScore, setHighScore] = useState(0);
    const [gameTimer, setGameTimer] = useState(GAME_DURATION_MS);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [scoreAnimation, setScoreAnimation] = useState({ points: 0, active: false });
    const [shake, setShake] = useState(false);
    const inputRefs = useRef([]);
    const gameTimerRef = useRef(null);
    const lastTickRef = useRef(null);

    useEffect(() => {
        const savedHighScore = localStorage.getItem(FRENZY_HIGH_SCORE_KEY);
        setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
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

    const populateSlot = useCallback((index) => {
        setSlots(prevSlots => {
            const currentFlags = prevSlots.map(s => s.flag);
            const newFlag = getUniqueFlag(currentFlags);
            const newSlots = [...prevSlots];
            newSlots[index] = {
                flag: newFlag,
                inputValue: '',
                timer: FLAG_TIMER_MS,
                cooldown: 0,
                isCorrect: null,
            };
            return newSlots;
        });
    }, [getUniqueFlag]);

    const startGame = () => {
        setShowNotification(false);
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        setGameTimer(GAME_DURATION_MS);
        const initialFlags = [];
        for (let i = 0; i < SLOT_COUNT; i++) {
            const newFlag = getUniqueFlag(initialFlags);
            initialFlags.push(newFlag);
        }
        setSlots(initialFlags.map(flag => ({
            ...initialSlotState,
            flag: flag,
        })));
        lastTickRef.current = performance.now();
    };

    const handleBack = () => {
        setView('menu');
    };

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

    const triggerScoreAnimation = useCallback((points) => {
        setScoreAnimation({ points: points, active: true });
        setTimeout(() => {
            setScoreAnimation({ points: 0, active: false });
        }, 1000);
    }, []);

    const triggerShake = useCallback(() => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }, []);

    const triggerIncorrect = useCallback((index, isExpired = false) => {
        setScore(s => Math.max(0, s + INCORRECT_POINTS));
        if (!isExpired) {
            triggerShake();
        }
        triggerScoreAnimation(INCORRECT_POINTS);
        setSlots(prev => {
            const newSlots = [...prev];
            newSlots[index] = { ...newSlots[index], cooldown: COOLDOWN_MS, isCorrect: false, timer: 0 };
            return newSlots;
        });
    }, [triggerShake, triggerScoreAnimation]);

    useEffect(() => {
        if (gameOver) {
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem(FRENZY_HIGH_SCORE_KEY, score.toString());
            }
        }
    }, [gameOver, score, highScore]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

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

            setSlots(prevSlots => prevSlots.map((slot, index) => {
                if (slot.cooldown > 0) {
                    const newCooldown = slot.cooldown - delta;
                    if (newCooldown <= 0) {
                        populateSlot(index);
                        return { ...slot, cooldown: 0 };
                    }
                    return { ...slot, cooldown: newCooldown };
                } else if (slot.timer > 0) {
                    const newTimer = slot.timer - delta;
                    if (newTimer <= 0) {
                        triggerIncorrect(index, true);
                        return { ...slot, timer: 0 };
                    }
                    return { ...slot, timer: newTimer };
                }
                return slot;
            }));

            gameTimerRef.current = requestAnimationFrame(tick);
        };

        gameTimerRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(gameTimerRef.current);

    }, [gameStarted, gameOver, populateSlot, triggerIncorrect]);

    const handleSubmit = (e, index) => {
        e.preventDefault();
        const slot = slots[index];
        if (slot.cooldown > 0 || gameOver || !gameStarted) return;

        const answer = slot.inputValue.trim().toLowerCase();
        const correctAnswer = slot.flag.name.toLowerCase();

        if (answer === correctAnswer) {
            setScore(s => s + CORRECT_POINTS);
            triggerScoreAnimation(CORRECT_POINTS);
            setSlots(prev => {
                const newSlots = [...prev];
                newSlots[index] = { ...newSlots[index], cooldown: COOLDOWN_MS, isCorrect: true, timer: 0 };
                return newSlots;
            });
            setTimeout(() => inputRefs.current[index]?.blur(), 100);
        } else {
            triggerIncorrect(index);
        }
    };

    const handleInputChange = (e, index) => {
        const value = e.target.value;
        setSlots(prev => {
            const newSlots = [...prev];
            newSlots[index] = { ...newSlots[index], inputValue: value };
            return newSlots;
        });
    };

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (showNotification) {
        return (
            <div className="frenzy-notification-overlay">
                <div className="frenzy-notification-box">
                    <h2>Frenzy Mode!</h2>
                    <p className="frenzy-high-score">High Score: {highScore}</p>
                    <p>Guess as many flags as you can in 3 minutes!</p>
                    <p>Each flag has a 30-second timer. Correct guesses add 10 points. Wrong guesses or expired timers lose 5 points.</p>
                    <p className="frenzy-tip">Tip: Press a number '1-4' to quickly swap between flags!</p>
                    <button className="response-submit" onClick={startGame}>Start Game</button>
                    <button className="back-button" onClick={handleBack} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                </div>
            </div>
        );
    }

    if (gameOver) {
        return (
            <div className="frenzy-notification-overlay">
                <div className="frenzy-game-over frenzy-notification-box">
                    <h2>Game Over!</h2>
                    <p className="frenzy-final-score">Final Score: {score}</p>
                    <p className="frenzy-high-score">High Score: {highScore}</p>
                    {score > highScore && (
                        <p className="frenzy-new-high-score">🎉 New High Score! 🎉</p>
                    )}
                    <button className="response-submit" onClick={startGame}>Play Again</button>
                    <button className="back-button" onClick={handleBack} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`frenzy-quiz-container ${shake ? 'shake' : ''}`}>
            <div className="frenzy-header">
                <button className="back-button" onClick={handleBack}>←</button>
                <div className="frenzy-game-timer">
                    Time: {formatTime(gameTimer)}
                </div>
                <div className="frenzy-score">
                    Score: {score}
                    {scoreAnimation.active && (
                        <span className={`score-change ${scoreAnimation.points > 0 ? 'correct' : 'incorrect'}`}>
                            {scoreAnimation.points > 0 ? '+' : ''}{scoreAnimation.points}
                        </span>
                    )}
                </div>
            </div>
            <div className="frenzy-grid">
                {slots.map((slot, index) => (
                    <div key={index} className="frenzy-slot">
                        {slot.cooldown > 0 && (
                            <div className={`frenzy-cooldown-overlay ${slot.isCorrect === true ? 'correct' : slot.isCorrect === false ? 'incorrect' : 'expired'}`}>
                                {slot.isCorrect === true && "✅ Correct!"}
                                {slot.isCorrect === false && `❌ ${slot.flag?.name || ''}`}
                                {slot.isCorrect === null && `⏰ Times Up!`}
                            </div>
                        )}
                        {slot.flag && (
                            <>
                                <img
                                    src={`${IMAGE_BASE_URL}${slot.flag.file}`}
                                    alt="Flag"
                                    className="frenzy-flag-image"
                                />
                                <div className="frenzy-timer-bar-container">
                                    <div
                                        className="frenzy-timer-bar"
                                        style={{ width: `${(slot.timer / FLAG_TIMER_MS) * 100}%` }}
                                    ></div>
                                </div>
                                <form onSubmit={(e) => handleSubmit(e, index)} className="frenzy-form">
                                    <input
                                        ref={(el) => inputRefs.current[index] = el}
                                        type="text"
                                        value={slot.inputValue}
                                        onChange={(e) => handleInputChange(e, index)}
                                        className="response-input frenzy-input"
                                        placeholder={`Flag ${index + 1}...`}
                                        disabled={slot.cooldown > 0}
                                    />
                                </form>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FrenzyQuiz;