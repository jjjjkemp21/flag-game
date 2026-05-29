import React, { useEffect, useMemo } from 'react';
import Icon from '../common/Icon';
import AchievementIcon from './AchievementIcon';
import TitleBadge from './TitleBadge';
import { Button } from '../ui/index';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../auth/AuthProvider';
import { usePet } from '../../lib/pet';
import { useProfile, setShowcase, setSelectedTitle, setAchievementsUnlocked } from '../../lib/profile';
import { getBonus, getEarnedXp } from '../../lib/progress';
import { buildContext, evaluate, ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '../../lib/achievements';
import { masteryRank, nextRank, MASTERY_RANKS, geoMasteryRank, nextGeoRank, GEO_MASTERY_RANKS } from '../../lib/mastery';
import { chestYieldMultFromMastery } from '../../lib/chest';

function Achievements({ setView, flagsData }) {
    const { isAuthed } = useAuth();
    const toast = useToast();
    const pet = usePet();
    const profile = useProfile();
    const { frenzy, pixelated, longestRoute, language } = getBonus();

    const earnedXp = getEarnedXp();
    const ctx = useMemo(
        () => buildContext(flagsData, { frenzy, pixelated, longestRoute, language }, pet.level, earnedXp),
        [flagsData, pet.level, frenzy, pixelated, longestRoute, language, earnedXp]
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
    // Chest-yield bonus is earned through flag mastery (see chestYieldMultFromMastery).
    const chestYieldPct = Math.round((chestYieldMultFromMastery(ctx.mastered, ctx.total) - 1) * 100);
    const geoRank = geoMasteryRank(ctx.geoMastered, ctx.total);
    const geoNr = nextGeoRank(ctx.geoMastered, ctx.total);
    const selectedTitle = profile.selectedTitle || null;

    // Mastery ranks become unlockable display titles — each tier is "earned" once
    // you've mastered enough flags. World Champion only unlocks when you've
    // mastered every flag in the catalog. The 9 entries match MASTERY_RANKS + the
    // champion capstone in src/lib/mastery.js.
    const titles = [
        ...MASTERY_RANKS.map((r) => ({
            title: r.title,
            tier: r.tier,
            unlocked: ctx.mastered >= r.min,
            requirement: r.min === 0
                ? 'Default starting title.'
                : `Master ${r.min} flags.`,
        })),
        {
            title: 'World Champion',
            tier: 'legend',
            unlocked: ctx.total > 0 && ctx.mastered >= ctx.total,
            requirement: `Master every flag${ctx.total ? ` (${ctx.total})` : ''}.`,
        },
    ];

    // Parallel geography ladder, unlocked by countries placed correctly on the
    // globe (geoStreak > MASTERY_STREAK).
    const geoTitles = [
        ...GEO_MASTERY_RANKS.map((r) => ({
            title: r.title,
            tier: r.tier,
            unlocked: ctx.geoMastered >= r.min,
            requirement: r.min === 0
                ? 'Default geography title.'
                : `Master ${r.min} countries on the globe.`,
        })),
        {
            title: 'Atlas Cartographer',
            tier: 'legend',
            // Only the globe-renderable subset can ever be geo-mastered, so gate
            // on geoEligibleTotal (not the full catalog) or this is unreachable.
            unlocked: ctx.geoEligibleTotal > 0 && ctx.geoMastered >= ctx.geoEligibleTotal,
            requirement: `Master every country on the globe${ctx.geoEligibleTotal ? ` (${ctx.geoEligibleTotal})` : ''}.`,
        },
    ];

    const pickTitle = (t) => {
        if (!t.unlocked) return;
        // Tapping the currently-selected title clears the choice (auto-rank again).
        const next = t.title === selectedTitle ? null : t.title;
        setSelectedTitle(next);
        toast.success(next ? `Title set to "${next}".` : 'Title cleared.');
    };

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

            {/* Flag-recognition mastery: rank pill + progress + next rung. */}
            <div className="rank-banner">
                <span className={`rank-pill rank-pill--${rank.tier}`}>
                    <TitleBadge scope="mastery" tier={rank.tier} size={28} /> {rank.title}
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
                <p className="rank-next auth-hint">
                    <Icon name="redeem" /> Chest yield bonus <strong>+{chestYieldPct}%</strong> — mastering flags
                    boosts every end-of-run chest, up to +25%.
                </p>
            </div>

            {/* Globe-mode mastery: parallel section so the geo ladder reads
                as its own achievement track instead of a footnote on the
                flag-recognition banner. */}
            <div className="rank-banner">
                <span className={`rank-pill rank-pill--${geoRank.tier}`}>
                    <TitleBadge scope="geo" tier={geoRank.tier} size={28} /> {geoRank.title}
                </span>
                <p className="rank-summary">
                    <strong>{ctx.geoMastered}</strong> / {ctx.total} countries mastered on the globe
                </p>
                {geoNr && (
                    <p className="rank-next auth-hint">
                        {geoNr.remaining > 0
                            ? `Master ${geoNr.remaining} more on the globe to reach ${geoNr.title}.`
                            : `Next geography rank: ${geoNr.title}.`}
                    </p>
                )}
            </div>

            <div className="titles-section">
                <h3 className="settings-section-title">
                    Flag Mastery Titles
                    <span className="ach-group__count">
                        {titles.filter((t) => t.unlocked).length}/{titles.length}
                    </span>
                </h3>
                <p className="ach-hint auth-hint">
                    <Icon name="military_tech" /> Pick a mastery title to display next to your name. Tap your current
                    choice again to clear it and fall back to the leaderboard's auto-rank.
                </p>
                <div className="title-grid">
                    {titles.map((t) => {
                        const isSelected = t.unlocked && t.title === selectedTitle;
                        return (
                            <button
                                key={t.title}
                                type="button"
                                disabled={!t.unlocked}
                                className={`title-card title-card--${t.tier} ${t.unlocked ? 'is-unlocked' : 'is-locked'} ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => pickTitle(t)}
                                aria-pressed={isSelected}
                            >
                                <span className="title-card__icon">
                                    <TitleBadge scope="mastery" tier={t.tier} unlocked={t.unlocked} size={44} />
                                </span>
                                <span className="title-card__body">
                                    <span className={`rank-tag rank-pill--${t.tier}`}>{t.title}</span>
                                    <span className="title-card__req">{t.requirement}</span>
                                </span>
                                {isSelected && (
                                    <span className="title-card__check" aria-hidden="true">
                                        <Icon name="check_circle" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="titles-section">
                <h3 className="settings-section-title">
                    Geography Titles
                    <span className="ach-group__count">
                        {geoTitles.filter((t) => t.unlocked).length}/{geoTitles.length}
                    </span>
                </h3>
                <p className="ach-hint auth-hint">
                    <Icon name="public" /> Earned by placing countries on the globe. Pick one to wear it instead of your
                    flag-mastery title.
                </p>
                <div className="title-grid">
                    {geoTitles.map((t) => {
                        const isSelected = t.unlocked && t.title === selectedTitle;
                        return (
                            <button
                                key={`geo-${t.title}`}
                                type="button"
                                disabled={!t.unlocked}
                                className={`title-card title-card--${t.tier} ${t.unlocked ? 'is-unlocked' : 'is-locked'} ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => pickTitle(t)}
                                aria-pressed={isSelected}
                            >
                                <span className="title-card__icon">
                                    <TitleBadge scope="geo" tier={t.tier} unlocked={t.unlocked} size={44} />
                                </span>
                                <span className="title-card__body">
                                    <span className={`rank-tag rank-pill--${t.tier}`}>{t.title}</span>
                                    <span className="title-card__req">{t.requirement}</span>
                                </span>
                                {isSelected && (
                                    <span className="title-card__check" aria-hidden="true">
                                        <Icon name="check_circle" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
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
                                            <AchievementIcon icon={a.icon} tier={a.tier} unlocked={isUnlocked} size={56} />
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
