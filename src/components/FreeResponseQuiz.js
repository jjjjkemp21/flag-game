import React, { useState, useEffect, useCallback, useRef } from 'react';
import { update_flag_stats } from '../quiz_logic';
import './QuizStyles.css';

const IMAGE_BASE_URL = './assets/flags/';

function levenshtein(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1);
    for (let i = 0; i <= bn; i++) {
        matrix[i] = [i];
    }
    const bMatrix = matrix[0];
    for (let j = 1; j <= an; j++) {
        bMatrix[j] = j;
    }
    for (let i = 1; i <= bn; i++) {
        for (let j = 1; j <= an; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }
    return matrix[bn][an];
}

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

        const userAnswer = inputValue.trim().toLowerCase();
        const correctAnswer = currentFlag.name.toLowerCase();
        let wasCorrect;
        if (strictSpelling) {
            wasCorrect = userAnswer === correctAnswer;
        } else {
            const distance = levenshtein(userAnswer, correctAnswer);
            const maxLength = Math.max(userAnswer.length, correctAnswer.length);
            if (maxLength === 0) {
                wasCorrect = true;
            } else {
                const similarity = 1 - (distance / maxLength);
                wasCorrect = similarity >= 0.8;
            }
        }

        if (!wasCorrect) {
            setIsWiggling(true);
            setTimeout(() => setIsWiggling(false), 500);
        }

        setAnswered(true);
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