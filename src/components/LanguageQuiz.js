import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { ChoiceCard, ScoreBubble } from './ui';
import Mascot from '../assets/illustrations/Mascot';
import Confetti from '../assets/illustrations/Confetti';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { getHighScore, recordHighScore } from '../lib/progress';
import { refreshBattlepass } from '../lib/battlepass';
import { recordPlay } from '../lib/pet';
import { springs } from '../motion';

const LANGUAGES_URL = './data/languages.json';
const PHRASES_URL = './data/phrases.json';
const TOTAL_LIVES = 3;

function LanguageQuiz({ setView }) {
    const [languagesData, setLanguagesData] = useState([]);
    const [phrasesData, setPhrasesData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => getHighScore('language'));
    const [lives, setLives] = useState(TOTAL_LIVES);
    const [isGameOver, setIsGameOver] = useState(false);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [isLoading, setIsLoading] = useState(true);
    const [isAnswered, setIsAnswered] = useState(false);
    const [answerStatus, setAnswerStatus] = useState({});
    const [flashColor, setFlashColor] = useState(null);
    const [lifeLostIndex, setLifeLostIndex] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const audio = useAudio();

    useEffect(() => {
        setHighScore(getHighScore('language'));
        async function loadData() {
            try {
                const [langResponse, phraseResponse] = await Promise.all([
                    fetch(LANGUAGES_URL),
                    fetch(PHRASES_URL),
                ]);
                setLanguagesData(await langResponse.json());
                setPhrasesData(await phraseResponse.json());
            } catch (error) {
                console.error('Failed to load language data:', error);
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    const nextQuestion = useCallback(() => {
        setFlashColor(null);
        setLifeLostIndex(null);
        setShowConfetti(false);
        setFeedback({ text: ' ' });
        setIsAnswered(false);
        setAnswerStatus({});

        if (languagesData.length === 0 || !phrasesData) return;

        const randomLanguage = languagesData[Math.floor(Math.random() * languagesData.length)];
        const phraseList = phrasesData[randomLanguage.name];

        if (!phraseList || phraseList.length === 0) {
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
            audio.play('correct');
            setShowConfetti(true);
            const newScore = score + 1;
            setScore(newScore);
            if (newScore === 3 || newScore === 5 || newScore === 10) {
                audio.play('streak');
            }
            setFeedback({
                text: 'Correct! The language was:',
                answer: currentQuestion.language,
                tone: 'green',
            });
            setAnswerStatus({ [answerName]: 'correct' });
            setFlashColor('correct');
            setTimeout(nextQuestion, 1500);
        } else {
            audio.play('incorrect');
            setFlashColor('incorrect');
            setAnswerStatus({ [answerName]: 'incorrect', [currentQuestion.language]: 'correct' });

            const newLives = lives - 1;
            setLives(newLives);
            setLifeLostIndex(TOTAL_LIVES - lives);
            setFeedback({
                text: 'Incorrect. The language was:',
                answer: currentQuestion.language,
                tone: 'red',
            });

            if (newLives <= 0) {
                recordPlay(1.5);
                if (score > highScore) {
                    setHighScore(score);
                    recordHighScore('language', score);
                    refreshBattlepass();
                }
                setTimeout(() => {
                    audio.play('gameOver');
                    setIsGameOver(true);
                }, 1500);
            } else {
                setTimeout(nextQuestion, 1500);
            }
        }
    };

    const handlePlayAgain = () => {
        audio.play('click');
        setIsGameOver(false);
        setScore(0);
        setLives(TOTAL_LIVES);
        nextQuestion();
    };

    if (isLoading) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Loading languages…</span>
            </div>
        );
    }

    if (isGameOver) {
        return (
            <div className="quiz-box language-quiz-box game-over-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('bonus-menu')} aria-label="Back">
                        <Icon name="arrow_back" />
                    </button>
                </div>
                <Mascot size={120} mood={score > highScore ? 'cheer' : 'sad'} />
                <h1 className="menu-title">Game Over!</h1>
                <p className="final-score-lang">Final Score: {score}</p>
                <p className="high-score-lang">High Score: {highScore}</p>
                {score > highScore && (
                    <p className="new-high-score-lang">
                        <Icon name="emoji_events" variant="highlight" size="lg" pop /> New High Score!
                    </p>
                )}
                <button className="response-submit" onClick={handlePlayAgain}>
                    <Icon name="replay" /> Play Again
                </button>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Preparing quiz…</span>
            </div>
        );
    }

    return (
        <div className={`quiz-box language-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('bonus-menu')} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <div className="lives-container" aria-label={`${lives} lives left`}>
                    {[...Array(TOTAL_LIVES)].map((_, i) => {
                        const livesLost = TOTAL_LIVES - lives;
                        return (
                            <motion.div
                                key={i}
                                className={`life-box ${i < livesLost ? 'lost' : ''} ${i === lifeLostIndex ? 'shake' : ''}`}
                                animate={{ scale: i === lifeLostIndex ? [1, 0.6, 0.85] : 1 }}
                                transition={{ duration: 0.4 }}
                            />
                        );
                    })}
                </div>
                <ScoreBubble score={score} icon="star" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.phrase}
                    className="phrase-container"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={springs.gentle}
                >
                    <h2 className="phrase-text">"{currentQuestion.phrase}"</h2>
                </motion.div>
            </AnimatePresence>
            <p className="menu-subtitle language-subtitle">Which language is this?</p>

            <AnimatePresence>
                {showConfetti && <Confetti pieces={20} />}
            </AnimatePresence>

            <div className="feedback-label" style={{ color: feedback.tone === 'green' ? 'var(--color-success-deep)' : feedback.tone === 'red' ? 'var(--color-danger-deep)' : 'var(--color-ink-soft)' }} aria-live="polite">
                <div className="feedback-row">
                    {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                    {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                    <span>{feedback.text}</span>
                </div>
                {feedback.answer && <span className="feedback-answer">{feedback.answer}</span>}
            </div>

            <div className="options-box language-options">
                {options.map((option, i) => (
                    <ChoiceCard
                        key={option}
                        label={option}
                        index={i}
                        state={answerStatus[option] === 'correct' ? 'correct' : answerStatus[option] === 'incorrect' ? 'incorrect' : 'idle'}
                        disabled={isAnswered}
                        onSelect={handleAnswer}
                    />
                ))}
            </div>
        </div>
    );
}

export default LanguageQuiz;
