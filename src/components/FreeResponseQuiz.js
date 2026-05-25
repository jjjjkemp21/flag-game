import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { update_flag_stats } from '../quiz_logic';
import { checkAnswer } from '../answer_check';
import Icon from './Icon';
import { ScoreBubble } from './ui';
import Mascot from '../assets/illustrations/Mascot';
import Confetti from '../assets/illustrations/Confetti';
import MasteryMeter from './MasteryMeter';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { useProfile, recordBestStreak } from '../lib/profile';
import { awardForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../lib/xp';
import { addEarnedXp } from '../lib/progress';
import { bumpMetric } from '../lib/battlepass';
import { getStreak, saveStreak, resetStreak } from '../lib/streak';
import { springs } from '../motion';

const MODE = 'free-response';
const IMAGE_BASE_URL = './assets/flags/';

function FreeResponseQuiz({
    allFlagsData,
    quizFlags,
    setFlagsData,
    selectNextFlag,
    setView,
    strictSpelling,
    setQuizCategory,
    getQuestionHistory,
    updateQuestionHistory,
}) {
    const [currentFlag, setCurrentFlag] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState({ text: "Type the country's name" });
    const [answered, setAnswered] = useState(false);
    const inputRef = useRef(null);
    const [flashColor, setFlashColor] = useState(null);
    const [isWiggling, setIsWiggling] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(MODE));
    const [xpGain, setXpGain] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [masteryStreak, setMasteryStreak] = useState(0);
    const audio = useAudio();
    const profile = useProfile();

    const handleBack = () => {
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
    };

    const nextQuestion = useCallback(() => {
        setIsLoading(true);
        setFlashColor(null);
        setShowConfetti(false);
        setFeedback({ text: "Type the country's name" });
        setAnswered(false);
        setInputValue('');
        setXpGain(null);
        const questionFlag = selectNextFlag(quizFlags, getQuestionHistory());
        setCurrentFlag(questionFlag);
        setMasteryStreak(questionFlag ? (questionFlag.streak || 0) : 0);
        if (questionFlag) {
            updateQuestionHistory(questionFlag.code);
        }
        setIsLoading(false);
    }, [quizFlags, selectNextFlag, getQuestionHistory, updateQuestionHistory]);

    useEffect(() => {
        nextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoading && currentFlag && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoading, currentFlag]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentFlag || answered) return;

        if (!inputValue.trim()) {
            setIsWiggling(true);
            audio.play('incorrect', { volume: 0.5 });
            setTimeout(() => setIsWiggling(false), 500);
            return;
        }

        const wasCorrect = checkAnswer(inputValue, currentFlag, strictSpelling);

        if (!wasCorrect) {
            setIsWiggling(true);
            setTimeout(() => setIsWiggling(false), 500);
        }

        setAnswered(true);
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
            const award = awardForAnswer(currentFlag, 'free-response', next);
            addEarnedXp(award.amount);
            bumpMetric('fr_correct', 1);
            setXpGain(award);
            setShowConfetti(true);
            if (beforeStreak <= MASTERY_STREAK && afterStreak > MASTERY_STREAK) {
                audio.play('levelUp');
            }
        } else {
            audio.play('incorrect');
            setStreak(0);
            resetStreak(MODE);
            const penalty = penaltyForAnswer('free-response');
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
        }

        setTimeout(() => nextQuestion(), 2000);
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
        setTimeout(() => nextQuestion(), 2000);
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
                    <button className="back-button" onClick={handleBack} aria-label="Back">
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
                    {showConfetti && <Confetti pieces={26} />}
                </AnimatePresence>
                <AnimatePresence>
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

            <form onSubmit={handleSubmit} className="response-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={answered}
                    className={`response-input ${isWiggling ? 'wiggle' : ''}`}
                    placeholder="Enter country name…"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
                <div className="quiz-actions">
                    <button type="submit" disabled={answered || !inputValue.trim()} className="response-submit">
                        Submit
                    </button>
                    <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                        Skip
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FreeResponseQuiz;
