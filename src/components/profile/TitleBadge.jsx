import React from 'react';

// Compact circular SVG badge that wears a player's rank-title art. Used next to
// rank pills on the Achievements page, the leaderboard, and the profile card
// (anywhere `scopeRank()` is consumed). Each scope gets a unique glyph; the
// `tier` drives the backdrop gradient so a gold-tier badge reads as gold no
// matter which scope it represents. Visual language mirrors ChallengeIcon /
// AchievementIcon — same gem-cut backdrop, same tier palette.

const TIER_GRAD = {
    stone:    ['#7a8294', '#c8cdda'],
    bronze:   ['#9c5a2d', '#d28a52'],
    silver:   ['#6f7c8d', '#c9d2db'],
    gold:     ['#c89030', '#ffd86b'],
    platinum: ['#88a4d4', '#e5edf9'],
    legend:   ['#c83025', '#ffc247'],
};

const LOCKED_GRAD = ['#2a2434', '#4a4658'];

function backdrop(id, [a, b]) {
    return (
        <radialGradient id={id} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor={b} />
            <stop offset="100%" stopColor={a} />
        </radialGradient>
    );
}

// Scope → glyph. The Achievements page uses scope = 'mastery' for the flag
// ladder and 'geo' for the geography ladder; the leaderboard / profile use the
// same scope keys as `scopeRank()` in src/lib/mastery.js.
function glyphFor(scope, locked) {
    const fg = locked ? 'rgba(255,253,247,0.45)' : '#FFFDF7';
    const accent = locked ? '#9a8a4a' : '#FFD86B';
    const stroke = '#1F1A3B';
    if (scope === 'mastery' || scope === 'overall' || scope === 'friends') return (
        <g>
            {/* Laurel wreath around a flag — the flag-mastery title ladder */}
            <path d="M14 28 q -2 -6 2 -12" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M34 28 q 2 -6 -2 -12" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M14 28 q 0 4 4 6" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M34 28 q 0 4 -4 6" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {/* Leaf accents */}
            <ellipse cx="13" cy="22" rx="2" ry="3.2" fill={accent} transform="rotate(-30 13 22)" />
            <ellipse cx="35" cy="22" rx="2" ry="3.2" fill={accent} transform="rotate(30 35 22)" />
            <ellipse cx="16" cy="32" rx="2" ry="3" fill={accent} transform="rotate(-50 16 32)" />
            <ellipse cx="32" cy="32" rx="2" ry="3" fill={accent} transform="rotate(50 32 32)" />
            {/* Flag in the centre */}
            <path d="M22 14 L 22 34" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M22 16 L 32 19 L 28 22 L 32 25 L 22 22 Z" fill={fg} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        </g>
    );
    if (scope === 'geo' || scope === 'globe') return (
        <g>
            {/* Pin pressed into a globe — geo-mastery ladder */}
            <circle cx="22" cy="26" r="10" fill={fg} stroke={stroke} strokeWidth="1.2" />
            <ellipse cx="22" cy="26" rx="10" ry="3.5" fill="none" stroke={stroke} strokeWidth="1" opacity="0.6" />
            <path d="M22 16 q 4 10 0 20" stroke={stroke} strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M16 22 q 3 -2 6 0 q 3 -1 5 2 q -2 3 -4 2 q -3 2 -5 -1 q -2 0 -2 -3 Z" fill="#19A36B" opacity={locked ? 0.4 : 1} />
            {/* Pin */}
            <circle cx="32" cy="16" r="3" fill="#E5414C" stroke={stroke} strokeWidth="1" />
            <path d="M32 19 L 32 24" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="32" cy="16" r="1" fill={fg} />
        </g>
    );
    if (scope === 'frenzy') return (
        <g>
            {/* Lightning bolt with flame */}
            <path d="M24 12 L 15 26 L 23 26 L 19 36 L 32 22 L 24 22 Z"
                fill={accent} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="34" cy="16" r="1.8" fill="#FF6A2E" opacity={locked ? 0.4 : 0.9} />
        </g>
    );
    if (scope === 'pixelated') return (
        <g>
            <g fill={fg}>
                {[14, 22, 30].map((x) => [14, 22, 30].map((y) => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="0.6" opacity={(x + y) % 16 === 0 ? 1 : 0.45} />
                )))}
            </g>
            <rect x="22" y="22" width="6" height="6" rx="0.6" fill={accent} />
        </g>
    );
    if (scope === 'longestRoute') return (
        <g>
            <path d="M14 30 Q 20 14 26 24 Q 32 34 36 18" stroke={fg} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="2 3" />
            <circle cx="14" cy="30" r="2.4" fill={accent} stroke={stroke} strokeWidth="0.8" />
            <circle cx="36" cy="18" r="2.4" fill="#E5414C" stroke={stroke} strokeWidth="0.8" />
        </g>
    );
    if (scope === 'language') return (
        <g>
            <path d="M12 16 q0 -4 4 -4 h 16 q4 0 4 4 v 10 q0 4 -4 4 h -10 l -6 5 v -5 q-4 0 -4 -4 Z"
                fill={fg} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <text x="24" y="26" fontSize="10" fontWeight="900" textAnchor="middle" fill={stroke}>あ</text>
        </g>
    );
    if (scope === 'mpwins') return (
        <g>
            {/* Trophy cup — multiplayer wins */}
            <path d="M18 14 h 12 v 6 q 0 6 -6 6 q -6 0 -6 -6 Z" fill={accent} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M18 16 h -3 q -2 0 -2 2 q 0 4 5 4" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M30 16 h 3 q 2 0 2 2 q 0 4 -5 4" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <rect x="22" y="26" width="4" height="4" fill={accent} stroke={stroke} strokeWidth="1" />
            <rect x="18" y="30" width="12" height="3" rx="0.6" fill={fg} stroke={stroke} strokeWidth="1.2" />
            <path d="M22 19 l 2 2 l 4 -4" stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    );
    if (scope === 'atlas') return (
        <g>
            {/* Atlas pet egg/dragon — re-uses the egg motif from AchievementIcon */}
            <path d="M24 12 q 9 0 9 12 q 0 12 -9 12 q -9 0 -9 -12 q 0 -12 9 -12 Z"
                fill={fg} stroke={stroke} strokeWidth="1.2" />
            <path d="M16 22 q 8 6 16 0" stroke={stroke} strokeWidth="0.9" fill="none" opacity="0.45" />
            <ellipse cx="24" cy="25" rx="3" ry="2.4" fill={accent} stroke={stroke} strokeWidth="1" />
            <ellipse cx="24" cy="25" rx="0.7" ry="2.2" fill={stroke} />
        </g>
    );
    // Fallback — generic crest.
    return (
        <g>
            <path d="M24 13 L 33 17 L 33 25 Q 33 32 24 36 Q 15 32 15 25 L 15 17 Z"
                fill={fg} stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M20 24 l 3 3 l 6 -7" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    );
}

export default function TitleBadge({ scope, tier = 'stone', unlocked = true, size = 40 }) {
    const grad = unlocked ? (TIER_GRAD[tier] || TIER_GRAD.stone) : LOCKED_GRAD;
    const uid = `tbg-${scope}-${tier}-${unlocked ? 'on' : 'off'}-${size}`;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            aria-hidden="true"
            className={`title-badge title-badge--${tier} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
        >
            <defs>{backdrop(uid, grad)}</defs>
            <circle cx="24" cy="24" r="22" fill={`url(#${uid})`} stroke={unlocked ? 'rgba(255,255,255,0.35)' : 'rgba(31,26,59,0.4)'} strokeWidth="1.4" />
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            {glyphFor(scope, !unlocked)}
            {unlocked && tier === 'legend' && (
                <g fill="#FFFDF7">
                    {[[8, 12], [40, 10], [38, 38]].map(([x, y], i) => (
                        <path key={i} d={`M${x} ${y - 3} l 0.8 2.3 l 2.3 0.7 l -2.3 0.7 l -0.8 2.3 l -0.8 -2.3 l -2.3 -0.7 l 2.3 -0.7 Z`}>
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin={`${i * 0.45}s`} repeatCount="indefinite" />
                        </path>
                    ))}
                </g>
            )}
        </svg>
    );
}
