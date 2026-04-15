import React, { useState, useEffect, useCallback, useRef } from 'react';
import { update_flag_stats } from '../quiz_logic';
import { checkAnswer } from '../answer_check';
import Icon from './Icon';
import './QuizStyles.css';

const IMAGE_BASE_URL = './assets/flags/';

function FreeResponseQuiz({ allFlagsData, quizFlags, setFlagsData, selectNextFlag, setView, strictSpelling, setQuizCategory, questionHistory, updateQuestionHistory }) {
    const [currentFlag, setCurrentFlag] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState({ message: { text: "Type the country's name" }, color: 'var(--text-color)' });
    const [answered, setAnswered] = useState(false);
    const inputRef = useRef(null);
    const [flashColor, setFlashColor] = useState(null);
    const [isWiggling, setIsWiggling] = useState(false);

    const handleBack = () => {
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
    };

    const nextQuestion = useCallback(() => {
        setIsLoading(true);
        setFlashColor(null);
        setFeedback({ message: { text: "Type the country's name" }, color: 'var(--text-color)' });
        setAnswered(false);
        setInputValue('');
        const questionFlag = selectNextFlag(quizFlags, questionHistory);
        setCurrentFlag(questionFlag);
        if (questionFlag) {
            updateQuestionHistory(questionFlag.code);
        }
        setIsLoading(false);
    }, [quizFlags, selectNextFlag, questionHistory, updateQuestionHistory]);

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
        
        // --- MODIFIED: Pass currentFlag (object) instead of just currentFlag.name ---
        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag, wasCorrect);
        
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
        
        // --- MODIFIED: Pass currentFlag (object) instead of just currentFlag.name ---
        const { message, color, updatedFlags } = update_flag_stats(allFlagsData, currentFlag, false, 'skipped');

        const feedbackColor = color === 'green' ? 'var(--correct-color)' : 'var(--incorrect-color)';
        setFlagsData(updatedFlags);
        setFeedback({ message, color: feedbackColor });
        setTimeout(() => {
            nextQuestion();
        }, 2000);
    };

    if (isLoading) {
        return <div className="loading-box">Loading next flag…</div>;
    }

    if (!currentFlag) {
        return (
            <div className="quiz-box">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" variant="primary" />
                </button>
                <Icon name="celebration" variant="highlight" size="xl" pop />
                <h1>You're all done for now. Great job!</h1>
                <p style={{ textAlign: 'center' }}>Come back later to review more flags.</p>
            </div>
        );
    }

    return (
        <div className={`quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
            <button className="back-button" onClick={handleBack} aria-label="Back">
                <Icon name="arrow_back" variant="primary" />
            </button>
            <img
                src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                alt="Flag"
                className="flag-image"
            />
            <div className="feedback-label" style={{ color: feedback.color }}>
                <div className="feedback-row">
                    {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                    {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                    <span>{feedback.message.text}</span>
                </div>
                {feedback.message.answer && <span className="feedback-answer">{feedback.message.answer}</span>}
            </div>
            <form onSubmit={handleSubmit} className="response-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={answered}
                    className={`response-input ${isWiggling ? 'wiggle' : ''}`}
                    placeholder="Enter country name..."
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