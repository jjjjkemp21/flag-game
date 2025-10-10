import React from 'react';
import Stats from './Stats';
import './Menu.css';

function MainMenu({ setView, flagsData, setQuizMode }) {
    const handleStartQuiz = (mode) => {
        setQuizMode(mode);
        setView('quiz-menu');
    };

    return (
        <div className="main-menu-box">
            <h1 className="menu-title">Flag Quiz</h1>
            <p className="menu-subtitle">Choose a mode to start learning!</p>
            <div className="menu-options">
                <button className="menu-button" onClick={() => handleStartQuiz('multiple-choice')}>
                    Multiple Choice
                </button>
                <button className="menu-button" onClick={() => handleStartQuiz('free-response')}>
                    Free Response
                </button>
                <button className="menu-button secondary" onClick={() => setView('settings')}>
                    Settings
                </button>
            </div>
            <Stats flagsData={flagsData} />
        </div>
    );
}

export default MainMenu;