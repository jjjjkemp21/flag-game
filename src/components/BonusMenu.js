import React, { useState, useEffect } from 'react';
import './Menu.css';
import './QuizStyles.css';

function BonusMenu({ setView }) {
    const [frenzyHighScore, setFrenzyHighScore] = useState(0);
    const [pixelHighScore, setPixelHighScore] = useState(0);

    useEffect(() => {
        const fScore = localStorage.getItem('frenzyHighScore') || 0;
        const pScore = localStorage.getItem('pixelatedHighScore') || 0;
        setFrenzyHighScore(parseInt(fScore, 10));
        setPixelHighScore(parseInt(pScore, 10));
    }, []);

    return (
        <div className="quiz-box bonus-menu-box">
            <button className="back-button" onClick={() => setView('menu')}>←</button>
            <h1 className="menu-title">Bonus Modes</h1>
            <p className="menu-subtitle">Try a fun challenge!</p>
            <div className="menu-options">
                <button className="menu-button" onClick={() => setView('pixelated-quiz')}>
                    Pixelated Guess
                    <span className="menu-button-stats">
                        High Score: {pixelHighScore}
                    </span>
                </button>
                <button className="menu-button" onClick={() => setView('frenzy-quiz')}>
                    Frenzy Mode
                    <span className="menu-button-stats">
                        High Score: {frenzyHighScore}
                    </span>
                </button>
            </div>
        </div>
    );
}

export default BonusMenu;