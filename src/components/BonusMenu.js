import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from './Icon';
import Mascot from '../assets/illustrations/Mascot';
import ScoringInfo from './ScoringInfo';
import { useAudio } from '../audio/AudioProvider';
import { getBonus } from '../lib/progress';
import { springs } from '../motion';

const MODES = [
    { key: 'pixelated-quiz',     title: 'Pixelated Guess', desc: 'Reveal flags in stages',     icon: 'blur_on',       tone: 'success',  scoreKey: 'pixelated',     mood: 'think' },
    { key: 'frenzy-quiz',        title: 'Frenzy Mode',     desc: 'Race the clock on 4 flags',  icon: 'bolt',          tone: 'accent',   scoreKey: 'frenzy',        mood: 'cheer' },
    { key: 'longest-route-quiz', title: 'Longest Chain',   desc: 'Travel from country to country', icon: 'route',     tone: 'primary',  scoreKey: 'longestRoute',  mood: 'wave'  },
    { key: 'language-quiz',      title: 'Language Quiz',   desc: 'Match phrase to language',   icon: 'translate',     tone: 'purple',   scoreKey: 'language',      mood: 'idle'  },
];

function BonusMenu({ setView }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const [scores, setScores] = useState({});

    useEffect(() => {
        setScores(getBonus());
    }, []);

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
                            aria-label={`${mode.title} — High score ${scores[mode.scoreKey] || 0}`}
                        >
                            <div className="mode-card__badge">High Score: {scores[mode.scoreKey] || 0}</div>
                            <div className="mode-card__title">{mode.title}</div>
                            <div className="mode-card__desc">{mode.desc}</div>
                            <Icon name={mode.icon} className="mode-card__icon" />
                        </motion.button>
                        <ScoringInfo mode={mode.scoreKey} className="mode-card__info" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BonusMenu;
