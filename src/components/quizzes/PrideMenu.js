import React, { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import ScoringInfo from './ScoringInfo';
import { useAudio } from '../../audio/AudioProvider';
import {
    usePride,
    ensurePrideCatalog,
    prideGroups,
    prideDeckStats,
} from '../../lib/pride';
import { springs } from '../../motion/index';

const GROUP_LABELS = {
    umbrella: 'Umbrella',
    attraction: 'Attraction',
    gender: 'Gender identity',
};

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

function PrimaryDeckButton({ tone = 'primary', name, desc, stats, onClick, icon, index, emptyHint }) {
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
            <div className="mode-card__desc">{stats.total === 0 ? emptyHint : desc}</div>
            {icon && <Icon name={icon} className="mode-card__icon" />}
        </motion.button>
    );
}

// Pride deck picker — All / Needs Review / By Category. Same shape as
// CapitalsMenu (mastery-style deck picker), feeding PrideQuiz via setPrideDeck.
function PrideMenu({ setView, setPrideDeck }) {
    const audio = useAudio();
    usePride();
    useEffect(() => { ensurePrideCatalog(); }, []);

    const startQuiz = (type, value) => {
        setPrideDeck({ type, value });
        setView('pride-quiz');
    };

    const groups = useMemo(() => prideGroups(), []);
    const allStats = prideDeckStats({ type: 'all' });
    const reviewStats = prideDeckStats({ type: 'review' });

    return (
        <div className="main-menu-box">
            <div className="quiz-topbar">
                <button
                    className="back-button"
                    onClick={() => { audio.play('click'); setView('bonus-menu'); }}
                    aria-label="Back"
                >
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <div className="menu-title-row">
                <h1 className="menu-title">Pride</h1>
                <ScoringInfo mode="pride" />
            </div>
            <p className="menu-subtitle">Identify LGBTQ+ pride flags by sight.</p>

            <div className="mode-grid">
                <PrimaryDeckButton
                    tone="primary"
                    name="All Flags"
                    desc="Every flag in the catalog"
                    stats={allStats}
                    icon="all_inclusive"
                    onClick={() => startQuiz('all', null)}
                    index={0}
                    emptyHint="Catalog still loading…"
                />
                <PrimaryDeckButton
                    tone="success"
                    name="Needs Review"
                    desc="Flags you're due to revisit"
                    stats={reviewStats}
                    icon="refresh"
                    onClick={() => startQuiz('review', null)}
                    index={1}
                    emptyHint="Nothing due — come back later"
                />
            </div>

            <div className="category-section">
                <h3>By Category</h3>
                <div className="category-grid">
                    {groups.map((g, i) => (
                        <GridButton
                            key={g}
                            name={GROUP_LABELS[g] || g}
                            stats={prideDeckStats({ type: 'group', value: g })}
                            onClick={() => startQuiz('group', g)}
                            index={i}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PrideMenu;
