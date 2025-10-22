import React, { useState, useEffect, useRef } from 'react';
import './QuizStyles.css';
import './PixelatedQuiz.css'; // Using this for the modal styles

// --- Haversine Formula Helpers ---

/**
 * Converts degrees to radians.
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates the distance between two lat/long points in kilometers
 * using the Haversine formula.
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// Levenshtein function for forgiving spelling
function levenshtein(a, b) {
    // ... (levenshtein function remains the same) ...
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
const ROUTES_DATA_URL = './data/longest_routes.json'; // Path to your new JSON
const GAME_OVER_DELAY = 2000; // Delay in milliseconds (2 seconds)

// --- React Component ---

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
    
    // New state to hold the calculated stats for the current quiz
    const [quizStats, setQuizStats] = useState(null);

    const inputRef = useRef(null);
    const flagMapByName = useRef(new Map());
    const gameOverTimeoutRef = useRef(null); // Ref for timeout

    // On component mount, build the flag map
    useEffect(() => {
        if (allFlagsData.length > 0 && flagMapByName.current.size === 0) {
            const tempMap = new Map();
            allFlagsData.forEach(flag => {
                // Assuming the key is 'name' as per your existing code.
                // If your flags.json uses 'country', change 'flag.name' to 'flag.country'
                tempMap.set(flag.name, flag);
            });
            flagMapByName.current = tempMap;
        }
    }, [allFlagsData]);

    // On component mount, load the pre-calculated routes
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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (gameOverTimeoutRef.current) {
                clearTimeout(gameOverTimeoutRef.current);
            }
        };
    }, []);

    const triggerGameOverSequence = (feedbackMessage) => {
        setFeedback(feedbackMessage);
        setGameOver(true); // Disable input immediately
        setIsWin(false); // Ensure it's marked as a loss
        
        // Clear any existing timeout before setting a new one
        if (gameOverTimeoutRef.current) {
             clearTimeout(gameOverTimeoutRef.current);
        }

        // Set timeout to show the modal after the delay
        gameOverTimeoutRef.current = setTimeout(() => {
            setShowGameOverScreen(true);
        }, GAME_OVER_DELAY);
    };

    const startGame = () => {
        if (!allRoutes || routeKeys.length === 0 || flagMapByName.current.size === 0) return;
        
        // Clear any lingering game over state/timeout
        setShowGameOverScreen(false);
        if (gameOverTimeoutRef.current) {
             clearTimeout(gameOverTimeoutRef.current);
        }

        const randomKey = routeKeys[Math.floor(Math.random() * routeKeys.length)];
        const randomPathArray = allRoutes[randomKey];
        setQuizPath(randomPathArray);

        // --- Calculate and Set Journey Stats ---
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
                totalDistance: Math.round(calculatedDistance), // Round to nearest km
                route: randomPathArray.join(' → '), // Use arrow for style
            });
        } else {
            setQuizStats(null); // Clear stats if path was bad
        }
        // --- End Stats Calculation ---


        const firstFlagObject = flagMapByName.current.get(randomPathArray[0]);
        if (!firstFlagObject) {
            console.error("Error starting game: Could not find flag data for", randomPathArray[0]);
            // Maybe try again? For now, just error out.
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
        setQuizStats(null); // Clear old stats
        startGame(); // Resetting just starts a new game
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Don't process submit if game is over (even during the delay)
        if (!currentFlag || !inputValue.trim() || gameOver) return; 

        const userAnswer = inputValue.trim().toLowerCase();
        const correctAnswer = currentFlag.name.toLowerCase(); // Assumes 'name' field

        const distance = levenshtein(userAnswer, correctAnswer);
        const maxLength = Math.max(userAnswer.length, correctAnswer.length);
        const similarity = maxLength === 0 ? 1 : (1 - (distance / maxLength));
        const wasCorrect = similarity >= 0.8;

        if (wasCorrect) {
            const newIndex = currentPathIndex + 1;
            setScore(newIndex);
            setInputValue('');

            if (newIndex === quizPath.length) {
                // --- GAME WON ---
                setGameOver(true); // Disable input
                setShowGameOverScreen(true); // Show modal immediately on win
                setIsWin(true);
                setFeedback({ message: { text: "✅ Perfect Run! You completed the entire chain!" }, color: 'var(--correct-color)' });
                const finalScore = quizPath.length;
                if (finalScore > longestRouteHighScore) {
                    localStorage.setItem('longestRouteHighScore', finalScore.toString());
                    setLongestRouteHighScore(finalScore);
                }
            } else {
                // --- NEXT QUESTION ---
                setCurrentPathIndex(newIndex);
                const nextFlagName = quizPath[newIndex];
                const nextFlagObject = flagMapByName.current.get(nextFlagName);
                if (!nextFlagObject) {
                     console.error("Error during game: Could not find flag data for", nextFlagName);
                     // Trigger game over sequence on error
                     triggerGameOverSequence({ message: { text: `Error finding next flag: ${nextFlagName}. Game Over.` }, color: 'var(--incorrect-color)' });
                     return;
                }
                setCurrentFlag(nextFlagObject);
                setFeedback({ message: { text: "✅ Correct! What's next?" }, color: 'var(--correct-color)' });
                setTimeout(() => {
                    // Check gameOver again in case the win happened during the timeout
                    if (!gameOver) {
                         setFeedback({ message: { text: "What country is this?" }, color: 'var(--text-color)' });
                    }
                }, 1000);
            }
        } else {
            // --- GAME LOST --- Trigger the delayed sequence
            triggerGameOverSequence({ message: { text: `❌ Incorrect. The answer was:`, answer: currentFlag.name }, color: 'var(--incorrect-color)' });
        }
    };

    const handleSkip = () => {
        // Don't process skip if game is over (even during the delay)
        if (!currentFlag || gameOver) return; 
        // Trigger the delayed sequence
        triggerGameOverSequence({ message: { text: `❌ Skipped. The answer was:`, answer: currentFlag.name }, color: 'var(--incorrect-color)' });
    };

    useEffect(() => {
        // Focus input only if game started and NOT over (not even during delay)
        if (gameStarted && !gameOver && inputRef.current) { 
            inputRef.current.focus();
        }
    }, [gameStarted, gameOver, currentFlag]);

    const backToMenu = () => {
        setView('bonus-menu');
    };

    // --- Render Logic ---

    if (isLoading || !allRoutes || flagMapByName.current.size === 0) {
        // ... (loading state remains the same) ...
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
        // ... (no routes found state remains the same) ...
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

    // Show Instructions if game hasn't started
    if (!gameStarted) {
        // ... (instructions modal remains the same) ...
        return (
            <div className="pixel-notification-overlay">
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
            </div>
        );
    }

    // Show Game Over Modal ONLY if gameOver and showGameOverScreen are both true
    if (gameOver && showGameOverScreen) {
         return (
             <div className="pixel-notification-overlay">
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
                             <h2>Game Over!</h2>
                             <p className="pixel-final-score">Your chain: {score}</p>
                             <p className="pixel-high-score">Path length was: {quizPath.length}</p>
                             <p className="pixel-high-score">High Score: {longestRouteHighScore}</p>
                         </>
                     )}

                     {/* --- NEW QUIZ STATS BLOCK --- */}
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
                     {/* --- END QUIZ STATS BLOCK --- */}

                     <button className="response-submit" onClick={resetGame}>Play Again</button>
                     <button className="back-button" onClick={backToMenu} style={{ position: 'static', marginTop: '10px' }}>← Back to Menu</button>
                 </div>
             </div>
         );
    }

    // Show main quiz view if game is active OR if game is over but waiting for the delay
    if (!currentFlag && gameStarted) { // Handle potential loading issue within the game
        return (
            <div className="quiz-box">
                <button className="back-button" onClick={backToMenu}>←</button>
                <h1>Error loading flag...</h1>
            </div>
        );
    }
    
    // Ensure currentFlag exists before rendering main view
    if (!currentFlag) return null; 

    return (
        <div className="quiz-box">
            <button className="back-button" onClick={backToMenu}>←</button>
            <div className="quiz-header">
                <span className="quiz-score">Chain: {score} / {quizPath.length}</span>
            </div>
            <img
                src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                alt="Flag"
                className="flag-image"
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
                    disabled={gameOver} // Input disabled as soon as gameOver is true
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
        </div>
    );
}

export default LongestRouteQuiz;