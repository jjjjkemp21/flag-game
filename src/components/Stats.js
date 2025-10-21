import React, { useState, useEffect } from 'react';
import './Stats.css';

function Stats({ flagsData }) {
    const [frenzyHighScore, setFrenzyHighScore] = useState(0);
    const [pixelHighScore, setPixelHighScore] = useState(0);

    useEffect(() => {
        const fScore = localStorage.getItem('frenzyHighScore') || 0;
        const pScore = localStorage.getItem('pixelatedHighScore') || 0;
        setFrenzyHighScore(parseInt(fScore, 10));
        setPixelHighScore(parseInt(pScore, 10));
    }, []);

    if (!flagsData || flagsData.length === 0) {
        return null;
    }

    const masteredThreshold = 5;
    const learningThreshold = 0;

    const masteredCount = flagsData.filter(f => f.streak > masteredThreshold).length;
    const learningCount = flagsData.filter(f => f.streak > learningThreshold && f.streak <= masteredThreshold).length;
    const needsPracticeCount = flagsData.filter(f => f.streak <= learningThreshold).length;

    const sortedByKnowledge = [...flagsData].sort((a, b) => b.streak - a.streak);
    const bestKnown = sortedByKnowledge.length > 0 ? sortedByKnowledge[0] : null;
    const worstKnown = sortedByKnowledge.length > 0 ? sortedByKnowledge[sortedByKnowledge.length - 1] : null;

    return (
        <div className="stats-box">
            <h2>Your Progress</h2>
            <div className="stats-grid knowledge-grid">
                <div className="stat-item">
                    <span className="stat-value">{masteredCount}</span>
                    <span className="stat-label">Mastered</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{learningCount}</span>
                    <span className="stat-label">Learning</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{needsPracticeCount}</span>
                    <span className="stat-label">Needs Practice</span>
                </div>
            </div>

            <h3 className="stats-subtitle">Bonus Mode High Scores</h3>
            <div className="stats-grid high-score-grid">
                <div className="stat-item">
                    <span className="stat-value bonus-score">{pixelHighScore}</span>
                    <span className="stat-label">Pixelated</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value bonus-score">{frenzyHighScore}</span>
                    <span className="stat-label">Frenzy</span>
                </div>
            </div>

            {bestKnown && worstKnown && (
                <div className="stats-details">
                    <h3 className="stats-subtitle">Knowledge</h3>
                    <p><strong>Best:</strong> {bestKnown.name} (Streak: {bestKnown.streak})</p>
                    <p><strong>Needs Practice:</strong> {worstKnown.name} (Streak: {worstKnown.streak})</p>
                </div>
            )}
        </div>
    );
}

export default Stats;