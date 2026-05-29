import React from 'react';

// Custom inline SVG badges for battlepass challenges. Each glyph is hand-drawn
// against a circular gem-cut backdrop so the challenge list reads as themed art
// rather than generic Material icons. Picked by `metric` so all mc_* challenges
// share one face, all globe challenges share another, and so on.
//
// Every glyph renders inside a 48x48 viewBox with a coloured radial backdrop;
// the parent supplies the size via prop. Designed to match the reptile theme:
// jade/orange palette with subtle gradients.

const GRAD = {
    mc:        ['#5B5BF6', '#8A8CFF'], // multiple choice — blue
    fr:        ['#19C37D', '#7FE0A8'], // free response — green
    globe:     ['#2EC4D3', '#A8E0FF'], // globe — teal
    frenzy:    ['#FF6A2E', '#FFC247'], // frenzy — orange
    pix:       ['#7A4FD0', '#C9A8F0'], // pixelated — purple
    route:     ['#E5A018', '#FFD86B'], // longest route — gold
    lang:      ['#E5417A', '#FF7BA0'], // language — pink
    streak:    ['#FF5C6C', '#FF6A2E'], // streak — red/orange fire
    mp:        ['#B05BF6', '#FF7BA0'], // multiplayer — purple/pink
    mastery:   ['#19A36B', '#FFD86B'], // mastery — green/gold
    xp:        ['#FFC247', '#FF6A2E'], // XP — gold
};

function backdrop(id, [a, b]) {
    return (
        <defs>
            <radialGradient id={id} cx="50%" cy="40%" r="65%">
                <stop offset="0%" stopColor={b} />
                <stop offset="100%" stopColor={a} />
            </radialGradient>
        </defs>
    );
}

// metric → glyph + colour. metrics defined in src/lib/battlepassCatalog.js.
function glyphFor(metric) {
    if (metric === 'mc_correct') return { key: 'mc', draw: (
        <g>
            {/* Four-option grid with one highlighted */}
            <rect x="14" y="16" width="9" height="6" rx="1.5" fill="#FFFDF7" opacity="0.85" />
            <rect x="25" y="16" width="9" height="6" rx="1.5" fill="#FFD86B" />
            <rect x="14" y="24" width="9" height="6" rx="1.5" fill="#FFFDF7" opacity="0.85" />
            <rect x="25" y="24" width="9" height="6" rx="1.5" fill="#FFFDF7" opacity="0.85" />
            <path d="M27 19 l 2 2 l 4 -4" stroke="#1F1A3B" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    )};
    if (metric === 'fr_correct') return { key: 'fr', draw: (
        <g>
            {/* Pencil writing a checked line */}
            <path d="M14 32 L 32 14 L 36 18 L 18 36 Z" fill="#FFFDF7" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M30 16 L 34 20" stroke="#FFD86B" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 34 L 14 32" stroke="#1F1A3B" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M20 36 L 28 36" stroke="#FFFDF7" strokeWidth="1.6" strokeLinecap="round" />
        </g>
    )};
    if (metric === 'globe_correct') return { key: 'globe', draw: (
        <g>
            <circle cx="24" cy="24" r="11" fill="#FFFDF7" opacity="0.92" stroke="#1F1A3B" strokeWidth="1.2" />
            {/* Stylised continents */}
            <path d="M16 22 q4 -3 8 0 q3 -2 6 1 q-2 4 -5 3 q-3 2 -6 -1 q-3 0 -3 -3 Z" fill="#19C37D" />
            <path d="M18 28 q5 -1 8 2 q-2 3 -5 2 q-3 0 -3 -4 Z" fill="#19A36B" />
            {/* Pin */}
            <path d="M30 16 L 32 13 L 32 19 Z" fill="#E5414C" />
            <circle cx="32" cy="13" r="1.4" fill="#FFC247" />
        </g>
    )};
    if (metric === 'high_frenzy') return { key: 'frenzy', draw: (
        <g>
            {/* Lightning + flame combo */}
            <path d="M22 12 L 14 26 L 22 26 L 18 36 L 30 22 L 22 22 Z" fill="#FFD86B" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="32" cy="16" r="2" fill="#FF6A2E" opacity="0.9" />
            <circle cx="36" cy="22" r="1.4" fill="#FF6A2E" opacity="0.7" />
        </g>
    )};
    if (metric === 'high_pixelated') return { key: 'pix', draw: (
        <g>
            {/* Pixel grid with reveal */}
            <g fill="#FFFDF7">
                {[14, 22, 30].map((x) => [14, 22, 30].map((y) => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="0.6" opacity={(x + y) % 16 === 0 ? 1 : 0.45} />
                )))}
            </g>
            <rect x="22" y="22" width="6" height="6" rx="0.6" fill="#FFD86B" />
        </g>
    )};
    if (metric === 'high_longestRoute') return { key: 'route', draw: (
        <g>
            {/* Curving route with pins */}
            <path d="M14 30 Q 20 14 26 24 Q 32 34 36 18" stroke="#FFFDF7" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="2 3" />
            <circle cx="14" cy="30" r="2.4" fill="#FFD86B" stroke="#1F1A3B" strokeWidth="0.8" />
            <circle cx="36" cy="18" r="2.4" fill="#E5414C" stroke="#1F1A3B" strokeWidth="0.8" />
        </g>
    )};
    if (metric === 'high_language') return { key: 'lang', draw: (
        <g>
            {/* Speech bubble with letters */}
            <path d="M12 16 q0 -4 4 -4 h 16 q4 0 4 4 v 10 q0 4 -4 4 h -10 l -6 5 v -5 q-4 0 -4 -4 Z"
                fill="#FFFDF7" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="24" y="26" fontSize="10" fontWeight="900" textAnchor="middle" fill="#1F1A3B">あ</text>
        </g>
    )};
    if (metric === 'best_streak_any') return { key: 'streak', draw: (
        <g>
            {/* Flame */}
            <path d="M24 12 Q 14 20 18 30 Q 14 26 14 32 Q 14 38 24 38 Q 34 38 34 32 Q 34 26 30 30 Q 32 22 24 12 Z"
                fill="#FFD86B" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M24 22 Q 20 28 22 34 Q 24 30 26 34 Q 28 28 24 22 Z" fill="#FF6A2E" />
        </g>
    )};
    if (metric === 'mp_wins') return { key: 'mp', draw: (
        <g>
            {/* Crossed game controllers + trophy */}
            <path d="M24 14 l 6 6 l -6 6 l -6 -6 Z" fill="#FFFDF7" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M18 30 q6 4 12 0" stroke="#FFD86B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="22" cy="20" r="1.2" fill="#1F1A3B" />
            <circle cx="26" cy="20" r="1.2" fill="#1F1A3B" />
        </g>
    )};
    if (metric === 'mastered') return { key: 'mastery', draw: (
        <g>
            {/* Graduation cap + sparkle */}
            <path d="M14 22 L 24 16 L 34 22 L 24 28 Z" fill="#FFFDF7" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M18 24 v 6 q6 4 12 0 v -6" stroke="#1F1A3B" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            <path d="M34 22 L 34 30" stroke="#FFD86B" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="34" cy="32" r="1.4" fill="#FFD86B" />
        </g>
    )};
    if (metric === 'earned_xp') return { key: 'xp', draw: (
        <g>
            {/* XP star */}
            <path d="M24 12 l 3 8 l 8 1 l -6 6 l 2 9 l -7 -4 l -7 4 l 2 -9 l -6 -6 l 8 -1 Z"
                fill="#FFFDF7" stroke="#1F1A3B" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="24" y="28" fontSize="8" fontWeight="900" textAnchor="middle" fill="#1F1A3B">XP</text>
        </g>
    )};
    // Fallback — a plain reptile scale.
    return { key: 'mastery', draw: (
        <g>
            <path d="M24 14 q 10 0 10 10 q 0 10 -10 10 q -10 0 -10 -10 q 0 -10 10 -10 Z"
                fill="#FFFDF7" stroke="#1F1A3B" strokeWidth="1.2" />
            <circle cx="24" cy="22" r="2" fill="#FFD86B" />
        </g>
    )};
}

export default function ChallengeIcon({ metric, size = 48, done = false }) {
    const { key, draw } = glyphFor(metric);
    const grad = GRAD[key] || GRAD.mastery;
    const uid = `cig-${key}-${size}`;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            aria-hidden="true"
            className={`challenge-icon ${done ? 'is-done' : ''}`}
        >
            {backdrop(uid, grad)}
            <circle cx="24" cy="24" r="22" fill={`url(#${uid})`} stroke={done ? '#19C37D' : 'rgba(31,26,59,0.18)'} strokeWidth={done ? 2.5 : 1.2} />
            {/* Inner ring for a "gemcut" feel */}
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            {draw}
            {done && (
                <g>
                    <circle cx="38" cy="38" r="7" fill="#19C37D" stroke="#FFFDF7" strokeWidth="1.5" />
                    <path d="M35 38 l 2.5 2.5 l 4.5 -5" stroke="#FFFDF7" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            )}
        </svg>
    );
}
