import React from 'react';

// Atlas Bucks icon: a bold dollar glyph locked to the brand buck-green
// (`--brand-buck-green` in tokens.css, identical across light + dark themes).
// Used in the topbar, the shop, multiplayer ante, chest reveals, quest
// rewards, the battlepass — anywhere a bucks balance or payout is shown.
//
// Earlier versions painted the glyph with a teal-ocean SVG <pattern> overlay
// over a green fallback so the icon read as "money made of the world". That
// looked great where it rendered, but mobile WebKit fails to resolve `url(#…)`
// paint-servers inside transformed/animated layers (the xp-gain popup on a
// correct answer is the classic offender) — so the icon flipped between teal
// and green depending on where it sat. The visible inconsistency reads as a
// theme-swap bug. Simplified to a single solid colour so it renders the
// same in every context.
//
// Pass `labelled` where the icon is the ONLY unit indicator next to a number
// (prices, balances) so screen readers announce "Atlas Bucks" instead of a
// bare figure. Leave it decorative (default) where adjacent text already says
// "Bucks".
export default function AtlasBucksIcon({ size = 16, className = '', labelled = false }) {
    const a11y = labelled
        ? { role: 'img', 'aria-label': 'Atlas Bucks' }
        : { 'aria-hidden': 'true' };
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={`atlas-bucks-icon ${className}`.trim()}
            style={{
                verticalAlign: '-3px',
                // CSS var consumed via `fill="currentColor"` below. Fallback
                // hex is the same value as the var so a context that loses
                // the var still paints the locked brand green.
                color: 'var(--brand-buck-green, #1FAE5F)',
            }}
            {...a11y}
        >
            <text
                x="12"
                y="18.5"
                textAnchor="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontWeight="900"
                fontSize="20"
                fill="currentColor"
                stroke="var(--brand-buck-stroke, #1F1A3B)"
                strokeWidth="1.3"
                paintOrder="stroke fill"
            >$</text>
        </svg>
    );
}
