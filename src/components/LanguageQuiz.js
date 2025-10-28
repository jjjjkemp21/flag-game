import React, { useState, useEffect, useCallback } from 'react';
import './Menu.css';
import './QuizStyles.css';
import './LanguageQuizStyles.css';

const LANGUAGES_URL = './data/languages.json';
const PHRASES_URL = './data/phrases.json';
const HIGH_SCORE_KEY = 'languageHighScore';
const TOTAL_LIVES = 3;

function LanguageQuiz({ setView }) {
    const [languagesData, setLanguagesData] = useState([]);
    const [phrasesData, setPhrasesData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(TOTAL_LIVES);
    const [isGameOver, setIsGameOver] = useState(false);
    const [feedback, setFeedback] = useState({ text: '\u00A0', color: 'var(--text-color)' });
    const [isLoading, setIsLoading] = useState(true);
    const [isAnswered, setIsAnswered] = useState(false);
    const [answerStatus, setAnswerStatus] = useState({});

    useEffect(() => {
        setHighScore(parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0, 10));
        async function loadData() {
            try {
                const [langResponse, phraseResponse] = await Promise.all([
                    fetch(LANGUAGES_URL),
                    fetch(PHRASES_URL)
                ]);
                const languages = await langResponse.json();
                const phrases = await phraseResponse.json();
                setLanguagesData(languages);
                setPhrasesData(phrases);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to load language data:", error);
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const nextQuestion = useCallback(() => {
        setFeedback({ text: '\u00A0', color: 'var(--text-color)' });
        setIsAnswered(false);
        setAnswerStatus({});

        if (languagesData.length === 0 || !phrasesData) {
            return;
        }

        const randomLanguage = languagesData[Math.floor(Math.random() * languagesData.length)];
        const phraseList = phrasesData[randomLanguage.name];

        if (!phraseList || phraseList.length === 0) {
            console.warn(`No phrases found for ${randomLanguage.name}, trying again.`);
            setTimeout(nextQuestion, 50);
            return;
        }

        const randomPhrase = phraseList[Math.floor(Math.random() * phraseList.length)];
        setCurrentQuestion({ phrase: randomPhrase, language: randomLanguage.name });

        const distractors = randomLanguage.distractors;
        const correctOption = randomLanguage.name;
        const shuffledOptions = [...distractors, correctOption].sort(() => Math.random() - 0.5);
        setOptions(shuffledOptions);
    }, [languagesData, phrasesData]);

    useEffect(() => {
        if (!isLoading && languagesData.length > 0 && phrasesData) {
            nextQuestion();
        }
    }, [isLoading, languagesData, phrasesData, nextQuestion]);

    const handleAnswer = (answerName) => {
        if (isAnswered || isGameOver) return;
        setIsAnswered(true);

        if (answerName === currentQuestion.language) {
            setScore(prevScore => prevScore + 1);
            setFeedback({ text: '✅ Correct!', color: 'var(--correct-color)' });
            setAnswerStatus({ [answerName]: 'correct' });
            setTimeout(nextQuestion, 1000);
        } else {
            setAnswerStatus({
                [answerName]: 'incorrect',
                [currentQuestion.language]: 'correct'
            });
            const newLives = lives - 1;
            setLives(newLives);
            setFeedback({ text: `❌ Incorrect! It was ${currentQuestion.language}.`, color: 'var(--incorrect-color)' });

            if (newLives <= 0) {
                setIsGameOver(true);
                if (score > highScore) {
                    setHighScore(score);
                    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
                }
            } else {
                setTimeout(nextQuestion, 1500);
            }
        }
    };

    const handlePlayAgain = () => {
        setIsGameOver(false);
        setScore(0);
        setLives(TOTAL_LIVES);
        nextQuestion();
    };

    const renderLives = () => {
        const livesLost = TOTAL_LIVES - lives;
        return (
            <div className="lives-container">
                {[...Array(TOTAL_LIVES)].map((_, i) => (
                    <div
                        key={i}
                        className={`life-box ${i < livesLost ? 'lost' : ''}`}
                    ></div>
                ))}
            </div>
        );
    };


    if (isLoading) {
        return <div className="quiz-box language-quiz-box"><h2>Loading Languages... 🌍</h2></div>;
    }


    if (isGameOver) {
        return (
            <div className="quiz-box language-quiz-box game-over-box">
                <button className="back-button" onClick={() => setView('bonus-menu')}>←</button>
                <h1 className="menu-title">Game Over!</h1>
                <p className="final-score-lang">Final Score: {score}</p>
                <p className="high-score-lang">High Score: {highScore}</p>
                {score > highScore && <p className="new-high-score-lang">🎉 New High Score! 🎉</p>}
                <div className="menu-options" style={{ marginTop: '20px' }}>
                    <button className="menu-button c1" onClick={handlePlayAgain}>
                        Play Again? 🔁
                    </button>
                </div>
            </div>
        );
    }


    if (!currentQuestion) {
        return <div className="quiz-box language-quiz-box"><h2>Preparing quiz... 🤔</h2></div>;
    }


    return (
        <div className="quiz-box language-quiz-box">
            <button className="back-button" onClick={() => setView('bonus-menu')}>←</button>
            <div className="quiz-header language-header">
                {renderLives()}
                <div className="quiz-score">Score: {score}</div>
            </div>

            <div className="phrase-container">
                <h2 className="phrase-text">
                    "{currentQuestion.phrase}"
                </h2>
            </div>
            <p className="menu-subtitle language-subtitle">Which language is this?</p>

            <p className="feedback-label language-feedback" style={{ color: feedback.color }}>
                {feedback.text}
            </p>

            <div className="options-box language-options">
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={isAnswered}
                        className={`option-button ${answerStatus[option] || ''}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}


export default LanguageQuiz;