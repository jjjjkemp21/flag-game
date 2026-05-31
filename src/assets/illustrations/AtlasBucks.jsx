import React, { useId } from 'react';

// Atlas Bucks icon: a bold dollar glyph rendered with the same teal-ocean
// gradient + green continent dabs as Atlas's globe, so the currency reads as
// "money made of the world". Used in the topbar, the shop, multiplayer ante,
// and anywhere a bucks balance is shown.
//
// Pass `labelled` where the icon is the ONLY unit indicator next to a number
// (prices, balances) so screen readers announce "Atlas Bucks" instead of a
// bare figure. Leave it decorative (default) where adjacent text already says
// "Bucks".
export default function AtlasBucksIcon({ size = 16, className = '', labelled = false }) {
    const uid = useId();
    const oceanId = `ab-ocean-${uid.replace(/:/g, '')}`;
    const mapId = `ab-map-${uid.replace(/:/g, '')}`;
    const a11y = labelled
        ? { role: 'img', 'aria-label': 'Atlas Bucks' }
        : { 'aria-hidden': 'true' };
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={`atlas-bucks-icon ${className}`.trim()}
            style={{ verticalAlign: '-3px' }}
            {...a11y}
        >
            <defs>
                <linearGradient id={oceanId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#9FE5C9" />
                    <stop offset="0.55" stopColor="#2EC4D3" />
                    <stop offset="1" stopColor="#1FA0AC" />
                </linearGradient>
                {/* Pattern tile: teal ocean + a few green "continent" blobs */}
                <pattern id={mapId} patternUnits="userSpaceOnUse" width="24" height="24">
                    <rect width="24" height="24" fill={`url(#${oceanId})`} />
                    <path d="M2 6 q4 -3 8 -1 q2 4 -2 6 q-6 0 -6 -5 Z" fill="#19C37D" opacity="0.92" />
                    <path d="M15 3 q5 0 6 5 q-1 3 -5 2 q-3 -3 -1 -7 Z" fill="#19C37D" opacity="0.92" />
                    <path d="M9 16 q5 -1 7 2 q-1 4 -5 3 q-4 -2 -2 -5 Z" fill="#19C37D" opacity="0.92" />
                </pattern>
            </defs>
            {/* Base $ glyph: solid green fill + dark outline. This is the
                fallback that paints when the pattern paint-server below fails
                to resolve — which mobile WebKit does when the icon sits inside
                a transformed/animated layer (e.g. the xp-gain popup on a
                correct answer). Without it the glyph rendered dark (stroke
                only). The gradient glyph is drawn on top and covers this where
                paint-server references work (desktop + most contexts). */}
            <text
                x="12"
                y="18.5"
                textAnchor="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontWeight="900"
                fontSize="20"
                fill="#19C37D"
                stroke="#1F1A3B"
                strokeWidth="1.3"
                paintOrder="stroke fill"
            >$</text>
            {/* Map-textured overlay: the vivid globe fill where it renders. */}
            <text
                x="12"
                y="18.5"
                textAnchor="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontWeight="900"
                fontSize="20"
                fill={`url(#${mapId})`}
            >$</text>
        </svg>
    );
}
