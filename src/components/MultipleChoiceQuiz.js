import React, { useState, useEffect, useCallback } from 'react';
import { get_distractor_options, update_flag_stats } from '../quiz_logic';
import './QuizStyles.css';

const IMAGE_BASE_URL = './assets/flags/';

function MultipleChoiceQuiz({ allFlagsData, quizFlags, setFlagsData, selectNextFlag, setView, setQuizCategory, questionHistory, updateQuestionHistory }) {
    const [currentFlag, setCurrentFlag] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState({ message: { text: '\u00A0' }, color: 'var(--text-color)' });
    const [answered, setAnswered] = useState(false);
    const [chosenAnswer, setChosenAnswer] = useState(null);
    const [flashColor, setFlashColor] = useState(null);

    const handleBack = () => {
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
    };

    const nextQuestion = useCallback(() => {
        setIsLoading(true);
        setFlashColor(null);
        setFeedback({ message: { text: '\u00A0' }, color: 'var(--text-color)' });
        setAnswered(false);
        setChosenAnswer(null);

        const questionFlag = selectNextFlag(quizFlags, questionHistory);
        setCurrentFlag(questionFlag);

        if (questionFlag) {
            updateQuestionHistory(questionFlag.code);
            const distractors = get_distractor_options(questionFlag, allFlagsData, 3);
            const shuffledOptions = [...distractors, questionFlag.name].sort(() => Math.random() - 0.5);
            setOptions(shuffledOptions);
        }
        setIsLoading(false);
    }, [quizFlags, allFlagsData, selectNextFlag, questionHistory, updateQuestionHistory]);

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

        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag.name, wasCorrect);
        const feedbackColor = color === 'green' ? 'var(--correct-color)' : 'var(--incorrect-color)';
        setFlagsData(updatedFlags);
        setFeedback({ message, color: feedbackColor });

        setTimeout(() => {
            nextQuestion();
        }, 2000);
    };

    const handleSkip = () => {
        if (!currentFlag || answered) return;
        setAnswered(true);
        setFlashColor('incorrect');
        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag.name, false, 'skipped');
        const feedbackColor = color === 'green' ? 'var(--correct-color)' : 'var(--incorrect-color)';
        setFlagsData(updatedFlags);
        setFeedback({ message, color: feedbackColor });

        setTimeout(() => {
            nextQuestion();
        }, 2000);
    };

    const getButtonClass = (option) => {
        if (!answered) return 'option-button';
        if (option === currentFlag.name) return 'option-button correct';
        if (option === chosenAnswer && option !== currentFlag.name) return 'option-button incorrect';
        return 'option-button';
    };

    if (isLoading) {
        return <div className="quiz-box"><h2>Loading next flag...</h2></div>;
    }

    if (!currentFlag) {
        return (
            <div className="quiz-box">
                <button className="back-button" onClick={handleBack}>←</button>
                <h1>You're all done for now. Great job! 🎉</h1>
                <p style={{ textAlign: 'center' }}>Come back later to review more flags.</p>
            </div>
        );
    }

    return (
        <div className={`quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
            <button className="back-button" onClick={handleBack}>←</button>
            <img
                src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                alt="Flag"
                className="flag-image"
            />
            <p className="feedback-label" style={{ color: feedback.color }}>
                <span>{feedback.message.text}</span>
                {feedback.message.answer && <span className="feedback-answer">{feedback.message.answer}</span>}
            </p>
            <div className="options-box">
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={answered}
                        className={getButtonClass(option)}
                    >
                        {option}
                    </button>
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