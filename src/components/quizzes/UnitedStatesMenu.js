import React, { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import ScoringInfo from './ScoringInfo';
import { useAudio } from '../../audio/AudioProvider';
import {
    useUsStates,
    ensureUsStatesCatalog,
    usStateRegions,
    usStateDeckStats,
} from '../../lib/usStates';
import { springs } from '../../motion/index';

const formatRegion = (name) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

function PrimaryDeckButton({ tone = 'primary', name, desc, stats, onClick, icon, index }) {
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
            <div className="mode-card__desc">{desc}</div>
            {icon && <Icon name={icon} className="mode-card__icon" />}
        </motion.button>
    );
}

// United States deck/sub-mode picker. Lives under Capitals (CapitalsMenu has a
// hero card that routes here). Two big tone cards pick the sub-mode (Map vs.
// Capitals); a By-Region grid below scopes either sub-mode to a slice of states.
// Picking a region implies the sub-mode the player taps from the topbar pills.
function UnitedStatesMenu({ setView, setUsDeck, setUsSubMode }) {
    const audio = useAudio();
    useUsStates(); // live mastery tick
    useEffect(() => { ensureUsStatesCatalog(); }, []);

    const startQuiz = (subMode, type, value) => {
        setUsSubMode(subMode);
        setUsDeck({ type, value });
        setView('united-states-quiz');
    };

    const regions = useMemo(() => usStateRegions(), []);
    const allStats = usStateDeckStats({ type: 'all' });
    const reviewStats = usStateDeckStats({ type: 'review' });

    return (
        <div className="main-menu-box">
            <div className="quiz-topbar">
                <button
                    className="back-button"
                    onClick={() => { audio.play('click'); setView('capitals-menu'); }}
                    aria-label="Back"
                >
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <div className="menu-title-row">
                <h1 className="menu-title">United States</h1>
                <ScoringInfo mode="unitedStates" />
            </div>
            <p className="menu-subtitle">All 50 states on a 2D map, plus every state capital.</p>

            <div className="mode-grid">
                <PrimaryDeckButton
                    tone="info"
                    name="Map"
                    desc="Tap each state on the map"
                    stats={allStats}
                    icon="map"
                    onClick={() => startQuiz('map', 'all', null)}
                    index={0}
                />
                <PrimaryDeckButton
                    tone="accent"
                    name="Capitals"
                    desc="Name each state's capital"
                    stats={allStats}
                    icon="location_city"
                    onClick={() => startQuiz('capitals', 'all', null)}
                    index={1}
                />
                <PrimaryDeckButton
                    tone="primary"
                    name="Flags"
                    desc="Identify the state from its flag"
                    stats={allStats}
                    icon="flag"
                    onClick={() => startQuiz('flags', 'all', null)}
                    index={2}
                />
                {reviewStats.total > 0 && (
                    <PrimaryDeckButton
                        tone="success"
                        name="Needs Review"
                        desc="Mixed map, capital, and flag prompts that are due"
                        stats={reviewStats}
                        icon="refresh"
                        onClick={() => startQuiz('mixed', 'review', null)}
                        index={3}
                    />
                )}
            </div>

            <div className="category-section">
                <h3>Map · By Region</h3>
                <div className="category-grid">
                    {regions.map((region, i) => (
                        <GridButton
                            key={`map-${region}`}
                            name={formatRegion(region)}
                            stats={usStateDeckStats({ type: 'region', value: region })}
                            onClick={() => startQuiz('map', 'region', region)}
                            index={i}
                        />
                    ))}
                </div>
            </div>

            <div className="category-section">
                <h3>Capitals · By Region</h3>
                <div className="category-grid">
                    {regions.map((region, i) => (
                        <GridButton
                            key={`cap-${region}`}
                            name={formatRegion(region)}
                            stats={usStateDeckStats({ type: 'region', value: region })}
                            onClick={() => startQuiz('capitals', 'region', region)}
                            index={i}
                        />
                    ))}
                </div>
            </div>

            <div className="category-section">
                <h3>Flags · By Region</h3>
                <div className="category-grid">
                    {regions.map((region, i) => (
                        <GridButton
                            key={`flag-${region}`}
                            name={formatRegion(region)}
                            stats={usStateDeckStats({ type: 'region', value: region })}
                            onClick={() => startQuiz('flags', 'region', region)}
                            index={i}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UnitedStatesMenu;
