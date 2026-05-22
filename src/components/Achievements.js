import React, { useEffect, useMemo } from 'react';
import Icon from './Icon';
import { Button } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { usePet } from '../lib/pet';
import { useProfile, setShowcase, setAchievementsUnlocked } from '../lib/profile';
import { getBonus } from '../lib/progress';
import { buildContext, evaluate, ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '../lib/achievements';
import { masteryRank, nextRank } from '../lib/mastery';

function Achievements({ setView, flagsData }) {
    const { isAuthed } = useAuth();
    const toast = useToast();
    const pet = usePet();
    const profile = useProfile();
    const { frenzy, pixelated, longestRoute, language } = getBonus();

    const ctx = useMemo(
        () => buildContext(flagsData, { frenzy, pixelated, longestRoute, language }, pet.level),
        [flagsData, pet.level, frenzy, pixelated, longestRoute, language]
    );
    const unlocked = useMemo(() => evaluate(ctx), [ctx]);
    const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);

    // Keep the account's unlocked count + showcase reconciled with live progress.
    useEffect(() => {
        if (isAuthed) setAchievementsUnlocked(unlocked);
    }, [unlocked, isAuthed]);

    if (!isAuthed) {
        return (
            <div className="quiz-box achievements-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="emoji_events" size="xl" />
                    <h2>Achievements</h2>
                    <p>Log in to earn achievements, climb mastery ranks, and showcase your best on your profile.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    const showcase = profile.achievements.showcase;
    const rank = masteryRank(ctx.mastered, ctx.total);
    const nr = nextRank(ctx.mastered, ctx.total);

    const toggleFeature = (id) => {
        if (!unlockedSet.has(id)) return;
        if (showcase.includes(id)) {
            setShowcase(showcase.filter((s) => s !== id));
        } else if (showcase.length >= 3) {
            toast.danger('You can feature up to 3 achievements.');
        } else {
            setShowcase([...showcase, id]);
            toast.success('Featured on your profile!');
        }
    };

    return (
        <div className="quiz-box achievements-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <h2 className="text-center">Achievements</h2>

            <div className="rank-banner">
                <span className={`rank-pill rank-pill--${rank.tier}`}>
                    <Icon name="military_tech" /> {rank.title}
                </span>
                <p className="rank-summary">
                    <strong>{ctx.mastered}</strong> / {ctx.total} flags mastered ·{' '}
                    <strong>{unlocked.length}</strong> / {ACHIEVEMENTS.length} achievements
                </p>
                {nr && (
                    <p className="rank-next auth-hint">
                        {nr.remaining > 0
                            ? `Master ${nr.remaining} more to reach ${nr.title}.`
                            : `Next: ${nr.title}.`}
                    </p>
                )}
            </div>

            <p className="ach-hint auth-hint">
                <Icon name="star" /> Tap the star on any unlocked achievement to feature it on your profile (up to 3).
            </p>

            {ACHIEVEMENT_GROUPS.map((group) => {
                const items = ACHIEVEMENTS.filter((a) => a.group === group);
                if (!items.length) return null;
                const earned = items.filter((a) => unlockedSet.has(a.id)).length;
                return (
                    <div className="ach-group" key={group}>
                        <h3 className="settings-section-title">
                            {group} <span className="ach-group__count">{earned}/{items.length}</span>
                        </h3>
                        <div className="ach-grid">
                            {items.map((a) => {
                                const isUnlocked = unlockedSet.has(a.id);
                                const featured = showcase.includes(a.id);
                                const prog = a.progress ? a.progress(ctx) : null;
                                const pct = prog && prog.goal > 0
                                    ? Math.min(100, Math.round((prog.cur / prog.goal) * 100))
                                    : 0;
                                return (
                                    <div
                                        key={a.id}
                                        className={`ach-card ach-card--${a.tier} ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${featured ? 'is-featured' : ''}`}
                                    >
                                        <span className="ach-icon">
                                            <Icon name={isUnlocked ? a.icon : 'lock'} />
                                        </span>
                                        <span className="ach-info">
                                            <span className="ach-name">{a.name}</span>
                                            <span className="ach-desc">{a.desc}</span>
                                            {!isUnlocked && prog && prog.goal > 0 && (
                                                <>
                                                    <span className="ach-progress">
                                                        <span className="ach-progress__bar" style={{ width: `${pct}%` }} />
                                                    </span>
                                                    <span className="ach-progress__label">{Math.min(prog.cur, prog.goal)} / {prog.goal}</span>
                                                </>
                                            )}
                                        </span>
                                        {isUnlocked && (
                                            <button
                                                className={`ach-feature ${featured ? 'is-on' : ''}`}
                                                onClick={() => toggleFeature(a.id)}
                                                aria-label={featured ? 'Unfeature' : 'Feature on profile'}
                                            >
                                                <Icon name="star" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default Achievements;
