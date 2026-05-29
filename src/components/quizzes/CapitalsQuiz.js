import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';
import { ChoiceCard, ScoreBubble } from '../ui/index';
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
import { springs } from '../../motion/index';

const FLAGS_URL = './data/flags.json';
const CAPITALS_URL = './data/capitals.json';
const TOTAL_LIVES = 3;
const OPTIONS_PER_QUESTION = 4;

// Pretty labels for the region tag carried on each flag (region:xxx). Used by
// the hint chip / explainer so "north_america" reads as "North America".
const REGION_LABELS = {
    africa: 'Africa',
    asia: 'Asia',
    europe: 'Europe',
    north_america: 'North America',
    south_america: 'South America',
    oceania: 'Oceania',
    territory: 'an overseas territory or region',
};

function regionLabel(region) {
    return REGION_LABELS[region] || 'the world';
}

function CapitalsQuiz({ setView }) {
    const [flagsData, setFlagsData] = useState([]);
    const [capitalsData, setCapitalsData] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [options, setOptions] = useState([]);
    const [optionCountry, setOptionCountry] = useState({});
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => getHighScore('capitals'));
    const [lives, setLives] = useState(TOTAL_LIVES);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isNewHigh, setIsNewHigh] = useState(false);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [isLoading, setIsLoading] = useState(true);
    const [isAnswered, setIsAnswered] = useState(false);
    const [chest, setChest] = useState(null);
    const [answerStatus, setAnswerStatus] = useState({});
    const [flashColor, setFlashColor] = useState(null);
    const [lifeLostIndex, setLifeLostIndex] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [explainer, setExplainer] = useState(null);
    const [scoreDelta, setScoreDelta] = useState(null);

    const audio = useAudio();

    // The prompt names the country, never its capital, so it's safe to share
    // with spectators — but for parity with the other quizzes we only surface
    // score + streak (no prompt payload).
    const isPlaying = !isGameOver && !isLoading && currentQuestion;
    const { watchers, lastReactionId } = useQuizPresence(isPlaying ? 'capitals-quiz' : null, {
        score, streak: 0,
    });

    // Pending advance for the wrong-answer explainer; runs only when the
    // player clicks Continue so they can read at their own pace.
    const pendingAdvanceRef = useRef(null);

    // Quiz pool: join the capital list against flags.json for the flag emoji +
    // region tag, and drop entries whose capital equals the country name
    // (Singapore, Monaco, Vatican City, Gibraltar) — a "capital of Singapore?"
    // question with "Singapore" on the prompt gives itself away.
    const pool = useMemo(() => {
        if (!flagsData.length || !capitalsData.length) return [];
        const flagByCountry = new Map();
        const regionByCountry = new Map();
        for (const f of flagsData) {
            flagByCountry.set(f.country, f.flag || '');
            const tag = (f.tags || []).find((t) => t.startsWith('region:'));
            regionByCountry.set(f.country, tag ? tag.slice('region:'.length) : 'territory');
        }
        return capitalsData
            .filter((c) => c.capital && c.capital !== c.country)
            .map((c) => ({
                country: c.country,
                capital: c.capital,
                flag: flagByCountry.get(c.country) || '🏳️',
                region: regionByCountry.get(c.country) || 'territory',
            }));
    }, [flagsData, capitalsData]);

    useEffect(() => {
        setHighScore(getHighScore('capitals'));
        async function loadData() {
            try {
                const [flagsResponse, capitalsResponse] = await Promise.all([
                    fetch(FLAGS_URL),
                    fetch(CAPITALS_URL),
                ]);
                setFlagsData(await flagsResponse.json());
                setCapitalsData(await capitalsResponse.json());
            } catch (error) {
                console.error('Failed to load capitals data:', error);
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

        if (pool.length < OPTIONS_PER_QUESTION) return;

        const entry = pool[Math.floor(Math.random() * pool.length)];

        // Distractors: prefer capitals from the SAME region (a harder, more
        // plausible set), then top up from anywhere. Dedupe by capital string
        // so "Kingston" (Jamaica) and "Kingston" (Norfolk Island) never collide
        // in one question, and never repeat the country or the right answer.
        const usedCapitals = new Set([entry.capital]);
        const usedCountries = new Set([entry.country]);
        const distractors = [];
        const drawFrom = (list) => {
            const shuffled = [...list].sort(() => Math.random() - 0.5);
            for (const e of shuffled) {
                if (distractors.length >= OPTIONS_PER_QUESTION - 1) break;
                if (usedCapitals.has(e.capital) || usedCountries.has(e.country)) continue;
                usedCapitals.add(e.capital);
                usedCountries.add(e.country);
                distractors.push(e);
            }
        };
        drawFrom(pool.filter((e) => e.region === entry.region));
        if (distractors.length < OPTIONS_PER_QUESTION - 1) drawFrom(pool);

        const chosen = [entry, ...distractors];
        const countryByCapital = {};
        chosen.forEach((e) => { countryByCapital[e.capital] = e.country; });

        setCurrentQuestion({
            country: entry.country,
            capital: entry.capital,
            flag: entry.flag,
            region: entry.region,
        });
        setOptionCountry(countryByCapital);
        setOptions(chosen.map((e) => e.capital).sort(() => Math.random() - 0.5));
    }, [pool]);

    useEffect(() => {
        if (!isLoading && pool.length >= OPTIONS_PER_QUESTION) {
            nextQuestion();
        }
    }, [isLoading, pool, nextQuestion]);

    const handleRevealHint = () => {
        if (isAnswered || isGameOver || hintUsed || !currentQuestion) return;
        audio.play('click');
        setHintUsed(true);
    };

    const handleAnswer = (answerCapital) => {
        if (isAnswered || isGameOver) return;
        setIsAnswered(true);

        if (answerCapital === currentQuestion.capital) {
            audio.play('correct');
            setShowConfetti(true);
            // Hint forfeits the point — same rule as the Language quiz.
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
                    : 'Correct! The capital is:',
                answer: currentQuestion.capital,
                tone: 'green',
            });
            setAnswerStatus({ [answerCapital]: 'correct' });
            setFlashColor('correct');
            setTimeout(nextQuestion, 1500);
        } else {
            audio.play('incorrect');
            setFlashColor('incorrect');
            setAnswerStatus({ [answerCapital]: 'incorrect', [currentQuestion.capital]: 'correct' });

            const newLives = lives - 1;
            setLives(newLives);
            setLifeLostIndex(TOTAL_LIVES - lives);
            setFeedback({
                text: 'Incorrect. The capital is:',
                answer: currentQuestion.capital,
                tone: 'red',
            });

            // Explainer: name the right answer's region, and tell the player
            // which country the city they picked is actually the capital of.
            setExplainer({
                country: currentQuestion.country,
                capital: currentQuestion.capital,
                region: currentQuestion.region,
                chosenCapital: answerCapital,
                chosenCountry: optionCountry[answerCapital] || null,
            });

            const advance = newLives <= 0
                ? () => {
                    recordPlay(1.5);
                    const beatBest = score > highScore;   // capture before mutating highScore
                    setIsNewHigh(beatBest);
                    if (beatBest) {
                        setHighScore(score);
                        recordHighScore('capitals', score);
                        flushBonus().then(() => refreshBattlepass());
                    }
                    bumpQuestMetric('bonus_play', 1);
                    bumpQuestMetric('capitals_play', 1);
                    reportHwm('capitals_score', score);
                    if (score >= MIN_CORRECT_FOR_CHEST) {
                        const accuracy = lives / TOTAL_LIVES * 0.5 + 0.5; // 0.5..1.0
                        const rolled = rollChest({ correct: score, accuracy, bestStreak: Math.floor(score / 3), mode: 'capitals', yieldMult: currentChestYieldMult() });
                        if (rolled) {
                            addEarnedBucks(rolled.bucks);
                            setChest(rolled);
                        }
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
        setIsNewHigh(false);
        setChest(null);
        setScore(0);
        setLives(TOTAL_LIVES);
        nextQuestion();
    };

    if (isLoading) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Loading capitals…</span>
            </div>
        );
    }

    if (isGameOver) {
        return (
            <div className="quiz-box capitals-quiz-box game-over-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('bonus-menu')} aria-label="Back">
                        <Icon name="arrow_back" />
                    </button>
                </div>
                <Mascot size={120} mood={isNewHigh ? 'cheer' : 'sad'} />
                <h1 className="menu-title">Game Over!</h1>
                <p className="final-score-lang">Final Score: {score}</p>
                <p className="high-score-lang">High Score: {highScore}</p>
                {isNewHigh && (
                    <p className="new-high-score-lang">
                        <Icon name="emoji_events" variant="highlight" size="lg" pop /> New High Score!
                    </p>
                )}
                <button className="response-submit" onClick={handlePlayAgain}>
                    <Icon name="replay" /> Play Again
                </button>
                {/* Mounted here too so the end-of-run chest plays at game over
                    (the main play tree is unreachable while isGameOver). */}
                <ChestReveal
                    open={!!chest}
                    rarity={chest?.rarity || 'common'}
                    bucks={chest?.bucks || 0}
                    title="Capitals run complete!"
                    subtitle={`Score ${score}`}
                    showRarity
                    onClose={() => setChest(null)}
                />
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
        <div className={`quiz-box capitals-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
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
                    key={currentQuestion.country}
                    className="phrase-container capitals-prompt"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={springs.gentle}
                >
                    <span className="capitals-flag" aria-hidden="true">{currentQuestion.flag}</span>
                    <h2 className="phrase-text">{currentQuestion.country}</h2>
                </motion.div>
            </AnimatePresence>
            <p className="menu-subtitle language-subtitle">What is its capital?</p>

            <div className="lang-hint-row">
                {hintUsed ? (
                    <span className="lang-hint-chip">
                        <Icon name="lightbulb" /> Starts with “{currentQuestion.capital.charAt(0)}”
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
                {explainer && (
                    <motion.div
                        key="capitals-explainer"
                        className="lang-explainer"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={springs.gentle}
                        role="status"
                    >
                        <h3 className="lang-explainer__title">
                            <Icon name="public" /> {explainer.capital} — {explainer.country}
                        </h3>
                        <p className="lang-explainer__line">
                            <strong>{explainer.capital}</strong> is the capital of{' '}
                            <strong>{explainer.country}</strong>, in {regionLabel(explainer.region)}.
                        </p>
                        {explainer.chosenCountry && explainer.chosenCountry !== explainer.country && (
                            <p className="lang-explainer__line lang-explainer__line--contrast">
                                You picked <strong>{explainer.chosenCapital}</strong> — that's the capital of{' '}
                                <strong>{explainer.chosenCountry}</strong>.
                            </p>
                        )}
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
            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title="Capitals run complete!"
                subtitle={`Score ${score}`}
                showRarity
                onClose={() => setChest(null)}
            />
        </div>
    );
}

export default CapitalsQuiz;
