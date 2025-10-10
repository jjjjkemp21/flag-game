import React, { useMemo } from 'react';
import './Menu.css';

const formatCategoryName = (name) => {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
};

const getCategoryStats = (flags) => {
    if (!flags || flags.length === 0) {
        return { mastered: 0, total: 0, needsReview: 0 };
    }
    const masteredThreshold = 5;
    const now = Date.now();

    const mastered = flags.filter(f => f.streak > masteredThreshold).length;
    const needsReview = flags.filter(f => f.nextReview !== null && f.nextReview <= now).length;
    return { mastered, total: flags.length, needsReview };
};

const GridButton = ({ name, flags, onClick }) => {
    const stats = getCategoryStats(flags);
    const isCompleted = stats.mastered === stats.total && stats.total > 0;

    return (
        <button className="grid-button" onClick={onClick} disabled={stats.total === 0}>
            <span className="grid-button-name">{name}</span>
            <div className="grid-button-stats">
                <span className={isCompleted ? 'completed' : ''}>
                    {stats.mastered}/{stats.total}
                </span>
                {stats.needsReview > 0 && (
                    <span className="review-stat">
                        {stats.needsReview} review
                    </span>
                )}
            </div>
        </button>
    );
};

const MenuButton = ({ name, flags, onClick }) => {
    const stats = getCategoryStats(flags);
    const isCompleted = stats.mastered === stats.total && stats.total > 0;
    return (
        <button className="menu-button" onClick={onClick} disabled={stats.total === 0}>
            {name}
            {stats.total > 0 && (
                <div className="menu-button-stats">
                    <span className={isCompleted ? 'completed' : ''}>
                        {stats.mastered} / {stats.total} Mastered
                    </span>
                    {stats.needsReview > 0 && (
                        <>
                            {' • '}
                            <span className="review-stat">
                                {stats.needsReview} to review
                            </span>
                        </>
                    )}
                </div>
            )}
        </button>
    );
};

function QuizMenu({ setView, setQuizCategory, flagsData, quizMode }) {
    const startQuiz = (type, value) => {
        setQuizCategory({ type, value });
        setView(quizMode);
    };

    const categories = useMemo(() => {
        const regions = [...new Set(flagsData.flatMap(f => f.tags.filter(t => t.startsWith('region:')).map(t => t.split(':')[1])))].sort();
        const layouts = ['tricolour', 'bicolour', 'cross', 'canton', 'single_field', 'hoist_triangle'];
        return { regions, layouts };
    }, [flagsData]);

    const now = Date.now();
    const needsReviewFlags = flagsData.filter(f => f.nextReview !== null && f.nextReview <= now);

    return (
        <div className="main-menu-box">
            <button className="back-button" onClick={() => setView('menu')}>←</button>
            <h1 className="menu-title">Choose a Deck</h1>
            <p className="menu-subtitle">Select a set of flags to begin your quiz.</p>
            
            <div className="menu-options">
                <MenuButton name="All Flags" flags={flagsData} onClick={() => startQuiz('all', null)} />
                <MenuButton name="Needs Review" flags={needsReviewFlags} onClick={() => startQuiz('review', null)} />
            </div>

            <div className="category-section">
                <h3>By Region</h3>
                <div className="category-grid">
                    {categories.regions.map(region => (
                        <GridButton
                            key={region}
                            name={formatCategoryName(region)}
                            flags={flagsData.filter(f => f.tags.includes(`region:${region}`))}
                            onClick={() => startQuiz('region', region)}
                        />
                    ))}
                </div>
            </div>

            <div className="category-section">
                <h3>By Layout</h3>
                <div className="category-grid">
                    {categories.layouts.map(layout => (
                         <GridButton
                            key={layout}
                            name={formatCategoryName(layout)}
                            flags={flagsData.filter(f => f.tags.includes(`layout:${layout}`))}
                            onClick={() => startQuiz('layout', layout)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default QuizMenu;