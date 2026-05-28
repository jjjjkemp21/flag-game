import React from 'react';

// Single milestone leaf rendered on one side of the vine. The screen places
// these absolutely on either side of the central stem; major milestones use
// `size="lg"` and render a pair (one each side), minor milestones use
// `size="sm"` and render only one side.
//
// The `tier` prop (0..5) mirrors the chest-yield tier reached at the leaf's
// milestone XP — it ramps the leaf's appearance alongside the vine itself so
// the road's mid-section reads as a different "era" from its base or top.
// Tier 0 leaves are humble pale shoots, tier 3 leaves carry gold-rimmed
// veins, tier 4 leaves catch frost specks, and tier 5 leaves bear star
// ornaments in mythic violet + gold.
//
// Props:
//   side: 'left' | 'right'   — which side of the stem the leaf points away from
//   size: 'sm' | 'md' | 'lg' — visual scale
//   reached: boolean         — bright when crossed, muted (grey) when locked
//   tier: 0..5               — progression tier (palette + accents)

const SIZE_BY_NAME = {
    sm: { w: 56,  h: 30 },
    md: { w: 78,  h: 42 },
    lg: { w: 110, h: 60 },
};

// Tier palette + accent flags. `stops` drive the leaf body gradient (light
// → mid → dark), `stroke` is the outline / vein colour, `rim` is the bright
// edge highlight that runs along the top of the leaf (and along the bottom
// at tier 3+ for a fully gilded look), `dot` is a small gleaming ornament
// near the tip, and `sparkle` adds either frost specks (tier 4) or tiny star
// accents (tier 5).
const TIERS = {
    0: { stops: ['#E0F5BD', '#7BBE5C', '#3F7333'], stroke: '#3F7333', rim: null,      dot: null,      sparkle: null   },
    1: { stops: ['#C8F0A0', '#3FAA4F', '#1F5A2A'], stroke: '#1F5A2A', rim: '#FFD86B', dot: null,      sparkle: null   },
    2: { stops: ['#BCEEB8', '#2C9A5A', '#125534'], stroke: '#125534', rim: '#FFD86B', dot: '#FFFFFF', sparkle: null   },
    3: { stops: ['#B0E8D8', '#1B8E70', '#0E4536'], stroke: '#0E4536', rim: '#FFC74A', dot: '#FFC74A', sparkle: null   },
    4: { stops: ['#C8E8F0', '#2A95AE', '#0F4753'], stroke: '#0F4753', rim: '#FFE9A0', dot: '#FFFFFF', sparkle: 'frost' },
    5: { stops: ['#E2CCFF', '#6F4DC4', '#322266'], stroke: '#322266', rim: '#FFD24A', dot: '#FFD24A', sparkle: 'star'  },
};

// Five-point star polygon — used for the tier-5 ornaments. Returned as a
// plain SVG `points` string so it lives inside the leaf without needing
// extra defs.
function starPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        pts.push(`${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`);
    }
    return pts.join(' ');
}

export default function VineLeaf({ side = 'right', size = 'md', reached = false, tier = 1 }) {
    const t = Math.max(0, Math.min(5, Math.floor(Number(tier) || 0)));
    const T = TIERS[t];
    const { w, h } = SIZE_BY_NAME[size] || SIZE_BY_NAME.md;
    const flip = side === 'left';
    const strokeColor = reached ? T.stroke : '#2A3A2A';
    // The leaf path is drawn pointing right; flipping for the left side mirrors
    // it across the stem so the stem appears to grow out of the leaf base.
    const gradId = `leafFill-${side}-${size}-t${t}-${reached ? '1' : '0'}`;

    return (
        <svg
            className={`xpr-leaf xpr-leaf--${size} xpr-leaf--${side} xpr-leaf--t${t} ${reached ? 'is-reached' : 'is-locked'}`}
            viewBox="0 0 110 60"
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={flip ? { transform: 'scaleX(-1)' } : undefined}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    {reached ? (
                        <>
                            <stop offset="0%"   stopColor={T.stops[0]} />
                            <stop offset="55%"  stopColor={T.stops[1]} />
                            <stop offset="100%" stopColor={T.stops[2]} />
                        </>
                    ) : (
                        <>
                            <stop offset="0%"   stopColor="#C8D2C0" />
                            <stop offset="55%"  stopColor="#6F8A6A" />
                            <stop offset="100%" stopColor="#2A3A2A" />
                        </>
                    )}
                </linearGradient>
            </defs>

            {/* Leaf body — base at the left edge (stem attachment), tip at the
                right edge. The bezier control points give a slight droop so it
                reads as a leaf and not just a teardrop. */}
            <path
                d="M 4 30 Q 18 6 60 8 Q 100 12 106 30 Q 100 48 60 52 Q 18 54 4 30 Z"
                fill={`url(#${gradId})`}
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {/* Central vein */}
            <path
                d="M 6 30 Q 56 30 104 30"
                fill="none" stroke={strokeColor}
                strokeWidth="1.5" opacity="0.7"
            />
            {/* Side veins */}
            {[
                [22, 16, 36, 28],
                [42, 12, 54, 28],
                [62, 12, 74, 28],
                [82, 14, 94, 30],
                [22, 44, 36, 32],
                [42, 48, 54, 32],
                [62, 48, 74, 32],
                [82, 46, 94, 30],
            ].map(([x1, y1, x2, y2], i) => (
                <path
                    key={i}
                    d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + (y1 < 30 ? -1 : 1)} ${x2} ${y2}`}
                    stroke={strokeColor}
                    strokeWidth="0.9" opacity="0.55" fill="none"
                />
            ))}

            {/* Tier accents only render on reached leaves so locked ones stay
                muted and consistent regardless of which era they belong to. */}
            {reached && T.rim && (
                <path
                    d="M 60 8 Q 100 12 106 30"
                    fill="none" stroke={T.rim} strokeWidth="1.3" opacity="0.95"
                />
            )}
            {reached && t >= 3 && T.rim && (
                <path
                    d="M 60 52 Q 100 48 106 30"
                    fill="none" stroke={T.rim} strokeWidth="1.0" opacity="0.75"
                />
            )}
            {reached && T.dot && (
                <circle cx="94" cy="30" r="2.2" fill={T.dot}
                    stroke={T.stroke} strokeWidth="0.5" opacity="0.95" />
            )}
            {reached && T.sparkle === 'frost' && (
                <g opacity="0.95">
                    <circle cx="72" cy="20" r="0.9" fill="#FFFFFF" />
                    <circle cx="58" cy="42" r="0.8" fill="#FFFFFF" />
                    <circle cx="86" cy="44" r="0.7" fill="#FFFFFF" />
                </g>
            )}
            {reached && T.sparkle === 'star' && (
                <g>
                    <polygon points={starPoints(70, 22, 2.6)}
                        fill={T.rim} stroke={T.stroke} strokeWidth="0.45" strokeLinejoin="round" />
                    <polygon points={starPoints(50, 40, 1.8)}
                        fill={T.dot || T.rim} stroke={T.stroke} strokeWidth="0.4" strokeLinejoin="round" />
                </g>
            )}
        </svg>
    );
}
