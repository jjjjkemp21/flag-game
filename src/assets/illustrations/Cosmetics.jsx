import React from 'react';

// SVG cosmetic overlays drawn in the Mascot's 96x96 viewBox.
// Globe is centered at (48,48) with radius 34 (top edge ~y14).

export function renderHat(id) {
    switch (id) {
        case 'party':
            return (
                <g>
                    <path d="M48 -6 L60 20 L36 20 Z" fill="#FF5C6C" />
                    <path d="M48 -6 L54 8 L42 8 Z" fill="#FFC247" />
                    <circle cx="48" cy="-6" r="3.5" fill="#FFC247" />
                </g>
            );
        case 'beanie':
            return (
                <g>
                    <path d="M22 22 Q48 -10 74 22 Z" fill="#5B5BF6" />
                    <rect x="22" y="19" width="52" height="7" rx="3.5" fill="#3F3FD1" />
                    <circle cx="48" cy="-8" r="4" fill="#E6E5FF" />
                </g>
            );
        case 'grad':
            return (
                <g>
                    <polygon points="48,2 72,13 48,24 24,13" fill="#1F1A3B" />
                    <rect x="44" y="11" width="8" height="6" fill="#2A234D" />
                    <path d="M72 13 L72 26" stroke="#FFC247" strokeWidth="2" />
                    <circle cx="72" cy="27" r="3" fill="#FFC247" />
                </g>
            );
        case 'crown':
            return (
                <g>
                    <path d="M28 24 L32 6 L40 18 L48 4 L56 18 L64 6 L68 24 Z"
                        fill="#FFC247" stroke="#E5A018" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="48" cy="14" r="2.5" fill="#FF5C6C" />
                    <circle cx="34" cy="18" r="2" fill="#2EC4D3" />
                    <circle cx="62" cy="18" r="2" fill="#2EC4D3" />
                </g>
            );
        case 'tophat':
            return (
                <g>
                    <rect x="26" y="20" width="44" height="5" rx="2.5" fill="#1F1A3B" />
                    <rect x="34" y="-4" width="28" height="25" rx="3" fill="#1F1A3B" />
                    <rect x="34" y="12" width="28" height="5" fill="#FF5C6C" />
                </g>
            );
        case 'halo':
            return (
                <g>
                    <ellipse cx="48" cy="6" rx="16" ry="5" fill="none" stroke="#FFC247" strokeWidth="4" opacity="0.9" />
                </g>
            );
        default:
            return null;
    }
}

export function renderGlasses(id) {
    switch (id) {
        case 'round':
            return (
                <g stroke="#1F1A3B" strokeWidth="2.5" fill="rgba(255,255,255,0.25)">
                    <circle cx="38" cy="46" r="8" />
                    <circle cx="58" cy="46" r="8" />
                    <path d="M46 46 L50 46" />
                    <path d="M30 44 L24 42" />
                    <path d="M66 44 L72 42" />
                </g>
            );
        case 'shades':
            return (
                <g fill="#1F1A3B">
                    <rect x="29" y="41" width="17" height="11" rx="4" />
                    <rect x="50" y="41" width="17" height="11" rx="4" />
                    <rect x="45" y="44" width="6" height="2.5" />
                    <path d="M29 43 L23 41" stroke="#1F1A3B" strokeWidth="2.5" />
                    <path d="M67 43 L73 41" stroke="#1F1A3B" strokeWidth="2.5" />
                </g>
            );
        case 'heart':
            return (
                <g fill="#FF7BA0" stroke="#E5417A" strokeWidth="1.5">
                    <path d="M38 52 L31 45 a3.5 3.5 0 0 1 5 -4.6 l2 2 l2 -2 a3.5 3.5 0 0 1 5 4.6 Z" />
                    <path d="M58 52 L51 45 a3.5 3.5 0 0 1 5 -4.6 l2 2 l2 -2 a3.5 3.5 0 0 1 5 4.6 Z" />
                    <path d="M46 46 L50 46" stroke="#E5417A" strokeWidth="2" />
                </g>
            );
        default:
            return null;
    }
}
