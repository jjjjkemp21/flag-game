import React from 'react';
import Icon from './Icon';
import Stats from './Stats';

// Dedicated Statistics page (reached from the main menu). Wraps the existing
// progress panel with a back button so it reads as its own screen.
function StatsScreen({ setView, flagsData }) {
    return (
        <div className="quiz-box stats-screen">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <Stats flagsData={flagsData} />
        </div>
    );
}

export default StatsScreen;
