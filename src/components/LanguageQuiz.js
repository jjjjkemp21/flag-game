import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { ChoiceCard, ScoreBubble } from './ui';
import Mascot from '../assets/illustrations/Mascot';
import Confetti from '../assets/illustrations/Confetti';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { getHighScore, recordHighScore, flushBonus } from '../lib/progress';
import { refreshBattlepass } from '../lib/battlepass';
import { recordPlay } from '../lib/pet';
import { useQuizPresence } from '../lib/presence';
import SpectatorsBadge from './SpectatorsBadge';
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
    const [hintUsed, setHintUsed] = useState(false);
    const [explainer, setExplainer] = useState(null);
    const [scoreDelta, setScoreDelta] = useState(null);

    const audio = useAudio();

    // Language-quiz prompts (the foreign phrase) can fall back to the language
    // name itself when phrase data is sparse — which IS the answer. To rule out
    // leaks we don't surface the prompt to spectators for this mode; score +
    // streak only. (See plan §3 answer-leak audit.)
    const isPlaying = !isGameOver && !isLoading && currentQuestion;
    const { watchers, lastReactionId } = useQuizPresence(isPlaying ? 'language-quiz' : null, {
        score, streak: 0,
    });

    // Pending advance for the wrong-answer explainer; runs only when the
    // player clicks Continue so they can read at their own pace.
    const pendingAdvanceRef = useRef(null);

    // O(1) language lookup so the explainer can pull metadata for the chosen
    // distractor (not just the correct answer).
    const langByName = useMemo(
        () => new Map(languagesData.map((l) => [l.name, l])),
        [languagesData]
    );

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
        setHintUsed(false);
        setExplainer(null);
        setScoreDelta(null);
        pendingAdvanceRef.current = null;

        if (languagesData.length === 0 || !phrasesData) return;

        const randomLanguage = languagesData[Math.floor(Math.random() * languagesData.length)];
        const phraseList = phrasesData[randomLanguage.name];

        if (!phraseList || phraseList.length === 0) {
            setTimeout(nextQuestion, 50);
            return;
        }

        const randomPhrase = phraseList[Math.floor(Math.random() * phraseList.length)];
        setCurrentQuestion({
            phrase: randomPhrase,
            language: randomLanguage.name,
            family: randomLanguage.family,
            alphabet: randomLanguage.alphabet,
        });

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

    const handleRevealHint = () => {
        if (isAnswered || isGameOver || hintUsed || !currentQuestion) return;
        audio.play('click');
        setHintUsed(true);
    };

    const handleAnswer = (answerName) => {
        if (isAnswered || isGameOver) return;
        setIsAnswered(true);

        if (answerName === currentQuestion.language) {
            audio.play('correct');
            setShowConfetti(true);
            // Hint forfeits the score gain — same idea as GlobeQuiz halving XP,
            // adapted to LanguageQuiz which scores in integer points.
            const newScore = hintUsed ? score : score + 1;
            if (!hintUsed) {
                setScore(newScore);
                setScoreDelta(1);
            }
            if (!hintUsed && (newScore === 3 || newScore === 5 || newScore === 10)) {
                audio.play('streak');
            }
            setFeedback({
                text: hintUsed
                    ? 'Correct (hint used — no points):'
                    : 'Correct! The language was:',
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

            // Explainer panel: contrast the correct language's family + script
            // with whatever the player chose, so they walk away knowing the
            // tell. `chosen` may be missing if a future distractor isn't in the
            // catalog; the render guards on it.
            const correctLang = langByName.get(currentQuestion.language) || null;
            const chosenLang = langByName.get(answerName) || null;
            setExplainer({ correct: correctLang, chosen: chosenLang });

            const advance = newLives <= 0
                ? () => {
                    recordPlay(1.5);
                    if (score > highScore) {
                        setHighScore(score);
                        recordHighScore('language', score);
                        flushBonus().then(() => refreshBattlepass());
                    }
                    audio.play('gameOver');
                    setIsGameOver(true);
                }
                : nextQuestion;
            pendingAdvanceRef.current = advance;
        }
    };

    const handleContinue = () => {
        const advance = pendingAdvanceRef.current;
        pendingAdvanceRef.current = null;
        if (advance) advance();
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
                <ScoreBubble score={score} icon="star" floatingDelta={scoreDelta} />
                <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
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

            <div className="lang-hint-row">
                {hintUsed ? (
                    <span className="lang-hint-chip">
                        <Icon name="lightbulb" /> {currentQuestion.family} family · {currentQuestion.alphabet} script
                    </span>
                ) : (
                    <button
                        type="button"
                        className="lang-hint-btn"
                        onClick={handleRevealHint}
                        disabled={isAnswered}
                    >
                        <Icon name="lightbulb" /> Hint (no points)
                    </button>
                )}
            </div>

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

            <AnimatePresence>
                {explainer && explainer.correct && (
                    <motion.div
                        key="lang-explainer"
                        className="lang-explainer"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={springs.gentle}
                        role="status"
                    >
                        <h3 className="lang-explainer__title">
                            <Icon name="psychology" /> Why it was {explainer.correct.name}
                        </h3>
                        <p className="lang-explainer__line">
                            <strong>{explainer.correct.name}</strong> is in the{' '}
                            <strong>{explainer.correct.family}</strong> family and uses the{' '}
                            <strong>{explainer.correct.alphabet}</strong> script.
                        </p>
                        {explainer.chosen && (() => {
                            // Six languages list multiple scripts (Japanese, Javanese,
                            // Punjabi, Hausa, Mongolian, Serbian). Compare as sets so
                            // Serbian + Croatian register as script-overlapping (both
                            // use Latin) rather than as fully different scripts.
                            const parseScripts = (s) => new Set(
                                String(s).split(',').map((x) => x.trim()).filter(Boolean)
                            );
                            const correctScripts = parseScripts(explainer.correct.alphabet);
                            const chosenScripts = parseScripts(explainer.chosen.alphabet);
                            const shared = [...correctScripts].filter((s) => chosenScripts.has(s));
                            const sameAlpha =
                                correctScripts.size === chosenScripts.size &&
                                shared.length === correctScripts.size;
                            const overlap = !sameAlpha && shared.length > 0;
                            const sameFam = explainer.chosen.family === explainer.correct.family;
                            let body;
                            if (sameAlpha && sameFam) {
                                // Sibling languages — script and family both match;
                                // vocabulary / grammar are the only real tells.
                                body = (
                                    <>
                                        same <strong>{explainer.correct.family}</strong> family,
                                        same <strong>{explainer.correct.alphabet}</strong> script. These are close cousins —
                                        vocabulary and small grammar quirks are the tells, not the writing system.
                                    </>
                                );
                            } else if (sameAlpha) {
                                // Same script, different family — script can't help;
                                // listen for the family signature instead.
                                body = (
                                    <>
                                        same <strong>{explainer.correct.alphabet}</strong> script, but{' '}
                                        <strong>{explainer.correct.name}</strong> is{' '}
                                        <strong>{explainer.correct.family}</strong> while{' '}
                                        <strong>{explainer.chosen.name}</strong> is{' '}
                                        <strong>{explainer.chosen.family}</strong>. The script doesn't help here.
                                    </>
                                );
                            } else if (overlap) {
                                // Partial script overlap (e.g. Serbian+Croatian both
                                // use Latin; Hausa+Yoruba both use Latin). The phrase
                                // they saw may have been in the shared script, so
                                // pointing at the alphabet would mislead.
                                const sharedLabel = shared.join(' & ');
                                body = sameFam ? (
                                    <>
                                        both use the <strong>{sharedLabel}</strong> script and are both{' '}
                                        <strong>{explainer.correct.family}</strong> — close cousins. Vocabulary and small
                                        grammar quirks are the tells.
                                    </>
                                ) : (
                                    <>
                                        <strong>{explainer.chosen.name}</strong> uses <strong>{sharedLabel}</strong> too,
                                        so the script isn't conclusive. The family is the tell:{' '}
                                        <strong>{explainer.correct.name}</strong> is{' '}
                                        <strong>{explainer.correct.family}</strong>,{' '}
                                        <strong>{explainer.chosen.name}</strong> is{' '}
                                        <strong>{explainer.chosen.family}</strong>.
                                    </>
                                );
                            } else {
                                // Different script entirely — the shape of the
                                // characters is the dominant signal.
                                body = (
                                    <>
                                        that's the <strong>{explainer.chosen.alphabet}</strong> script.
                                        The shape of the characters is the giveaway.
                                    </>
                                );
                            }
                            return (
                                <p className="lang-explainer__line lang-explainer__line--contrast">
                                    You picked <strong>{explainer.chosen.name}</strong> — {body}
                                </p>
                            );
                        })()}
                        <button
                            type="button"
                            className="lang-explainer__continue"
                            onClick={handleContinue}
                            autoFocus
                        >
                            Continue <Icon name="arrow_forward" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LanguageQuiz;
