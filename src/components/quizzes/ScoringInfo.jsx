import React, { useState } from 'react';
import Icon from '../common/Icon';
import { Modal } from '../ui/index';
import { MODE_XP } from '../../lib/xp';

// Strip a trailing ".0" so 2 reads "2×" while 1.5 reads "1.5×".
const mult = (mode) => `${Number(MODE_XP[mode] || 1)}×`;

// Per-mode scoring/multiplier explainer. Drop <ScoringInfo mode="..." /> next to a
// mode title; it renders a small "i" button that opens a rules modal. Mode-bonus
// numbers are interpolated from src/lib/xp.js (MODE_XP) so they never drift.
const INFO = {
    'multiple-choice': {
        title: 'Multiple Choice — scoring',
        lines: [
            'Each correct answer earns XP. Wrong answers earn nothing (your streak resets).',
            'Base XP depends on how well you know the flag: brand-new 20, still learning 12, already mastered 6.',
            `Multiple Choice is the easiest style, so it pays a ${mult('multiple-choice')} mode bonus.`,
            'A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Master a flag by answering it correctly 6 times in a row.',
        ],
    },
    'free-response': {
        title: 'Free Response — scoring',
        lines: [
            'Each correct answer earns XP. Wrong answers earn nothing (your streak resets).',
            'Base XP depends on how well you know the flag: brand-new 20, still learning 12, already mastered 6.',
            `Typing from memory is harder, so Free Response pays a ${mult('free-response')} mode bonus.`,
            'A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Master a flag by answering it correctly 6 times in a row.',
        ],
    },
    'globe': {
        title: 'Globe — scoring',
        lines: [
            'Two ways to play, switchable inside the screen.',
            `Find: a flag is shown — tap the country on the 3D globe and confirm. Pays a ${mult('globe')} mode bonus.`,
            `Name: a country is highlighted — type its name. No flag is shown. Pays a ${mult('globe-name')} mode bonus (hardest).`,
            'Both modes share one geography mastery — answering in either contributes to your geo streaks and the Globe leaderboard.',
            'Wrong answers reset your run streak. A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Find mode: stuck? The Hint button rotates the globe to the correct continent — half XP if you still answer correctly.',
        ],
    },
    flash: {
        title: 'Flash Mode — scoring',
        lines: [
            'A flag flashes for a second, then hides — pick the country from four options from memory.',
            'It plays like Multiple Choice and earns the same XP; build a run streak for bragging rights.',
            'Wrong answers reset your streak.',
        ],
    },
    'reverse-mc': {
        title: 'Country → Flag — scoring',
        lines: [
            'A country name is shown — pick its flag from four thumbnails.',
            'It plays like Multiple Choice and earns the same XP; build a run streak for bragging rights.',
            'Wrong answers reset your streak.',
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
    capitals: {
        title: 'Capitals — scoring',
        lines: [
            'A country is shown — pick its capital city from four options. You have three lives.',
            'Distractors are pulled from the same region, so the choices stay plausible.',
            'Stuck? The Hint reveals the capital’s first letter — but a hinted answer scores no point.',
            'Your best score is added to your total XP.',
        ],
    },
    unitedStates: {
        title: 'United States — scoring',
        lines: [
            'All 50 states + DC, three ways to play, picked from the menu.',
            `Map: a state name is shown — tap that state on the 2D map. Pays a ${mult('us-states-map')} mode bonus.`,
            `Capitals: a state name is shown — pick its capital from four options. Pays a ${mult('us-states-capitals')} mode bonus.`,
            `Flags: a state flag is shown — pick which state it belongs to. Pays a ${mult('us-states-flags')} mode bonus.`,
            'All three sub-modes share one per-state mastery streak — getting a state right any way grows the same meter.',
            'Wrong answers reset your run streak. A hot streak multiplies XP from 1× up to a 2× cap, reached at a 30-answer streak.',
            'Master a state by answering it correctly 6 times in a row.',
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
