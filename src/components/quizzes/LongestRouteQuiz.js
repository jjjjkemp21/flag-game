import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAnswer } from '../../answer_check';
import Icon from '../common/Icon';
import { Button, ScoreBubble } from '../ui/index';
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
import Globe from '../../lib/globe/Globe';
import { variants, springs } from '../../motion/index';

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
// Zoom used when sliding the answer country into view on reveal — matches the
// value GlobeQuiz uses so reveals across the two screens feel identical.
const REVEAL_ZOOM = 4.6;

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

function LongestRouteQuiz({ allFlagsData, setView, strictSpelling = false, includeTerritories = false }) {
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

    // Answer method: 'type' (the classic free-text chain) or 'globe' (find each
    // country on the 3D globe instead of typing it). Both share one high score —
    // it's the same chain challenge, just a different way to answer.
    const [answerMode, setAnswerMode] = useState('type');

    const [quizStats, setQuizStats] = useState(null);
    const [flashColor, setFlashColor] = useState(null);
    const [scoreDelta, setScoreDelta] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Globe-mode state.
    const [globeReady, setGlobeReady] = useState(false);
    const [globeError, setGlobeError] = useState(null);
    const [globeSelected, setGlobeSelected] = useState(null); // iso2 the player tapped

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

    // Globe refs. The Three.js scene lives in a ref; React owns the HUD.
    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const availableIso2Ref = useRef(null);     // Set of iso2 codes the globe can place
    const currentFlagRef = useRef(null);       // mirror for the once-wired globe callbacks
    const questionResolvedRef = useRef(false); // guards double-tap confirm during reveal
    const resolveGlobeAnswerRef = useRef(null);
    currentFlagRef.current = currentFlag;

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

    // Mount the globe whenever Globe mode is selected — even on the start screen
    // (the play box is in the DOM, just display:none), so the geometry preloads
    // and we know which countries are placeable before the player hits Start.
    useEffect(() => {
        if (answerMode !== 'globe') return;
        if (!containerRef.current) return;
        setGlobeReady(false);
        setGlobeError(null);
        const globe = new Globe(containerRef.current, {
            onSelect: (iso2) => {
                if (questionResolvedRef.current || !currentFlagRef.current) return;
                setGlobeSelected(iso2 || null);
                audio.play('click');
                if (iso2 && globeRef.current) {
                    globeRef.current.flyToIso2(iso2, { zoom: REVEAL_ZOOM, noZoomOut: true });
                }
            },
            onConfirm: (iso2) => {
                if (questionResolvedRef.current || !iso2) return;
                resolveGlobeAnswerRef.current?.(iso2);
            },
            onReady: () => {
                if (!globeRef.current) return;
                availableIso2Ref.current = new Set(globeRef.current.getAvailableIso2());
                setGlobeReady(true);
            },
            onError: (e) => {
                console.error('Globe load failed', e);
                setGlobeError(e?.message || 'Failed to load the globe — check your connection.');
            },
        });
        globeRef.current = globe;
        globe.load();
        return () => {
            globe.dispose();
            globeRef.current = null;
            availableIso2Ref.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answerMode]);

    // Re-tint the globe when the host app toggles dark/light.
    useEffect(() => {
        if (answerMode !== 'globe') return;
        const observer = new MutationObserver(() => {
            if (globeRef.current) globeRef.current.applyTheme();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, [answerMode]);

    // A chain is globe-playable only if EVERY country in it maps to a country
    // the globe can actually place — otherwise the player could never finish it.
    const chainGlobeEligible = (key) => {
        const set = availableIso2Ref.current;
        if (!set) return false;
        return allRoutes[key].every((name) => {
            const f = flagMapByName.current.get(name);
            return f && f.code && set.has(f.code.toUpperCase());
        });
    };

    // Length-bucket counts on the start screen. In Globe mode (once the globe is
    // ready) they additionally exclude chains with an unplaceable country.
    const globeFilterReady = answerMode === 'globe' && globeReady;
    const bucketCount = (b) => routeKeys.filter((k) => {
        const len = allRoutes[k].length;
        if (len < b.min || len > b.max) return false;
        return globeFilterReady ? chainGlobeEligible(k) : true;
    }).length;

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
        if (answerMode === 'globe' && !globeReady) return; // wait for geometry

        setShowGameOverScreen(false);
        setFlashColor(null);
        setShowConfetti(false);
        if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);

        // Narrow to chains that fit the chosen length bucket. If for any reason
        // no routes match (data drift), fall back to the full pool so the mode
        // is never bricked.
        const bucket = BUCKETS.find((b) => b.key === selectedBucket) || BUCKETS[BUCKETS.length - 1];
        const lenOk = (k) => {
            const len = allRoutes[k].length;
            return len >= bucket.min && len <= bucket.max;
        };
        // Honour the global "include territories" toggle: drop any route that
        // passes through a dependent territory unless the player opted in. The
        // name→flag map stays built from the FULL catalog so every node still
        // resolves — we only filter which whole routes are eligible.
        const territoryOk = (k) => includeTerritories || allRoutes[k].every((name) => {
            const f = flagMapByName.current.get(name);
            return f && !(f.tags || []).includes('region:territory');
        });
        // Globe mode additionally requires every country to be placeable on the
        // 3D globe (some tiny dependencies aren't in Natural Earth's 110m set).
        const globeOk = (k) => answerMode !== 'globe' || chainGlobeEligible(k);

        const eligible = routeKeys.filter((k) => lenOk(k) && territoryOk(k) && globeOk(k));
        // Fallbacks also respect the toggles so territories / unplaceable chains
        // never slip back in.
        const fallbackPool = routeKeys.filter((k) => territoryOk(k) && globeOk(k));
        const pool = eligible.length > 0 ? eligible : (fallbackPool.length > 0 ? fallbackPool : routeKeys);
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

        if (answerMode === 'globe') {
            setGlobeSelected(null);
            questionResolvedRef.current = false;
            if (globeRef.current) {
                globeRef.current.clearAllPaints();
                globeRef.current.setLocked(null);
                globeRef.current.resetCamera();
                // The play box was display:none behind the start modal, so the
                // canvas had no size — nudge a resize now that it's visible.
                setTimeout(() => globeRef.current?.resize(), 60);
            }
        }
    };

    const resetGame = () => {
        setQuizStats(null);
        startGame();
    };

    // Advance to flag at `index` (or end the chain on a bad lookup). Resets the
    // per-question globe state when in Globe mode.
    const goToFlag = (index) => {
        setShowConfetti(false);
        setCurrentPathIndex(index);
        const nextFlagName = quizPath[index];
        const nextFlagObject = flagMapByName.current.get(nextFlagName);
        if (!nextFlagObject) {
            triggerGameOverSequence({ text: `Error finding next flag: ${nextFlagName}. Game Over.`, color: 'var(--color-danger-deep)' });
            return;
        }
        setCurrentFlag(nextFlagObject);
        setFlashColor(null);
        setFeedback({ text: 'What country is this?' });
        if (answerMode === 'globe') {
            setGlobeSelected(null);
            questionResolvedRef.current = false;
            if (globeRef.current) {
                globeRef.current.clearAllPaints();
                globeRef.current.setLocked(null);
                globeRef.current.resetCamera();
            }
        }
    };

    // Shared correct-answer pipeline for both answer methods. Advances the chain
    // or, on the final flag, runs the win / high-score / chest sequence.
    const advanceChain = () => {
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
            setTimeout(() => goToFlag(newIndex), 1500);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentFlag || !inputValue.trim() || gameOver) return;
        const wasCorrect = checkAnswer(inputValue, currentFlag, strictSpelling);
        if (wasCorrect) {
            advanceChain();
        } else {
            triggerGameOverSequence({ text: 'Incorrect. The answer was:', answer: currentFlag.name, color: 'var(--color-danger-deep)' });
        }
    };

    // Globe-mode answer: the player tapped `guessIso2` and confirmed. Paint the
    // reveal, then run the shared correct / game-over path.
    const resolveGlobeAnswer = (guessIso2) => {
        const flag = currentFlagRef.current;
        if (!flag || gameOver || questionResolvedRef.current) return;
        questionResolvedRef.current = true;
        const code = (flag.code || '').toUpperCase();
        const wasCorrect = (guessIso2 || '').toUpperCase() === code;
        if (globeRef.current) {
            globeRef.current.setLocked(wasCorrect ? 'correct' : 'wrong');
            if (wasCorrect) {
                globeRef.current.paintCountry(flag.code, 'correct');
            } else {
                if (guessIso2 && guessIso2.toUpperCase() !== code) {
                    globeRef.current.paintCountry(guessIso2, 'wrong');
                }
                globeRef.current.paintCountry(flag.code, 'correct');
                globeRef.current.flyToIso2(flag.code, { duration: 700, zoom: REVEAL_ZOOM });
            }
        }
        if (wasCorrect) {
            advanceChain();
        } else {
            triggerGameOverSequence({ text: 'Incorrect. The answer was:', answer: flag.name, color: 'var(--color-danger-deep)' });
        }
    };
    resolveGlobeAnswerRef.current = resolveGlobeAnswer;

    const handleGlobeConfirm = () => {
        if (!globeSelected || flashColor || gameOver || questionResolvedRef.current) return;
        resolveGlobeAnswer(globeSelected);
    };

    const handleSkip = () => {
        if (!currentFlag || gameOver) return;
        if (answerMode === 'globe') {
            questionResolvedRef.current = true;
            if (globeRef.current) {
                globeRef.current.setLocked('wrong');
                globeRef.current.paintCountry(currentFlag.code, 'correct');
                globeRef.current.flyToIso2(currentFlag.code, { duration: 700, zoom: REVEAL_ZOOM });
            }
        }
        triggerGameOverSequence({ text: 'Skipped. The answer was:', answer: currentFlag.name, color: 'var(--color-danger-deep)' });
    };

    useEffect(() => {
        if (answerMode === 'type' && gameStarted && !gameOver && inputRef.current) {
            const focusTimeout = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(focusTimeout);
        }
    }, [answerMode, gameStarted, gameOver, currentFlag]);

    const backToMenu = () => setView('bonus-menu');

    const switchAnswerMode = (mode) => {
        if (mode === answerMode) return;
        audio.play('click');
        setAnswerMode(mode);
    };

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

    const feedbackColor = feedback.color || 'var(--color-ink-soft)';
    const playVisible = gameStarted && !(gameOver && showGameOverScreen);
    const startDisabled = answerMode === 'globe' && (!globeReady || !!globeError);

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

                                    <p>How do you want to answer?</p>
                                    <div className="globe-quiz__mode-toggle" role="tablist" aria-label="Answer method">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={answerMode === 'type'}
                                            className={`globe-quiz__mode-tab ${answerMode === 'type' ? 'is-active' : ''}`}
                                            onClick={() => switchAnswerMode('type')}
                                        >
                                            <Icon name="keyboard" /> Type
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={answerMode === 'globe'}
                                            className={`globe-quiz__mode-tab ${answerMode === 'globe' ? 'is-active' : ''}`}
                                            onClick={() => switchAnswerMode('globe')}
                                        >
                                            <Icon name="public" /> Globe
                                        </button>
                                    </div>

                                    <p>Pick a chain length:</p>
                                    <div className="bucket-picker">
                                        {BUCKETS.map((b) => {
                                            const count = bucketCount(b);
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
                                                            ? `${count}`
                                                            : `${b.min}${b.max < 99 ? `-${b.max}` : '+'} · ${count}`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ul className="pixel-rules-list">
                                        <li>
                                            {answerMode === 'globe'
                                                ? 'Find every country of a randomly chosen chain on the globe, in order.'
                                                : 'Guess every flag in a randomly chosen chain, in order.'}
                                        </li>
                                        <li>One incorrect answer or skip ends the game.</li>
                                        <li>Complete the chain to set a new high score!</li>
                                    </ul>
                                    {answerMode === 'globe' && !globeReady && !globeError && (
                                        <p className="pixel-high-score" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', justifyContent: 'center' }}>
                                            <Spinner /> Preparing the globe…
                                        </p>
                                    )}
                                    {globeError && (
                                        <p className="pixel-high-score" style={{ color: 'var(--color-danger-deep)' }}>
                                            {globeError}
                                        </p>
                                    )}
                                    <button className="response-submit" onClick={() => { audio.play('click'); startGame(); }} disabled={startDisabled}>
                                        Start Challenge
                                    </button>
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

            {answerMode === 'type' ? (
                <div
                    className={`quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}
                    style={{ display: playVisible ? 'flex' : 'none' }}
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

                    <div className="feedback-label" style={{ color: feedbackColor }} aria-live="polite">
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
            ) : (
                <div
                    className={`quiz-box globe-quiz ${flashColor ? `flash-${flashColor}` : ''}`}
                    style={{ display: playVisible ? 'flex' : 'none' }}
                >
                    <div className="quiz-topbar globe-quiz__topbar">
                        <button className="back-button" onClick={backToMenu} aria-label="Back">
                            <Icon name="arrow_back" />
                        </button>
                        <span className="ui-pill ui-pill--primary">
                            <Icon name="route" /> Chain {score}/{quizPath.length}
                        </span>
                        <ScoreBubble score={score} icon="trending_up" floatingDelta={scoreDelta} />
                        <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
                    </div>

                    <div className="globe-quiz__stage" aria-label="World globe">
                        <div ref={containerRef} className="globe-quiz__canvas" />
                        {!globeReady && !globeError && (
                            <div className="globe-quiz__overlay">
                                <Spinner />
                                <span>Rendering the globe…</span>
                            </div>
                        )}
                        {globeError && (
                            <div className="globe-quiz__overlay globe-quiz__overlay--error">
                                <Icon name="public_off" />
                                <span>{globeError}</span>
                                <Button variant="secondary" onClick={backToMenu}>Back</Button>
                            </div>
                        )}

                        {currentFlag && (
                            <motion.div
                                className="globe-quiz__prompt"
                                key={`chain-${currentFlag.code}`}
                                initial={{ opacity: 0, y: 20, scale: 0.94 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={springs.bouncy}
                            >
                                <div className="globe-quiz__prompt-tag">Find this country</div>
                                <img
                                    src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                                    alt="Flag"
                                    className="globe-quiz__prompt-flag"
                                />
                                <div className="globe-quiz__prompt-hint">
                                    <Icon name="touch_app" /> Tap a country, then confirm.
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {flashColor === 'correct' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={springs.bouncy}
                                    className="globe-quiz__mascot"
                                    aria-hidden="true"
                                >
                                    <Mascot size={64} mood="cheer" still />
                                </motion.div>
                            )}
                            {flashColor === 'incorrect' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={springs.gentle}
                                    className="globe-quiz__mascot"
                                    aria-hidden="true"
                                >
                                    <Mascot size={64} mood="sad" still />
                                </motion.div>
                            )}
                            {showConfetti && (
                                <div className="globe-quiz__confetti">
                                    <Confetti pieces={18} radius={140} />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="feedback-label globe-quiz__feedback" style={{ color: feedbackColor }} aria-live="polite">
                        <div className="feedback-row">
                            {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                            {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                            <span>{feedback.text}</span>
                        </div>
                        {feedback.answer && <span className="feedback-answer">{feedback.answer}</span>}
                    </div>

                    <div className="globe-quiz__actions">
                        <Button
                            variant="primary"
                            onClick={handleGlobeConfirm}
                            disabled={gameOver || !globeSelected || !!flashColor}
                            icon="check"
                        >
                            Confirm
                        </Button>
                        <button type="button" onClick={handleSkip} disabled={gameOver} className="skip-button">
                            Skip
                        </button>
                    </div>
                </div>
            )}
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
