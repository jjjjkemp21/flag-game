import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Stats from './Stats';
import Icon from './Icon';
import Logo from '../assets/illustrations/Logo';
import Mascot from '../assets/illustrations/Mascot';
import BackgroundBlobs from '../assets/illustrations/BackgroundBlobs';
import WorldDots from '../assets/illustrations/WorldDots';
import { useAudio } from '../audio/AudioProvider';
import { springs } from '../motion';

const MODES = [
    { key: 'multiple-choice', title: 'Multiple Choice', desc: 'Pick from four options', icon: 'quiz', tone: 'primary' },
    { key: 'free-response',   title: 'Free Response',   desc: 'Type the country name', icon: 'edit_note',  tone: 'success' },
    { key: 'bonus',           title: 'Bonus Modes',     desc: 'Frenzy, Pixelated, Language…', icon: 'rocket_launch', tone: 'accent' },
    { key: 'leaderboard',     title: 'Leaderboard',     desc: 'Compete on the global ranks', icon: 'leaderboard', tone: 'primary' },
    { key: 'friends',         title: 'Friends',         desc: 'Add friends, compare progress', icon: 'group', tone: 'success' },
    { key: 'settings',        title: 'Settings',        desc: 'Theme, sound, spelling', icon: 'tune', tone: 'neutral' },
];

function ModeCard({ mode, onClick, index, masteryHint }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    return (
        <motion.button
            className={`mode-card tone-${mode.tone}`}
            onClick={() => { audio.play('click'); onClick(); }}
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + index * 0.06 }}
            whileHover={prefersReduced ? undefined : { y: -3 }}
            whileTap={prefersReduced ? undefined : { scale: 0.97 }}
            aria-label={mode.title}
        >
            {masteryHint && <div className="mode-card__badge">{masteryHint}</div>}
            <div className="mode-card__title">{mode.title}</div>
            <div className="mode-card__desc">{mode.desc}</div>
            <Icon name={mode.icon} className="mode-card__icon" />
        </motion.button>
    );
}

function MainMenu({ setView, flagsData, setQuizMode }) {
    const masteryHint = useMemo(() => {
        if (!flagsData?.length) return null;
        const mastered = flagsData.filter(f => f.streak > 5).length;
        return `${mastered}/${flagsData.length} mastered`;
    }, [flagsData]);

    const handleStartQuiz = (mode) => {
        setQuizMode(mode);
        setView('quiz-menu');
    };

    const onCardClick = (modeKey) => {
        if (modeKey === 'multiple-choice' || modeKey === 'free-response') {
            handleStartQuiz(modeKey);
        } else if (modeKey === 'bonus') {
            setView('bonus-menu');
        } else if (modeKey === 'leaderboard') {
            setView('leaderboard');
        } else if (modeKey === 'friends') {
            setView('friends');
        } else if (modeKey === 'settings') {
            setView('settings');
        }
    };

    return (
        <div className="main-menu-box">
            <section className="hero-band" aria-labelledby="main-menu-title">
                <BackgroundBlobs density="normal" />
                <div style={{ color: 'var(--color-primary-deep)', position: 'absolute', inset: 0, zIndex: 1 }}>
                    <WorldDots opacity={0.18} />
                </div>
                <div className="hero-band__logo-row">
                    <Logo size={56} />
                    <h1 id="main-menu-title" className="menu-title hero-band__title">Flag Quest</h1>
                </div>
                <p className="menu-subtitle hero-band__subtitle">
                    Master 250+ world flags with spaced repetition, frenzy challenges, and pixel reveals.
                </p>
                <div style={{ position: 'relative', zIndex: 2, marginTop: 'var(--space-xs)' }}>
                    <Mascot size={92} mood="wave" />
                </div>
                {masteryHint && (
                    <div className="knowledge-stats" style={{ position: 'relative', zIndex: 2 }}>
                        <span className="ui-pill ui-pill--primary">
                            <Icon name="star" /> {masteryHint}
                        </span>
                    </div>
                )}
            </section>

            <div className="mode-grid">
                {MODES.map((mode, i) => (
                    <ModeCard
                        key={mode.key}
                        mode={mode}
                        index={i}
                        onClick={() => onCardClick(mode.key)}
                        masteryHint={mode.key === 'multiple-choice' ? masteryHint : null}
                    />
                ))}
            </div>

            <Stats flagsData={flagsData} />
        </div>
    );
}

export default MainMenu;
