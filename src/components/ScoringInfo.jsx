import React, { useState } from 'react';
import Icon from './Icon';
import { Modal } from './ui';

// Per-mode scoring/multiplier explainer. Drop <ScoringInfo mode="..." /> next to a
// mode title; it renders a small "i" button that opens a rules modal. Keep the
// numbers here in sync with src/lib/xp.js and the bonus modes.
const INFO = {
    'multiple-choice': {
        title: 'Multiple Choice — scoring',
        lines: [
            'Each correct answer earns XP. Wrong answers earn nothing (your streak resets).',
            'Base XP depends on how well you know the flag: brand-new 20, still learning 12, already mastered 6.',
            'Multiple Choice is the easiest style, so it pays a 1× mode bonus.',
            'A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Master a flag by answering it correctly 6 times in a row.',
        ],
    },
    'free-response': {
        title: 'Free Response — scoring',
        lines: [
            'Each correct answer earns XP. Wrong answers earn nothing (your streak resets).',
            'Base XP depends on how well you know the flag: brand-new 20, still learning 12, already mastered 6.',
            'Typing from memory is harder, so Free Response pays a 1.5× mode bonus.',
            'A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Master a flag by answering it correctly 6 times in a row.',
        ],
    },
    'globe': {
        title: 'Globe — scoring',
        lines: [
            'Tap a country on the 3D globe, then confirm (double-tap or the Confirm button).',
            'Each correct placement earns XP. Wrong answers reset your streak.',
            'Globe mode tracks a separate geography mastery — independent from how well you recognise the flag.',
            'Hardest mode: pays a 1.75× mode bonus.',
            'A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Stuck? The Hint button rotates the globe to the correct continent — uses cost half XP if you still answer correctly.',
        ],
    },
    multiplayer: {
        title: 'Multiplayer — scoring',
        lines: [
            'Multiplayer is just for bragging rights — it never affects your XP or mastery.',
            'A correct answer scores +1 point; a miss costs −1 point (never below zero).',
            'Race: first to the target wins. Blitz / Streak Duel: highest score or streak when the clock runs out.',
            'Question style: Flags (recognise the flag), Languages (which language is this phrase?), or Globe (find the flag’s country on the 3D globe). Globe rounds work with Race, Blitz, and Streak Duel.',
            'Atlas Battle (1v1): each correct lands a hit on your rival’s Atlas — KO it to win. Losing drops your Atlas’s battle HP and can knock it out, but it heals back as you play other modes (it can never die from a battle).',
        ],
    },
    frenzy: {
        title: 'Frenzy — scoring',
        lines: [
            'Guess as many flags as you can in 3 minutes across four slots.',
            'Correct +10, wrong or expired −5 (score never drops below zero).',
            'Your best score is added to your total XP.',
        ],
    },
    pixelated: {
        title: 'Pixelated — scoring',
        lines: [
            'Name the flag as it sharpens from heavily pixelated — earlier guesses score more.',
            'Your best score is added to your total XP.',
        ],
    },
    longestRoute: {
        title: 'Longest Chain — scoring',
        lines: [
            'Chain neighbouring countries without a mistake; your longest unbroken chain is the score.',
            'Your best chain is added to your total XP.',
        ],
    },
    language: {
        title: 'Language — scoring',
        lines: [
            'Identify the language from a phrase; keep going as long as you answer correctly.',
            'Your best score is added to your total XP.',
        ],
    },
};

function ScoringInfo({ mode, className = '' }) {
    const [open, setOpen] = useState(false);
    const info = INFO[mode];
    if (!info) return null;
    return (
        <>
            <button
                type="button"
                className={`info-button ${className}`}
                aria-label="How scoring works"
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            >
                <Icon name="info" />
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title={info.title}>
                <ul className="scoring-info">
                    {info.lines.map((line, i) => (
                        <li key={i}>{line}</li>
                    ))}
                </ul>
            </Modal>
        </>
    );
}

export default ScoringInfo;
