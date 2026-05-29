import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import Mascot from '../../assets/illustrations/Mascot';
import ScoringInfo from './ScoringInfo';
import { useAudio } from '../../audio/AudioProvider';
import { getBonus } from '../../lib/progress';
import { getBestStreak } from '../../lib/streak';
import { springs } from '../../motion/index';

// `scoreKey` reads getBonus() (modes with a fixed-length / time-boxed score).
// `streakKey` reads getBestStreak() — for the MC variants which are infinite
// runs and have no "high score" beyond best streak.
const MODES = [
    { key: 'pixelated-quiz',     title: 'Pixelated Guess', desc: 'Reveal flags in stages',     icon: 'blur_on',       tone: 'success',  scoreKey: 'pixelated',     mood: 'think' },
    { key: 'frenzy-quiz',        title: 'Frenzy Mode',     desc: 'Race the clock on 4 flags',  icon: 'bolt',          tone: 'accent',   scoreKey: 'frenzy',        mood: 'cheer' },
    { key: 'longest-route-quiz', title: 'Longest Chain',   desc: 'Travel from country to country', icon: 'route',     tone: 'primary',  scoreKey: 'longestRoute',  mood: 'wave'  },
    { key: 'language-quiz',      title: 'Language Quiz',   desc: 'Match phrase to language',   icon: 'translate',     tone: 'purple',   scoreKey: 'language',      mood: 'idle'  },
    { key: 'capitals-quiz',      title: 'Capitals Quiz',   desc: 'Name the capital city',      icon: 'location_city', tone: 'info',     scoreKey: 'capitals',      mood: 'think' },
    { key: 'flash',              title: 'Flash Mode',      desc: 'See it for a second, then guess', icon: 'visibility_off', tone: 'danger', streakKey: 'flash',  mood: 'wave'  },
    { key: 'reverse-mc',         title: 'Country → Flag',  desc: 'Pick the flag for the country', icon: 'swap_horiz',  tone: 'versus',   streakKey: 'reverse-mc',   mood: 'idle'  },
];

function BonusMenu({ setView }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const [scores, setScores] = useState({});

    useEffect(() => {
        setScores(getBonus());
    }, []);

    const badgeValue = (mode) => {
        if (mode.scoreKey) return scores[mode.scoreKey] || 0;
        if (mode.streakKey) return getBestStreak(mode.streakKey);
        return 0;
    };
    const badgeLabel = (mode) => (mode.streakKey ? 'Best Streak' : 'High Score');

    return (
        <div className="bonus-menu-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => { audio.play('click'); setView('menu'); }} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                alignSelf: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <Mascot size={64} mood="think" />
                <h1 className="menu-title" style={{ margin: 0 }}>Bonus Modes</h1>
            </div>
            <p className="menu-subtitle">Try a fun challenge!</p>
            <div className="mode-grid">
                {MODES.map((mode, i) => (
                    <div className="mode-card-wrap" key={mode.key}>
                        <motion.button
                            className={`mode-card tone-${mode.tone}`}
                            onClick={() => { audio.play('click'); setView(mode.key); }}
                            initial={prefersReduced ? false : { opacity: 0, y: 18 }}
                            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
                            transition={{ ...springs.gentle, delay: 0.08 * i }}
                            whileHover={prefersReduced ? undefined : { y: -3 }}
                            whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                            aria-label={`${mode.title} — ${badgeLabel(mode)} ${badgeValue(mode)}`}
                        >
                            <div className="mode-card__badge">{badgeLabel(mode)}: {badgeValue(mode)}</div>
                            <div className="mode-card__title">{mode.title}</div>
                            <div className="mode-card__desc">{mode.desc}</div>
                            <Icon name={mode.icon} className="mode-card__icon" />
                        </motion.button>
                        <ScoringInfo mode={mode.scoreKey || mode.key} className="mode-card__info" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BonusMenu;
