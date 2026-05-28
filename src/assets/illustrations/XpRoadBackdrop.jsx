import React from 'react';

// Long ambient backdrop for the XP Road's scrolling canvas. Two stacked SVGs:
//
//   <XpRoadBackdrop /> — sky → meadow scene with sun, drifting cumulus, and
//   grounded hills. Renders BEHIND the central vine + UI.
//
//   <XpRoadFog />      — translucent fog bands rendered IN FRONT of the vine
//   but BEHIND the milestone plaques. Gives the climb a sense of depth as the
//   vine + climbers recede through fog at intentional heights.
//
// Both use `viewBox="0 0 200 1000" preserveAspectRatio="xMidYMid slice"` so a
// single bespoke composition fills both mobile and desktop canvases: tall
// portrait canvases (mobile) crop horizontally at the SVG edges, near-square
// canvases (desktop) fit close to the natural aspect, and the central cloud +
// fog detail stays visible regardless.
//
// Clouds drift the full width of the SVG (left off-screen → right off-screen)
// matching the home-menu XpRoadCard emblem. Each cloud has a stagger `begin`
// (negative seconds) so clouds appear pre-distributed across the sky at mount
// rather than all entering from the left edge at t=0. Drift is SMIL-driven
// so no JS animation loop pins the scroller during use.

// One drifting cloud. The cloud puff itself is a centred symbol; this
// component renders it inside a <g> whose transform is animated from
// (-50, y) to (250, y) — well off both edges so puffs fade in/out cleanly.
// The negative `begin` time offsets each cloud's phase so they don't bunch.
function Cloud({ y, s = 1, o = 1, dur = 40, begin = 0 }) {
    const values = `-50 ${y};250 ${y}`;
    return (
        <g opacity={o}>
            <g transform={`translate(-50 ${y}) scale(${s})`}>
                <use href="#xprbCloudPuff" />
            </g>
            <animateTransform
                attributeName="transform"
                type="translate"
                values={values}
                dur={`${dur}s`}
                begin={`${begin}s`}
                repeatCount="indefinite"
            />
        </g>
    );
}

// Cloud placements spread across the 0..1000 viewBox. Each row is one drifting
// puff. `dur` controls travel speed (longer = slower = feels more distant);
// `begin` is a negative-second offset so puffs are pre-distributed across the
// sky at mount rather than all entering together. Layered top-to-bottom:
// sparse wispy puffs in the open sky, denser cumulus through the middle of
// the climb, thinning low clouds approaching the meadow.
const CLOUDS = [
    // Top sky — wispy, fewer, slower
    { y: 60,  s: 0.7, o: 0.85, dur: 56, begin: -8 },
    { y: 100, s: 1.0, o: 0.92, dur: 64, begin: -32 },
    { y: 140, s: 0.6, o: 0.78, dur: 70, begin: -18 },
    { y: 180, s: 0.85, o: 0.88, dur: 60, begin: -45 },

    // Mid sky — denser cumulus, varied speeds
    { y: 240, s: 1.1, o: 0.92, dur: 52, begin: -22 },
    { y: 290, s: 0.95, o: 0.85, dur: 58, begin: -40 },
    { y: 340, s: 1.25, o: 0.95, dur: 46, begin: -12 },
    { y: 400, s: 1.0, o: 0.88, dur: 54, begin: -36 },
    { y: 460, s: 1.15, o: 0.92, dur: 50, begin: -24 },
    { y: 520, s: 0.9, o: 0.82, dur: 62, begin: -8 },
    { y: 580, s: 1.2, o: 0.9, dur: 48, begin: -28 },
    { y: 640, s: 1.0, o: 0.86, dur: 56, begin: -44 },

    // Low cloud bank — thinning out approaching meadow
    { y: 720, s: 1.05, o: 0.78, dur: 66, begin: -16 },
    { y: 780, s: 0.85, o: 0.72, dur: 74, begin: -50 },
    { y: 820, s: 1.0, o: 0.7, dur: 70, begin: -30 },
];

// Shared <defs> block. Centralising the gradients + symbols means colours
// stay in lock-step and the cloud puff symbol is defined once.
function BackdropDefs() {
    return (
        <defs>
            {/* Sky wash: deep blue zenith → soft horizon → meadow green. */}
            <linearGradient id="xprbSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6FBFE6" />
                <stop offset="20%"  stopColor="#9FD2EE" />
                <stop offset="42%"  stopColor="#CDE4F3" />
                <stop offset="62%"  stopColor="#E8F2EC" />
                <stop offset="82%"  stopColor="#D2E9BC" />
                <stop offset="100%" stopColor="#9BC78A" />
            </linearGradient>
            <radialGradient id="xprbSun" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFF6CA" />
                <stop offset="55%"  stopColor="#FFD86B" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FFB845" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="xprbCloudFill" cx="40%" cy="35%" r="65%">
                <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.98" />
                <stop offset="55%"  stopColor="#F4FAFD" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#C9D8E2" stopOpacity="0.35" />
            </radialGradient>
            <linearGradient id="xprbHillsFar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#A5C9C0" />
                <stop offset="100%" stopColor="#7AAFA0" />
            </linearGradient>
            <linearGradient id="xprbHillsNear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#7FB670" />
                <stop offset="100%" stopColor="#4F8B47" />
            </linearGradient>

            {/* Single cloud-puff symbol referenced by every drifting cloud.
                Drawn centred at the symbol origin so the parent <g> handles
                all positioning + scaling. `overflow="visible"` lets the
                puff's ellipses render outside the symbol box. */}
            <symbol id="xprbCloudPuff" overflow="visible">
                <ellipse cx="0"   cy="0"  rx="22" ry="9"  fill="url(#xprbCloudFill)" />
                <ellipse cx="-16" cy="3"  rx="14" ry="7"  fill="url(#xprbCloudFill)" />
                <ellipse cx="16"  cy="4"  rx="13" ry="7"  fill="url(#xprbCloudFill)" />
                <ellipse cx="-4"  cy="-5" rx="11" ry="6"  fill="url(#xprbCloudFill)" />
                <ellipse cx="10"  cy="-5" rx="9"  ry="5"  fill="url(#xprbCloudFill)" />
            </symbol>
        </defs>
    );
}

export default function XpRoadBackdrop() {
    return (
        <svg
            className="xpr-backdrop"
            viewBox="0 0 200 1000"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <BackdropDefs />

            {/* Full-bleed sky wash. */}
            <rect width="200" height="1000" fill="url(#xprbSky)" />

            {/* Soft sun glow top-right with a brighter inner disc. */}
            <circle cx="172" cy="85" r="60" fill="url(#xprbSun)" />
            <circle cx="172" cy="85" r="16" fill="#FFF2B8" opacity="0.9" />

            {/* Drifting clouds — every cloud travels L→R across the sky. */}
            <g>
                {CLOUDS.map((c, i) => (
                    <Cloud key={i} {...c} />
                ))}
            </g>

            {/* Distant pale hills then near meadow rise. */}
            <path
                d="M -10 870 Q 30 840 70 855 Q 110 835 145 855 Q 180 845 210 860 L 210 1010 L -10 1010 Z"
                fill="url(#xprbHillsFar)"
                opacity="0.85"
            />
            <path
                d="M -10 910 Q 40 880 95 900 Q 145 885 210 905 L 210 1010 L -10 1010 Z"
                fill="url(#xprbHillsNear)"
            />
            {/* Grass tufts USED to sit here as 2×16 paths in the same slice SVG,
                but slice-stretch on a tall canvas turned them into ugly vertical
                streaks. They now live in <XpRoadMeadowGrass /> below, a separate
                fixed-height SVG that renders the tufts at their natural size. */}
        </svg>
    );
}

// Bottom-of-canvas grass strip rendered as its OWN SVG so it doesn't inherit
// the backdrop's slice-stretch (which turned the original grass tufts into
// tall vertical streaks on long canvases). Pinned to the bottom of the
// canvas with a fixed pixel height, `preserveAspectRatio="none"` only
// stretches horizontally to fill the width — the vertical scale of each
// tuft is locked. The strip sits IN FRONT of the backdrop hills but BEHIND
// the vine + milestones so the player still appears to climb up out of it.
export function XpRoadMeadowGrass() {
    // A small randomish-but-stable scatter of bushy tufts. Each tuft is a
    // tiny cluster of blades pointing up from a common base, so they read
    // as grass rather than abstract shapes. xs are spread across 0..200 to
    // match the canvas viewBox; ys vary slightly so the tops don't form a
    // flat line.
    const TUFTS = [
        { x: 6,   y: 30, s: 1.0  },
        { x: 18,  y: 26, s: 0.85 },
        { x: 32,  y: 32, s: 1.1  },
        { x: 46,  y: 28, s: 0.95 },
        { x: 58,  y: 31, s: 0.9  },
        { x: 72,  y: 27, s: 1.05 },
        { x: 84,  y: 30, s: 0.95 },
        { x: 98,  y: 26, s: 1.0  },
        { x: 112, y: 32, s: 0.9  },
        { x: 126, y: 28, s: 1.1  },
        { x: 140, y: 30, s: 0.95 },
        { x: 152, y: 27, s: 0.9  },
        { x: 166, y: 31, s: 1.0  },
        { x: 180, y: 28, s: 1.05 },
        { x: 194, y: 30, s: 0.9  },
    ];
    return (
        <svg
            className="xpr-meadow-grass"
            viewBox="0 0 200 36"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="xprbGrassBlade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#5FA94A" />
                    <stop offset="100%" stopColor="#2F6A2A" />
                </linearGradient>
            </defs>
            {TUFTS.map((t, i) => (
                <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
                    {/* Three blades fanning out from a common base */}
                    <path d="M -3 0 Q -3.6 -5 -2 -10" stroke="url(#xprbGrassBlade)"
                        strokeWidth="1.4" strokeLinecap="round" fill="none" />
                    <path d="M 0 0 Q 0 -7 0.4 -13" stroke="url(#xprbGrassBlade)"
                        strokeWidth="1.6" strokeLinecap="round" fill="none" />
                    <path d="M 3 0 Q 3.4 -6 2 -11" stroke="url(#xprbGrassBlade)"
                        strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </g>
            ))}
        </svg>
    );
}

// Separate fog layer sandwiched between the vine (z:1) and milestone plaques
// (z:3). Bands sit at five intentional Y heights so the climb pierces fog at
// predictable intervals rather than fading uniformly.
const FOG_BANDS = [
    { y: 200, h: 70, opacity: 0.65 },
    { y: 360, h: 90, opacity: 0.78 },
    { y: 520, h: 80, opacity: 0.70 },
    { y: 680, h: 95, opacity: 0.82 },
    { y: 830, h: 75, opacity: 0.62 },
];

export function XpRoadFog() {
    return (
        <svg
            className="xpr-fog"
            viewBox="0 0 200 1000"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="xprbFogFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0" />
                    <stop offset="48%"  stopColor="#FAFCFE" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
            </defs>
            {FOG_BANDS.map((b, i) => (
                <rect
                    key={`f-${i}`}
                    x="-20" width="240"
                    y={b.y} height={b.h}
                    fill="url(#xprbFogFill)"
                    opacity={b.opacity}
                />
            ))}
        </svg>
    );
}
