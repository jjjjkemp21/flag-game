import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get_distractor_options, update_flag_stats } from '../../quiz_logic';
import Icon from '../common/Icon';
import { ChoiceCard, ScoreBubble } from '../ui/index';
import Confetti from '../../assets/illustrations/Confetti';
import Mascot from '../../assets/illustrations/Mascot';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import MasteryMeter from './MasteryMeter';
import Spinner from '../../assets/illustrations/Spinner';
import { useAudio } from '../../audio/AudioProvider';
import { useProfile, recordBestStreak, flushProfile } from '../../lib/profile';
import { awardForAnswer, awardBucksForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../../lib/xp';
import { addEarnedXp } from '../../lib/progress';
import { addEarnedBucks } from '../../lib/currency';
import { bumpMetric, refreshBattlepass } from '../../lib/battlepass';
import { bumpQuestMetric, reportStreakHwm } from '../../lib/quests';
import { rollChest, MIN_CORRECT_FOR_CHEST, currentChestYieldMult } from '../../lib/chest';
import ChestReveal from '../economy/ChestReveal';
import { getStreak, saveStreak, resetStreak } from '../../lib/streak';
import { useQuizPresence } from '../../lib/presence';
import SpectatorsBadge from '../social/SpectatorsBadge';
import { springs } from '../../motion/index';

// Per-variant streak keys so Flash best-streaks track independently of plain
// Multiple Choice on the leaderboard + BonusMenu high-score badge.
const MODE_BY_VARIANT = {
    standard: 'multiple-choice',
    flash:    'flash',
    reverse:  'reverse-mc',
};
const FLASH_REVEAL_MS = 1000;
const IMAGE_BASE_URL = './assets/flags/';

function MultipleChoiceQuiz({
    allFlagsData,
    quizFlags,
    // Pool the wrong-answer options are drawn from. Defaults to the full
    // catalog, but App passes the territory-filtered set so distractors honour
    // the "include territories" toggle. Stat writes still use allFlagsData.
    distractorPool,
    setFlagsData,
    selectNextFlag,
    setView,
    setQuizCategory,
    quizCategory,
    getQuestionHistory,
    updateQuestionHistory,
    variant = 'standard',
}) {
    const MODE = MODE_BY_VARIANT[variant] || MODE_BY_VARIANT.standard;
    const [currentFlag, setCurrentFlag] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [answered, setAnswered] = useState(false);
    const [chosenAnswer, setChosenAnswer] = useState(null);
    const [flashColor, setFlashColor] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(MODE));
    const [xpGain, setXpGain] = useState(null); // { amount, multiplier } floating reward
    const [showConfetti, setShowConfetti] = useState(false);
    const [masteryStreak, setMasteryStreak] = useState(0); // current flag's progress to mastery
    const [flashHidden, setFlashHidden] = useState(false);
    const flashTimerRef = useRef(null);
    const audio = useAudio();
    const profile = useProfile();
    // End-of-run chest: tracked across the session so back-press can roll a
    // chest reflecting the whole run's accuracy + max streak. `bestStreak`
    // captures the run's peak streak even if the player went cold at the end.
    const [bestStreak, setBestStreak] = useState(0);
    const [answeredTotal, setAnsweredTotal] = useState(0);
    const [chest, setChest] = useState(null); // { rarity, bucks } once rolled

    // Presence heartbeat so friends see "playing" on the Friends tab; returns
    // a watchers count + last reaction id we feed into the SpectatorsBadge.
    const isReverse = variant === 'reverse';
    const { watchers, lastReactionId } = useQuizPresence(MODE, {
        score, streak,
        promptKind: isReverse ? 'country' : 'flag',
        promptFlagCode: !isReverse && currentFlag ? currentFlag.code : undefined,
        promptCountry: isReverse && currentFlag ? currentFlag.name : undefined,
        // tri-state so the spectator's mascot can cheer on correct, frown on
        // wrong, and stay neutral while the player is still deciding.
        lastAnswerCorrect:
            flashColor === 'correct' ? true : flashColor === 'incorrect' ? false : null,
        // Surface the choice texts so the spectator can see what the player
        // is picking between. Reverse mode shows flag images; we still send
        // the country names so the spectator UI can render either form.
        options: options && options.length ? options : undefined,
    });

    // Flash / Reverse come in from BonusMenu, not QuizMenu — bounce them back
    // there instead of the quiz category picker they never visited.
    const navigateBack = () => {
        if (variant === 'flash' || variant === 'reverse') {
            setView('bonus-menu');
            return;
        }
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
    };

    // End-of-run path: if the player accumulated enough correct answers, roll
    // a chest before navigating away. The chest's Continue button triggers
    // navigateBack() (via the chest's onClose).
    const handleBack = () => {
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

    const nextQuestion = useCallback(() => {
        setIsLoading(true);
        setFlashColor(null);
        setFeedback({ text: ' ' });
        setAnswered(false);
        setChosenAnswer(null);
        setXpGain(null);
        setShowConfetti(false);

        const history = getQuestionHistory();
        const questionFlag = selectNextFlag(quizFlags, history);
        setCurrentFlag(questionFlag);
        setMasteryStreak(questionFlag ? (questionFlag.streak || 0) : 0);

        if (questionFlag) {
            updateQuestionHistory(questionFlag.code);
            const distractors = get_distractor_options(questionFlag, distractorPool || allFlagsData, 3, quizCategory, history);
            const shuffledOptions = [...distractors, questionFlag.name].sort(() => Math.random() - 0.5);
            setOptions(shuffledOptions);
        }
        setIsLoading(false);
    }, [quizFlags, allFlagsData, distractorPool, selectNextFlag, quizCategory, getQuestionHistory, updateQuestionHistory]);

    useEffect(() => {
        nextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Flash variant: show the flag, then hide behind a "?" placeholder after
    // FLASH_REVEAL_MS unless the player has already answered. The flag re-
    // appears on answer so they can see what it was alongside the feedback.
    useEffect(() => {
        if (variant !== 'flash') return undefined;
        setFlashHidden(false);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        if (!currentFlag) return undefined;
        flashTimerRef.current = setTimeout(() => setFlashHidden(true), FLASH_REVEAL_MS);
        return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
    }, [currentFlag, variant]);

    const handleAnswer = (answer) => {
        if (!currentFlag || answered) return;

        // Flash variant: re-show the flag with the feedback so the player can
        // see what it actually was. Also cancel the pending hide-timer.
        if (variant === 'flash') {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            setFlashHidden(false);
        }

        setAnswered(true);
        setChosenAnswer(answer);
        const wasCorrect = answer === currentFlag.name;
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');
        setAnsweredTotal((n) => n + 1);

        const beforeStreak = currentFlag.streak || 0;
        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag, wasCorrect);
        setFlagsData(updatedFlags);
        setFeedback({ text: message.text, answer: message.answer, tone: color });

        const after = updatedFlags.find((f) => f.code === currentFlag.code);
        const afterStreak = after ? (after.streak || 0) : beforeStreak;
        setMasteryStreak(afterStreak);

        if (wasCorrect) {
            audio.play('correct');
            setScore(s => s + 1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(MODE, next);
            if (next > bestStreak) setBestStreak(next);
            // Genuine new bests need to reach the pass via streaks_json before
            // the streak_* challenges can flip — flush profile then refresh.
            if (recordBestStreak(MODE, next)) flushProfile().then(() => refreshBattlepass());
            // Scaled XP: harder modes pay more, hot streak multiplies up to 2x,
            // and a brand-new flag is worth more than an already-mastered one.
            // Economy v2: Bucks land alongside XP at the old (pre-double) rate.
            const award = awardForAnswer(currentFlag, 'multiple-choice', next);
            addEarnedXp(award.amount);
            const bucksAward = awardBucksForAnswer(award);
            if (bucksAward > 0) addEarnedBucks(bucksAward);
            bumpMetric('mc_correct', 1);
            // Quests: per-mode + cross-mode correct counters plus a streak HWM
            // and a "master_new" trigger when the streak crosses the mastery
            // threshold — the same data the pass uses, fanned out twice.
            bumpQuestMetric('mc_correct', 1);
            bumpQuestMetric('any_correct', 1);
            reportStreakHwm(next);
            if (beforeStreak <= MASTERY_STREAK && afterStreak > MASTERY_STREAK) {
                bumpQuestMetric('master_new', 1);
            }
            setXpGain({ ...award, bucks: bucksAward });
            setShowConfetti(true);
            // A satisfying flourish the moment a flag crosses into "mastered".
            if (beforeStreak <= MASTERY_STREAK && afterStreak > MASTERY_STREAK) {
                audio.play('levelUp');
            }
        } else {
            audio.play('incorrect');
            setStreak(0);
            resetStreak(MODE);
            // Wrong answers shave a little earned XP (never below zero).
            const penalty = penaltyForAnswer('multiple-choice');
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
        }

        setTimeout(() => {
            nextQuestion();
        }, 2000);
    };

    const handleSkip = () => {
        if (!currentFlag || answered) return;
        if (variant === 'flash') {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            setFlashHidden(false);
        }
        setAnswered(true);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setStreak(0);
        resetStreak(MODE);
        setAnsweredTotal((n) => n + 1);
        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag, false, 'skipped');
        setFlagsData(updatedFlags);
        setFeedback({ text: message.text, answer: message.answer, tone: color });
        const after = updatedFlags.find((f) => f.code === currentFlag.code);
        if (after) setMasteryStreak(after.streak || 0);
        setTimeout(() => {
            nextQuestion();
        }, 2000);
    };

    const getChoiceState = (option) => {
        if (!answered) return 'idle';
        if (option === currentFlag.name) return 'correct';
        if (option === chosenAnswer && option !== currentFlag.name) return 'incorrect';
        return 'idle';
    };

    // Keyboard play: the A/B/C/D badges imply key selection, so honour it.
    // 1–4 / A–D pick an option while unanswered; Enter/Space advances once
    // answered (skipping the 2s auto-advance wait). Latest values via a ref so
    // the listener binds once and never goes stale.
    const kbRef = useRef({});
    kbRef.current = { answered, options, handleAnswer, nextQuestion, hasFlag: !!currentFlag };
    useEffect(() => {
        const onKey = (e) => {
            const st = kbRef.current;
            if (!st.hasFlag) return;
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

    if (isLoading) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Loading next flag…</span>
            </div>
        );
    }

    if (!currentFlag) {
        return (
            <div className="quiz-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={handleBack} aria-label="Back to menu">
                        <Icon name="arrow_back" />
                    </button>
                </div>
                <Mascot size={120} mood="cheer" cosmetics={profile.cosmetics} />
                <h1 className="text-center">You're all caught up!</h1>
                <p className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                    Come back later to review more flags.
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
        <div className={`quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
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
                {variant === 'reverse' ? (
                    <motion.div
                        key={`reverse-${currentFlag.code}`}
                        className="reverse-prompt"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        <span className="reverse-prompt__label">Pick the flag of</span>
                        <span className="reverse-prompt__name">{currentFlag.name}</span>
                    </motion.div>
                ) : variant === 'flash' && flashHidden && !answered ? (
                    <motion.div
                        key={`${currentFlag.file}-hidden`}
                        className="flag-image flag-flash-placeholder"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        aria-label="Flag hidden"
                    >
                        ?
                    </motion.div>
                ) : (
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

            {variant === 'reverse' ? (
                <div className="flag-choice-grid">
                    {options.map((option, i) => {
                        const optFlag = allFlagsData.find((f) => f.name === option);
                        const state = getChoiceState(option);
                        const isCorrect = state === 'correct';
                        const isIncorrect = state === 'incorrect';
                        return (
                            <div className="choice-wrap" key={`${currentFlag.code}-${option}`}>
                                <button
                                    type="button"
                                    className={`flag-choice ${isCorrect ? 'is-correct' : ''} ${isIncorrect ? 'is-incorrect' : ''}`}
                                    disabled={answered}
                                    onClick={() => handleAnswer(option)}
                                    aria-label={option}
                                >
                                    <span className="flag-choice__index">{String.fromCharCode(65 + i)}</span>
                                    {optFlag && (
                                        <img
                                            src={`${IMAGE_BASE_URL}${optFlag.file}`}
                                            alt=""
                                            className="flag-choice__img"
                                        />
                                    )}
                                    {isCorrect && <Icon name="check_circle" variant="correct" className="flag-choice__mark" />}
                                    {isIncorrect && <Icon name="cancel" variant="incorrect" className="flag-choice__mark" />}
                                </button>
                                <AnimatePresence>
                                    {showConfetti && option === currentFlag.name && (
                                        <Confetti pieces={16} radius={110} />
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="options-box">
                    {options.map((option, i) => (
                        <div className="choice-wrap" key={`${currentFlag.code}-${option}`}>
                            <ChoiceCard
                                label={option}
                                index={i}
                                state={getChoiceState(option)}
                                disabled={answered}
                                onSelect={handleAnswer}
                            />
                            <AnimatePresence>
                                {showConfetti && option === currentFlag.name && (
                                    <Confetti pieces={16} radius={110} />
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            <div className="quiz-actions">
                <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                    Skip
                </button>
            </div>

            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title="Run complete!"
                subtitle={`${score} correct · streak ${bestStreak}`}
                showRarity
                onClose={() => { setChest(null); navigateBack(); }}
            />
        </div>
    );
}

export default MultipleChoiceQuiz;
