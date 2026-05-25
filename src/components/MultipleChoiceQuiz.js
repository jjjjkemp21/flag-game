import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get_distractor_options, update_flag_stats } from '../quiz_logic';
import Icon from './Icon';
import { ChoiceCard, ScoreBubble } from './ui';
import Confetti from '../assets/illustrations/Confetti';
import Mascot from '../assets/illustrations/Mascot';
import MasteryMeter from './MasteryMeter';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { useProfile, recordBestStreak } from '../lib/profile';
import { awardForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../lib/xp';
import { addEarnedXp } from '../lib/progress';
import { bumpMetric } from '../lib/battlepass';
import { getStreak, saveStreak, resetStreak } from '../lib/streak';
import { springs } from '../motion';

const MODE = 'multiple-choice';
const IMAGE_BASE_URL = './assets/flags/';

function MultipleChoiceQuiz({
    allFlagsData,
    quizFlags,
    setFlagsData,
    selectNextFlag,
    setView,
    setQuizCategory,
    quizCategory,
    getQuestionHistory,
    updateQuestionHistory,
}) {
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
    const audio = useAudio();
    const profile = useProfile();

    const handleBack = () => {
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
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
            const distractors = get_distractor_options(questionFlag, allFlagsData, 3, quizCategory, history);
            const shuffledOptions = [...distractors, questionFlag.name].sort(() => Math.random() - 0.5);
            setOptions(shuffledOptions);
        }
        setIsLoading(false);
    }, [quizFlags, allFlagsData, selectNextFlag, quizCategory, getQuestionHistory, updateQuestionHistory]);

    useEffect(() => {
        nextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnswer = (answer) => {
        if (!currentFlag || answered) return;

        setAnswered(true);
        setChosenAnswer(answer);
        const wasCorrect = answer === currentFlag.name;
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');

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
            recordBestStreak(MODE, next);
            // Scaled XP: harder modes pay more, hot streak multiplies up to 2x,
            // and a brand-new flag is worth more than an already-mastered one.
            const award = awardForAnswer(currentFlag, 'multiple-choice', next);
            addEarnedXp(award.amount);
            bumpMetric('mc_correct', 1);
            setXpGain(award);
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
        setAnswered(true);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setStreak(0);
        resetStreak(MODE);
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
            </div>

            <MasteryMeter streak={masteryStreak} />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <motion.img
                    key={currentFlag.file}
                    src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                    alt="Flag"
                    className="flag-image"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
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
                            {xpGain.amount < 0
                                ? `${xpGain.amount} XP`
                                : `+${xpGain.amount} XP${xpGain.multiplier > 1 ? ` ×${xpGain.multiplier.toFixed(1)}` : ''}`}
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

            <div className="quiz-actions">
                <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                    Skip
                </button>
            </div>
        </div>
    );
}

export default MultipleChoiceQuiz;
