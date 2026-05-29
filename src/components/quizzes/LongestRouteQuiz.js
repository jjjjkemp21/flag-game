import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAnswer } from '../../answer_check';
import Icon from '../common/Icon';
import { ScoreBubble } from '../ui/index';
import Mascot from '../../assets/illustrations/Mascot';
import Confetti from '../../assets/illustrations/Confetti';
import Spinner from '../../assets/illustrations/Spinner';
import { useAudio } from '../../audio/AudioProvider';
import { getHighScore, recordHighScore, flushBonus } from '../../lib/progress';
import { refreshBattlepass } from '../../lib/battlepass';
import { bumpQuestMetric, reportHwm } from '../../lib/quests';
import { addEarnedBucks } from '../../lib/currency';
import { rollChest, MIN_CORRECT_FOR_CHEST, currentChestYieldMult } from '../../lib/chest';
import ChestReveal from '../economy/ChestReveal';
import { recordPlay } from '../../lib/pet';
import { useQuizPresence } from '../../lib/presence';
import SpectatorsBadge from '../social/SpectatorsBadge';
import { variants } from '../../motion/index';

function deg2rad(deg) { return deg * (Math.PI / 180); }
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const IMAGE_BASE_URL = './assets/flags/';
const ROUTES_DATA_URL = './data/longest_routes.json';
const GAME_OVER_DELAY = 2000;

// Length buckets the player picks from on the start screen. The data file has
// 131 chains clustered around 10-24, plus a sparse 35-38 tier (Afghanistan +
// the four neighbours that sit at the centre of the Asia/Europe/Africa
// landmass). Random preserves the pre-feature behaviour. min/max are inclusive.
const BUCKETS = [
    { key: 'short',    label: 'Short',    icon: 'speed',         min: 10, max: 14 },
    { key: 'medium',   label: 'Medium',   icon: 'route',         min: 15, max: 19 },
    { key: 'long',     label: 'Long',     icon: 'hiking',        min: 20, max: 24 },
    { key: 'marathon', label: 'Marathon', icon: 'emoji_events',  min: 35, max: 99 },
    { key: 'random',   label: 'Random',   icon: 'shuffle',       min: 0,  max: 999 },
];

function LongestRouteQuiz({ allFlagsData, setView, strictSpelling = false }) {
    const [allRoutes, setAllRoutes] = useState(null);
    const [routeKeys, setRouteKeys] = useState([]);
    const [quizPath, setQuizPath] = useState([]);
    const [currentPathIndex, setCurrentPathIndex] = useState(0);
    const [currentFlag, setCurrentFlag] = useState(null);

    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState({ text: '' });
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showGameOverScreen, setShowGameOverScreen] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [chest, setChest] = useState(null);

    const [score, setScore] = useState(0);
    const [longestRouteHighScore, setLongestRouteHighScore] = useState(() => getHighScore('longestRoute'));
    const [selectedBucket, setSelectedBucket] = useState('random');

    const [quizStats, setQuizStats] = useState(null);
    const [flashColor, setFlashColor] = useState(null);
    const [scoreDelta, setScoreDelta] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const audio = useAudio();

    const isPlaying = gameStarted && !gameOver;
    const { watchers, lastReactionId } = useQuizPresence(isPlaying ? 'longest-route-quiz' : null, {
        score, streak: 0,
        promptKind: 'flag',
        promptFlagCode: currentFlag ? currentFlag.code : undefined,
    });
    const inputRef = useRef(null);
    const flagMapByName = useRef(new Map());
    const gameOverTimeoutRef = useRef(null);

    useEffect(() => {
        if (gameOver) recordPlay(1.5);
    }, [gameOver]);

    useEffect(() => {
        if (allFlagsData.length > 0 && flagMapByName.current.size === 0) {
            const tempMap = new Map();
            allFlagsData.forEach(flag => tempMap.set(flag.name, flag));
            flagMapByName.current = tempMap;
        }
    }, [allFlagsData]);

    useEffect(() => {
        const loadRoutes = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(ROUTES_DATA_URL);
                const routesData = await response.json();
                setAllRoutes(routesData);
                setRouteKeys(Object.keys(routesData));
            } catch (error) {
                console.error('Failed to load longest routes data:', error);
            }
            setIsLoading(false);
        };
        loadRoutes();
    }, []);

    useEffect(() => () => {
        if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);
    }, []);

    const triggerGameOverSequence = (msg) => {
        setFeedback(msg);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setGameOver(true);
        setIsWin(false);
        // Failed runs still award a (lower-rarity) chest if the player got far
        // enough — feels worse to fail at flag 9 and walk away empty-handed
        // than to skip the celebration on a near-miss.
        bumpQuestMetric('bonus_play', 1);
        bumpQuestMetric('longest_play', 1);
        const reached = Math.max(0, Number(currentPathIndex) || 0);
        reportHwm('longest_score', reached);
        if (reached >= MIN_CORRECT_FOR_CHEST) {
            const rolled = rollChest({ correct: reached, accuracy: 0.7, bestStreak: reached, mode: 'longestRoute', yieldMult: currentChestYieldMult() });
            if (rolled) {
                addEarnedBucks(rolled.bucks);
                setChest(rolled);
            }
        }
        if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = setTimeout(() => setShowGameOverScreen(true), GAME_OVER_DELAY);
    };

    const startGame = () => {
        if (!allRoutes || routeKeys.length === 0 || flagMapByName.current.size === 0) return;

        setShowGameOverScreen(false);
        setFlashColor(null);
        setShowConfetti(false);
        if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);

        // Narrow to chains that fit the chosen length bucket. If for any reason
        // no routes match (data drift), fall back to the full pool so the mode
        // is never bricked.
        const bucket = BUCKETS.find((b) => b.key === selectedBucket) || BUCKETS[BUCKETS.length - 1];
        const eligible = routeKeys.filter((k) => {
            const len = allRoutes[k].length;
            return len >= bucket.min && len <= bucket.max;
        });
        const pool = eligible.length > 0 ? eligible : routeKeys;
        const randomKey = pool[Math.floor(Math.random() * pool.length)];
        const randomPathArray = allRoutes[randomKey];
        setQuizPath(randomPathArray);

        // Distance is computed only if the flags carry coordinates. They
        // currently don't (flags.json has no lat/long), so totalDistance is
        // omitted — but the country/route summary needs no coordinates and is
        // always populated, so the "Longest Journey" recap panel actually shows.
        let calculatedDistance = 0;
        let lastFlagObj = null;
        let hasDistance = true;

        for (const countryName of randomPathArray) {
            const currentFlagObj = flagMapByName.current.get(countryName);
            if (!currentFlagObj || !currentFlagObj.coordinates) {
                hasDistance = false;
                break;
            }
            if (lastFlagObj) {
                calculatedDistance += getDistance(
                    lastFlagObj.coordinates.lat,
                    lastFlagObj.coordinates.long,
                    currentFlagObj.coordinates.lat,
                    currentFlagObj.coordinates.long,
                );
            }
            lastFlagObj = currentFlagObj;
        }

        setQuizStats({
            startingCountry: randomPathArray[0],
            countriesVisited: randomPathArray.length,
            route: randomPathArray.join(' → '),
            ...(hasDistance ? { totalDistance: Math.round(calculatedDistance) } : {}),
        });

        const firstFlagObject = flagMapByName.current.get(randomPathArray[0]);
        if (!firstFlagObject) {
            setFeedback({ text: `Error finding first flag: ${randomPathArray[0]}` });
            return;
        }

        setGameStarted(true);
        setGameOver(false);
        setIsWin(false);
        setScore(0);
        setCurrentPathIndex(0);
        setCurrentFlag(firstFlagObject);
        setFeedback({ text: 'What country is this?' });
        setInputValue('');
    };

    const resetGame = () => {
        setQuizStats(null);
        startGame();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentFlag || !inputValue.trim() || gameOver) return;
        const wasCorrect = checkAnswer(inputValue, currentFlag, strictSpelling);

        if (wasCorrect) {
            audio.play('correct');
            setFlashColor('correct');
            const newIndex = currentPathIndex + 1;
            setScore(newIndex);
            setScoreDelta(1);
            setShowConfetti(true);
            setTimeout(() => setScoreDelta(null), 700);
            setInputValue('');

            if (newIndex === quizPath.length) {
                audio.play('levelUp');
                const finalFlagName = currentFlag.name;
                setFeedback({ text: 'Perfect Run! The final flag was:', answer: finalFlagName, color: 'var(--color-success-deep)' });
                const finalScore = quizPath.length;
                if (finalScore > longestRouteHighScore) {
                    recordHighScore('longestRoute', finalScore);
                    setLongestRouteHighScore(finalScore);
                    flushBonus().then(() => refreshBattlepass());
                }
                bumpQuestMetric('bonus_play', 1);
                bumpQuestMetric('longest_play', 1);
                bumpQuestMetric('perfect_run', 1);
                reportHwm('longest_score', finalScore);
                // Perfect-run chest. Accuracy is effectively 1.0 here so the
                // distribution leans heavily toward higher rarities.
                const rolled = rollChest({ correct: Math.max(MIN_CORRECT_FOR_CHEST, finalScore), accuracy: 1.0, bestStreak: finalScore, mode: 'longestRoute', yieldMult: currentChestYieldMult() });
                if (rolled) {
                    addEarnedBucks(rolled.bucks);
                    setChest(rolled);
                }
                setGameOver(true);
                setIsWin(true);
                if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);
                gameOverTimeoutRef.current = setTimeout(() => setShowGameOverScreen(true), GAME_OVER_DELAY);
            } else {
                setFeedback({ text: 'Correct! That was:', answer: currentFlag.name, color: 'var(--color-success-deep)' });
                setInputValue('');

                setTimeout(() => {
                    setShowConfetti(false);
                    setCurrentPathIndex(newIndex);
                    const nextFlagName = quizPath[newIndex];
                    const nextFlagObject = flagMapByName.current.get(nextFlagName);
                    if (!nextFlagObject) {
                        triggerGameOverSequence({ text: `Error finding next flag: ${nextFlagName}. Game Over.`, color: 'var(--color-danger-deep)' });
                        return;
                    }
                    setCurrentFlag(nextFlagObject);
                    setFlashColor(null);
                    setFeedback({ text: 'What country is this?' });
                }, 1500);
            }
        } else {
            triggerGameOverSequence({ text: 'Incorrect. The answer was:', answer: currentFlag.name, color: 'var(--color-danger-deep)' });
        }
    };

    const handleSkip = () => {
        if (!currentFlag || gameOver) return;
        triggerGameOverSequence({ text: 'Skipped. The answer was:', answer: currentFlag.name, color: 'var(--color-danger-deep)' });
    };

    useEffect(() => {
        if (gameStarted && !gameOver && inputRef.current) {
            const focusTimeout = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(focusTimeout);
        }
    }, [gameStarted, gameOver, currentFlag]);

    const backToMenu = () => setView('bonus-menu');

    if (isLoading || !allRoutes || flagMapByName.current.size === 0) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Loading routes…</span>
            </div>
        );
    }

    if (routeKeys.length === 0) {
        return (
            <div className="pixel-notification-overlay">
                <div className="pixel-notification-box">
                    <h2>No Routes Found</h2>
                    <p>The pre-calculated routes file seems to be empty or missing long enough paths.</p>
                    <button className="back-button menu-back-button" onClick={backToMenu}>
                        <Icon name="arrow_back" /> Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {(!gameStarted || (gameOver && showGameOverScreen)) && (
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
                            {!gameStarted ? (
                                <>
                                    <Mascot size={88} mood="wave" />
                                    <h2>Longest Route</h2>
                                    <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                                    <p>Pick a chain length:</p>
                                    <div className="bucket-picker">
                                        {BUCKETS.map((b) => {
                                            const count = routeKeys.filter((k) => {
                                                const len = allRoutes[k].length;
                                                return len >= b.min && len <= b.max;
                                            }).length;
                                            const disabled = count === 0 && b.key !== 'random';
                                            return (
                                                <button
                                                    key={b.key}
                                                    type="button"
                                                    className={`bucket-chip ${selectedBucket === b.key ? 'is-active' : ''}`}
                                                    onClick={() => setSelectedBucket(b.key)}
                                                    disabled={disabled}
                                                >
                                                    <Icon name={b.icon} /> {b.label}
                                                    <span className="bucket-chip__count">
                                                        {b.key === 'random'
                                                            ? `${routeKeys.length}`
                                                            : `${b.min}${b.max < 99 ? `-${b.max}` : '+'} · ${count}`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ul className="pixel-rules-list">
                                        <li>Guess every flag in a randomly chosen chain, in order.</li>
                                        <li>One incorrect answer or skip ends the game.</li>
                                        <li>Complete the chain to set a new high score!</li>
                                    </ul>
                                    <button className="response-submit" onClick={() => { audio.play('click'); startGame(); }}>Start Challenge</button>
                                    <button className="back-button menu-back-button" onClick={backToMenu}>
                                        <Icon name="arrow_back" /> Back to Menu
                                    </button>
                                </>
                            ) : (
                                <>
                                    {isWin ? (
                                        <>
                                            <Mascot size={88} mood="cheer" />
                                            <h2>You did it!</h2>
                                            <p className="pixel-final-score">Chain Complete: {score}</p>
                                            {score > longestRouteHighScore ? (
                                                <p className="pixel-new-high-score">
                                                    <Icon name="emoji_events" variant="highlight" size="lg" pop /> New High Score!
                                                </p>
                                            ) : (
                                                <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Mascot size={88} mood="sad" />
                                            <h2>Game Over!</h2>
                                            <p className="pixel-final-score">Your chain: {score}</p>
                                            <p className="pixel-high-score">Path length was: {quizPath.length}</p>
                                            <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                                        </>
                                    )}
                                    {quizStats && (
                                        <div style={{
                                            textAlign: 'left', marginTop: 'var(--space-sm)', fontSize: 'var(--fs-sm)',
                                            borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)',
                                            alignSelf: 'stretch',
                                        }}>
                                            <h4 style={{ margin: '0 0 var(--space-xs)', textAlign: 'center' }}>Longest Journey</h4>
                                            <p style={{ margin: '4px 0' }}><strong>Starting Country:</strong> {quizStats.startingCountry}</p>
                                            <p style={{ margin: '4px 0' }}><strong>Countries Visited:</strong> {quizStats.countriesVisited}</p>
                                            {quizStats.totalDistance != null && (
                                                <p style={{ margin: '4px 0' }}><strong>Total Distance:</strong> {quizStats.totalDistance} km</p>
                                            )}
                                            <p style={{ margin: '4px 0', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                                <strong>Route:</strong> {quizStats.route}
                                            </p>
                                        </div>
                                    )}
                                    <button className="response-submit" onClick={() => { audio.play('click'); resetGame(); }}>Play Again</button>
                                    <button className="back-button menu-back-button" onClick={backToMenu}>
                                        <Icon name="arrow_back" /> Back to Menu
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className={`quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}
                style={{ display: (gameStarted && !(gameOver && showGameOverScreen)) ? 'flex' : 'none' }}
            >
                <div className="quiz-topbar">
                    <button className="back-button" onClick={backToMenu} aria-label="Back">
                        <Icon name="arrow_back" />
                    </button>
                    <span className="ui-pill ui-pill--primary">
                        <Icon name="route" /> Chain {score}/{quizPath.length}
                    </span>
                    <ScoreBubble score={score} icon="trending_up" floatingDelta={scoreDelta} />
                    <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
                </div>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {currentFlag && (
                        <motion.img
                            key={currentFlag.file}
                            src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                            alt="Flag"
                            className="flag-image"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                    )}
                    <AnimatePresence>
                        {showConfetti && <Confetti pieces={20} />}
                    </AnimatePresence>
                </div>

                <div className="feedback-label" style={{ color: feedback.color || 'var(--color-ink-soft)' }} aria-live="polite">
                    <div className="feedback-row">
                        {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                        {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                        <span>{feedback.text}</span>
                    </div>
                    {feedback.answer && <span className="feedback-answer">{feedback.answer}</span>}
                </div>

                <form onSubmit={handleSubmit} className="response-form">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={gameOver}
                        className="response-input"
                        placeholder="Enter country name…"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                    <div className="quiz-actions">
                        <button type="submit" disabled={gameOver || !inputValue.trim()} className="response-submit">
                            Submit
                        </button>
                        <button type="button" onClick={handleSkip} disabled={gameOver} className="skip-button">
                            Skip
                        </button>
                    </div>
                </form>
            </div>
            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title={isWin ? 'Perfect route!' : 'Route ended'}
                subtitle={`Reached ${Math.max(0, currentPathIndex)} flag${currentPathIndex === 1 ? '' : 's'}`}
                showRarity
                onClose={() => setChest(null)}
            />
        </>
    );
}

export default LongestRouteQuiz;
