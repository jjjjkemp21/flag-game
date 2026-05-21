import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get_distractor_options, update_flag_stats } from '../quiz_logic';
import Icon from './Icon';
import { ChoiceCard, ScoreBubble } from './ui';
import Confetti from '../assets/illustrations/Confetti';
import Mascot from '../assets/illustrations/Mascot';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { springs } from '../motion';

const IMAGE_BASE_URL = './assets/flags/';

function MultipleChoiceQuiz({
    allFlagsData,
    quizFlags,
    setFlagsData,
    selectNextFlag,
    setView,
    setQuizCategory,
    quizCategory,
    questionHistory,
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
    const [streak, setStreak] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const audio = useAudio();

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
        setShowConfetti(false);

        const questionFlag = selectNextFlag(quizFlags, questionHistory);
        setCurrentFlag(questionFlag);

        if (questionFlag) {
            updateQuestionHistory(questionFlag.code);
            const distractors = get_distractor_options(questionFlag, allFlagsData, 3, quizCategory, questionHistory);
            const shuffledOptions = [...distractors, questionFlag.name].sort(() => Math.random() - 0.5);
            setOptions(shuffledOptions);
        }
        setIsLoading(false);
    }, [quizFlags, allFlagsData, selectNextFlag, quizCategory, questionHistory, updateQuestionHistory]);

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

        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag, wasCorrect);
        setFlagsData(updatedFlags);
        setFeedback({ text: message.text, answer: message.answer, tone: color });

        if (wasCorrect) {
            audio.play('correct');
            setScore(s => s + 1);
            setStreak(s => {
                const next = s + 1;
                if (next === 3 || next === 5 || next === 10) {
                    audio.play('streak');
                }
                return next;
            });
            setShowConfetti(true);
        } else {
            audio.play('incorrect');
            setStreak(0);
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
        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag, false, 'skipped');
        setFlagsData(updatedFlags);
        setFeedback({ text: message.text, answer: message.answer, tone: color });
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
                <Mascot size={120} mood="cheer" />
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
                </span>
                <ScoreBubble score={score} icon="star" />
            </div>

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
                    {showConfetti && <Confetti pieces={28} />}
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
                            <Mascot size={56} mood="cheer" />
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
                            <Mascot size={56} mood="sad" />
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
                    <ChoiceCard
                        key={option}
                        label={option}
                        index={i}
                        state={getChoiceState(option)}
                        disabled={answered}
                        onSelect={handleAnswer}
                    />
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
