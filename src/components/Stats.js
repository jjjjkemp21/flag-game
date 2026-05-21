import React, { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ProgressRing, Pill } from './ui';
import BadgeRing from '../assets/illustrations/BadgeRing';
import Icon from './Icon';
import { computeXp, readBonusScores } from '../lib/xp';

function CountUp({ to = 0, duration = 0.9 }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, latest => Math.round(latest));
    useEffect(() => {
        const controls = animate(count, to, { duration, ease: 'easeOut' });
        return controls.stop;
    }, [to, count, duration]);
    return <motion.span>{rounded}</motion.span>;
}

function Stats({ flagsData }) {
    const [highScores, setHighScores] = useState({});

    useEffect(() => {
        setHighScores({
            frenzy: parseInt(localStorage.getItem('frenzyHighScore') || '0', 10),
            pixelated: parseInt(localStorage.getItem('pixelatedHighScore') || '0', 10),
            longestRoute: parseInt(localStorage.getItem('longestRouteHighScore') || '0', 10),
            language: parseInt(localStorage.getItem('languageHighScore') || '0', 10),
        });
    }, [flagsData]);

    const stats = useMemo(() => {
        if (!flagsData?.length) return null;
        const masteredThreshold = 5;
        const learningThreshold = 0;
        const masteredCount = flagsData.filter(f => f.streak > masteredThreshold).length;
        const learningCount = flagsData.filter(f => f.streak > learningThreshold && f.streak <= masteredThreshold).length;
        const needsPracticeCount = flagsData.filter(f => f.streak <= learningThreshold).length;
        const total = flagsData.length;

        const answered = flagsData.filter(f => (f.correct || 0) + (f.incorrect || 0) > 0);
        const sortedByKnowledge = [...answered].sort((a, b) => b.streak - a.streak);
        return {
            masteredCount,
            learningCount,
            needsPracticeCount,
            total,
            mastery: masteredCount / total,
            best: sortedByKnowledge[0] || null,
            worst: sortedByKnowledge[sortedByKnowledge.length - 1] || null,
            hasAnswered: answered.length > 0,
        };
    }, [flagsData]);

    if (!stats) return null;

    const xp = computeXp(flagsData, readBonusScores());

    const tiers = [
        { tier: 'bronze',   label: 'Bronze',   threshold: 10 },
        { tier: 'silver',   label: 'Silver',   threshold: 50 },
        { tier: 'gold',     label: 'Gold',     threshold: 150 },
        { tier: 'platinum', label: 'Platinum', threshold: stats.total },
    ];

    return (
        <div className="stats-box">
            <h2 className="text-center">Your Progress</h2>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Pill tone="primary" icon="star"><CountUp to={xp} /> XP</Pill>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
                <ProgressRing value={stats.mastery} size={140} stroke={12} tone="primary" label={`${stats.masteredCount} of ${stats.total} mastered`}>
                    <div style={{ fontSize: 'var(--fs-xl)' }}>
                        <CountUp to={Math.round(stats.mastery * 100)} />%
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Mastery
                    </div>
                </ProgressRing>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Pill tone="success" icon="check_circle"><CountUp to={stats.masteredCount} /> mastered</Pill>
                    <Pill tone="info" icon="school"><CountUp to={stats.learningCount} /> learning</Pill>
                    <Pill tone="danger" icon="priority_high"><CountUp to={stats.needsPracticeCount} /> needs practice</Pill>
                </div>
            </div>

            <h3 className="stats-subtitle text-center">Mastery Tiers</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                {tiers.map(t => (
                    <BadgeRing
                        key={t.tier}
                        tier={t.tier}
                        label={t.label}
                        earned={stats.masteredCount >= t.threshold}
                    />
                ))}
            </div>

            <h3 className="stats-subtitle text-center">Bonus High Scores</h3>
            <div className="stats-grid high-score-grid">
                <div className="stat-item">
                    <span className="stat-value bonus-score"><CountUp to={highScores.pixelated || 0} /></span>
                    <span className="stat-label">Pixelated</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value bonus-score"><CountUp to={highScores.frenzy || 0} /></span>
                    <span className="stat-label">Frenzy</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value bonus-score"><CountUp to={highScores.longestRoute || 0} /></span>
                    <span className="stat-label">Longest Chain</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value bonus-score"><CountUp to={highScores.language || 0} /></span>
                    <span className="stat-label">Language</span>
                </div>
            </div>

            {stats.hasAnswered && (
                <div className="stats-details" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <Icon name="emoji_events" variant="highlight" />
                        <strong>Best:</strong> {stats.best.name}
                        <Pill tone="success">Streak {stats.best.streak}</Pill>
                    </p>
                    {stats.worst && stats.worst !== stats.best && (
                        <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <Icon name="trending_down" variant="incorrect" />
                            <strong>Needs Practice:</strong> {stats.worst.name}
                            <Pill tone="danger">Streak {stats.worst.streak}</Pill>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Stats;
