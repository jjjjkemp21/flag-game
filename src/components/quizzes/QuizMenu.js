import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import ScoringInfo from './ScoringInfo';
import { useAudio } from '../../audio/AudioProvider';
import { MASTERY_STREAK } from '../../lib/xp';
import { GLOBE_RENDERABLE_ISO2 } from '../../lib/achievements';
import { springs } from '../../motion/index';

const formatCategoryName = (name) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// In Globe mode the deck is filtered at runtime to flags whose ISO-A2 has
// a Natural Earth polygon — territories, supranationals, and a handful of
// micro-states the 110m dataset drops are skipped. We mirror that here so
// the per-deck "X/Y" reflects the deck the player will actually play
// instead of the unfiltered region total.
const isGeoEligible = (f) => GLOBE_RENDERABLE_ISO2.has((f.code || '').toUpperCase());

const getCategoryStats = (flags, quizMode) => {
    if (!flags || flags.length === 0) {
        return { mastered: 0, total: 0, needsReview: 0 };
    }
    // Mastery threshold must match everywhere else (MainMenu, Stats, achievements,
    // server): a flag is mastered once its streak passes MASTERY_STREAK. Globe
    // mode tracks a separate per-flag geo-streak, so we read THAT in globe mode
    // (mastering a flag in MC doesn't automatically master it on the globe).
    const isGlobe = quizMode === 'globe';
    const deck = isGlobe ? flags.filter(isGeoEligible) : flags;
    const now = Date.now();
    const streakOf = (f) => (isGlobe ? (f.geoStreak || 0) : (f.streak || 0));
    const nextReviewOf = (f) => (isGlobe ? f.geoNextReview : f.nextReview);
    const mastered = deck.filter(f => streakOf(f) > MASTERY_STREAK).length;
    const needsReview = deck.filter(f => nextReviewOf(f) !== null && nextReviewOf(f) <= now).length;
    return { mastered, total: deck.length, needsReview };
};

function GridButton({ name, flags, onClick, index, quizMode }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const stats = getCategoryStats(flags, quizMode);
    const isCompleted = stats.mastered === stats.total && stats.total > 0;

    return (
        <motion.button
            className="grid-button"
            onClick={() => { audio.play('click'); onClick(); }}
            disabled={stats.total === 0}
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.04 * index }}
            whileHover={!prefersReduced && stats.total > 0 ? { y: -3 } : undefined}
            whileTap={!prefersReduced && stats.total > 0 ? { scale: 0.97 } : undefined}
            aria-label={`${name} — ${stats.mastered} of ${stats.total} mastered`}
        >
            <span className="grid-button-name">{name}</span>
            <div className="grid-button-stats">
                <span className={isCompleted ? 'completed' : ''}>
                    {stats.mastered}/{stats.total}
                </span>
                {stats.needsReview > 0 && (
                    <span className="review-stat">{stats.needsReview} review</span>
                )}
            </div>
        </motion.button>
    );
}

function PrimaryDeckButton({ tone = 'primary', name, flags, onClick, icon, index, quizMode }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const stats = getCategoryStats(flags, quizMode);
    return (
        <motion.button
            className={`mode-card tone-${tone}`}
            onClick={() => { audio.play('click'); onClick(); }}
            disabled={stats.total === 0}
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.04 * index }}
            whileHover={!prefersReduced && stats.total > 0 ? { y: -3 } : undefined}
            whileTap={!prefersReduced && stats.total > 0 ? { scale: 0.97 } : undefined}
            aria-label={name}
        >
            {stats.total > 0 && (
                <div className="mode-card__badge">
                    {stats.mastered}/{stats.total} mastered
                    {stats.needsReview > 0 ? ` · ${stats.needsReview} review` : ''}
                </div>
            )}
            <div className="mode-card__title">{name}</div>
            <div className="mode-card__desc">
                {stats.total === 0 ? 'No flags due — come back later' : 'Start the quiz'}
            </div>
            {icon && <Icon name={icon} className="mode-card__icon" />}
        </motion.button>
    );
}

function QuizMenu({ setView, setQuizCategory, flagsData, quizMode }) {
    const audio = useAudio();
    const startQuiz = (type, value) => {
        setQuizCategory({ type, value });
        setView(quizMode);
    };

    const categories = useMemo(() => {
        const regions = [...new Set(flagsData.flatMap(f =>
            f.tags.filter(t => t.startsWith('region:')).map(t => t.split(':')[1])
        ))].sort();
        const layouts = ['tricolour', 'bicolour', 'cross', 'canton', 'single_field', 'hoist_triangle'];
        return { regions, layouts };
    }, [flagsData]);

    const now = Date.now();
    // Needs-review pulls from the mode's own review schedule so Globe mode's
    // tile isn't dominated by flags the player hasn't seen ON THE GLOBE yet.
    const isGlobe = quizMode === 'globe';
    const needsReviewFlags = flagsData.filter((f) => {
        const due = isGlobe ? f.geoNextReview : f.nextReview;
        return due !== null && due !== undefined && due <= now;
    });

    return (
        <div className="main-menu-box">
            <div className="quiz-topbar">
                <button
                    className="back-button"
                    onClick={() => { audio.play('click'); setView('menu'); }}
                    aria-label="Back"
                >
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <div className="menu-title-row">
                <h1 className="menu-title">Choose a Deck</h1>
                <ScoringInfo mode={quizMode} />
            </div>
            <p className="menu-subtitle">Select a set of flags to begin your quiz.</p>

            <div className="mode-grid">
                <PrimaryDeckButton
                    tone="primary"
                    name="All Flags"
                    flags={flagsData}
                    icon="public"
                    onClick={() => startQuiz('all', null)}
                    index={0}
                    quizMode={quizMode}
                />
                <PrimaryDeckButton
                    tone="accent"
                    name="Needs Review"
                    flags={needsReviewFlags}
                    icon="refresh"
                    onClick={() => startQuiz('review', null)}
                    index={1}
                    quizMode={quizMode}
                />
            </div>

            <div className="category-section">
                <h3>By Region</h3>
                <div className="category-grid">
                    {categories.regions.map((region, i) => (
                        <GridButton
                            key={region}
                            name={formatCategoryName(region)}
                            flags={flagsData.filter(f => f.tags.includes(`region:${region}`))}
                            onClick={() => startQuiz('region', region)}
                            index={i}
                            quizMode={quizMode}
                        />
                    ))}
                </div>
            </div>

            <div className="category-section">
                <h3>By Layout</h3>
                <div className="category-grid">
                    {categories.layouts.map((layout, i) => (
                        <GridButton
                            key={layout}
                            name={formatCategoryName(layout)}
                            flags={flagsData.filter(f => f.tags.includes(`layout:${layout}`))}
                            onClick={() => startQuiz('layout', layout)}
                            index={i}
                            quizMode={quizMode}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default QuizMenu;
