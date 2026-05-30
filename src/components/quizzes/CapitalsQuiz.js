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
import { bumpQuestMetric, reportHwm, reportStreakHwm } from '../../lib/quests';
import { addEarnedBucks } from '../../lib/currency';
import { awardForAnswer, awardBucksForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../../lib/xp';
import { rollChest, MIN_CORRECT_FOR_CHEST, currentChestYieldMult } from '../../lib/chest';
import ChestReveal from '../economy/ChestReveal';
import { recordCorrect, recordIncorrect } from '../../lib/pet';
import { getStreak, saveStreak, resetStreak } from '../../lib/streak';
import { useQuizPresence } from '../../lib/presence';
import SpectatorsBadge from '../social/SpectatorsBadge';
import { springs } from '../../motion/index';
import {
    useCapitals,
    ensureCapitalsCatalog,
    getCapitalById,
    getCapitalStat,
    recordCapitalAnswer,
    selectNextCapital,
    capitalDistractors,
    availableCapitalCodes,
    deckCapitalCodes,
} from '../../lib/capitals';

const IMAGE_BASE_URL = './assets/flags/';
const MODE = 'capitals';
const OPTIONS_PER_QUESTION = 4;

// Capitals mode — an endless, flag-style mastery quiz. The flag is shown with
// the country name beneath it and the player picks its capital from four
// choices. Mastery is tracked per country in its own track (src/lib/capitals.js),
// completely separate from flag-recognition mastery — exactly like Globe mode's
// geography axis. Shares the standard XP / Bucks / streak / chest loop.
function CapitalsQuiz({ setView, includeTerritories = false, deck = { type: 'all', value: null } }) {
    const capitalsState = useCapitals();
    const catalogReady = capitalsState.catalogLoaded;

    // Question pool = the chosen deck, snapshotted once the catalog is ready so a
    // "Needs Review" run keeps its codes for the whole session instead of
    // shrinking as each one is answered (matches the flag quizzes). Distractors
    // stay broad — every other available capital plus the deck itself — so a
    // small region still yields four plausible options.
    const questionCodes = useMemo(
        () => (catalogReady ? deckCapitalCodes(deck, includeTerritories) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [catalogReady, deck.type, deck.value, includeTerritories]
    );
    const distractorCodes = useMemo(() => {
        if (!catalogReady) return [];
        return [...new Set([...availableCapitalCodes(includeTerritories), ...questionCodes])];
    }, [catalogReady, includeTerritories, questionCodes]);

    const [current, setCurrent] = useState(null); // { code, country, capital, flagFile, region }
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(MODE));
    const [masteryStreak, setMasteryStreak] = useState(0); // current capital's progress to mastery
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

    // The prompt names the country (never its capital), so it's safe to share
    // with spectators — surface the flag + country + the option set so a
    // watching friend can follow along, plus a tri-state verdict for the
    // glance-able correct/wrong flash (mirrors the flag MC quiz).
    const isPlaying = catalogReady && !!current;
    const { watchers, lastReactionId } = useQuizPresence(isPlaying ? 'capitals-quiz' : null, {
        score, streak,
        promptKind: 'capital',
        promptFlagCode: current ? current.code : undefined,
        promptCountry: current ? current.country : undefined,
        lastAnswerCorrect:
            flashColor === 'correct' ? true : flashColor === 'incorrect' ? false : null,
        options: options && options.length ? options : undefined,
    });

    // Warm the catalog (capitals.json joined to flags.json) on mount.
    useEffect(() => { ensureCapitalsCatalog(); }, []);

    const nextQuestion = useCallback(() => {
        setFlashColor(null);
        setFeedback({ text: ' ' });
        setAnswered(false);
        setChosenAnswer(null);
        setXpGain(null);
        setShowConfetti(false);

        if (!questionCodes.length || distractorCodes.length < OPTIONS_PER_QUESTION) { setCurrent(null); return; }

        const code = selectNextCapital(questionCodes, recentRef.current);
        const entry = getCapitalById(code);
        if (!entry) { setCurrent(null); return; }
        recentRef.current = [...recentRef.current.slice(-4), code];

        const distractors = capitalDistractors(code, distractorCodes, OPTIONS_PER_QUESTION - 1);
        const shuffled = [entry.capital, ...distractors].sort(() => Math.random() - 0.5);
        setCurrent(entry);
        setMasteryStreak(getCapitalStat(code).streak || 0);
        setOptions(shuffled);
    }, [questionCodes, distractorCodes]);

    // Kick off the first question once the catalog is ready.
    useEffect(() => {
        if (catalogReady && !current) nextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalogReady]);

    const navigateBack = () => setView('capitals-menu');

    // End-of-run path: roll a chest reflecting the session's accuracy + max
    // streak, and record the session's correct count as the Capitals high score
    // (feeds the leaderboard / Atlas Pass / quests). The chest's Continue button
    // triggers navigateBack() via onClose.
    const handleBack = () => {
        reportHwm('capitals_score', score);
        if (score > 0) {
            recordHighScore('capitals', score);
            flushBonus().then(() => refreshBattlepass());
        }
        if (chest || score < MIN_CORRECT_FOR_CHEST) {
            navigateBack();
            return;
        }
        const accuracy = answeredTotal > 0 ? score / answeredTotal : 0;
        const rolled = rollChest({ correct: score, accuracy, bestStreak, mode: MODE, yieldMult: currentChestYieldMult() });
        if (!rolled) {
            navigateBack();
            return;
        }
        addEarnedBucks(rolled.bucks);
        setChest(rolled);
    };

    const handleAnswer = (answer) => {
        if (!current || answered) return;
        setAnswered(true);
        setChosenAnswer(answer);
        const wasCorrect = answer === current.capital;
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');
        setAnsweredTotal((n) => n + 1);

        const preStat = getCapitalStat(current.code);
        const { before, after } = recordCapitalAnswer(current.code, wasCorrect);
        setMasteryStreak(after);

        if (wasCorrect) {
            audio.play('correct');
            setScore((s) => s + 1);
            recordCorrect(1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(MODE, next);
            if (next > bestStreak) setBestStreak(next);
            // Scaled XP: a brand-new capital is worth more than an already-
            // mastered one, the hot streak multiplies up to 2x. Bucks land
            // alongside at the old (pre-double) rate.
            const award = awardForAnswer({ correct: preStat.correct, streak: before }, MODE, next);
            addEarnedXp(award.amount);
            const bucksAward = awardBucksForAnswer(award);
            if (bucksAward > 0) addEarnedBucks(bucksAward);
            setXpGain({ ...award, bucks: bucksAward });
            bumpQuestMetric('capitals_play', 1);
            bumpQuestMetric('any_correct', 1);
            reportStreakHwm(next);
            setFeedback({ text: 'Correct! The capital is:', answer: current.capital, tone: 'green' });
            setShowConfetti(true);
            // A satisfying flourish the moment a capital crosses into "mastered".
            if (before <= MASTERY_STREAK && after > MASTERY_STREAK) audio.play('levelUp');
        } else {
            audio.play('incorrect');
            recordIncorrect(1);
            setStreak(0);
            resetStreak(MODE);
            const penalty = penaltyForAnswer(MODE);
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
            setFeedback({ text: 'Incorrect. The capital is:', answer: current.capital, tone: 'red' });
        }

        setTimeout(() => { nextQuestion(); }, 2000);
    };

    const handleSkip = () => {
        if (!current || answered) return;
        setAnswered(true);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setStreak(0);
        resetStreak(MODE);
        setAnsweredTotal((n) => n + 1);
        const { after } = recordCapitalAnswer(current.code, false);
        setMasteryStreak(after);
        setFeedback({ text: 'Skipped. The capital is:', answer: current.capital, tone: 'red' });
        setTimeout(() => { nextQuestion(); }, 2000);
    };

    const getChoiceState = (option) => {
        if (!answered) return 'idle';
        if (option === current.capital) return 'correct';
        if (option === chosenAnswer && option !== current.capital) return 'incorrect';
        return 'idle';
    };

    // Keyboard play: 1–4 / A–D pick an option while unanswered; Enter/Space
    // advances once answered. Latest values via a ref so the listener binds once.
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
                <span>Loading capitals…</span>
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
                <h1 className="text-center">No capitals to show.</h1>
                <p className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                    {deck.type === 'review'
                        ? 'Nothing due for review in this deck — come back later.'
                        : 'Try enabling territories in Settings for more.'}
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
        <div className={`quiz-box capitals-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
            <div className="quiz-topbar">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <span className="ui-pill ui-pill--primary">
                    <Icon name="local_fire_department" /> Streak {streak}
                    {streak > 0 && <span className="streak-mult">×{streakMultiplier(streak).toFixed(1)}</span>}
                </span>
                <ScoreBubble score={score} icon="star" />
                <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
            </div>

            <MasteryMeter streak={masteryStreak} />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.code}
                        className="capitals-prompt"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={springs.gentle}
                    >
                        {current.flagFile && (
                            <img
                                src={`${IMAGE_BASE_URL}${current.flagFile}`}
                                alt=""
                                className="flag-image"
                            />
                        )}
                        <h2 className="capitals-country">{current.country}</h2>
                        <p className="menu-subtitle capitals-subtitle">What is its capital?</p>
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
                    <div className="choice-wrap" key={`${current.code}-${option}`}>
                        <ChoiceCard
                            label={option}
                            index={i}
                            state={getChoiceState(option)}
                            disabled={answered}
                            onSelect={handleAnswer}
                        />
                        <AnimatePresence>
                            {showConfetti && option === current.capital && (
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
                title="Capitals run complete!"
                subtitle={`${score} correct · streak ${bestStreak}`}
                showRarity
                onClose={() => { setChest(null); navigateBack(); }}
            />
        </div>
    );
}

export default CapitalsQuiz;
