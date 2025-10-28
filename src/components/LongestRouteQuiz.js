import React, { useState, useEffect, useRef } from 'react';
import './QuizStyles.css';
import './PixelatedQuiz.css';

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function levenshtein(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1);
    for (let i = 0; i <= bn; i++) {
        matrix[i] = [i];
    }
    const bMatrix = matrix[0];
    for (let j = 1; j <= an; j++) {
        bMatrix[j] = j;
    }
    for (let i = 1; i <= bn; i++) {
        for (let j = 1; j <= an; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }
    return matrix[bn][an];
}

const IMAGE_BASE_URL = './assets/flags/';
const ROUTES_DATA_URL = './data/longest_routes.json';
const GAME_OVER_DELAY = 2000;

function LongestRouteQuiz({ allFlagsData, setView }) {
    const [allRoutes, setAllRoutes] = useState(null);
    const [routeKeys, setRouteKeys] = useState([]);
    const [quizPath, setQuizPath] = useState([]);
    const [currentPathIndex, setCurrentPathIndex] = useState(0);
    const [currentFlag, setCurrentFlag] = useState(null);
    
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState({ message: { text: "" }, color: 'var(--text-color)' });
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showGameOverScreen, setShowGameOverScreen] = useState(false); 
    const [isWin, setIsWin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [score, setScore] = useState(0);
    const [longestRouteHighScore, setLongestRouteHighScore] = useState(() =>
        parseInt(localStorage.getItem('longestRouteHighScore') || '0', 10)
    );
    
    const [quizStats, setQuizStats] = useState(null);

    const [flashColor, setFlashColor] = useState(null);
    const [scorePop, setScorePop] = useState(false);

    const inputRef = useRef(null);
    const flagMapByName = useRef(new Map());
    const gameOverTimeoutRef = useRef(null);

    useEffect(() => {
        if (allFlagsData.length > 0 && flagMapByName.current.size === 0) {
            const tempMap = new Map();
            allFlagsData.forEach(flag => {
                tempMap.set(flag.name, flag);
            });
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
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to load longest routes data:", error);
                setIsLoading(false);
            }
        };
        loadRoutes();
    }, []);

    useEffect(() => {
        return () => {
            if (gameOverTimeoutRef.current) {
                clearTimeout(gameOverTimeoutRef.current);
            }
        };
    }, []);

    const triggerGameOverSequence = (feedbackMessage) => {
        setFeedback(feedbackMessage);
        setFlashColor('incorrect');
        setGameOver(true);
        setIsWin(false);
        
        if (gameOverTimeoutRef.current) {
            clearTimeout(gameOverTimeoutRef.current);
        }

        gameOverTimeoutRef.current = setTimeout(() => {
            setShowGameOverScreen(true);
        }, GAME_OVER_DELAY);
    };

    const startGame = () => {
        if (!allRoutes || routeKeys.length === 0 || flagMapByName.current.size === 0) return;
        
        setShowGameOverScreen(false);
        setFlashColor(null);

        if (gameOverTimeoutRef.current) {
            clearTimeout(gameOverTimeoutRef.current);
        }

        const randomKey = routeKeys[Math.floor(Math.random() * routeKeys.length)];
        const randomPathArray = allRoutes[randomKey];
        setQuizPath(randomPathArray);

        let calculatedDistance = 0;
        let lastFlagObj = null;
        let pathIsValid = true;
        
        for (const countryName of randomPathArray) {
            const currentFlagObj = flagMapByName.current.get(countryName);
            if (!currentFlagObj || !currentFlagObj.coordinates) {
                console.error("Error calculating distance: Missing data for", countryName);
                pathIsValid = false;
                break;
            }
            
            if (lastFlagObj) {
                calculatedDistance += getDistance(
                    lastFlagObj.coordinates.lat,
                    lastFlagObj.coordinates.long,
                    currentFlagObj.coordinates.lat,
                    currentFlagObj.coordinates.long
                );
            }
            lastFlagObj = currentFlagObj;
        }
        
        if (pathIsValid) {
            setQuizStats({
                startingCountry: randomPathArray[0],
                countriesVisited: randomPathArray.length,
                totalDistance: Math.round(calculatedDistance),
                route: randomPathArray.join(' → '),
            });
        } else {
            setQuizStats(null);
        }

        const firstFlagObject = flagMapByName.current.get(randomPathArray[0]);
        if (!firstFlagObject) {
            console.error("Error starting game: Could not find flag data for", randomPathArray[0]);
            setFeedback({ message: { text: `Error finding first flag: ${randomPathArray[0]}` }, color: 'var(--incorrect-color)' });
            return;
        }

        setGameStarted(true);
        setGameOver(false);
        setIsWin(false);
        setScore(0);
        setCurrentPathIndex(0);
        setCurrentFlag(firstFlagObject);
        setFeedback({ message: { text: "What country is this?" }, color: 'var(--text-color)' });
        setInputValue('');
    };

    const resetGame = () => {
        setQuizStats(null);
        startGame();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentFlag || !inputValue.trim() || gameOver) return; 

        const userAnswer = inputValue.trim().toLowerCase();
        const correctAnswer = currentFlag.name.toLowerCase();

        const distance = levenshtein(userAnswer, correctAnswer);
        const maxLength = Math.max(userAnswer.length, correctAnswer.length);
        const similarity = maxLength === 0 ? 1 : (1 - (distance / maxLength));
        const wasCorrect = similarity >= 0.8;

        if (wasCorrect) {
            setFlashColor('correct');
            const newIndex = currentPathIndex + 1;
            setScore(newIndex);
            setScorePop(true);
            setTimeout(() => setScorePop(false), 300);
            setInputValue('');

            if (newIndex === quizPath.length) {
                setGameOver(true);
                setShowGameOverScreen(true);
                setIsWin(true);
                setFeedback({ message: { text: "✅ Perfect Run! You completed the entire chain!" }, color: 'var(--correct-color)' });
                const finalScore = quizPath.length;
                if (finalScore > longestRouteHighScore) {
                    localStorage.setItem('longestRouteHighScore', finalScore.toString());
                    setLongestRouteHighScore(finalScore);
                }
            } else {
                setFeedback({ message: { text: "✅ Correct!" }, color: 'var(--correct-color)' });
                setInputValue('');
                
                setTimeout(() => {
                    if (gameOver) return;

                    setCurrentPathIndex(newIndex);
                    const nextFlagName = quizPath[newIndex];
                    const nextFlagObject = flagMapByName.current.get(nextFlagName);
                    
                    if (!nextFlagObject) {
                        console.error("Error during game: Could not find flag data for", nextFlagName);
                        triggerGameOverSequence({ message: { text: `Error finding next flag: ${nextFlagName}. Game Over.` }, color: 'var(--incorrect-color)' });
                        return;
                    }

                    setCurrentFlag(nextFlagObject);
                    setFlashColor(null);
                    setFeedback({ message: { text: "What country is this?" }, color: 'var(--text-color)' });
                
                }, 2000);
            }
        } else {
            triggerGameOverSequence({ message: { text: `❌ Incorrect. The answer was:`, answer: currentFlag.name }, color: 'var(--incorrect-color)' });
        }
    };

    const handleSkip = () => {
        if (!currentFlag || gameOver) return; 
        triggerGameOverSequence({ message: { text: `❌ Skipped. The answer was:`, answer: currentFlag.name }, color: 'var(--incorrect-color)' });
    };

    useEffect(() => {
        if (gameStarted && !gameOver && inputRef.current) {
            const focusTimeout = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(focusTimeout);
        }
    }, [gameStarted, gameOver, currentFlag]);

    const backToMenu = () => {
        setView('bonus-menu');
    };

    if (isLoading || !allRoutes || flagMapByName.current.size === 0) {
        return (
            <div className="pixel-notification-overlay">
                <div className="pixel-notification-box quiz-box">
                    <h2>Loading Routes...</h2>
                    <p>Please wait, loading pre-calculated country routes...</p>
                </div>
            </div>
        );
    }
    
    if (routeKeys.length === 0) {
        return (
            <div className="pixel-notification-overlay">
                <div className="pixel-notification-box quiz-box">
                    <h2>No Routes Found</h2>
                    <p>The pre-calculated routes file seems to be empty or missing long enough paths.</p>
                    <button className="back-button" onClick={backToMenu} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <div 
                className="pixel-notification-overlay"
                style={{ display: (!gameStarted || (gameOver && showGameOverScreen)) ? 'flex' : 'none' }}
            >
                {!gameStarted && (
                    <div className="pixel-notification-box quiz-box">
                        <h2 className="menu-title" style={{ marginTop: 0 }}>Longest Route</h2>
                        <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                        <p>We've loaded <strong style={{color: 'var(--primary-color)'}}>{routeKeys.length}</strong> pre-calculated routes. You'll be quizzed on one!</p>
                        <ul className="pixel-rules-list" style={{ textAlign: 'left', listStylePosition: 'inside' }}>
                            <li>You must guess every flag in a randomly selected chain, in order.</li>
                            <li>A single incorrect answer or skip will end the game.</li>
                            <li>Complete an entire chain to set a new high score!</li>
                        </ul>
                        <button className="response-submit" onClick={startGame}>Start Challenge</button>
                        <button className="back-button" onClick={backToMenu} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                    </div>
                )}

                {(gameOver && showGameOverScreen) && (
                    <div className="pixel-game-over pixel-notification-box quiz-box">
                        {isWin ? (
                            <>
                                <h2>You did it!</h2>
                                <p className="pixel-final-score">Chain Complete: {score}</p>
                                {score > longestRouteHighScore ? (
                                    <p className="pixel-new-high-score">🎉 New High Score! 🎉</p>
                                ) : (
                                    <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                                )}
                            </>
                        ) : (
                            <>
                                -----------------
                                <h2>Game Over!</h2>
                                <p className="pixel-final-score">Your chain: {score}</p>
                                <p className="pixel-high-score">Path length was: {quizPath.length}</p>
                                <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                            </>
                        )}

                        {quizStats && (
                            <div 
                                className="pixel-quiz-stats" 
                                style={{ 
                                    textAlign: 'left', 
                                    marginTop: '15px', 
                                    fontSize: '0.9rem', 
                                    borderTop: '1px solid var(--border-color)', 
                                    paddingTop: '10px' 
                                }}
                            >
                                <h4 style={{ marginTop: 0, marginBottom: '8px', textAlign: 'center' }}>Longest Journey Calculation</h4>
                                <p style={{ margin: '4px 0' }}><strong>Starting Country:</strong> {quizStats.startingCountry}</p>
                                <p style={{ margin: '4px 0' }}><strong>Countries Visited:</strong> {quizStats.countriesVisited}</p>
                                <p style={{ margin: '4px 0' }}><strong>Total Distance:</strong> {quizStats.totalDistance} km</p>
                                <p style={{ margin: '4px 0', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                    <strong>Route:</strong> {quizStats.route}
                                </p>
                            </div>
                        )}

                        <button className="response-submit" onClick={resetGame}>Play Again</button>
                        <button className="back-button" onClick={backToMenu} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                    </div>
                )}
            </div>

            <div 
                className={`quiz-box longest-route-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}
                style={{ display: (gameStarted && !(gameOver && showGameOverScreen)) ? 'flex' : 'none' }}
            >
                {!currentFlag ? (
                    <>
                        <button className="back-button" onClick={backToMenu}>←</button>
                        <h1>Error loading flag...</h1>
                    </>
                ) : (
                    <>
                        <button className="back-button" onClick={backToMenu}>←</button>
                        <div className="quiz-header">
                            <span className={`quiz-score ${scorePop ? 'pop' : ''}`}>Chain: {score} / {quizPath.length}</span>
                        </div>
                        <img
                            key={currentFlag.file}
                            src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                            alt="Flag"
                            className="flag-image pop-in"
                        />
                        
                        <p className="feedback-label" style={{ color: feedback.color }}>
                            <span>{feedback.message.text}</span>
                            {feedback.message.answer && <span className="feedback-answer">{feedback.message.answer}</span>}
                        </p>

                        <form onSubmit={handleSubmit} className="response-form">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={gameOver}
                                className="response-input"
                                placeholder="Enter country name..."
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
                    </>
                )}
            </div>
        </>
    );
}

export default LongestRouteQuiz;