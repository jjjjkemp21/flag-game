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
        setHighScores(readBonusScores());
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

        // Lifetime activity + accuracy across every answer ever given.
        const totalCorrect = flagsData.reduce((s, f) => s + (f.correct || 0), 0);
        const totalIncorrect = flagsData.reduce((s, f) => s + (f.incorrect || 0), 0);
        const totalAnswers = totalCorrect + totalIncorrect;
        const accuracy = totalAnswers > 0 ? totalCorrect / totalAnswers : 0;

        const now = Date.now();
        const dueForReview = flagsData.filter(f => f.nextReview != null && f.nextReview <= now).length;

        // Mastery split by region so the player sees where they're strong/weak.
        const regionMap = new Map();
        for (const f of flagsData) {
            for (const tag of (f.tags || [])) {
                if (!tag.startsWith('region:')) continue;
                const key = tag.split(':')[1];
                const entry = regionMap.get(key) || { region: key, total: 0, mastered: 0 };
                entry.total += 1;
                if (f.streak > masteredThreshold) entry.mastered += 1;
                regionMap.set(key, entry);
            }
        }
        const regions = [...regionMap.values()]
            .sort((a, b) => (b.mastered / b.total) - (a.mastered / a.total) || b.total - a.total);

        return {
            masteredCount,
            learningCount,
            needsPracticeCount,
            total,
            mastery: masteredCount / total,
            best: sortedByKnowledge[0] || null,
            worst: sortedByKnowledge[sortedByKnowledge.length - 1] || null,
            hasAnswered: answered.length > 0,
            totalCorrect,
            totalIncorrect,
            totalAnswers,
            accuracy,
            answeredCount: answered.length,
            dueForReview,
            regions,
        };
    }, [flagsData]);

    const titleCase = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (!stats) return null;

    const xp = computeXp();

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

            <h3 className="stats-subtitle text-center">Accuracy &amp; Activity</h3>
            <div className="stats-grid high-score-grid">
                <div className="stat-item">
                    <span className="stat-value"><CountUp to={Math.round(stats.accuracy * 100)} />%</span>
                    <span className="stat-label">Accuracy</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value"><CountUp to={stats.totalAnswers} /></span>
                    <span className="stat-label">Answers</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value"><CountUp to={stats.answeredCount} /></span>
                    <span className="stat-label">Flags seen</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value"><CountUp to={stats.dueForReview} /></span>
                    <span className="stat-label">Due for review</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Pill tone="success" icon="check"><CountUp to={stats.totalCorrect} /> correct</Pill>
                <Pill tone="danger" icon="close"><CountUp to={stats.totalIncorrect} /> missed</Pill>
            </div>

            {stats.regions.length > 0 && (
                <>
                    <h3 className="stats-subtitle text-center">Mastery by Region</h3>
                    <div className="region-stats">
                        {stats.regions.map((r) => {
                            const pct = Math.round((r.mastered / r.total) * 100);
                            return (
                                <div className="region-stat" key={r.region}>
                                    <span className="region-stat__name">{titleCase(r.region)}</span>
                                    <span className="region-stat__track">
                                        <span className="region-stat__fill" style={{ width: `${pct}%` }} />
                                    </span>
                                    <span className="region-stat__val">{r.mastered}/{r.total}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

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
