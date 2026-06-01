import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';
import { ChoiceCard, ScoreBubble } from '../ui/index';
import Mascot from '../../assets/illustrations/Mascot';
import Confetti from '../../assets/illustrations/Confetti';
import Spinner from '../../assets/illustrations/Spinner';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import MasteryMeter from './MasteryMeter';
import { useAudio } from '../../audio/AudioProvider';
import { useProfile } from '../../lib/profile';
import { recordHighScore, flushBonus, addEarnedXp } from '../../lib/progress';
import { refreshBattlepass } from '../../lib/battlepass';
import { bumpQuestMetric, reportStreakHwm } from '../../lib/quests';
import { addEarnedBucks } from '../../lib/currency';
import { awardForAnswer, awardBucksForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../../lib/xp';
import { rollChest, MIN_CORRECT_FOR_CHEST, currentChestYieldMult } from '../../lib/chest';
import ChestReveal from '../economy/ChestReveal';
import { recordCorrect, recordIncorrect } from '../../lib/pet';
import { getStreak, saveStreak, resetStreak } from '../../lib/streak';
import { springs } from '../../motion/index';
import {
    usePride,
    ensurePrideCatalog,
    getPrideById,
    getPrideStat,
    recordPrideAnswer,
    selectNextPride,
    prideNameDistractors,
    availablePrideSlugs,
    deckPrideSlugs,
} from '../../lib/pride';

const FLAG_IMAGE_BASE = './assets/pride-flags/';
const MODE = 'pride';
const XP_MODE = 'pride-flags';
const STREAK_KEY = 'pride';
const OPTIONS_PER_QUESTION = 4;

// Pride quiz — endless flag-recognition quiz over the 27 LGBTQ+ identity flags.
// Mirrors the world Flags MC + US Flags sub-mode: per-item mastery (its own
// spaced-repetition track in src/lib/pride.js), same XP / Bucks / streak /
// chest / pet / quest loop the rest of the app uses. Lives under Bonus Modes
// in the UI but operates like a mastery-driven flag quiz.
function PrideQuiz({ setView, deck = { type: 'all', value: null } }) {
    const prideState = usePride();
    const catalogReady = prideState.catalogLoaded;

    const questionSlugs = useMemo(
        () => (catalogReady ? deckPrideSlugs(deck) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [catalogReady, deck.type, deck.value]
    );
    const distractorSlugs = useMemo(() => {
        if (!catalogReady) return [];
        return [...new Set([...availablePrideSlugs(), ...questionSlugs])];
    }, [catalogReady, questionSlugs]);

    const [current, setCurrent] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(STREAK_KEY));
    const [masteryStreak, setMasteryStreak] = useState(0);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [answered, setAnswered] = useState(false);
    const [chosenAnswer, setChosenAnswer] = useState(null);
    const [flashColor, setFlashColor] = useState(null);
    const [xpGain, setXpGain] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [bestStreak, setBestStreak] = useState(0);
    const [answeredTotal, setAnsweredTotal] = useState(0);
    const [chest, setChest] = useState(null);

    const audio = useAudio();
    const profile = useProfile();
    const recentRef = useRef([]);

    useEffect(() => { ensurePrideCatalog(); }, []);

    const nextQuestion = useCallback(() => {
        setFlashColor(null);
        setFeedback({ text: ' ' });
        setAnswered(false);
        setChosenAnswer(null);
        setXpGain(null);
        setShowConfetti(false);

        if (!questionSlugs.length || distractorSlugs.length < OPTIONS_PER_QUESTION) { setCurrent(null); return; }

        const slug = selectNextPride(questionSlugs, recentRef.current);
        const entry = getPrideById(slug);
        if (!entry) { setCurrent(null); return; }
        recentRef.current = [...recentRef.current.slice(-4), slug];

        const distractors = prideNameDistractors(slug, distractorSlugs, OPTIONS_PER_QUESTION - 1);
        const shuffled = [entry.name, ...distractors].sort(() => Math.random() - 0.5);
        setCurrent(entry);
        setMasteryStreak(getPrideStat(slug).streak || 0);
        setOptions(shuffled);
    }, [questionSlugs, distractorSlugs]);

    useEffect(() => {
        if (catalogReady && !current) nextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalogReady]);

    const navigateBack = () => setView('pride-menu');

    const handleBack = () => {
        if (score > 0) {
            recordHighScore(MODE, score);
            flushBonus().then(() => refreshBattlepass());
        }
        if (chest || score < MIN_CORRECT_FOR_CHEST) {
            navigateBack();
            return;
        }
        const accuracy = answeredTotal > 0 ? score / answeredTotal : 0;
        const rolled = rollChest({ correct: score, accuracy, bestStreak, mode: MODE, yieldMult: currentChestYieldMult() });
        if (!rolled) { navigateBack(); return; }
        addEarnedBucks(rolled.bucks);
        setChest(rolled);
    };

    const handleAnswer = (answer) => {
        if (!current || answered) return;
        setAnswered(true);
        setChosenAnswer(answer);
        const wasCorrect = answer === current.name;
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');
        setAnsweredTotal((n) => n + 1);

        const preStat = getPrideStat(current.slug);
        const { before, after } = recordPrideAnswer(current.slug, wasCorrect);
        setMasteryStreak(after);

        if (wasCorrect) {
            audio.play('correct');
            setScore((s) => s + 1);
            recordCorrect(1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(STREAK_KEY, next);
            if (next > bestStreak) setBestStreak(next);
            const award = awardForAnswer({ correct: preStat.correct, streak: before }, XP_MODE, next);
            addEarnedXp(award.amount);
            const bucksAward = awardBucksForAnswer(award);
            if (bucksAward > 0) addEarnedBucks(bucksAward);
            setXpGain({ ...award, bucks: bucksAward });
            bumpQuestMetric('any_correct', 1);
            reportStreakHwm(next);
            setFeedback({ text: 'Correct! That flag is:', answer: current.name, tone: 'green' });
            setShowConfetti(true);
            if (before <= MASTERY_STREAK && after > MASTERY_STREAK) audio.play('levelUp');
        } else {
            audio.play('incorrect');
            recordIncorrect(1);
            setStreak(0);
            resetStreak(STREAK_KEY);
            const penalty = penaltyForAnswer(XP_MODE);
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
            setFeedback({ text: 'Incorrect. That flag is:', answer: current.name, tone: 'red' });
        }

        setTimeout(() => { nextQuestion(); }, 2000);
    };

    const handleSkip = () => {
        if (!current || answered) return;
        setAnswered(true);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setStreak(0);
        resetStreak(STREAK_KEY);
        setAnsweredTotal((n) => n + 1);
        const { after } = recordPrideAnswer(current.slug, false);
        setMasteryStreak(after);
        setFeedback({ text: 'Skipped. That flag is:', answer: current.name, tone: 'red' });
        setTimeout(() => { nextQuestion(); }, 2000);
    };

    const getChoiceState = (option) => {
        if (!answered || !current) return 'idle';
        if (option === current.name) return 'correct';
        if (option === chosenAnswer && option !== current.name) return 'incorrect';
        return 'idle';
    };

    // Keyboard play: 1–4 / A–D pick an option while unanswered; Enter/Space advances.
    const kbRef = useRef({});
    kbRef.current = { answered, options, handleAnswer, nextQuestion, hasQuestion: !!current };
    useEffect(() => {
        const onKey = (e) => {
            const st = kbRef.current;
            if (!st.hasQuestion) return;
            const tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (!st.answered) {
                let idx = -1;
                if (e.key >= '1' && e.key <= '4') idx = Number(e.key) - 1;
                else {
                    const k = e.key.toLowerCase();
                    if (k >= 'a' && k <= 'd') idx = k.charCodeAt(0) - 97;
                }
                if (idx >= 0 && idx < st.options.length) {
                    e.preventDefault();
                    st.handleAnswer(st.options[idx]);
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                st.nextQuestion();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    if (!catalogReady) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Loading pride flags…</span>
            </div>
        );
    }

    if (!current) {
        return (
            <div className="quiz-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={navigateBack} aria-label="Back to menu">
                        <Icon name="arrow_back" />
                    </button>
                </div>
                <Mascot size={120} mood="cheer" cosmetics={profile.cosmetics} />
                <h1 className="text-center">No flags to show.</h1>
                <p className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                    {deck.type === 'review'
                        ? 'Nothing due for review — come back later.'
                        : 'Try a different deck.'}
                </p>
            </div>
        );
    }

    const feedbackColor = feedback.tone === 'green'
        ? 'var(--color-success-deep)'
        : feedback.tone === 'red'
            ? 'var(--color-danger-deep)'
            : 'var(--color-ink-soft)';

    return (
        <div className={`quiz-box pride-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
            <div className="quiz-topbar">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <span className="ui-pill ui-pill--primary">
                    <Icon name="local_fire_department" /> Streak {streak}
                    {streak > 0 && <span className="streak-mult">×{streakMultiplier(streak).toFixed(1)}</span>}
                </span>
                <ScoreBubble score={score} icon="star" />
            </div>

            <MasteryMeter streak={masteryStreak} />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.slug}
                        className="pride-prompt"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={springs.gentle}
                    >
                        <img
                            src={`${FLAG_IMAGE_BASE}${current.slug}.svg`}
                            alt=""
                            className="flag-image pride-flag"
                        />
                        <p className="menu-subtitle pride-subtitle">Which flag is this?</p>
                    </motion.div>
                </AnimatePresence>
                <AnimatePresence>
                    {answered && flashColor === 'correct' && (
                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            style={{ position: 'absolute', right: 'min(2vw, 12px)', bottom: 'min(2vw, 12px)' }}
                            aria-hidden="true"
                        >
                            <Mascot size={56} mood="cheer" cosmetics={profile.cosmetics} still />
                        </motion.div>
                    )}
                    {answered && flashColor === 'incorrect' && (
                        <motion.div
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.gentle}
                            style={{ position: 'absolute', right: 'min(2vw, 12px)', bottom: 'min(2vw, 12px)' }}
                            aria-hidden="true"
                        >
                            <Mascot size={56} mood="sad" cosmetics={profile.cosmetics} still />
                        </motion.div>
                    )}
                    {xpGain && (
                        <motion.div
                            className={`xp-gain ${xpGain.amount < 0 ? 'xp-gain--neg' : ''}`}
                            initial={{ x: '-50%', y: 8, opacity: 0, scale: 0.9 }}
                            animate={{ x: '-50%', y: -18, opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            style={{ position: 'absolute', left: '50%', top: 'min(2vw, 12px)' }}
                            aria-hidden="true"
                        >
                            {xpGain.amount < 0 ? (
                                `${xpGain.amount} XP`
                            ) : (
                                <>
                                    <span className="xp-gain__amount">
                                        +{xpGain.amount} XP
                                        {xpGain.multiplier > 1 && (
                                            <span className="xp-gain__mult">×{xpGain.multiplier.toFixed(1)}</span>
                                        )}
                                    </span>
                                    {xpGain.bucks > 0 && (
                                        <>
                                            <span className="xp-gain__sep" aria-hidden="true" />
                                            <span className="xp-gain__bucks">
                                                <AtlasBucksIcon size={16} /> +{xpGain.bucks}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
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

            <div className="options-box">
                {options.map((option, i) => (
                    <div className="choice-wrap" key={`${current.slug}-${option}`}>
                        <ChoiceCard
                            label={option}
                            index={i}
                            state={getChoiceState(option)}
                            disabled={answered}
                            onSelect={handleAnswer}
                        />
                        <AnimatePresence>
                            {showConfetti && option === current.name && (
                                <Confetti pieces={16} radius={110} />
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            <div className="quiz-actions">
                <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                    Skip
                </button>
            </div>

            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title="Pride run complete!"
                subtitle={`${score} correct · streak ${bestStreak}`}
                showRarity
                onClose={() => { setChest(null); navigateBack(); }}
            />
        </div>
    );
}

export default PrideQuiz;
