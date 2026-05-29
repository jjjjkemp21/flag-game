import React from 'react';

// Custom inline-SVG badges for achievements. Designed to match ChallengeIcon's
// gem-cut backdrop language so the Achievements page reads as themed art
// instead of generic Material icons. Picked by the catalog's `icon` field, so
// e.g. all `flag`-iconed achievements share one glyph and all `star` ones share
// another, with the tier driving the colour scheme of the backdrop.

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

// Mapping from catalog icon → hand-drawn glyph. The renderer always draws on a
// 48x48 viewBox; glyph paths assume the centre of the badge is (24, 24).
function glyphFor(icon, locked) {
    const fg = locked ? 'rgba(255,253,247,0.45)' : '#FFFDF7';
    const accent = locked ? '#9a8a4a' : '#FFD86B';
    const stroke = '#1F1A3B';
    if (icon === 'flag') return (
        <g>
            {/* Pennant on a pole — first_steps / first_landing */}
            <path d="M18 12 L 18 36" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 14 L 34 18 L 28 22 L 34 26 L 18 22 Z" fill={accent} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="18" cy="11" r="1.4" fill={fg} stroke={stroke} strokeWidth="0.8" />
        </g>
    );
    if (icon === 'star') return (
        <g>
            <path d="M24 12 l 3.4 7.6 l 8.2 1 l -6 5.6 l 1.8 8 l -7.4 -4 l -7.4 4 l 1.8 -8 l -6 -5.6 l 8.2 -1 Z"
                fill={accent} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M24 16 l 1.8 4 l 4.2 0.5 l -3 3 l 0.8 4 l -3.8 -2 Z" fill={fg} opacity="0.7" />
        </g>
    );
    if (icon === 'public') return (
        <g>
            {/* Globe with meridian */}
            <circle cx="24" cy="24" r="11" fill={fg} stroke={stroke} strokeWidth="1.3" />
            <ellipse cx="24" cy="24" rx="11" ry="4" fill="none" stroke={stroke} strokeWidth="1.1" opacity="0.65" />
            <path d="M24 13 q 5 11 0 22" stroke={stroke} strokeWidth="1.1" fill="none" opacity="0.65" />
            <path d="M24 13 q -5 11 0 22" stroke={stroke} strokeWidth="1.1" fill="none" opacity="0.65" />
            <path d="M16 20 q 3 -2 8 0 q 3 -1 6 2 q -2 4 -5 3 q -3 2 -6 -1 q -3 0 -3 -4 Z" fill="#19A36B" opacity={locked ? 0.4 : 1} />
        </g>
    );
    if (icon === 'travel_explore') return (
        <g>
            {/* Crown above a globe — the "supreme" capstone variants */}
            <circle cx="24" cy="28" r="9" fill={fg} stroke={stroke} strokeWidth="1.2" />
            <ellipse cx="24" cy="28" rx="9" ry="3" fill="none" stroke={stroke} strokeWidth="1" opacity="0.6" />
            <path d="M24 19 q 4 9 0 18" stroke={stroke} strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M14 16 L 17 22 L 20 14 L 24 22 L 28 14 L 31 22 L 34 16 L 33 24 L 15 24 Z"
                fill={accent} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="20" cy="14" r="1.2" fill="#E5414C" stroke={stroke} strokeWidth="0.6" />
            <circle cx="28" cy="14" r="1.2" fill="#E5414C" stroke={stroke} strokeWidth="0.6" />
        </g>
    );
    if (icon === 'check_circle') return (
        <g>
            {/* Bullseye + check — accuracy milestones */}
            <circle cx="24" cy="24" r="11" fill="none" stroke={fg} strokeWidth="2" />
            <circle cx="24" cy="24" r="7" fill="none" stroke={fg} strokeWidth="1.6" opacity="0.7" />
            <circle cx="24" cy="24" r="3" fill={accent} />
            <path d="M19 24 l 3.5 3.5 l 7 -8" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    );
    if (icon === 'explore') return (
        <g>
            {/* Compass — globe-continent variants */}
            <circle cx="24" cy="24" r="11" fill={fg} stroke={stroke} strokeWidth="1.3" />
            <path d="M24 14 L 27 24 L 24 34 L 21 24 Z" fill={accent} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
            <path d="M14 24 L 24 21 L 34 24 L 24 27 Z" fill={fg} stroke={stroke} strokeWidth="1" strokeLinejoin="round" opacity="0.8" />
            <circle cx="24" cy="24" r="1.6" fill={stroke} />
        </g>
    );
    if (icon === 'bolt') return (
        <g>
            {/* Lightning + sparks — frenzy */}
            <path d="M24 12 L 15 26 L 23 26 L 19 36 L 32 22 L 24 22 Z"
                fill={accent} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="34" cy="16" r="1.8" fill="#FF6A2E" opacity={locked ? 0.4 : 0.9} />
            <circle cx="36" cy="22" r="1.2" fill="#FF6A2E" opacity={locked ? 0.3 : 0.7} />
        </g>
    );
    if (icon === 'blur_on') return (
        <g>
            {/* Pixel-reveal grid — pixelated */}
            <g fill={fg}>
                {[14, 22, 30].map((x) => [14, 22, 30].map((y) => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="0.6" opacity={(x + y) % 16 === 0 ? 1 : 0.45} />
                )))}
            </g>
            <rect x="22" y="22" width="6" height="6" rx="0.6" fill={accent} />
        </g>
    );
    if (icon === 'route') return (
        <g>
            {/* Curved route — longest route */}
            <path d="M14 30 Q 20 14 26 24 Q 32 34 36 18" stroke={fg} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="2 3" />
            <circle cx="14" cy="30" r="2.4" fill={accent} stroke={stroke} strokeWidth="0.8" />
            <circle cx="36" cy="18" r="2.4" fill="#E5414C" stroke={stroke} strokeWidth="0.8" />
        </g>
    );
    if (icon === 'translate') return (
        <g>
            {/* Speech bubble with character — language */}
            <path d="M12 16 q0 -4 4 -4 h 16 q4 0 4 4 v 10 q0 4 -4 4 h -10 l -6 5 v -5 q-4 0 -4 -4 Z"
                fill={fg} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
            <text x="24" y="26" fontSize="10" fontWeight="900" textAnchor="middle" fill={stroke}>あ</text>
        </g>
    );
    if (icon === 'pets') return (
        <g>
            {/* Stylised egg with a peeking dragon eye — Atlas pet */}
            <path d="M24 12 q 9 0 9 12 q 0 12 -9 12 q -9 0 -9 -12 q 0 -12 9 -12 Z"
                fill={fg} stroke={stroke} strokeWidth="1.3" />
            <path d="M16 20 q 8 6 16 0" stroke={stroke} strokeWidth="0.9" fill="none" opacity="0.45" />
            <path d="M16 26 q 8 6 16 0" stroke={stroke} strokeWidth="0.9" fill="none" opacity="0.45" />
            <ellipse cx="24" cy="23" rx="3" ry="2.4" fill={accent} stroke={stroke} strokeWidth="1" />
            <ellipse cx="24" cy="23" rx="0.7" ry="2.2" fill={stroke} />
            <circle cx="23" cy="22" r="0.7" fill="#FFFDF7" opacity="0.9" />
        </g>
    );
    // Fallback — reptile scale (same as ChallengeIcon's fallback).
    return (
        <g>
            <path d="M24 14 q 10 0 10 10 q 0 10 -10 10 q -10 0 -10 -10 q 0 -10 10 -10 Z"
                fill={fg} stroke={stroke} strokeWidth="1.2" />
            <circle cx="24" cy="22" r="2" fill={accent} />
        </g>
    );
}

export default function AchievementIcon({ icon, tier = 'stone', unlocked = false, size = 56 }) {
    const grad = unlocked ? (TIER_GRAD[tier] || TIER_GRAD.stone) : LOCKED_GRAD;
    const uid = `aig-${tier}-${unlocked ? 'on' : 'off'}-${size}`;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            aria-hidden="true"
            className={`achievement-icon achievement-icon--${tier} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
        >
            <defs>{backdrop(uid, grad)}</defs>
            <circle cx="24" cy="24" r="22" fill={`url(#${uid})`} stroke={unlocked ? 'rgba(255,255,255,0.35)' : 'rgba(31,26,59,0.4)'} strokeWidth="1.4" />
            {/* Inner gem ring */}
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            {glyphFor(icon, !unlocked)}
            {!unlocked && (
                <g>
                    {/* Lock overlay for locked achievements */}
                    <rect x="32" y="32" width="12" height="12" rx="2.5" fill="#1F1A3B" opacity="0.85" />
                    <rect x="34" y="36" width="8" height="6" rx="1" fill="#FFD86B" />
                    <path d="M35 36 v -2 a 3 3 0 0 1 6 0 v 2" stroke="#FFD86B" strokeWidth="1.4" fill="none" />
                </g>
            )}
            {unlocked && tier === 'legend' && (
                <g fill="#FFFDF7">
                    {/* Sparkle stars on legendary achievements */}
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
