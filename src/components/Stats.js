import React, { useState, useEffect } from 'react';
import './Stats.css';

function Stats({ flagsData }) {
    const [frenzyHighScore, setFrenzyHighScore] = useState(0);
    const [pixelHighScore, setPixelHighScore] = useState(0);
    const [longestRouteHighScore, setLongestRouteHighScore] = useState(0);
    const [languageHighScore, setLanguageHighScore] = useState(0);

    useEffect(() => {
        const fScore = localStorage.getItem('frenzyHighScore') || 0;
        const pScore = localStorage.getItem('pixelatedHighScore') || 0;
        const lrScore = localStorage.getItem('longestRouteHighScore') || 0;
        const langScore = localStorage.getItem('languageHighScore') || 0;
        setFrenzyHighScore(parseInt(fScore, 10));
        setPixelHighScore(parseInt(pScore, 10));
        setLongestRouteHighScore(parseInt(lrScore, 10));
        setLanguageHighScore(parseInt(langScore, 10));
    }, []);

    if (!flagsData || flagsData.length === 0) {
        return null;
    }

    const masteredThreshold = 5;
    const learningThreshold = 0;

    const masteredCount = flagsData.filter(f => f.streak > masteredThreshold).length;
    const learningCount = flagsData.filter(f => f.streak > learningThreshold && f.streak <= masteredThreshold).length;
    const needsPracticeCount = flagsData.filter(f => f.streak <= learningThreshold).length;

    // Only surface Best/Worst once the user has actually answered flags.
    const answeredFlags = flagsData.filter(f => (f.correct || 0) + (f.incorrect || 0) > 0);
    const hasAnswered = answeredFlags.length > 0;
    const sortedByKnowledge = [...answeredFlags].sort((a, b) => b.streak - a.streak);
    const bestKnown = hasAnswered ? sortedByKnowledge[0] : null;
    const worstKnown = hasAnswered ? sortedByKnowledge[sortedByKnowledge.length - 1] : null;

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
                <div className="stat-item">
                    <span className="stat-value bonus-score">{longestRouteHighScore}</span>
                    <span className="stat-label">Longest Chain</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value bonus-score">{languageHighScore}</span>
                    <span className="stat-label">Language</span>
                </div>
            </div>

            {hasAnswered && (
                <div className="stats-details">
                    <h3 className="stats-subtitle">Knowledge</h3>
                    <p><strong>Best:</strong> {bestKnown.name} (Streak: {bestKnown.streak})</p>
                    {worstKnown && worstKnown !== bestKnown && (
                        <p><strong>Needs Practice:</strong> {worstKnown.name} (Streak: {worstKnown.streak})</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Stats;