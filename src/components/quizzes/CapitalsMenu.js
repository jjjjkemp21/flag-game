import React, { useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import ScoringInfo from './ScoringInfo';
import { useAudio } from '../../audio/AudioProvider';
import { useCapitals, ensureCapitalsCatalog, capitalRegions, capitalDeckStats } from '../../lib/capitals';
import { springs } from '../../motion/index';

const formatCategoryName = (name) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function GridButton({ name, stats, onClick, index }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
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

function PrimaryDeckButton({ tone = 'primary', name, stats, onClick, icon, index, emptyHint }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
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
                {stats.total === 0 ? emptyHint : 'Start the quiz'}
            </div>
            {icon && <Icon name={icon} className="mode-card__icon" />}
        </motion.button>
    );
}

// Deck picker for Capitals mode — the same All / Needs Review / By Region shape
// the flag quizzes get from QuizMenu, but driven by the per-capital mastery
// track instead of flag tags. The chosen deck is handed to CapitalsQuiz via
// setCapitalsDeck; question selection narrows to it while distractors stay broad.
function CapitalsMenu({ setView, setCapitalsDeck, includeTerritories = false }) {
    const audio = useAudio();
    // Subscribe so the per-deck mastery/review counts tick live as capitals are
    // learned (capitalDeckStats reads the live store).
    useCapitals();
    // Warm the catalog in case the player reached this screen before App's
    // mount-time warm finished (idempotent).
    useEffect(() => { ensureCapitalsCatalog(); }, []);

    const startQuiz = (type, value) => {
        setCapitalsDeck({ type, value });
        setView('capitals-quiz');
    };

    const regions = useMemo(() => capitalRegions(includeTerritories), [includeTerritories]);
    const allStats = capitalDeckStats({ type: 'all' }, includeTerritories);
    const reviewStats = capitalDeckStats({ type: 'review' }, includeTerritories);

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
                <ScoringInfo mode="capitals" />
            </div>
            <p className="menu-subtitle">Pick which capitals to practise.</p>

            <div className="mode-grid">
                <PrimaryDeckButton
                    tone="primary"
                    name="All Capitals"
                    stats={allStats}
                    icon="public"
                    onClick={() => startQuiz('all', null)}
                    index={0}
                    emptyHint="No capitals — enable territories in Settings"
                />
                <PrimaryDeckButton
                    tone="accent"
                    name="Needs Review"
                    stats={reviewStats}
                    icon="refresh"
                    onClick={() => startQuiz('review', null)}
                    index={1}
                    emptyHint="Nothing due — come back later"
                />
            </div>

            <div className="category-section">
                <h3>By Region</h3>
                <div className="category-grid">
                    {regions.map((region, i) => (
                        <GridButton
                            key={region}
                            name={formatCategoryName(region)}
                            stats={capitalDeckStats({ type: 'region', value: region }, includeTerritories)}
                            onClick={() => startQuiz('region', region)}
                            index={i}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CapitalsMenu;
