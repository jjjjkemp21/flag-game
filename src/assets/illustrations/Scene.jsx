import React from 'react';

// Scene backgrounds for the homepage hero (and shop preview). Each scene is
// a self-contained SVG that fills its parent — designed at viewBox 600x300
// and sliced (preserveAspectRatio) so it covers any aspect ratio cleanly.
// `default` returns null so callers can fall back to the regular hero blobs.

const Stop = ({ offset, color, opacity }) => (
    <stop offset={offset} stopColor={color} stopOpacity={opacity == null ? 1 : opacity} />
);

function SceneWrap({ id, children }) {
    return (
        <svg
            className={`hero-scene hero-scene--${id}`}
            viewBox="0 0 600 300"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
            {children}
        </svg>
    );
}

// ---- Africa — Sunset Savanna ----------------------------------------------
function Africa() {
    return (
        <SceneWrap id="africa">
            <defs>
                <linearGradient id="sc-af-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#3A1A4A" />
                    <Stop offset="22%" color="#C44A2A" />
                    <Stop offset="55%" color="#FF8A3F" />
                    <Stop offset="80%" color="#FFD080" />
                    <Stop offset="100%" color="#FFE8B0" />
                </linearGradient>
                <radialGradient id="sc-af-sunglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFFEEC" />
                    <Stop offset="40%" color="#FFE8A8" opacity="0.85" />
                    <Stop offset="100%" color="#FF8A3F" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-af-haze" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FF8A3F" opacity="0" />
                    <Stop offset="100%" color="#3A1810" opacity="0.55" />
                </linearGradient>
                <linearGradient id="sc-af-silhouette" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#2A1408" />
                    <Stop offset="100%" color="#0A0402" />
                </linearGradient>
                <filter id="sc-af-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-af-sky)" />

            {/* Sun + blurred halo + pulsating disc */}
            <circle cx="420" cy="170" r="120" fill="url(#sc-af-sunglow)">
                <animate attributeName="r" values="120;138;120" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="420" cy="170" r="44" fill="#FFFCE8" opacity="0.8" filter="url(#sc-af-glow)" />
            <circle cx="420" cy="170" r="32" fill="#FFF8D0">
                <animate attributeName="opacity" values="0.95;1;0.95" dur="4s" repeatCount="indefinite" />
            </circle>
            {/* Dust motes drifting */}
            <g fill="#FFE8A8" opacity="0.55">
                <circle cx="120" cy="260" r="1">
                    <animate attributeName="cx" values="120;160;120" dur="14s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="14s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="252" r="1.2">
                    <animate attributeName="cx" values="300;260;300" dur="16s" repeatCount="indefinite" />
                </circle>
                <circle cx="480" cy="258" r="1">
                    <animate attributeName="cx" values="480;520;480" dur="12s" repeatCount="indefinite" />
                </circle>
            </g>

            {/* Bird V-formation */}
            <g fill="none" stroke="#2A1408" strokeWidth="1.5" strokeLinecap="round">
                <path d="M150,70 L156,67 L162,70" />
                <path d="M168,76 L174,73 L180,76" />
                <path d="M132,80 L138,77 L144,80" />
                <path d="M186,82 L192,79 L198,82" />
                <path d="M114,90 L120,87 L126,90" />
            </g>

            {/* Far blue-haze ridges */}
            <path d="M0,200 Q80,188 160,196 T320,194 T480,192 T600,198 L600,210 L0,210 Z"
                  fill="#6A2A30" opacity="0.55" />
            {/* Mid ridge */}
            <path d="M0,218 Q120,200 240,215 T480,212 T600,218 L600,228 L0,228 Z"
                  fill="#5A1F1A" opacity="0.85" />
            {/* Near savanna ground */}
            <path d="M0,232 Q150,222 300,230 T600,228 L600,300 L0,300 Z" fill="#3A1408" />
            <rect width="600" height="80" y="220" fill="url(#sc-af-haze)" />

            {/* Tall grass tufts in foreground */}
            <g stroke="#1A0A04" strokeWidth="1.2" strokeLinecap="round" fill="none">
                <path d="M10,295 L8,278 M14,295 L16,280 M20,295 L18,275" />
                <path d="M70,298 L68,282 M74,298 L76,278 M80,298 L78,283" />
                <path d="M300,298 L298,284 M304,298 L306,280 M310,298 L308,285" />
                <path d="M460,298 L458,282 M464,298 L466,278 M470,298 L468,284" />
                <path d="M580,298 L578,282 M584,298 L586,278 M590,298 L588,285" />
            </g>

            {/* Hero acacia tree — left, with gradient depth and small leaves */}
            <g transform="translate(110,235)">
                <path d="M-3,0 Q-6,-30 -2,-62 L2,-62 Q6,-30 3,0 Z" fill="url(#sc-af-silhouette)" />
                <path d="M-2,-58 Q-22,-66 -42,-62" stroke="#1A0A04" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M2,-58 Q22,-66 44,-62" stroke="#1A0A04" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M0,-62 Q-4,-78 0,-90" stroke="#1A0A04" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Sub-branches */}
                <path d="M-30,-64 Q-36,-72 -42,-78" stroke="#1A0A04" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M30,-64 Q36,-72 42,-78" stroke="#1A0A04" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Flat fan canopy */}
                <ellipse cx="0" cy="-72" rx="64" ry="11" fill="#0A0402" />
                <ellipse cx="-24" cy="-79" rx="36" ry="9" fill="#0A0402" />
                <ellipse cx="22" cy="-77" rx="34" ry="9" fill="#0A0402" />
                <ellipse cx="0" cy="-87" rx="22" ry="6" fill="#0A0402" />
                {/* Tiny leaves catching the sun */}
                <g fill="#FFB070" opacity="0.55">
                    <circle cx="-38" cy="-74" r="1.2" />
                    <circle cx="36" cy="-72" r="1" />
                    <circle cx="-8" cy="-86" r="1" />
                    <circle cx="12" cy="-83" r="1.2" />
                </g>
            </g>

            {/* Distant acacia */}
            <g transform="translate(540,248)" opacity="0.92">
                <path d="M-2,0 Q-4,-22 -1,-46 L1,-46 Q4,-22 2,0 Z" fill="#1A0A04" />
                <ellipse cx="0" cy="-52" rx="42" ry="7" fill="#0F0604" />
                <ellipse cx="-12" cy="-58" rx="22" ry="5" fill="#0F0604" />
                <ellipse cx="14" cy="-56" rx="20" ry="5" fill="#0F0604" />
            </g>

            {/* Elephant silhouette in mid-distance — body + 4 legs as one shape */}
            <g transform="translate(370,232)" fill="#1A0A04" opacity="0.95">
                <path d="M-26,-10 C-26,-22 -10,-22 0,-22 C10,-22 26,-22 26,-10 L26,2 L22,2 L22,8 L14,8 L14,2 L8,2 L8,8 L2,8 L2,2 L-2,2 L-2,8 L-8,8 L-8,2 L-14,2 L-14,8 L-22,8 L-22,2 L-26,2 Z" />
                {/* Head + trunk */}
                <circle cx="22" cy="-12" r="10" />
                <path d="M30,-12 Q36,-2 32,6 Q28,2 28,-6 Z" />
                {/* Tail */}
                <path d="M-26,-10 Q-30,-6 -26,-2 L-24,-3 Q-26,-7 -24,-10 Z" />
                {/* Ear ridge */}
                <path d="M22,-2 Q26,4 32,2" stroke="#3A1A10" strokeWidth="1.2" fill="none" opacity="0.6" />
            </g>

            {/* Giraffe silhouette — body + 4 legs as one shape */}
            <g transform="translate(220,260)" fill="#1A0A04">
                <path d="M-4,-22 Q-4,-32 18,-32 L26,-32 Q40,-32 40,-22 L40,-14 L39,-14 L39,0 L33,0 L33,-14 L31,-14 L31,0 L25,0 L25,-14 L15,-14 L15,0 L9,0 L9,-14 L7,-14 L7,0 L1,0 L1,-14 L-4,-14 Z" />
                {/* Neck */}
                <path d="M30,-30 Q40,-46 44,-58 L48,-58 Q44,-46 36,-30 Z" />
                {/* Head */}
                <ellipse cx="48" cy="-60" rx="6" ry="4" />
                {/* Horns */}
                <line x1="46" y1="-62" x2="44" y2="-66" stroke="#1A0A04" strokeWidth="1.5" />
                <line x1="50" y1="-62" x2="52" y2="-66" stroke="#1A0A04" strokeWidth="1.5" />
                {/* Tail */}
                <path d="M-4,-22 Q-8,-16 -6,-10" stroke="#1A0A04" strokeWidth="1.5" fill="none" />
            </g>

            {/* Gazelle — body + 4 legs as one shape */}
            <g transform="translate(80,270)" fill="#1A0A04">
                <path d="M-9,-10 Q-9,-14 0,-14 Q9,-14 9,-10 L9,-7 L7.5,-7 L7.5,0 L5.5,0 L5.5,-7 L4.5,-7 L4.5,0 L2.5,0 L2.5,-7 L-1.5,-7 L-1.5,0 L-3.5,0 L-3.5,-7 L-4.5,-7 L-4.5,0 L-6.5,0 L-6.5,-7 L-9,-7 Z" />
                {/* Neck */}
                <path d="M8,-12 Q12,-18 12,-22 L13,-22 Q11,-16 9,-12 Z" />
                {/* Horns */}
                <line x1="11" y1="-22" x2="9" y2="-26" stroke="#1A0A04" strokeWidth="1" />
                <line x1="13" y1="-22" x2="15" y2="-26" stroke="#1A0A04" strokeWidth="1" />
            </g>
        </SceneWrap>
    );
}

// ---- Asia — Misty Peaks ---------------------------------------------------
function Asia() {
    return (
        <SceneWrap id="asia">
            <defs>
                <linearGradient id="sc-as-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFE6E0" />
                    <Stop offset="40%" color="#FFB8C8" />
                    <Stop offset="75%" color="#E58AB0" />
                    <Stop offset="100%" color="#7A4A8A" />
                </linearGradient>
                <radialGradient id="sc-as-sunglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFFCE8" />
                    <Stop offset="55%" color="#FFD8B0" opacity="0.8" />
                    <Stop offset="100%" color="#FFB8C8" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-as-fuji" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFFFFF" />
                    <Stop offset="30%" color="#E8DAE8" />
                    <Stop offset="32%" color="#5B3F70" />
                    <Stop offset="100%" color="#2A1A40" />
                </linearGradient>
                <radialGradient id="sc-as-lantern" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFC0A0" />
                    <Stop offset="100%" color="#FF6B40" opacity="0" />
                </radialGradient>
                <filter id="sc-as-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-as-sky)" />

            {/* Sun glow with blur */}
            <circle cx="280" cy="120" r="100" fill="url(#sc-as-sunglow)" />
            <circle cx="280" cy="120" r="34" fill="#FFFCE8" opacity="0.75" filter="url(#sc-as-glow)" />
            <circle cx="280" cy="120" r="26" fill="#FFFCE8" opacity="0.95" />

            {/* Far ridge layer 1 — deepest fog */}
            <path d="M0,180 Q60,170 120,178 T240,176 T360,180 T480,174 T600,180 L600,210 L0,210 Z"
                  fill="#9A6A98" opacity="0.45" />
            {/* Mid ridge */}
            <path d="M0,195 L40,180 L90,195 L160,165 L230,195 L290,170 L350,195 L420,168 L480,195 L560,178 L600,195 L600,220 L0,220 Z"
                  fill="#6A4A78" opacity="0.7" />

            {/* Mt Fuji centerpiece */}
            <polygon points="200,225 290,90 380,225" fill="url(#sc-as-fuji)" />
            {/* Snow streaks */}
            <path d="M278,120 L286,108 L294,120 L290,124 L286,112 L282,124 Z" fill="#FFFFFF" />
            <path d="M268,140 L274,128 L280,140" fill="#FFFFFF" opacity="0.75" />
            <path d="M298,140 L304,128 L310,140" fill="#FFFFFF" opacity="0.75" />

            {/* Foreground darker peaks */}
            <polygon points="-40,230 60,150 160,230" fill="#3A2450" />
            <polygon points="20,230 100,170 180,230" fill="#2A1A40" />
            <polygon points="380,230 480,140 580,230" fill="#3A2450" />
            <polygon points="440,230 520,168 600,230" fill="#2A1A40" />
            {/* Their snow caps */}
            <path d="M50,165 L60,150 L70,165 L66,168 L60,158 L54,168 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M470,155 L480,140 L490,155 L486,158 L480,146 L474,158 Z" fill="#FFFFFF" opacity="0.9" />

            {/* Low fog band */}
            <ellipse cx="300" cy="215" rx="380" ry="14" fill="#FFE6E0" opacity="0.55" />
            <ellipse cx="160" cy="222" rx="240" ry="10" fill="#FFE6E0" opacity="0.45" />
            <ellipse cx="460" cy="222" rx="220" ry="10" fill="#FFE6E0" opacity="0.45" />

            {/* Ground */}
            <rect y="225" width="600" height="75" fill="#1A0F28" />
            <path d="M0,228 Q150,235 300,228 T600,232 L600,300 L0,300 Z" fill="#0F0820" />

            {/* Crane in profile — bigger, more readable */}
            <g transform="translate(170,140)" fill="#1A0A20">
                {/* Body */}
                <ellipse cx="0" cy="0" rx="9" ry="4" />
                {/* Neck + head */}
                <path d="M6,-2 Q12,-6 14,-12 Q16,-10 12,-3 Z" />
                <circle cx="14" cy="-12" r="2" />
                <path d="M15,-13 L20,-12 L15,-11 Z" fill="#FFC247" />
                {/* Legs trailing — thicker, anchored inside body */}
                <path d="M-2,2 L-1,2 L-7,8 L-8,8 Z" />
                <path d="M2,2 L3,2 L-3,8 L-4,8 Z" />
                {/* Wing */}
                <path d="M-2,-2 Q-10,-6 -18,-3 Q-12,0 -2,0 Z" />
                <path d="M-2,-2 Q-10,-6 -18,-3" stroke="#FFFFFF" strokeWidth="0.5" fill="none" opacity="0.4" />
            </g>

            {/* Pagoda — 3 tiers with curved eaves and lantern halos */}
            <g transform="translate(450,225)">
                {/* Lantern halos behind */}
                <circle cx="-26" cy="-30" r="10" fill="url(#sc-as-lantern)">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="26" cy="-30" r="10" fill="url(#sc-as-lantern)">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="3.4s" repeatCount="indefinite" />
                </circle>
                <g fill="#1A0A20">
                    {/* Base */}
                    <rect x="-30" y="-12" width="60" height="12" />
                    {/* Level 1 */}
                    <rect x="-22" y="-32" width="44" height="20" />
                </g>
                {/* Curved eave 1 — smooth arch with soft corner curls */}
                <path d="M-28,-32 L28,-32 Q34,-32 32,-38 Q28,-44 0,-44 Q-28,-44 -32,-38 Q-34,-32 -28,-32 Z" fill="#2A1530" />
                {/* Window glow */}
                <rect x="-4" y="-26" width="8" height="10" fill="#FFD86B">
                    <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
                </rect>
                {/* Level 2 */}
                <rect x="-18" y="-56" width="36" height="16" fill="#1A0A20" />
                <path d="M-24,-56 L24,-56 Q30,-56 28,-62 Q24,-68 0,-68 Q-24,-68 -28,-62 Q-30,-56 -24,-56 Z" fill="#2A1530" />
                <rect x="-3" y="-50" width="6" height="8" fill="#FFD86B" />
                {/* Level 3 */}
                <rect x="-14" y="-76" width="28" height="14" fill="#1A0A20" />
                <path d="M-20,-76 L20,-76 Q26,-76 24,-82 Q20,-88 0,-88 Q-20,-88 -24,-82 Q-26,-76 -20,-76 Z" fill="#2A1530" />
                {/* Spire */}
                <rect x="-1.5" y="-92" width="3" height="14" fill="#1A0A20" />
                <circle cx="0" cy="-95" r="3" fill="#FFD86B">
                    <animate attributeName="opacity" values="0.9;1;0.9" dur="4s" repeatCount="indefinite" />
                </circle>
                {/* Lantern bodies + tassels */}
                <ellipse cx="-26" cy="-30" rx="3.5" ry="4.5" fill="#FF6B4A" />
                <line x1="-26" y1="-32" x2="-26" y2="-37" stroke="#1A0A20" strokeWidth="0.6" />
                <line x1="-26" y1="-26" x2="-26" y2="-22" stroke="#FFD86B" strokeWidth="0.6" />
                <ellipse cx="26" cy="-30" rx="3.5" ry="4.5" fill="#FF6B4A" />
                <line x1="26" y1="-32" x2="26" y2="-37" stroke="#1A0A20" strokeWidth="0.6" />
                <line x1="26" y1="-26" x2="26" y2="-22" stroke="#FFD86B" strokeWidth="0.6" />
            </g>

            {/* Cherry blossom tree — left foreground */}
            <g transform="translate(80,225)">
                <path d="M-2,0 Q-6,-26 -8,-50 Q-4,-58 0,-60 L2,-58 Q-2,-32 2,0 Z" fill="#2A1A20" />
                <path d="M-4,-44 Q-16,-50 -28,-46" stroke="#2A1A20" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M0,-52 Q10,-58 18,-54" stroke="#2A1A20" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M-2,-58 Q-2,-72 4,-78" stroke="#2A1A20" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Blossom puffs */}
                <g fill="#FFB8D8">
                    <circle cx="-28" cy="-48" r="9" />
                    <circle cx="-22" cy="-54" r="7" />
                    <circle cx="-14" cy="-56" r="8" />
                    <circle cx="20" cy="-56" r="8" />
                    <circle cx="14" cy="-62" r="7" />
                    <circle cx="6" cy="-78" r="9" />
                    <circle cx="-2" cy="-72" r="6" />
                </g>
                <g fill="#FFD8E5">
                    <circle cx="-24" cy="-52" r="3" />
                    <circle cx="-16" cy="-60" r="3" />
                    <circle cx="16" cy="-58" r="3" />
                    <circle cx="2" cy="-76" r="3" />
                </g>
            </g>

            {/* Falling petals — animated */}
            <g fill="#FFB8D8">
                <circle cx="120" cy="60" r="2.5">
                    <animate attributeName="cy" values="60;240" dur="14s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="14s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="40" r="2">
                    <animate attributeName="cy" values="40;250" dur="18s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="18s" repeatCount="indefinite" />
                </circle>
                <circle cx="340" cy="80" r="2.5">
                    <animate attributeName="cy" values="80;250" dur="16s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="16s" repeatCount="indefinite" />
                </circle>
                <circle cx="500" cy="60" r="2">
                    <animate attributeName="cy" values="60;240" dur="15s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="15s" repeatCount="indefinite" />
                </circle>
                <circle cx="560" cy="100" r="2.5">
                    <animate attributeName="cy" values="100;245" dur="17s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="17s" repeatCount="indefinite" />
                </circle>
            </g>
        </SceneWrap>
    );
}

// ---- Europe — Castle on the Hill ------------------------------------------
function Europe() {
    return (
        <SceneWrap id="europe">
            <defs>
                <linearGradient id="sc-eu-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFE4C8" />
                    <Stop offset="35%" color="#FFC0B0" />
                    <Stop offset="70%" color="#CFD8E8" />
                    <Stop offset="100%" color="#6A8AB0" />
                </linearGradient>
                <linearGradient id="sc-eu-castle" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#A89888" />
                    <Stop offset="100%" color="#5A4A40" />
                </linearGradient>
                <linearGradient id="sc-eu-roof" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#A03030" />
                    <Stop offset="100%" color="#5A1818" />
                </linearGradient>
                <radialGradient id="sc-eu-sungold" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFF4D8" />
                    <Stop offset="100%" color="#FFC0B0" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-eu-moat" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#5A7AA8" />
                    <Stop offset="100%" color="#2A3F58" />
                </linearGradient>
                <filter id="sc-eu-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-eu-sky)" />

            {/* Distant sun with bloom */}
            <circle cx="100" cy="110" r="90" fill="url(#sc-eu-sungold)" />
            <circle cx="100" cy="110" r="32" fill="#FFF4D8" opacity="0.7" filter="url(#sc-eu-glow)" />
            <circle cx="100" cy="110" r="22" fill="#FFF4D8" opacity="0.95" />

            {/* Layered clouds */}
            <g fill="#FFFFFF">
                <g opacity="0.6">
                    <ellipse cx="200" cy="60" rx="58" ry="14" />
                    <ellipse cx="230" cy="50" rx="38" ry="12" />
                    <ellipse cx="180" cy="52" rx="28" ry="9" />
                </g>
                <g opacity="0.75">
                    <ellipse cx="450" cy="80" rx="70" ry="16" />
                    <ellipse cx="480" cy="68" rx="42" ry="14" />
                    <ellipse cx="420" cy="72" rx="30" ry="10" />
                </g>
                <g opacity="0.5">
                    <ellipse cx="350" cy="40" rx="44" ry="9" />
                </g>
            </g>

            {/* Birds */}
            <g fill="none" stroke="#3A3550" strokeWidth="1.2" strokeLinecap="round">
                <path d="M250,110 Q254,107 258,110 Q262,107 266,110" />
                <path d="M310,90 Q314,87 318,90 Q322,87 326,90" />
                <path d="M380,120 Q384,117 388,120 Q392,117 396,120" />
            </g>

            {/* Far hills */}
            <path d="M0,200 Q100,180 200,196 T400,194 T600,200 L600,300 L0,300 Z"
                  fill="#7A8A78" opacity="0.5" />
            {/* Mid hills */}
            <path d="M0,220 Q150,196 300,216 T600,212 L600,300 L0,300 Z"
                  fill="#4A6A4A" opacity="0.85" />

            {/* Castle on hill — silhouetted higher detail */}
            <path d="M150,260 Q300,200 450,260 L450,300 L150,300 Z" fill="#2F4530" />
            <g transform="translate(300,238)">
                {/* Outer wall */}
                <rect x="-105" y="-46" width="210" height="46" fill="url(#sc-eu-castle)" />
                {/* Crenellations top of wall */}
                <g fill="url(#sc-eu-castle)">
                    <rect x="-105" y="-54" width="8" height="8" />
                    <rect x="-91" y="-54" width="8" height="8" />
                    <rect x="-77" y="-54" width="8" height="8" />
                    <rect x="89" y="-54" width="8" height="8" />
                    <rect x="75" y="-54" width="8" height="8" />
                    <rect x="97" y="-54" width="8" height="8" />
                </g>
                {/* Side towers */}
                <rect x="-120" y="-86" width="32" height="86" fill="url(#sc-eu-castle)" />
                <rect x="88" y="-86" width="32" height="86" fill="url(#sc-eu-castle)" />
                <g fill="url(#sc-eu-castle)">
                    <rect x="-120" y="-94" width="6" height="8" />
                    <rect x="-110" y="-94" width="6" height="8" />
                    <rect x="-100" y="-94" width="6" height="8" />
                    <rect x="-90" y="-94" width="6" height="8" />
                    <rect x="88" y="-94" width="6" height="8" />
                    <rect x="98" y="-94" width="6" height="8" />
                    <rect x="108" y="-94" width="6" height="8" />
                    <rect x="118" y="-94" width="6" height="8" />
                </g>
                {/* Conical roofs on side towers */}
                <polygon points="-120,-94 -104,-114 -88,-94" fill="url(#sc-eu-roof)" />
                <polygon points="88,-94 104,-114 120,-94" fill="url(#sc-eu-roof)" />
                {/* Central keep */}
                <rect x="-26" y="-118" width="52" height="118" fill="url(#sc-eu-castle)" />
                <g fill="url(#sc-eu-castle)">
                    <rect x="-26" y="-126" width="7" height="8" />
                    <rect x="-15" y="-126" width="7" height="8" />
                    <rect x="-4" y="-126" width="7" height="8" />
                    <rect x="7" y="-126" width="7" height="8" />
                    <rect x="19" y="-126" width="7" height="8" />
                </g>
                {/* Keep roof */}
                <polygon points="-26,-126 0,-160 26,-126" fill="url(#sc-eu-roof)" />
                {/* Flag pole + waving banner */}
                <line x1="0" y1="-160" x2="0" y2="-180" stroke="#1A1410" strokeWidth="2" />
                <path d="M0,-178 Q8,-176 14,-178 Q10,-174 14,-170 Q8,-172 0,-170 Z" fill="#D02838">
                    <animate attributeName="d"
                             values="M0,-178 Q8,-176 14,-178 Q10,-174 14,-170 Q8,-172 0,-170 Z;
                                     M0,-178 Q8,-180 14,-176 Q10,-172 14,-172 Q8,-174 0,-170 Z;
                                     M0,-178 Q8,-176 14,-178 Q10,-174 14,-170 Q8,-172 0,-170 Z"
                             dur="2.5s" repeatCount="indefinite" />
                </path>
                {/* Drawbridge door */}
                <path d="M-14,-46 L-14,-8 Q-14,0 -8,0 L8,0 Q14,0 14,-8 L14,-46 Z" fill="#1A1208" />
                {/* Castle windows lit — with cross-mullion arches */}
                <g fill="#FFE08A">
                    <path d="M-107,-72 L-101,-72 L-101,-60 L-107,-60 Z">
                        <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" />
                    </path>
                    <line x1="-104" y1="-72" x2="-104" y2="-60" stroke="#5A4A40" strokeWidth="0.6" />
                    <line x1="-107" y1="-66" x2="-101" y2="-66" stroke="#5A4A40" strokeWidth="0.6" />
                </g>
                <g fill="#FFE08A">
                    <rect x="101" y="-72" width="6" height="12">
                        <animate attributeName="opacity" values="0.85;1;0.85" dur="4.5s" repeatCount="indefinite" />
                    </rect>
                    <line x1="104" y1="-72" x2="104" y2="-60" stroke="#5A4A40" strokeWidth="0.6" />
                    <line x1="101" y1="-66" x2="107" y2="-66" stroke="#5A4A40" strokeWidth="0.6" />
                </g>
                {/* Keep arched window */}
                <path d="M-4,-104 L4,-104 L4,-94 Q4,-90 0,-90 Q-4,-90 -4,-94 Z" fill="#FFE08A">
                    <animate attributeName="opacity" values="0.85;1;0.85" dur="3.5s" repeatCount="indefinite" />
                </path>
                <line x1="0" y1="-104" x2="0" y2="-91" stroke="#5A4A40" strokeWidth="0.6" />
                <line x1="-4" y1="-98" x2="4" y2="-98" stroke="#5A4A40" strokeWidth="0.6" />
                <rect x="-4" y="-78" width="8" height="14" fill="#FFE08A" opacity="0.75" />
                <rect x="-36" y="-30" width="6" height="14" fill="#FFE08A" opacity="0.8" />
                <rect x="30" y="-30" width="6" height="14" fill="#FFE08A" opacity="0.8" />
                {/* Drawbridge chains */}
                <line x1="-14" y1="-46" x2="-18" y2="-30" stroke="#1A1410" strokeWidth="1" />
                <line x1="14" y1="-46" x2="18" y2="-30" stroke="#1A1410" strokeWidth="1" />
            </g>

            {/* Moat — wide elliptical pond curving in front of the castle hill */}
            <ellipse cx="300" cy="282" rx="190" ry="14" fill="url(#sc-eu-moat)" />
            {/* Pond bank highlight (sun-side rim) */}
            <path d="M115,278 Q300,267 485,278" stroke="#3A5070" strokeWidth="1.2" fill="none" opacity="0.65" />
            <path d="M115,278 Q300,267 485,278" stroke="#FFE6C8" strokeWidth="0.6" fill="none" opacity="0.45" />
            {/* Castle reflection — faint inverted silhouette in the water */}
            <g opacity="0.32">
                <rect x="287" y="282" width="26" height="11" fill="#3A2030" />
                <polygon points="287,282 300,290 313,282" fill="#5A1818" />
                <rect x="277" y="282" width="6" height="10" fill="#3A2030" />
                <rect x="317" y="282" width="6" height="10" fill="#3A2030" />
            </g>
            {/* Subtle moat ripples — animated */}
            <g stroke="#A8C8E8" strokeWidth="0.8" opacity="0.45" fill="none">
                <path d="M170,282 Q210,280 250,282 T330,282 T410,282 T430,282">
                    <animate attributeName="opacity" values="0.25;0.55;0.25" dur="5s" repeatCount="indefinite" />
                </path>
                <path d="M195,289 Q235,287 275,289 T355,289 T395,289">
                    <animate attributeName="opacity" values="0.45;0.2;0.45" dur="6s" repeatCount="indefinite" />
                </path>
                <path d="M155,275 Q185,274 215,275">
                    <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4.5s" repeatCount="indefinite" />
                </path>
                <path d="M390,275 Q420,274 450,275">
                    <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4.8s" repeatCount="indefinite" />
                </path>
            </g>
            {/* Lily-pad highlight specks catching the warm light */}
            <g fill="#FFE6C8" opacity="0.5">
                <ellipse cx="210" cy="280" rx="3" ry="0.6" />
                <ellipse cx="340" cy="285" rx="4" ry="0.6" />
                <ellipse cx="395" cy="280" rx="3" ry="0.6" />
            </g>

            {/* Cypress trees flanking — layered foliage, trunks, highlights, base bushes */}
            <g>
                {/* Left cypress — tall */}
                <g transform="translate(80,260)">
                    <rect x="-2" y="22" width="4" height="14" fill="#2A1A14" />
                    <ellipse cx="0" cy="0" rx="11" ry="34" fill="#1A2A1A" />
                    <ellipse cx="-1" cy="-4" rx="8" ry="28" fill="#2A4022" />
                    <ellipse cx="-3" cy="-10" rx="5" ry="22" fill="#4A6028" opacity="0.55" />
                    <ellipse cx="3" cy="-2" rx="3" ry="18" fill="#0F1A0F" opacity="0.7" />
                    <ellipse cx="-2" cy="-26" rx="2.5" ry="6" fill="#7A8A38" opacity="0.5" />
                    {/* Texture flecks */}
                    <circle cx="-4" cy="-14" r="0.6" fill="#5A7028" opacity="0.5" />
                    <circle cx="2" cy="-8" r="0.6" fill="#5A7028" opacity="0.5" />
                    <circle cx="-1" cy="2" r="0.6" fill="#5A7028" opacity="0.4" />
                </g>
                {/* Left cypress — shorter */}
                <g transform="translate(102,266)">
                    <rect x="-2" y="20" width="4" height="11" fill="#2A1A14" />
                    <ellipse cx="0" cy="0" rx="8" ry="28" fill="#1A2A1A" />
                    <ellipse cx="-1" cy="-3" rx="6" ry="22" fill="#2A4022" />
                    <ellipse cx="3" cy="-2" rx="2.5" ry="14" fill="#0F1A0F" opacity="0.7" />
                    <ellipse cx="-1" cy="-20" rx="2" ry="5" fill="#7A8A38" opacity="0.45" />
                    <circle cx="-3" cy="-10" r="0.5" fill="#5A7028" opacity="0.5" />
                    <circle cx="1" cy="-4" r="0.5" fill="#5A7028" opacity="0.5" />
                </g>
                {/* Small foreground bush left */}
                <g transform="translate(135,294)">
                    <ellipse cx="0" cy="0" rx="10" ry="4" fill="#1A2A1A" />
                    <ellipse cx="-3" cy="-2" rx="6" ry="3" fill="#2A4022" />
                    <ellipse cx="4" cy="-1" rx="5" ry="2.5" fill="#2A4022" />
                    <circle cx="-3" cy="-3" r="0.9" fill="#FFE08A" opacity="0.65" />
                    <circle cx="3" cy="-2" r="0.8" fill="#FFA8C0" opacity="0.55" />
                </g>
                {/* Right cypress — shorter */}
                <g transform="translate(520,265)">
                    <rect x="-2" y="20" width="4" height="12" fill="#2A1A14" />
                    <ellipse cx="0" cy="0" rx="9" ry="30" fill="#1A2A1A" />
                    <ellipse cx="-1" cy="-3" rx="7" ry="24" fill="#2A4022" />
                    <ellipse cx="-3" cy="-8" rx="4" ry="18" fill="#4A6028" opacity="0.5" />
                    <ellipse cx="3" cy="-2" rx="2.5" ry="14" fill="#0F1A0F" opacity="0.7" />
                    <ellipse cx="-1" cy="-22" rx="2" ry="5" fill="#7A8A38" opacity="0.45" />
                    <circle cx="-3" cy="-12" r="0.6" fill="#5A7028" opacity="0.5" />
                    <circle cx="1" cy="-4" r="0.6" fill="#5A7028" opacity="0.5" />
                </g>
                {/* Right cypress — tall */}
                <g transform="translate(544,259)">
                    <rect x="-2" y="24" width="4" height="14" fill="#2A1A14" />
                    <ellipse cx="0" cy="0" rx="12" ry="36" fill="#1A2A1A" />
                    <ellipse cx="-1" cy="-4" rx="9" ry="30" fill="#2A4022" />
                    <ellipse cx="-3" cy="-10" rx="5" ry="22" fill="#4A6028" opacity="0.55" />
                    <ellipse cx="3" cy="-2" rx="3" ry="18" fill="#0F1A0F" opacity="0.7" />
                    <ellipse cx="-2" cy="-28" rx="2.5" ry="6" fill="#7A8A38" opacity="0.5" />
                    <circle cx="-4" cy="-16" r="0.6" fill="#5A7028" opacity="0.5" />
                    <circle cx="2" cy="-6" r="0.6" fill="#5A7028" opacity="0.5" />
                    <circle cx="-1" cy="4" r="0.6" fill="#5A7028" opacity="0.4" />
                </g>
                {/* Small foreground bush right */}
                <g transform="translate(470,294)">
                    <ellipse cx="0" cy="0" rx="10" ry="4" fill="#1A2A1A" />
                    <ellipse cx="-3" cy="-2" rx="6" ry="3" fill="#2A4022" />
                    <ellipse cx="4" cy="-1" rx="5" ry="2.5" fill="#2A4022" />
                    <circle cx="-3" cy="-3" r="0.9" fill="#FFE08A" opacity="0.65" />
                    <circle cx="3" cy="-2" r="0.8" fill="#FFA8C0" opacity="0.55" />
                </g>
            </g>

            {/* Distant farmhouse on far hill */}
            <g transform="translate(160,205)" fill="#5A4A40" opacity="0.7">
                <rect x="-6" y="-4" width="12" height="6" />
                <polygon points="-7,-4 0,-9 7,-4" fill="#7A2A2A" opacity="0.7" />
                <rect x="-1" y="-3" width="2" height="3" fill="#FFE08A" opacity="0.8" />
            </g>

            {/* Foreground grass tufts */}
            <g stroke="#2A4A28" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7">
                <path d="M40,300 L40,294 M44,300 L44,292 M48,300 L48,295" />
                <path d="M160,300 L160,294 M165,300 L165,292 M170,300 L170,295" />
                <path d="M255,300 L255,294 M260,300 L260,291 M265,300 L265,295" />
                <path d="M345,300 L345,295 M350,300 L350,292 M355,300 L355,295" />
                <path d="M450,300 L450,295 M455,300 L455,293 M460,300 L460,296" />
                <path d="M555,300 L555,294 M560,300 L560,292 M565,300 L565,295" />
            </g>
        </SceneWrap>
    );
}

// ---- North America — Mountain Forest --------------------------------------
function NorthAmerica() {
    return (
        <SceneWrap id="north_america">
            <defs>
                <linearGradient id="sc-na-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#F8D8A8" />
                    <Stop offset="35%" color="#E8B098" />
                    <Stop offset="70%" color="#A8B8D8" />
                    <Stop offset="100%" color="#4A6A98" />
                </linearGradient>
                <linearGradient id="sc-na-snow" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFFFFF" />
                    <Stop offset="40%" color="#E0E8F4" />
                    <Stop offset="100%" color="#4A5A78" />
                </linearGradient>
                <linearGradient id="sc-na-lake" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#5A7AA8" />
                    <Stop offset="100%" color="#1F2F4A" />
                </linearGradient>
                <radialGradient id="sc-na-sunsoft" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFF8E8" />
                    <Stop offset="100%" color="#E8B098" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-na-pine" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#0A1810" />
                    <Stop offset="100%" color="#040C08" />
                </linearGradient>
                <filter id="sc-na-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-na-sky)" />

            {/* Soft sun with lens flare */}
            <circle cx="500" cy="70" r="80" fill="url(#sc-na-sunsoft)" />
            <circle cx="500" cy="70" r="32" fill="#FFFCEC" opacity="0.7" filter="url(#sc-na-glow)" />
            <circle cx="500" cy="70" r="22" fill="#FFFCEC" opacity="0.95" />
            {/* Subtle flare streak */}
            <line x1="420" y1="70" x2="580" y2="70" stroke="#FFFCEC" strokeWidth="0.6" opacity="0.35" />
            <line x1="500" y1="20" x2="500" y2="120" stroke="#FFFCEC" strokeWidth="0.4" opacity="0.3" />

            {/* Distant haze ridges */}
            <path d="M0,160 L80,130 L160,160 L240,120 L320,160 L400,135 L480,160 L580,140 L600,155 L600,200 L0,200 Z"
                  fill="#7A8AB0" opacity="0.55" />

            {/* Main mountain range — multi-faceted with detailed snow */}
            <polygon points="-60,210 80,80 220,210" fill="url(#sc-na-snow)" />
            <polygon points="60,210 200,50 340,210" fill="url(#sc-na-snow)" />
            <polygon points="240,210 360,90 480,210" fill="url(#sc-na-snow)" />
            <polygon points="420,210 540,110 660,210" fill="url(#sc-na-snow)" />

            {/* Shadow facets */}
            <polygon points="80,80 80,200 -10,200" fill="#2A3A58" opacity="0.45" />
            <polygon points="200,50 200,210 80,210" fill="#2A3A58" opacity="0.4" />
            <polygon points="360,90 360,210 250,210" fill="#2A3A58" opacity="0.45" />
            <polygon points="540,110 540,210 430,210" fill="#2A3A58" opacity="0.4" />

            {/* Snow cap detail streaks */}
            <path d="M170,98 L200,50 L230,98 L222,108 L200,72 L178,108 Z" fill="#FFFFFF" opacity="0.95" />
            <path d="M338,128 L360,90 L382,128 L374,136 L360,108 L346,136 Z" fill="#FFFFFF" opacity="0.95" />
            <path d="M60,128 L80,80 L100,128 L92,134 L80,108 L68,134 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M520,148 L540,110 L560,148 L552,154 L540,128 L528,154 Z" fill="#FFFFFF" opacity="0.85" />

            {/* Eagle silhouette — refined wingspan */}
            <g transform="translate(360,120)" fill="#1F1A2A">
                <path d="M0,0 Q-8,-6 -18,-5 Q-26,-3 -32,1 Q-22,1 -14,0 Q-6,2 0,0 Q6,2 14,0 Q22,1 32,1 Q26,-3 18,-5 Q8,-6 0,0 Z" />
                <ellipse cx="0" cy="1" rx="3.5" ry="2.5" />
                <path d="M3,2 L8,5 L2,4 Z" />
                <animateTransform attributeName="transform" type="translate"
                                  values="360,120; 380,116; 360,120" dur="8s" repeatCount="indefinite" />
            </g>

            {/* Solid forest base — extends all the way down to meet the foreground ground; no lake gap, no mountain visible through any layer */}
            <rect y="172" width="600" height="90" fill="#152418" />
            {/* Far conifer ridge — tall continuous treeline that fully covers the mountain bases */}
            <path d="M0,170 L8,156 L16,172 L24,150 L32,170 L40,160 L48,174 L56,148 L64,170 L72,158 L80,174 L88,154 L96,170 L104,160 L112,174 L120,150 L128,170 L136,158 L144,174 L152,152 L160,170 L168,160 L176,174 L184,148 L192,170 L200,158 L208,174 L216,154 L224,170 L232,160 L240,174 L248,150 L256,170 L264,158 L272,174 L280,152 L288,170 L296,160 L304,174 L312,148 L320,170 L328,158 L336,174 L344,154 L352,170 L360,160 L368,174 L376,150 L384,170 L392,158 L400,174 L408,152 L416,170 L424,160 L432,174 L440,148 L448,170 L456,158 L464,174 L472,154 L480,170 L488,160 L496,174 L504,150 L512,170 L520,158 L528,174 L536,152 L544,170 L552,160 L560,174 L568,148 L576,170 L584,158 L592,174 L600,170 L600,262 L0,262 Z"
                  fill="#152518" />
            {/* Mid-tier treeline — darker layer in front for depth, also extends down to ground */}
            <path d="M0,194 L12,184 L24,198 L36,182 L48,196 L60,186 L72,200 L84,180 L96,196 L108,186 L120,198 L132,182 L144,196 L156,186 L168,200 L180,180 L192,196 L204,186 L216,198 L228,182 L240,196 L252,186 L264,200 L276,180 L288,196 L300,186 L312,198 L324,182 L336,196 L348,186 L360,200 L372,180 L384,196 L396,186 L408,198 L420,182 L432,196 L444,186 L456,200 L468,180 L480,196 L492,186 L504,198 L516,182 L528,196 L540,186 L552,200 L564,180 L576,196 L588,186 L600,196 L600,262 L0,262 Z"
                  fill="#0E1B11" />
            {/* Sharper near-foreground spikes — denser, more depth */}
            <g fill="#081308">
                <polygon points="20,200 30,180 40,200" />
                <polygon points="68,200 78,176 88,200" />
                <polygon points="118,200 128,180 138,200" />
                <polygon points="168,200 178,176 188,200" />
                <polygon points="218,200 228,178 238,200" />
                <polygon points="268,200 278,176 288,200" />
                <polygon points="318,200 328,180 338,200" />
                <polygon points="368,200 378,176 388,200" />
                <polygon points="418,200 428,180 438,200" />
                <polygon points="468,200 478,176 488,200" />
                <polygon points="518,200 528,178 538,200" />
                <polygon points="568,200 578,176 588,200" />
            </g>

            {/* Alpine lake — elliptical body of water nestled in the forest, shores wrap around the sides */}
            <ellipse cx="300" cy="242" rx="240" ry="20" fill="url(#sc-na-lake)" />
            {/* Lake far-shore highlight (top rim catching warm light) */}
            <path d="M68,236 Q300,222 532,236" stroke="#7A9ACC" strokeWidth="0.8" fill="none" opacity="0.55" />
            <path d="M68,236 Q300,222 532,236" stroke="#FFE6C8" strokeWidth="0.4" fill="none" opacity="0.4" />
            {/* Sun shimmer on the water — long bands, not triangular peaks */}
            <g fill="#FFFCEC" opacity="0.32">
                <ellipse cx="400" cy="244" rx="40" ry="1.4" />
                <ellipse cx="400" cy="250" rx="56" ry="1.2" />
                <ellipse cx="400" cy="256" rx="72" ry="1" />
            </g>
            {/* Water ripples — animated */}
            <g stroke="#A8C8E8" strokeWidth="0.8" opacity="0.5" fill="none">
                <path d="M100,248 Q140,246 180,248">
                    <animate attributeName="opacity" values="0.3;0.55;0.3" dur="5s" repeatCount="indefinite" />
                </path>
                <path d="M220,254 Q260,252 300,254">
                    <animate attributeName="opacity" values="0.5;0.25;0.5" dur="6s" repeatCount="indefinite" />
                </path>
                <path d="M340,250 Q380,248 420,250">
                    <animate attributeName="opacity" values="0.3;0.55;0.3" dur="5.5s" repeatCount="indefinite" />
                </path>
                <path d="M180,258 Q220,256 260,258">
                    <animate attributeName="opacity" values="0.4;0.2;0.4" dur="6.5s" repeatCount="indefinite" />
                </path>
            </g>

            {/* Foreground ground */}
            <rect y="262" width="600" height="38" fill="#0F2418" />

            {/* Foreground detailed pines — denser canopy with snow caps, branches and highlights */}
            <g fill="url(#sc-na-pine)">
                {/* Tree 1 */}
                <g transform="translate(40,262)">
                    <rect x="-3" y="-10" width="6" height="18" fill="#2A1408" />
                    <polygon points="0,-68 -14,-46 -7,-46 -16,-28 -8,-28 -18,-10 18,-10 8,-28 16,-28 7,-46 14,-46" />
                    <path d="M0,-68 L-4,-62 L0,-65 L4,-62 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-13,-46 L-7,-46 L-8,-43 Z" fill="#FFFFFF" opacity="0.7" />
                    <path d="M7,-46 L13,-46 L8,-43 Z" fill="#FFFFFF" opacity="0.7" />
                    <path d="M-10,-32 L-4,-36 L-2,-32 Z" fill="#1F3A22" opacity="0.55" />
                </g>
                {/* Tree 2 — small */}
                <g transform="translate(95,262)">
                    <rect x="-2" y="-6" width="4" height="12" fill="#2A1408" />
                    <polygon points="0,-50 -10,-34 -5,-34 -12,-20 -5,-20 -12,-6 12,-6 5,-20 12,-20 5,-34 10,-34" />
                    <path d="M0,-50 L-3,-45 L0,-47 L3,-45 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-9,-34 L-5,-34 L-6,-32 Z" fill="#FFFFFF" opacity="0.65" />
                    <path d="M5,-34 L9,-34 L6,-32 Z" fill="#FFFFFF" opacity="0.65" />
                </g>
                {/* Tree 3 */}
                <g transform="translate(150,262)">
                    <rect x="-3" y="-12" width="6" height="21" fill="#2A1408" />
                    <polygon points="0,-76 -16,-52 -8,-52 -18,-32 -10,-32 -20,-12 20,-12 10,-32 18,-32 8,-52 16,-52" />
                    <path d="M0,-76 L-5,-68 L0,-71 L5,-68 Z" fill="#FFFFFF" opacity="0.92" />
                    <path d="M-14,-52 L-8,-52 L-9,-49 Z" fill="#FFFFFF" opacity="0.72" />
                    <path d="M8,-52 L14,-52 L9,-49 Z" fill="#FFFFFF" opacity="0.72" />
                    <path d="M-12,-36 L-5,-40 L-3,-36 Z" fill="#1F3A22" opacity="0.55" />
                </g>
                {/* Tree 4 — small */}
                <g transform="translate(205,262)">
                    <rect x="-2" y="-6" width="4" height="13" fill="#2A1408" />
                    <polygon points="0,-52 -11,-36 -5,-36 -13,-20 -6,-20 -13,-6 13,-6 6,-20 13,-20 5,-36 11,-36" />
                    <path d="M0,-52 L-4,-46 L0,-48 L4,-46 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-9,-36 L-5,-36 L-7,-33 Z" fill="#FFFFFF" opacity="0.65" />
                    <path d="M5,-36 L9,-36 L7,-33 Z" fill="#FFFFFF" opacity="0.65" />
                </g>
                {/* Tree 5 — big center */}
                <g transform="translate(252,262)">
                    <rect x="-4" y="-14" width="8" height="25" fill="#2A1408" />
                    <polygon points="0,-88 -19,-60 -10,-60 -23,-38 -13,-38 -25,-14 25,-14 13,-38 23,-38 10,-60 19,-60" />
                    <path d="M0,-88 L-6,-78 L0,-82 L6,-78 Z" fill="#FFFFFF" opacity="0.95" />
                    <path d="M-17,-60 L-10,-60 L-12,-56 Z" fill="#FFFFFF" opacity="0.8" />
                    <path d="M10,-60 L17,-60 L12,-56 Z" fill="#FFFFFF" opacity="0.8" />
                    <path d="M-20,-38 L-13,-38 L-15,-34 Z" fill="#FFFFFF" opacity="0.6" />
                    <path d="M13,-38 L20,-38 L15,-34 Z" fill="#FFFFFF" opacity="0.6" />
                    <path d="M-14,-42 L-6,-48 L-4,-42 Z" fill="#1F3A22" opacity="0.5" />
                </g>
                {/* Tree 6 */}
                <g transform="translate(308,262)">
                    <rect x="-2.5" y="-8" width="5" height="16" fill="#2A1408" />
                    <polygon points="0,-58 -12,-40 -6,-40 -14,-24 -6,-24 -14,-8 14,-8 6,-24 14,-24 6,-40 12,-40" />
                    <path d="M0,-58 L-4,-52 L0,-54 L4,-52 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-10,-40 L-6,-40 L-8,-37 Z" fill="#FFFFFF" opacity="0.7" />
                    <path d="M6,-40 L10,-40 L8,-37 Z" fill="#FFFFFF" opacity="0.7" />
                </g>
                {/* Tree 7 — small */}
                <g transform="translate(358,262)">
                    <rect x="-2" y="-6" width="4" height="12" fill="#2A1408" />
                    <polygon points="0,-50 -10,-34 -5,-34 -12,-20 -5,-20 -12,-6 12,-6 5,-20 12,-20 5,-34 10,-34" />
                    <path d="M0,-50 L-3,-45 L0,-47 L3,-45 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-9,-34 L-5,-34 L-6,-32 Z" fill="#FFFFFF" opacity="0.65" />
                    <path d="M5,-34 L9,-34 L6,-32 Z" fill="#FFFFFF" opacity="0.65" />
                </g>
                {/* Tree 8 */}
                <g transform="translate(412,262)">
                    <rect x="-3.5" y="-12" width="7" height="22" fill="#2A1408" />
                    <polygon points="0,-80 -17,-56 -9,-56 -21,-34 -11,-34 -22,-12 22,-12 11,-34 21,-34 9,-56 17,-56" />
                    <path d="M0,-80 L-5,-72 L0,-75 L5,-72 Z" fill="#FFFFFF" opacity="0.93" />
                    <path d="M-15,-56 L-9,-56 L-11,-52 Z" fill="#FFFFFF" opacity="0.75" />
                    <path d="M9,-56 L15,-56 L11,-52 Z" fill="#FFFFFF" opacity="0.75" />
                    <path d="M-12,-38 L-5,-44 L-3,-38 Z" fill="#1F3A22" opacity="0.5" />
                </g>
                {/* Tree 9 — small */}
                <g transform="translate(465,262)">
                    <rect x="-2" y="-6" width="4" height="13" fill="#2A1408" />
                    <polygon points="0,-54 -11,-36 -5,-36 -13,-22 -6,-22 -13,-6 13,-6 6,-22 13,-22 5,-36 11,-36" />
                    <path d="M0,-54 L-4,-48 L0,-50 L4,-48 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-9,-36 L-5,-36 L-7,-33 Z" fill="#FFFFFF" opacity="0.65" />
                    <path d="M5,-36 L9,-36 L7,-33 Z" fill="#FFFFFF" opacity="0.65" />
                </g>
                {/* Tree 10 */}
                <g transform="translate(515,262)">
                    <rect x="-3" y="-10" width="6" height="18" fill="#2A1408" />
                    <polygon points="0,-70 -15,-48 -8,-48 -17,-28 -9,-28 -19,-10 19,-10 9,-28 17,-28 8,-48 15,-48" />
                    <path d="M0,-70 L-4,-63 L0,-66 L4,-63 Z" fill="#FFFFFF" opacity="0.92" />
                    <path d="M-13,-48 L-8,-48 L-9,-45 Z" fill="#FFFFFF" opacity="0.7" />
                    <path d="M8,-48 L13,-48 L9,-45 Z" fill="#FFFFFF" opacity="0.7" />
                    <path d="M-10,-32 L-3,-36 L-1,-32 Z" fill="#1F3A22" opacity="0.55" />
                </g>
                {/* Tree 11 */}
                <g transform="translate(565,262)">
                    <rect x="-2.5" y="-8" width="5" height="16" fill="#2A1408" />
                    <polygon points="0,-62 -13,-42 -6,-42 -15,-24 -7,-24 -15,-8 15,-8 7,-24 15,-24 6,-42 13,-42" />
                    <path d="M0,-62 L-4,-55 L0,-58 L4,-55 Z" fill="#FFFFFF" opacity="0.9" />
                    <path d="M-11,-42 L-6,-42 L-7,-39 Z" fill="#FFFFFF" opacity="0.7" />
                    <path d="M6,-42 L11,-42 L7,-39 Z" fill="#FFFFFF" opacity="0.7" />
                </g>
            </g>
        </SceneWrap>
    );
}

// ---- South America — Amazon Rainforest ------------------------------------
function SouthAmerica() {
    return (
        <SceneWrap id="south_america">
            <defs>
                <linearGradient id="sc-sa-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFE8B0" />
                    <Stop offset="40%" color="#F8C088" />
                    <Stop offset="80%" color="#A87858" />
                    <Stop offset="100%" color="#5A3820" />
                </linearGradient>
                <linearGradient id="sc-sa-water" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#6FB878" />
                    <Stop offset="100%" color="#0F3A20" />
                </linearGradient>
                <radialGradient id="sc-sa-sun" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFFEEC" />
                    <Stop offset="50%" color="#FFE8A8" opacity="0.85" />
                    <Stop offset="100%" color="#FFC247" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-sa-rays" x1="50%" y1="0%" x2="50%" y2="100%">
                    <Stop offset="0%" color="#FFFEEC" opacity="0.45" />
                    <Stop offset="100%" color="#FFFEEC" opacity="0" />
                </linearGradient>
                <filter id="sc-sa-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-sa-sky)" />

            {/* Sun through canopy gap with bloom */}
            <circle cx="320" cy="100" r="110" fill="url(#sc-sa-sun)" />
            <circle cx="320" cy="100" r="32" fill="#FFFEEC" opacity="0.75" filter="url(#sc-sa-glow)" />
            <circle cx="320" cy="100" r="22" fill="#FFFEEC">
                <animate attributeName="opacity" values="0.9;1;0.9" dur="4s" repeatCount="indefinite" />
            </circle>

            {/* Light rays — stronger god-rays */}
            <g opacity="0.75">
                <polygon points="320,100 260,300 280,300" fill="url(#sc-sa-rays)" />
                <polygon points="320,100 300,300 320,300" fill="url(#sc-sa-rays)" />
                <polygon points="320,100 340,300 360,300" fill="url(#sc-sa-rays)" />
                <polygon points="320,100 380,300 400,300" fill="url(#sc-sa-rays)" />
                <polygon points="320,100 420,300 440,300" fill="url(#sc-sa-rays)" opacity="0.5" />
                <polygon points="320,100 220,300 240,300" fill="url(#sc-sa-rays)" opacity="0.5" />
            </g>

            {/* Far canopy ridgeline */}
            <path d="M0,150 Q40,130 80,148 Q130,118 180,140 Q230,122 280,140 Q330,118 380,140 Q430,118 480,140 Q530,118 600,148 L600,200 L0,200 Z"
                  fill="#1F5A2F" opacity="0.7" />

            {/* Mid canopy — bunched lobes with highlights */}
            <g fill="#0F4A2A">
                <ellipse cx="40" cy="180" rx="90" ry="50" />
                <ellipse cx="160" cy="175" rx="80" ry="54" />
                <ellipse cx="260" cy="182" rx="70" ry="46" />
                <ellipse cx="500" cy="178" rx="90" ry="54" />
                <ellipse cx="590" cy="184" rx="70" ry="48" />
            </g>
            {/* Canopy highlights */}
            <g fill="#1F7A3F" opacity="0.55">
                <ellipse cx="40" cy="150" rx="40" ry="14" />
                <ellipse cx="160" cy="140" rx="38" ry="14" />
                <ellipse cx="500" cy="142" rx="42" ry="14" />
            </g>

            {/* Hero tree left */}
            <g>
                <path d="M88,170 Q92,210 92,250 L106,250 Q106,210 106,170 Z" fill="#2A1A0F" />
                <g fill="#0A2A18">
                    <ellipse cx="98" cy="155" rx="64" ry="36" />
                    <ellipse cx="78" cy="142" rx="38" ry="22" />
                    <ellipse cx="120" cy="142" rx="38" ry="22" />
                    <ellipse cx="98" cy="135" rx="28" ry="14" />
                </g>
                <g fill="#1F7A3F" opacity="0.5">
                    <ellipse cx="86" cy="135" rx="16" ry="6" />
                    <ellipse cx="116" cy="138" rx="14" ry="6" />
                </g>
                {/* Hanging vine */}
                <path d="M68,170 Q64,200 70,228" stroke="#2A4A28" strokeWidth="2" fill="none" />
                <circle cx="70" cy="230" r="3" fill="#FFB0D8" />
                <circle cx="65" cy="208" r="2" fill="#19A36B" />
                {/* Macaw on branch */}
                <g transform="translate(140,160)">
                    <ellipse cx="0" cy="0" rx="8" ry="5" fill="#D02838" />
                    <circle cx="-5" cy="-3" r="3.5" fill="#D02838" />
                    <ellipse cx="-8" cy="-2" rx="3" ry="1.5" fill="#1A1410" />
                    <circle cx="-5" cy="-4" r="0.8" fill="#FFFCEC" />
                    <path d="M2,2 L8,6 L4,8 Z" fill="#2058D0" />
                    <path d="M-3,1 Q-5,4 -1,5" fill="#FFD200" />
                </g>
            </g>

            {/* Hero tree right with toucan */}
            <g>
                <path d="M444,165 Q448,210 448,250 L464,250 Q464,210 464,165 Z" fill="#2A1A0F" />
                <g fill="#0A2A18">
                    <ellipse cx="454" cy="148" rx="68" ry="38" />
                    <ellipse cx="430" cy="134" rx="40" ry="24" />
                    <ellipse cx="484" cy="134" rx="40" ry="24" />
                    <ellipse cx="454" cy="125" rx="28" ry="14" />
                </g>
                <g fill="#1F7A3F" opacity="0.5">
                    <ellipse cx="440" cy="124" rx="16" ry="6" />
                    <ellipse cx="476" cy="126" rx="14" ry="6" />
                </g>
                {/* Branch */}
                <path d="M444,188 L410,184" stroke="#2A1A0F" strokeWidth="4" strokeLinecap="round" />
                {/* Refined toucan */}
                <g transform="translate(402,178)">
                    <ellipse cx="0" cy="0" rx="13" ry="10" fill="#1A1410" />
                    <circle cx="6" cy="-5" r="5" fill="#1A1410" />
                    {/* Bill */}
                    <path d="M10,-6 Q26,-10 30,-2 Q26,4 10,-1 Z" fill="#FF8A20" />
                    <path d="M10,-6 Q22,-9 26,-4" stroke="#D04A10" strokeWidth="0.6" fill="none" />
                    <ellipse cx="20" cy="-4" rx="3" ry="1.5" fill="#FFD200" />
                    {/* Eye patch */}
                    <ellipse cx="6" cy="-5" rx="2.5" ry="1.8" fill="#FFD8A8" />
                    <circle cx="6.5" cy="-5" r="1.2" fill="#1A1410" />
                    {/* Wing */}
                    <path d="M-3,-3 Q-10,3 -5,7 Z" fill="#19A36B" />
                    {/* Chest */}
                    <ellipse cx="2" cy="2" rx="6" ry="4" fill="#FFFCEC" />
                    {/* Tail */}
                    <path d="M-11,-2 L-19,3 L-11,5 Z" fill="#FFFCEC" />
                    {/* Feet — anchored inside body, splayed at tips */}
                    <path d="M-3,8 L-1,8 L-2,14 Z" fill="#FFD200" />
                    <path d="M2,8 L4,8 L3,14 Z" fill="#FFD200" />
                </g>
            </g>

            {/* River bank shoreline */}
            <path d="M0,250 Q150,240 300,252 Q450,244 600,250 L600,260 L0,260 Z" fill="#3A2410" />
            <path d="M0,254 Q150,248 300,256 Q450,250 600,254 L600,260 L0,260 Z" fill="#5A3818" opacity="0.6" />

            {/* River */}
            <rect y="258" width="600" height="42" fill="url(#sc-sa-water)" />

            {/* Caiman in water */}
            <g transform="translate(360,272)" fill="#0A2A18">
                <ellipse cx="0" cy="0" rx="32" ry="3" />
                <path d="M-22,-1 L-26,-3 L-18,-3 Z" />
                <path d="M-12,-2 L-14,-4 L-6,-4 Z" />
                <path d="M2,-2 L0,-4 L8,-4 Z" />
                <circle cx="20" cy="-2" r="1.2" fill="#FFC247" />
                <circle cx="24" cy="-2" r="1.2" fill="#FFC247" />
            </g>

            {/* Ripples */}
            <g stroke="#A8E5C8" strokeWidth="1" opacity="0.5" fill="none">
                <path d="M40,270 Q70,268 100,270" />
                <path d="M180,278 Q210,276 240,278" />
                <path d="M460,282 Q490,280 520,282" />
                <path d="M80,288 Q120,286 160,288" />
                <path d="M520,272 Q550,270 580,272" />
            </g>

            {/* Lily pads */}
            <g>
                <ellipse cx="120" cy="275" rx="14" ry="5" fill="#19A36B" />
                <path d="M120,275 L112,272" stroke="#0A2A18" strokeWidth="1" />
                <circle cx="118" cy="271" r="2.5" fill="#FFB0D8" />
                <ellipse cx="260" cy="284" rx="16" ry="6" fill="#19A36B" />
                <path d="M260,284 L250,280" stroke="#0A2A18" strokeWidth="1" />
                <circle cx="256" cy="280" r="2" fill="#FFD8E5" />
                <ellipse cx="500" cy="278" rx="13" ry="5" fill="#19A36B" />
                <circle cx="497" cy="276" r="2" fill="#FFFEEC" />
            </g>

            {/* Orchids on the canopy edge */}
            <g>
                <circle cx="220" cy="180" r="2.5" fill="#FFB0D8" />
                <circle cx="220" cy="180" r="1" fill="#FFFEEC" />
                <circle cx="340" cy="178" r="2.5" fill="#FFD0A8" />
                <circle cx="340" cy="178" r="1" fill="#FFFEEC" />
                <circle cx="560" cy="176" r="2.5" fill="#FFB0D8" />
                <circle cx="560" cy="176" r="1" fill="#FFFEEC" />
            </g>

            {/* Hummingbird hovering near sun rays */}
            <g transform="translate(280,140)">
                <ellipse cx="0" cy="0" rx="3.5" ry="2" fill="#19A36B" />
                <circle cx="3" cy="-1" r="1.6" fill="#19A36B" />
                <line x1="4.5" y1="-1" x2="9" y2="-1" stroke="#1A1410" strokeWidth="0.8" />
                {/* Wings — flickering */}
                <ellipse cx="-1" cy="-2" rx="5" ry="1.5" fill="#A8E5C8" opacity="0.6">
                    <animate attributeName="ry" values="1.5;0.5;1.5" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="-1" cy="2" rx="5" ry="1.5" fill="#A8E5C8" opacity="0.6">
                    <animate attributeName="ry" values="1.5;0.5;1.5" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
                {/* Tail */}
                <path d="M-3,0 L-7,-1 L-7,1 Z" fill="#19A36B" />
            </g>
        </SceneWrap>
    );
}

// ---- Oceania — Tropical Lagoon --------------------------------------------
function Oceania() {
    return (
        <SceneWrap id="oceania">
            <defs>
                <linearGradient id="sc-oc-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFE8B0" />
                    <Stop offset="30%" color="#FFA890" />
                    <Stop offset="65%" color="#E06AA0" />
                    <Stop offset="100%" color="#5A3F90" />
                </linearGradient>
                <linearGradient id="sc-oc-water" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#3F8AC8" />
                    <Stop offset="60%" color="#1F5F98" />
                    <Stop offset="100%" color="#0A2F58" />
                </linearGradient>
                <radialGradient id="sc-oc-sunhalo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFFAD8" />
                    <Stop offset="100%" color="#FFA890" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-oc-island" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#3A2A50" />
                    <Stop offset="100%" color="#1A1228" />
                </linearGradient>
                <filter id="sc-oc-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-oc-sky)" />

            {/* Sun with bloom */}
            <circle cx="320" cy="175" r="110" fill="url(#sc-oc-sunhalo)" />
            <circle cx="320" cy="175" r="48" fill="#FFFAD8" opacity="0.6" filter="url(#sc-oc-glow)" />
            <circle cx="320" cy="175" r="38" fill="#FFFAD8">
                <animate attributeName="r" values="38;44;38" dur="5s" repeatCount="indefinite" />
            </circle>
            {/* Distant V-formation birds */}
            <g fill="none" stroke="#3A2440" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
                <path d="M180,130 L186,127 L192,130" />
                <path d="M196,134 L202,131 L208,134" />
                <path d="M164,136 L170,133 L176,136" />
            </g>

            {/* Clouds */}
            <g fill="#FFFFFF" opacity="0.55">
                <ellipse cx="120" cy="50" rx="48" ry="9" />
                <ellipse cx="140" cy="42" rx="28" ry="7" />
                <ellipse cx="480" cy="60" rx="52" ry="10" />
                <ellipse cx="500" cy="50" rx="30" ry="8" />
            </g>

            {/* Sea horizon line + water */}
            <rect y="195" width="600" height="105" fill="url(#sc-oc-water)" />

            {/* Distant sail */}
            <g transform="translate(420,188)">
                <path d="M0,0 L0,-16 L8,0 Z" fill="#FFFFFF" opacity="0.95" />
                <path d="M0,0 L0,-22 L-2,0 Z" fill="#FFFFFF" opacity="0.95" />
                <path d="M-6,0 L8,0 L6,5 L-4,5 Z" fill="#3A2410" />
            </g>

            {/* Sun reflection on water — refined band */}
            <g fill="#FFFAD8" opacity="0.7">
                <ellipse cx="320" cy="200" rx="40" ry="3" />
                <ellipse cx="320" cy="215" rx="56" ry="2.5" />
                <ellipse cx="320" cy="230" rx="74" ry="2" />
                <ellipse cx="320" cy="250" rx="100" ry="1.8" />
                <ellipse cx="320" cy="272" rx="130" ry="1.4" />
            </g>

            {/* Foam waves — animated */}
            <g stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7">
                <path d="M0,240 Q50,236 100,240 T200,240 T300,240 T400,240 T500,240 T600,240">
                    <animate attributeName="d"
                             values="M0,240 Q50,236 100,240 T200,240 T300,240 T400,240 T500,240 T600,240;
                                     M0,240 Q50,244 100,240 T200,240 T300,240 T400,240 T500,240 T600,240;
                                     M0,240 Q50,236 100,240 T200,240 T300,240 T400,240 T500,240 T600,240"
                             dur="6s" repeatCount="indefinite" />
                </path>
                <path d="M0,265 Q60,260 120,265 T240,265 T360,265 T480,265 T600,265">
                    <animate attributeName="d"
                             values="M0,265 Q60,260 120,265 T240,265 T360,265 T480,265 T600,265;
                                     M0,265 Q60,270 120,265 T240,265 T360,265 T480,265 T600,265;
                                     M0,265 Q60,260 120,265 T240,265 T360,265 T480,265 T600,265"
                             dur="7s" repeatCount="indefinite" />
                </path>
            </g>

            {/* Distant smaller island */}
            <ellipse cx="500" cy="218" rx="50" ry="8" fill="#2A2440" opacity="0.85" />
            <g transform="translate(495,218)" fill="#1F1A2A" opacity="0.85">
                <path d="M-2,0 Q-4,-18 -1,-32 Q2,-18 2,0 Z" />
                <path d="M0,-32 Q-12,-38 -22,-32 Q-10,-46 0,-36 Z" />
                <path d="M0,-32 Q12,-38 22,-32 Q10,-46 0,-36 Z" />
            </g>

            {/* Main island — left, with gradient depth */}
            <ellipse cx="110" cy="228" rx="100" ry="14" fill="url(#sc-oc-island)" />
            <ellipse cx="110" cy="220" rx="70" ry="6" fill="#3A2A50" />
            {/* Starfish on the sand */}
            <g transform="translate(150,222)" fill="#FF8A70">
                <path d="M0,-4 L1,-1 L4,-1 L1.5,1 L2.5,4 L0,2 L-2.5,4 L-1.5,1 L-4,-1 L-1,-1 Z" />
            </g>
            {/* Beach plant cluster */}
            <g transform="translate(60,223)" stroke="#1A0F0A" strokeWidth="1" fill="none" strokeLinecap="round">
                <path d="M0,0 Q-2,-4 -4,-7" />
                <path d="M0,0 Q0,-4 0,-8" />
                <path d="M0,0 Q2,-4 4,-7" />
            </g>

            {/* Palm tree — curved trunk with detailed fronds */}
            <g transform="translate(95,220)">
                <path d="M-4,0 Q-14,-25 -10,-50 Q-6,-70 0,-78 L4,-78 Q-2,-70 -6,-50 Q-10,-25 4,0 Z" fill="#1A0F0A" />
                {/* Detailed fronds */}
                <g transform="translate(0,-78)" fill="#0A2A14">
                    {/* Left fronds */}
                    <path d="M0,0 Q-20,-2 -38,4 Q-30,-6 -18,-10 Q-8,-12 0,-8 Z" />
                    <path d="M0,0 Q-22,-12 -42,-18 Q-32,-22 -16,-18 Q-6,-14 0,-6 Z" />
                    <path d="M0,0 Q-12,-18 -22,-32 Q-12,-28 -4,-16 Q-2,-8 0,-4 Z" />
                    {/* Right fronds */}
                    <path d="M0,0 Q20,-2 38,4 Q30,-6 18,-10 Q8,-12 0,-8 Z" />
                    <path d="M0,0 Q22,-12 42,-18 Q32,-22 16,-18 Q6,-14 0,-6 Z" />
                    <path d="M0,0 Q12,-18 22,-32 Q12,-28 4,-16 Q2,-8 0,-4 Z" />
                    {/* Center front */}
                    <path d="M0,0 Q-4,-8 0,-18 Q4,-8 0,0 Z" />
                </g>
                {/* Coconuts */}
                <circle cx="-3" cy="-74" r="3" fill="#3A2410" />
                <circle cx="3" cy="-74" r="3" fill="#3A2410" />
                <circle cx="0" cy="-72" r="2.5" fill="#3A2410" />
                {/* Frond highlights */}
                <g transform="translate(0,-78)" fill="#1F7A3F" opacity="0.55">
                    <path d="M0,0 Q-14,-4 -28,0 Q-18,-6 0,-6 Z" />
                    <path d="M0,0 Q14,-4 28,0 Q18,-6 0,-6 Z" />
                </g>
            </g>

            {/* Beach foam at island edge */}
            <ellipse cx="110" cy="240" rx="80" ry="3" fill="#FFFFFF" opacity="0.6" />

            {/* Tropical bird */}
            <g fill="none" stroke="#1A1410" strokeWidth="1.2" strokeLinecap="round">
                <path d="M250,80 Q254,76 258,80 Q262,76 266,80" />
                <path d="M280,100 Q284,96 288,100 Q292,96 296,100" />
            </g>
        </SceneWrap>
    );
}

// ---- Antarctica — Aurora Borealis -----------------------------------------
function Antarctica() {
    return (
        <SceneWrap id="antarctica">
            <defs>
                <linearGradient id="sc-an-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#080A1A" />
                    <Stop offset="60%" color="#152040" />
                    <Stop offset="100%" color="#2A3560" />
                </linearGradient>
                <linearGradient id="sc-an-aurora-g" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#7FFF3F" opacity="0" />
                    <Stop offset="40%" color="#19E37D" opacity="0.85" />
                    <Stop offset="70%" color="#5BAEE0" opacity="0.6" />
                    <Stop offset="100%" color="#A858E8" opacity="0" />
                </linearGradient>
                <linearGradient id="sc-an-aurora-p" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FF8AC8" opacity="0" />
                    <Stop offset="50%" color="#C858E8" opacity="0.7" />
                    <Stop offset="100%" color="#3F58D0" opacity="0" />
                </linearGradient>
                <linearGradient id="sc-an-water" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#102040" />
                    <Stop offset="100%" color="#050818" />
                </linearGradient>
                <linearGradient id="sc-an-ice" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#E8F4FF" />
                    <Stop offset="100%" color="#7AAAE0" />
                </linearGradient>
                <filter id="sc-an-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="10" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-an-sky)" />

            {/* Stars — twinkling */}
            <g fill="#FFFFFF">
                <circle cx="60" cy="40" r="1.4">
                    <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="140" cy="70" r="0.8" />
                <circle cx="220" cy="30" r="1.5">
                    <animate attributeName="opacity" values="1;0.4;1" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="280" cy="55" r="1" />
                <circle cx="360" cy="25" r="1.2">
                    <animate attributeName="opacity" values="1;0.5;1" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="440" cy="60" r="0.8" />
                <circle cx="520" cy="30" r="1.4">
                    <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="580" cy="50" r="1" />
                <circle cx="100" cy="120" r="0.8" />
                <circle cx="180" cy="140" r="0.7" />
                <circle cx="320" cy="100" r="0.9" />
                <circle cx="400" cy="135" r="0.7" />
                <circle cx="500" cy="110" r="1">
                    <animate attributeName="opacity" values="1;0.4;1" dur="3.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="40" cy="180" r="0.6" />
                <circle cx="560" cy="160" r="0.7" />
            </g>

            {/* Shooting star */}
            <line x1="80" y1="50" x2="120" y2="80" stroke="#FFFFFF" strokeWidth="1" opacity="0">
                <animate attributeName="opacity" values="0;1;0" dur="6s" begin="2s" repeatCount="indefinite" />
            </line>

            {/* Aurora curtains — soft-blurred glow layer */}
            <g filter="url(#sc-an-blur)" opacity="0.6">
                <path d="M0,0 Q120,80 80,200 L20,200 Z" fill="#19E37D" />
                <path d="M340,0 Q440,90 400,200 L320,200 Z" fill="#C858E8" />
                <path d="M500,0 Q580,100 560,210 L480,210 Z" fill="#19E37D" />
            </g>
            {/* Aurora curtains — sharper ribbons over the glow */}
            <g>
                <path d="M-20,0 Q120,80 80,200 Q60,250 40,300 L-20,300 Z" fill="url(#sc-an-aurora-g)">
                    <animate attributeName="opacity" values="0.85;1;0.7;0.85" dur="8s" repeatCount="indefinite" />
                </path>
                <path d="M160,0 Q260,80 220,210 Q200,260 190,300 L100,300 Q150,200 160,0 Z"
                      fill="url(#sc-an-aurora-g)">
                    <animate attributeName="opacity" values="0.8;0.5;0.95;0.8" dur="10s" repeatCount="indefinite" />
                </path>
                <path d="M340,0 Q440,90 400,200 Q380,260 370,300 L290,300 Q330,180 340,0 Z"
                      fill="url(#sc-an-aurora-p)">
                    <animate attributeName="opacity" values="0.6;0.9;0.5;0.6" dur="9s" repeatCount="indefinite" />
                </path>
                <path d="M500,0 Q580,100 560,210 Q540,260 520,300 L460,300 Q490,180 500,0 Z"
                      fill="url(#sc-an-aurora-g)">
                    <animate attributeName="opacity" values="0.55;0.8;0.6;0.55" dur="11s" repeatCount="indefinite" />
                </path>
            </g>

            {/* Aurora-tinted snow line glow */}
            <ellipse cx="300" cy="235" rx="380" ry="14" fill="#19E37D" opacity="0.18" />

            {/* Ocean */}
            <rect y="240" width="600" height="60" fill="url(#sc-an-water)" />

            {/* Aurora reflection on water */}
            <g opacity="0.35">
                <path d="M40,240 Q60,250 80,240 L80,260 Q60,256 40,260 Z" fill="#19E37D" />
                <path d="M200,240 Q220,254 240,240 L240,262 Q220,258 200,262 Z" fill="#19E37D" />
                <path d="M380,240 Q400,252 420,240 L420,260 Q400,256 380,260 Z" fill="#C858E8" />
                <path d="M540,240 Q560,250 580,240 L580,258 Q560,254 540,258 Z" fill="#19E37D" />
            </g>

            {/* Icebergs — more facets with edge highlights */}
            <g>
                {/* Iceberg 1 */}
                <polygon points="0,250 30,215 60,228 100,205 130,250" fill="url(#sc-an-ice)" />
                <polygon points="30,250 60,228 80,250" fill="#5A8AC0" opacity="0.6" />
                <polyline points="30,215 60,228 100,205" fill="none" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.7" />
                {/* Iceberg 2 */}
                <polygon points="160,255 200,225 230,236 270,215 300,255" fill="url(#sc-an-ice)" />
                <polygon points="200,255 230,236 250,255" fill="#5A8AC0" opacity="0.6" />
                <polyline points="200,225 230,236 270,215" fill="none" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.7" />
                {/* Iceberg 3 big */}
                <polygon points="350,254 400,200 440,230 490,212 540,254" fill="url(#sc-an-ice)" />
                <polygon points="400,254 440,230 460,254" fill="#5A8AC0" opacity="0.65" />
                <polyline points="400,200 440,230 490,212" fill="none" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.8" />
                {/* Iceberg 4 */}
                <polygon points="510,256 560,222 600,256" fill="url(#sc-an-ice)" />
                <polygon points="540,256 560,222 580,256" fill="#5A8AC0" opacity="0.55" />
                <polyline points="510,256 560,222 600,256" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6" />
            </g>

            {/* Whale spout — far behind icebergs */}
            <g transform="translate(280,228)" opacity="0.85">
                <line x1="0" y1="0" x2="0" y2="-12" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" />
                <ellipse cx="0" cy="-14" rx="3" ry="2" fill="#FFFFFF" opacity="0.5">
                    <animate attributeName="opacity" values="0;0.6;0" dur="5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="-2" cy="-10" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.5">
                    <animate attributeName="opacity" values="0;0.5;0" dur="5s" begin="0.3s" repeatCount="indefinite" />
                </ellipse>
            </g>

            {/* Whale tail breaching distance */}
            <g transform="translate(300,265)" fill="#0A1020">
                <path d="M0,0 Q-2,-10 -8,-14 Q-2,-12 0,-8 Q2,-12 8,-14 Q2,-10 0,0 Z" />
                <ellipse cx="0" cy="2" rx="14" ry="2" fill="#FFFFFF" opacity="0.4" />
            </g>

            {/* Penguins — refined silhouettes */}
            <g transform="translate(80,278)">
                {/* Adult 1 */}
                <g transform="translate(0,0)">
                    <ellipse cx="0" cy="-8" rx="6" ry="10" fill="#0A1020" />
                    <circle cx="0" cy="-18" r="4" fill="#0A1020" />
                    <ellipse cx="0" cy="-6" rx="3" ry="7" fill="#E8F4FF" />
                    <path d="M0,-19 L4,-17 L0,-16 Z" fill="#FFC247" />
                    <path d="M-3.5,0 L-0.5,0 L-2,4 Z" fill="#FFC247" />
                    <path d="M0.5,0 L3.5,0 L2,4 Z" fill="#FFC247" />
                </g>
                {/* Adult 2 */}
                <g transform="translate(16,2)">
                    <ellipse cx="0" cy="-8" rx="5" ry="9" fill="#0A1020" />
                    <circle cx="0" cy="-16" r="3.5" fill="#0A1020" />
                    <ellipse cx="0" cy="-6" rx="2.5" ry="6" fill="#E8F4FF" />
                    <path d="M0,-17 L3,-15 L0,-14 Z" fill="#FFC247" />
                </g>
                {/* Baby */}
                <g transform="translate(28,4)">
                    <ellipse cx="0" cy="-5" rx="3.5" ry="6" fill="#5A6A8A" />
                    <circle cx="0" cy="-11" r="2.5" fill="#5A6A8A" />
                    <ellipse cx="0" cy="-4" rx="1.8" ry="4" fill="#E8F4FF" />
                </g>
            </g>

            {/* Snow flurry — gentle animated flakes */}
            <g fill="#FFFFFF">
                <circle cx="80" cy="30" r="1">
                    <animate attributeName="cy" values="0;300" dur="20s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.8;0.8;0" dur="20s" repeatCount="indefinite" />
                </circle>
                <circle cx="220" cy="50" r="1.2">
                    <animate attributeName="cy" values="0;300" dur="22s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.8;0.8;0" dur="22s" repeatCount="indefinite" />
                </circle>
                <circle cx="380" cy="20" r="1">
                    <animate attributeName="cy" values="0;300" dur="25s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.8;0.8;0" dur="25s" repeatCount="indefinite" />
                </circle>
                <circle cx="500" cy="90" r="0.8">
                    <animate attributeName="cy" values="0;300" dur="18s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.8;0.8;0" dur="18s" repeatCount="indefinite" />
                </circle>
            </g>
        </SceneWrap>
    );
}

// ---- Reptile Kingdom — Atlas Pass capstone --------------------------------
// A moonlit jungle temple deep in the swamp: layered rainforest canopy, a
// great overgrown stone ziggurat lit from within, and the kingdom's reptiles
// — crocodile, serpent, gecko, tortoise (and a dragon crossing the moon) —
// as crisp silhouettes with amber eye-glow against cool green moonlight.
function Reptile() {
    return (
        <SceneWrap id="bp_reptile">
            <defs>
                <linearGradient id="sc-rp-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#15301F" />
                    <Stop offset="38%" color="#0E2317" />
                    <Stop offset="72%" color="#0A1A11" />
                    <Stop offset="100%" color="#050E0A" />
                </linearGradient>
                <radialGradient id="sc-rp-moonhalo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#EAF6DC" opacity="0.85" />
                    <Stop offset="45%" color="#A8D078" opacity="0.45" />
                    <Stop offset="100%" color="#19C37D" opacity="0" />
                </radialGradient>
                <radialGradient id="sc-rp-moonbody" cx="42%" cy="38%" r="62%">
                    <Stop offset="0%" color="#F4FCE8" />
                    <Stop offset="65%" color="#CFEDB4" />
                    <Stop offset="100%" color="#97CB82" />
                </radialGradient>
                <radialGradient id="sc-rp-mist" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#3FD89A" opacity="0.5" />
                    <Stop offset="100%" color="#19C37D" opacity="0" />
                </radialGradient>
                <radialGradient id="sc-rp-doorglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFE2A0" />
                    <Stop offset="55%" color="#FFB23F" opacity="0.7" />
                    <Stop offset="100%" color="#FF8A1F" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-rp-stone" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#3C5240" />
                    <Stop offset="55%" color="#26382B" />
                    <Stop offset="100%" color="#15231A" />
                </linearGradient>
                <linearGradient id="sc-rp-stair" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#46604A" />
                    <Stop offset="100%" color="#1C2C20" />
                </linearGradient>
                <linearGradient id="sc-rp-water" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#123226" />
                    <Stop offset="55%" color="#0A1C14" />
                    <Stop offset="100%" color="#04100B" />
                </linearGradient>
                <linearGradient id="sc-rp-snake" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#33824A" />
                    <Stop offset="100%" color="#143A22" />
                </linearGradient>
                <filter id="sc-rp-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="7" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-rp-sky)" />

            {/* Soft moonlight bloom into the sky */}
            <circle cx="468" cy="92" r="150" fill="url(#sc-rp-mist)" opacity="0.55" />

            {/* Star field — faint, a few twinkling */}
            <g fill="#CFE8D8">
                <circle cx="40" cy="34" r="1.1">
                    <animate attributeName="opacity" values="1;0.3;1" dur="3.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="96" cy="60" r="0.8" />
                <circle cx="150" cy="30" r="1.3">
                    <animate attributeName="opacity" values="1;0.4;1" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="208" cy="54" r="0.9" />
                <circle cx="250" cy="32" r="1.1">
                    <animate attributeName="opacity" values="1;0.45;1" dur="3.1s" repeatCount="indefinite" />
                </circle>
                <circle cx="120" cy="100" r="0.7" />
                <circle cx="64" cy="120" r="0.9">
                    <animate attributeName="opacity" values="1;0.4;1" dur="3.7s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="110" r="0.7" />
                <circle cx="350" cy="40" r="0.9" />
                <circle cx="392" cy="70" r="0.7" />
                <circle cx="540" cy="30" r="1.1">
                    <animate attributeName="opacity" values="1;0.35;1" dur="2.9s" repeatCount="indefinite" />
                </circle>
                <circle cx="584" cy="56" r="0.8" />
            </g>

            {/* Moon — bloom halo, soft glow, body + craters */}
            <circle cx="468" cy="76" r="96" fill="url(#sc-rp-moonhalo)" />
            <circle cx="468" cy="76" r="40" fill="#CDEBB2" opacity="0.55" filter="url(#sc-rp-glow)" />
            <circle cx="468" cy="76" r="33" fill="url(#sc-rp-moonbody)">
                <animate attributeName="opacity" values="0.92;1;0.92" dur="7s" repeatCount="indefinite" />
            </circle>
            <g fill="#8FBE79" opacity="0.45">
                <circle cx="474" cy="70" r="4" />
                <circle cx="483" cy="84" r="2.6" />
                <circle cx="461" cy="86" r="3" />
                <circle cx="458" cy="68" r="2" />
            </g>

            {/* Dragon crossing the moon */}
            <g transform="translate(452,96)" fill="#05100A">
                <animateTransform attributeName="transform" type="translate"
                                  values="452,96; 430,86; 452,96" dur="9s" repeatCount="indefinite" />
                <path d="M-22,2 Q-40,6 -54,16 Q-46,10 -30,6 Q-26,4 -22,0 Z" />
                <path d="M-54,16 L-64,12 L-57,18 L-64,23 L-55,20 Z" />
                <ellipse cx="0" cy="0" rx="22" ry="6" />
                <path d="M-6,-2 Q-18,-20 -32,-26 Q-24,-18 -16,-10 Q-10,-5 -4,-3 Z" opacity="0.7" />
                <path d="M-2,-2 Q-14,-24 -32,-32 Q-22,-22 -14,-12 L-22,-20 Q-10,-10 -4,-4 L-9,-14 Q0,-6 6,0 Z" />
                <path d="M18,-2 Q30,-7 40,-9 Q49,-9 51,-4 Q46,-2 36,-2 Q27,1 20,4 Z" />
                <line x1="46" y1="-9" x2="51" y2="-16" stroke="#05100A" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="40" y1="-9" x2="42" y2="-15" stroke="#05100A" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="44" cy="-7" r="1.2" fill="#FFC247">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
            </g>

            {/* Far canopy ridges — distant haze */}
            <path d="M0,158 Q80,138 160,154 T320,150 T480,152 T600,156 L600,210 L0,210 Z"
                  fill="#0C2014" opacity="0.5" />
            <path d="M0,172 Q70,150 150,166 T300,162 T450,166 T600,170 L600,210 L0,210 Z"
                  fill="#0A1B11" opacity="0.85" />

            {/* Mid canopy — bunched treetops with moonlit rim */}
            <g fill="#0B2215">
                <ellipse cx="30" cy="186" rx="80" ry="44" />
                <ellipse cx="120" cy="178" rx="70" ry="46" />
                <ellipse cx="210" cy="190" rx="66" ry="40" />
                <ellipse cx="410" cy="188" rx="64" ry="40" />
                <ellipse cx="500" cy="180" rx="84" ry="48" />
                <ellipse cx="585" cy="186" rx="70" ry="46" />
            </g>
            <g fill="#2F7A4F" opacity="0.4">
                <ellipse cx="510" cy="150" rx="40" ry="10" />
                <ellipse cx="120" cy="150" rx="34" ry="9" />
                <ellipse cx="420" cy="160" rx="30" ry="8" />
            </g>
            {/* Emergent trees poking above the canopy */}
            <g fill="#081710">
                <g transform="translate(70,165)">
                    <rect x="-2" y="0" width="4" height="40" />
                    <ellipse cx="0" cy="-6" rx="20" ry="16" />
                    <ellipse cx="-12" cy="2" rx="12" ry="10" />
                    <ellipse cx="12" cy="2" rx="12" ry="10" />
                </g>
                <g transform="translate(540,158)">
                    <rect x="-2" y="0" width="4" height="48" />
                    <ellipse cx="0" cy="-8" rx="22" ry="17" />
                    <ellipse cx="-13" cy="2" rx="13" ry="10" />
                    <ellipse cx="13" cy="2" rx="13" ry="10" />
                </g>
            </g>

            {/* Hanging vines framing the sides */}
            <g stroke="#0F2A18" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M40,150 Q38,185 44,220" />
                <path d="M150,140 Q154,180 148,214" />
                <path d="M470,150 Q472,185 466,222" />
                <path d="M560,140 Q562,180 556,212" />
            </g>
            <g fill="#1F4A2A">
                <ellipse cx="44" cy="192" rx="4" ry="2" />
                <ellipse cx="41" cy="176" rx="3" ry="1.6" />
                <ellipse cx="149" cy="186" rx="4" ry="2" />
                <ellipse cx="467" cy="194" rx="4" ry="2" />
                <ellipse cx="557" cy="184" rx="4" ry="2" />
                <ellipse cx="560" cy="166" rx="3" ry="1.6" />
            </g>

            {/* ===== Hero temple — overgrown stone ziggurat ===== */}
            <g transform="translate(300,248)">
                {/* warm sanctum glow behind the doorway */}
                <ellipse cx="0" cy="-128" rx="46" ry="40" fill="url(#sc-rp-doorglow)">
                    <animate attributeName="opacity" values="0.75;1;0.75" dur="4.5s" repeatCount="indefinite" />
                </ellipse>

                {/* stepped tiers */}
                <g fill="url(#sc-rp-stone)">
                    <polygon points="-94,0 94,0 80,-34 -80,-34" />
                    <polygon points="-78,-34 78,-34 64,-66 -64,-66" />
                    <polygon points="-62,-66 62,-66 48,-96 -48,-96" />
                    <polygon points="-46,-96 46,-96 36,-120 -36,-120" />
                </g>
                {/* left faces in shadow */}
                <g fill="#0C1812" opacity="0.4">
                    <polygon points="-80,-34 -10,-34 -8,0 -94,0" />
                    <polygon points="-64,-66 -8,-66 -8,-34 -78,-34" />
                    <polygon points="-48,-96 -6,-96 -6,-66 -62,-66" />
                    <polygon points="-36,-120 -4,-120 -4,-96 -46,-96" />
                </g>
                {/* moonlit right edges + lit top ledges */}
                <g stroke="#5C7A5E" strokeWidth="1.2" opacity="0.5" fill="none" strokeLinecap="round">
                    <path d="M94,0 L80,-34" />
                    <path d="M78,-34 L64,-66" />
                    <path d="M62,-66 L48,-96" />
                    <path d="M46,-96 L36,-120" />
                </g>
                <g stroke="#4A6650" strokeWidth="1" opacity="0.45" fill="none">
                    <path d="M-80,-34 L80,-34" />
                    <path d="M-64,-66 L64,-66" />
                    <path d="M-48,-96 L48,-96" />
                </g>

                {/* central staircase */}
                <polygon points="-14,0 -11,-120 11,-120 14,0" fill="url(#sc-rp-stair)" />
                <g stroke="#16241A" strokeWidth="1" opacity="0.7">
                    <line x1="-13.4" y1="-12" x2="13.4" y2="-12" />
                    <line x1="-12.8" y1="-24" x2="12.8" y2="-24" />
                    <line x1="-12.2" y1="-36" x2="12.2" y2="-36" />
                    <line x1="-11.6" y1="-48" x2="11.6" y2="-48" />
                    <line x1="-11" y1="-60" x2="11" y2="-60" />
                    <line x1="-10.4" y1="-72" x2="10.4" y2="-72" />
                    <line x1="-9.8" y1="-84" x2="9.8" y2="-84" />
                    <line x1="-9.2" y1="-96" x2="9.2" y2="-96" />
                    <line x1="-8.6" y1="-108" x2="8.6" y2="-108" />
                </g>

                {/* serpent balustrades + carved heads at the foot */}
                <g fill="#1B2C20">
                    <path d="M-16,0 L-13,-120 L-9,-120 L-12,0 Z" />
                    <path d="M16,0 L13,-120 L9,-120 L12,0 Z" />
                </g>
                <g fill="#26382B">
                    <path d="M-16,0 Q-30,-2 -34,8 Q-30,12 -20,10 Q-14,8 -14,2 Z" />
                    <path d="M16,0 Q30,-2 34,8 Q30,12 20,10 Q14,8 14,2 Z" />
                </g>
                <g fill="#FFC247">
                    <circle cx="-27" cy="4" r="1.4">
                        <animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="27" cy="4" r="1.4">
                        <animate attributeName="opacity" values="0.7;1;0.7" dur="3.4s" repeatCount="indefinite" />
                    </circle>
                </g>

                {/* shrine + glowing doorway */}
                <rect x="-30" y="-150" width="60" height="30" fill="url(#sc-rp-stone)" />
                <rect x="-30" y="-150" width="14" height="30" fill="#0C1812" opacity="0.4" />
                <path d="M-12,-120 L-12,-142 Q-12,-148 -6,-148 L6,-148 Q12,-148 12,-142 L12,-120 Z" fill="#1A0E04" />
                <path d="M-9,-120 L-9,-141 Q-9,-145 -5,-145 L5,-145 Q9,-145 9,-141 L9,-120 Z" fill="#FFC247">
                    <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" />
                </path>
                <rect x="-4" y="-138" width="8" height="18" fill="#FFE9B0" opacity="0.9" />
                {/* roof comb */}
                <polygon points="-34,-150 34,-150 24,-162 -24,-162" fill="url(#sc-rp-stone)" />
                <rect x="-6" y="-176" width="12" height="16" fill="#26382B" />
                <polygon points="-10,-176 10,-176 0,-188" fill="#26382B" />
                <circle cx="0" cy="-168" r="2.4" fill="#FFC247">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="3.6s" repeatCount="indefinite" />
                </circle>

                {/* carved glyph eyes */}
                <g fill="#FFC247">
                    <ellipse cx="-34" cy="-50" rx="2.6" ry="1.8">
                        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="34" cy="-50" rx="2.6" ry="1.8">
                        <animate attributeName="opacity" values="0.5;1;0.5" dur="3.4s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="-26" cy="-80" rx="2.2" ry="1.6">
                        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="26" cy="-80" rx="2.2" ry="1.6">
                        <animate attributeName="opacity" values="0.6;1;0.6" dur="3.1s" repeatCount="indefinite" />
                    </ellipse>
                </g>

                {/* vines overgrowing the stone */}
                <g stroke="#1F4A2A" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.9">
                    <path d="M-80,-34 Q-72,-20 -82,-2" />
                    <path d="M70,-34 Q78,-18 70,0" />
                    <path d="M-48,-96 Q-40,-86 -50,-70 Q-44,-58 -52,-44" />
                    <path d="M44,-96 Q52,-82 44,-66" />
                </g>
                <g fill="#1F4A2A">
                    <ellipse cx="-82" cy="-10" rx="3.5" ry="1.8" />
                    <ellipse cx="72" cy="-12" rx="3.5" ry="1.8" />
                    <ellipse cx="-51" cy="-52" rx="3" ry="1.6" />
                    <ellipse cx="45" cy="-72" rx="3" ry="1.6" />
                </g>

                {/* gecko clinging to the right face */}
                <g transform="translate(56,-74) scale(-0.85,0.85)" fill="#0A1810">
                    <path d="M0,0 Q6,-3 12,-2 Q16,-1 18,2 Q14,3 10,2 Q4,3 0,2 Z" />
                    <path d="M18,2 Q23,0 25,3 Q23,5 18,4 Z" />
                    <path d="M0,1 Q-8,0 -12,5 Q-14,9 -11,11 Q-12,7 -8,5 Q-3,3 0,2 Z" />
                    <path d="M4,1 L1,-4 M4,1 L0,-3" stroke="#0A1810" strokeWidth="1" strokeLinecap="round" />
                    <path d="M4,2 L1,6 M4,2 L0,5" stroke="#0A1810" strokeWidth="1" strokeLinecap="round" />
                    <path d="M14,1 L17,-3 M14,1 L18,-2" stroke="#0A1810" strokeWidth="1" strokeLinecap="round" />
                    <path d="M14,2 L17,6 M14,2 L18,5" stroke="#0A1810" strokeWidth="1" strokeLinecap="round" />
                    <circle cx="22" cy="2.5" r="0.9" fill="#FFC247" />
                </g>
            </g>

            {/* Drifting swamp mist */}
            <g>
                <ellipse cx="200" cy="232" rx="200" ry="20" fill="url(#sc-rp-mist)" opacity="0.5">
                    <animate attributeName="cx" values="200;260;200" dur="22s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0.6;0.35" dur="11s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="430" cy="244" rx="180" ry="16" fill="url(#sc-rp-mist)" opacity="0.45">
                    <animate attributeName="cx" values="430;370;430" dur="26s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.3;0.5" dur="13s" repeatCount="indefinite" />
                </ellipse>
            </g>

            {/* ===== Swamp water ===== */}
            <rect y="250" width="600" height="50" fill="url(#sc-rp-water)" />
            <path d="M0,250 Q150,246 300,250 Q450,246 600,250 L600,256 L0,256 Z" fill="#0E2417" opacity="0.7" />
            {/* moon reflection shimmer */}
            <g fill="#CDEBB2" opacity="0.22">
                <ellipse cx="468" cy="258" rx="26" ry="1.6">
                    <animate attributeName="rx" values="22;30;22" dur="6s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="468" cy="266" rx="34" ry="1.4">
                    <animate attributeName="rx" values="38;28;38" dur="7s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="468" cy="276" rx="44" ry="1.2">
                    <animate attributeName="rx" values="40;50;40" dur="8s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="468" cy="288" rx="56" ry="1">
                    <animate attributeName="rx" values="60;48;60" dur="9s" repeatCount="indefinite" />
                </ellipse>
            </g>
            {/* temple amber reflection */}
            <g fill="#FFC247" opacity="0.14">
                <ellipse cx="300" cy="260" rx="10" ry="1.4" />
                <ellipse cx="300" cy="270" rx="16" ry="1.2" />
                <ellipse cx="300" cy="282" rx="22" ry="1" />
            </g>
            {/* ripples */}
            <g stroke="#2F7A4F" strokeWidth="1" opacity="0.45" fill="none">
                <path d="M40,272 Q70,270 100,272">
                    <animate attributeName="opacity" values="0.25;0.5;0.25" dur="5s" repeatCount="indefinite" />
                </path>
                <path d="M250,284 Q280,282 310,284">
                    <animate attributeName="opacity" values="0.45;0.2;0.45" dur="6s" repeatCount="indefinite" />
                </path>
                <path d="M430,276 Q460,274 490,276">
                    <animate attributeName="opacity" values="0.3;0.5;0.3" dur="5.5s" repeatCount="indefinite" />
                </path>
                <path d="M520,266 Q545,264 570,266">
                    <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4.8s" repeatCount="indefinite" />
                </path>
            </g>
            {/* lily pads + night lotus */}
            <g>
                <ellipse cx="110" cy="276" rx="15" ry="5" fill="#16432A" />
                <path d="M110,276 L101,272" stroke="#0A1810" strokeWidth="1" />
                <circle cx="116" cy="273" r="2.4" fill="#FFB0D8" />
                <circle cx="116" cy="273" r="1" fill="#FFF0C0" />
                <ellipse cx="360" cy="286" rx="17" ry="6" fill="#16432A" />
                <ellipse cx="180" cy="290" rx="13" ry="4.5" fill="#16432A" />
                <circle cx="184" cy="288" r="2" fill="#A8E5C8" />
            </g>

            {/* Tortoise on the left bank */}
            <g transform="translate(72,249)" fill="#0A1810">
                <path d="M-16,0 Q-16,-14 0,-15 Q16,-14 16,0 Z" />
                <path d="M-17,0 Q0,3 17,0 L16,2 Q0,5 -16,2 Z" fill="#0E2417" />
                <path d="M16,-4 Q24,-6 26,-2 Q24,1 16,-1 Z" />
                <circle cx="23" cy="-3" r="0.8" fill="#FFC247" />
                <rect x="-12" y="-2" width="5" height="5" />
                <rect x="6" y="-2" width="5" height="5" />
                <path d="M-16,-2 L-21,0 L-16,1 Z" />
            </g>
            <g transform="translate(72,249)" stroke="#2F7A4F" strokeWidth="0.7" opacity="0.4" fill="none">
                <path d="M-10,-2 Q-10,-11 -8,-13" />
                <path d="M0,-3 L0,-15" />
                <path d="M10,-2 Q10,-11 8,-13" />
                <path d="M-15,-1 Q0,-6 15,-1" />
            </g>

            {/* Crocodile — hero, half-submerged */}
            <g transform="translate(152,260)">
                <ellipse cx="0" cy="7" rx="72" ry="3.5" fill="#0A1810" opacity="0.45" />
                <path d="M-78,-1 Q-96,-1 -112,3 Q-100,1 -82,0 Z" fill="#0B1A11" />
                <path d="M-78,0 Q-80,-4 -70,-5 Q-30,-8 6,-8 Q40,-9 58,-7 Q72,-6 84,-6 Q92,-7 94,-3 Q90,-1 80,-1 Q40,0 0,0 Z" fill="#0B1A11" />
                <g fill="#0B1A11">
                    <path d="M-58,-6 L-52,-12 L-46,-6 Z" />
                    <path d="M-44,-7 L-38,-13 L-32,-7 Z" />
                    <path d="M-30,-7 L-24,-14 L-18,-7 Z" />
                    <path d="M-16,-8 L-10,-14 L-4,-8 Z" />
                    <path d="M-2,-8 L4,-14 L10,-8 Z" />
                    <path d="M12,-8 L18,-13 L24,-8 Z" />
                    <path d="M26,-8 L32,-12 L38,-8 Z" />
                </g>
                <path d="M60,-7 Q66,-12 72,-8 Z" fill="#0B1A11" />
                <circle cx="66" cy="-8" r="2" fill="#FFC247">
                    <animate attributeName="opacity" values="0.75;1;0.75" dur="2.6s" repeatCount="indefinite" />
                </circle>
                <circle cx="66.5" cy="-8.6" r="0.7" fill="#FFF0C0" />
                <path d="M88,-6 Q94,-9 96,-5 Q92,-3 88,-4 Z" fill="#0B1A11" />
                <circle cx="92" cy="-6" r="0.6" fill="#1F4A2A" />
                <g stroke="#2F7A4F" strokeWidth="0.8" opacity="0.5" fill="none">
                    <path d="M-90,1 Q-78,3 -66,1">
                        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
                    </path>
                    <path d="M70,1 Q84,3 98,1">
                        <animate attributeName="opacity" values="0.4;0.15;0.4" dur="4.5s" repeatCount="indefinite" />
                    </path>
                </g>
            </g>

            {/* Lurking caiman — eyes + snout at the waterline */}
            <path d="M428,270 Q440,267 452,270 Q440,272 428,270 Z" fill="#0A1810" />
            <g fill="#FFC247">
                <circle cx="436" cy="266" r="1.5">
                    <animate attributeName="opacity" values="1;0.3;1" dur="3.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="442" cy="266" r="1.5">
                    <animate attributeName="opacity" values="1;0.3;1" dur="3.3s" repeatCount="indefinite" />
                </circle>
                {/* eyes lurking in the foliage */}
                <circle cx="40" cy="184" r="1.4">
                    <animate attributeName="opacity" values="1;0.35;1" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="46" cy="184" r="1.4">
                    <animate attributeName="opacity" values="1;0.35;1" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="556" cy="182" r="1.4">
                    <animate attributeName="opacity" values="1;0.3;1" dur="3.6s" repeatCount="indefinite" />
                </circle>
                <circle cx="562" cy="182" r="1.4">
                    <animate attributeName="opacity" values="1;0.3;1" dur="3.6s" repeatCount="indefinite" />
                </circle>
            </g>

            {/* Serpent draped on a branch — upper right */}
            <path d="M600,136 Q535,140 466,156" stroke="#15281A" strokeWidth="6" fill="none" strokeLinecap="round" />
            <g>
                <path d="M560,150 Q540,142 520,150 Q500,158 484,150 Q470,144 462,152"
                      fill="none" stroke="url(#sc-rp-snake)" strokeWidth="7" strokeLinecap="round" />
                <path d="M462,152 Q452,150 446,140 Q442,132 448,126" fill="none" stroke="url(#sc-rp-snake)" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M448,126 Q442,121 449,118 Q455,116 458,121 Q458,126 452,127 Z" fill="#33824A" />
                <circle cx="452" cy="122" r="1.2" fill="#FFC247">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <g stroke="#E0384A" strokeWidth="0.9" strokeLinecap="round" fill="none">
                    <path d="M457,120 L464,117 M457,120 L464,121">
                        <animate attributeName="opacity" values="0;0;1;0;0;0;0" dur="3.2s" repeatCount="indefinite" />
                    </path>
                </g>
                <g stroke="#9FD8AC" strokeWidth="0.8" opacity="0.45" strokeLinecap="round">
                    <line x1="532" y1="148" x2="534" y2="151" />
                    <line x1="510" y1="152" x2="512" y2="155" />
                    <line x1="492" y1="150" x2="494" y2="153" />
                    <line x1="470" y1="150" x2="472" y2="153" />
                </g>
            </g>

            {/* Big foreground leaves framing the corners */}
            <g transform="translate(0,300)">
                <path d="M8,-2 C 6,-60 26,-100 70,-120 C 40,-66 28,-34 20,-2 Z" fill="#06120B" />
                <path d="M0,-2 C 18,-46 56,-66 100,-74 C 60,-50 34,-26 14,2 Z" fill="#081710" />
                <g stroke="#173E24" strokeWidth="1" fill="none" opacity="0.55">
                    <path d="M12,-4 Q34,-66 66,-114" />
                    <path d="M6,-4 Q44,-50 94,-70" />
                </g>
                <path d="M8,-2 C 6,-60 26,-100 70,-120" fill="none" stroke="#2F7A4F" strokeWidth="1" opacity="0.3" />
            </g>
            <g transform="translate(600,300) scale(-1,1)">
                <path d="M8,-2 C 6,-60 26,-100 70,-120 C 40,-66 28,-34 20,-2 Z" fill="#06120B" />
                <path d="M0,-2 C 18,-46 56,-66 100,-74 C 60,-50 34,-26 14,2 Z" fill="#081710" />
                <g stroke="#173E24" strokeWidth="1" fill="none" opacity="0.55">
                    <path d="M12,-4 Q34,-66 66,-114" />
                    <path d="M6,-4 Q44,-50 94,-70" />
                </g>
                <path d="M8,-2 C 6,-60 26,-100 70,-120" fill="none" stroke="#2F7A4F" strokeWidth="1" opacity="0.3" />
            </g>

            {/* Foreground reeds */}
            <g stroke="#0A1810" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M24,300 Q28,262 22,232" />
                <path d="M44,300 Q48,256 44,222" />
                <path d="M64,300 Q66,266 60,238" />
                <path d="M86,300 Q90,270 86,246" />
                <path d="M540,300 Q544,260 540,228" />
                <path d="M560,300 Q562,266 556,238" />
                <path d="M580,300 Q584,260 580,226" />
            </g>
            <g fill="#1F4A2A">
                <ellipse cx="22" cy="232" rx="1.6" ry="4" />
                <ellipse cx="44" cy="222" rx="1.6" ry="4" />
                <ellipse cx="60" cy="238" rx="1.5" ry="3.5" />
                <ellipse cx="86" cy="246" rx="1.5" ry="3.5" />
                <ellipse cx="540" cy="228" rx="1.6" ry="4" />
                <ellipse cx="556" cy="238" rx="1.5" ry="3.5" />
                <ellipse cx="580" cy="226" rx="1.6" ry="4" />
            </g>

            {/* Fireflies + glowing spores */}
            <g fill="#A8E5C8">
                <circle cx="180" cy="118" r="1.6" opacity="0.9">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="118;110;118" dur="9s" repeatCount="indefinite" />
                </circle>
                <circle cx="330" cy="132" r="1.5" opacity="0.9">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="250" cy="150" r="1.2" opacity="0.9">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="250;262;250" dur="12s" repeatCount="indefinite" />
                </circle>
                <circle cx="120" cy="144" r="1.4" opacity="0.9">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="408" cy="138" r="1.2" opacity="0.9">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="3.4s" repeatCount="indefinite" />
                </circle>
            </g>
            <g fill="#FFE08A">
                <circle cx="300" cy="170" r="1.3" opacity="0.85">
                    <animate attributeName="opacity" values="0.15;0.9;0.15" dur="3.6s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="170;162;170" dur="10s" repeatCount="indefinite" />
                </circle>
                <circle cx="210" cy="128" r="1.1" opacity="0.85">
                    <animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.9s" repeatCount="indefinite" />
                </circle>
            </g>
        </SceneWrap>
    );
}

// ---- Pride Parade ---------------------------------------------------------
// Aurora-stripe sky over a dusk silhouette. Six soft rainbow ribbons sweep
// horizontally across a deep purple-to-rose gradient, with a low confetti
// drift + a distant city skyline at the bottom for grounding. Designed to
// feel celebratory but not garish — long curves, low opacity, no hard edges.
function PrideParade() {
    return (
        <SceneWrap id="pride-parade">
            <defs>
                <linearGradient id="sc-pp-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#241850" />
                    <Stop offset="40%" color="#5B3FA0" />
                    <Stop offset="78%" color="#C04F90" />
                    <Stop offset="100%" color="#FF8A5B" />
                </linearGradient>
                <radialGradient id="sc-pp-glow" cx="50%" cy="80%" r="60%">
                    <Stop offset="0%" color="#FFE3B0" opacity="0.55" />
                    <Stop offset="100%" color="#FF8A5B" opacity="0" />
                </radialGradient>
                {/* One soft ribbon mask — every rainbow band reuses it for
                    consistent feathering at the edges. */}
                <linearGradient id="sc-pp-ribbon-fade" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" color="#FFFFFF" opacity="0" />
                    <Stop offset="15%" color="#FFFFFF" opacity="1" />
                    <Stop offset="85%" color="#FFFFFF" opacity="1" />
                    <Stop offset="100%" color="#FFFFFF" opacity="0" />
                </linearGradient>
                <mask id="sc-pp-ribbon-mask">
                    <rect width="600" height="300" fill="url(#sc-pp-ribbon-fade)" />
                </mask>
            </defs>

            <rect width="600" height="300" fill="url(#sc-pp-sky)" />
            <rect width="600" height="300" fill="url(#sc-pp-glow)" />

            {/* Rainbow ribbons sweeping across the sky. Each ribbon is a wide
                curved stroke at low opacity; the mask softens the entry/exit. */}
            <g fill="none" strokeLinecap="round" mask="url(#sc-pp-ribbon-mask)">
                {[
                    { y: 50,  color: '#E40303', dur: '18s', amp: 8 },
                    { y: 80,  color: '#FF8C00', dur: '17s', amp: 10 },
                    { y: 110, color: '#FFED00', dur: '16s', amp: 9 },
                    { y: 140, color: '#008026', dur: '15s', amp: 11 },
                    { y: 170, color: '#004CFF', dur: '14s', amp: 10 },
                    { y: 200, color: '#732982', dur: '13s', amp: 8 },
                ].map((r, i) => (
                    <path key={i} stroke={r.color} strokeWidth="14" opacity="0.55"
                        d={`M-40 ${r.y} Q 150 ${r.y - r.amp} 300 ${r.y} T 640 ${r.y}`}>
                        <animate attributeName="d"
                            values={`M-40 ${r.y} Q 150 ${r.y - r.amp} 300 ${r.y} T 640 ${r.y};
                                     M-40 ${r.y} Q 150 ${r.y + r.amp} 300 ${r.y} T 640 ${r.y};
                                     M-40 ${r.y} Q 150 ${r.y - r.amp} 300 ${r.y} T 640 ${r.y}`}
                            dur={r.dur} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.7;0.4" dur={r.dur} repeatCount="indefinite" />
                    </path>
                ))}
            </g>

            {/* Soft star/confetti drift in the upper sky. */}
            <g fill="#FFE3B0" opacity="0.75">
                {[[80, 30, '5s', 0], [220, 22, '6s', 1.2], [380, 36, '5.5s', 0.4], [520, 18, '6.5s', 2.1], [150, 60, '5s', 1.6], [460, 56, '6s', 0.9]].map(([cx, cy, dur, begin], i) => (
                    <circle key={i} cx={cx} cy={cy} r="1.2">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur={dur} begin={`${begin}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>

            {/* Distant skyline silhouette — gives the sky something to sit
                above, so the rainbow bands read as "over a parade" rather
                than floating in space. */}
            <g fill="#0F0820" opacity="0.92">
                <path d="M0 240 L0 300 L600 300 L600 230 L568 220 L568 240 L540 240 L540 215 L510 205 L510 240 L478 240 L478 200 L450 188 L450 240 L416 240 L416 210 L392 200 L392 240 L356 240 L356 218 L330 208 L330 240 L300 240 L300 195 L268 185 L268 240 L236 240 L236 222 L210 212 L210 240 L180 240 L180 200 L152 192 L152 240 L120 240 L120 220 L94 212 L94 240 L62 240 L62 230 L34 222 L34 240 L0 230 Z" />
            </g>

            {/* A few golden confetti dots near the foreground catching light. */}
            <g fill="#FFD86B">
                {[[80, 250, '3s', 0], [220, 244, '3.5s', 1.0], [340, 252, '3s', 0.4], [460, 246, '4s', 1.6], [540, 254, '3.5s', 0.9]].map(([cx, cy, dur, begin], i) => (
                    <circle key={i} cx={cx} cy={cy} r="2">
                        <animate attributeName="opacity" values="0.3;0.95;0.3" dur={dur} begin={`${begin}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>
        </SceneWrap>
    );
}

// ---- Mount Olympus — Atlas Pass Season 2 capstone -------------------------
// Dawn over the home of the gods: a deep-to-gold sky, a radiant sun, a marble
// temple of columns crowning the summit above a sea of clouds, distant peaks,
// a gliding eagle and drifting motes of golden light.
function Olympus() {
    return (
        <SceneWrap id="bp_olympus">
            <defs>
                <linearGradient id="sc-ol-sky" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#243A6A" />
                    <Stop offset="32%" color="#4A6AA8" />
                    <Stop offset="60%" color="#9AB0D8" />
                    <Stop offset="82%" color="#FFD89A" />
                    <Stop offset="100%" color="#FFEFC2" />
                </linearGradient>
                <radialGradient id="sc-ol-sun" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" color="#FFFDEC" />
                    <Stop offset="38%" color="#FFE6A8" opacity="0.9" />
                    <Stop offset="100%" color="#FFC247" opacity="0" />
                </radialGradient>
                <linearGradient id="sc-ol-marble" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FBFCFE" />
                    <Stop offset="60%" color="#E4E9F0" />
                    <Stop offset="100%" color="#C0C8D6" />
                </linearGradient>
                <linearGradient id="sc-ol-peak" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#7E8AA8" />
                    <Stop offset="55%" color="#566187" />
                    <Stop offset="100%" color="#39426A" />
                </linearGradient>
                <linearGradient id="sc-ol-cloud" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" color="#FFFFFF" />
                    <Stop offset="100%" color="#E0D2F0" />
                </linearGradient>
                <filter id="sc-ol-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>

            <rect width="600" height="300" fill="url(#sc-ol-sky)" />

            {/* Sun + radiant halo low on the horizon */}
            <circle cx="300" cy="196" r="150" fill="url(#sc-ol-sun)">
                <animate attributeName="r" values="150;168;150" dur="7s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="196" r="40" fill="#FFFBE6" filter="url(#sc-ol-glow)" opacity="0.85" />
            <circle cx="300" cy="196" r="28" fill="#FFF6D0">
                <animate attributeName="opacity" values="0.9;1;0.9" dur="4s" repeatCount="indefinite" />
            </circle>

            {/* Twinkling stars in the deep upper sky */}
            <g fill="#FFFDF7">
                {[[60, 36], [130, 60], [220, 28], [380, 40], [470, 64], [540, 32], [500, 100]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="1.4">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2.4 + (i % 3)}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>

            {/* Gliding eagle */}
            <g fill="none" stroke="#2A2440" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
                <path d="M120,96 Q132,86 144,96 Q156,86 168,96">
                    <animateTransform attributeName="transform" type="translate" values="0 0; 320 -16; 0 0" dur="22s" repeatCount="indefinite" />
                    <animate attributeName="d"
                        values="M120,96 Q132,86 144,96 Q156,86 168,96;
                                M120,94 Q132,98 144,92 Q156,98 168,94;
                                M120,96 Q132,86 144,96 Q156,86 168,96"
                        dur="2.4s" repeatCount="indefinite" />
                </path>
            </g>

            {/* Distant peaks behind the cloud sea */}
            <path d="M0,210 L80,150 L150,205 L230,140 L300,205 L370,150 L450,205 L520,150 L600,205 L600,300 L0,300 Z"
                  fill="url(#sc-ol-peak)" opacity="0.55" />

            {/* The summit — a broad marble plateau */}
            <path d="M150,300 L150,232 Q300,210 450,232 L450,300 Z" fill="url(#sc-ol-peak)" />
            <path d="M170,238 Q300,220 430,238 L430,250 Q300,232 170,250 Z" fill="url(#sc-ol-marble)" opacity="0.9" />

            {/* Marble temple — pediment on a colonnade of fluted columns */}
            <g>
                {/* Stylobate (base steps) */}
                <rect x="206" y="226" width="188" height="8" fill="#D4DAE4" />
                <rect x="212" y="220" width="176" height="7" fill="#E8ECF3" />
                {/* Columns */}
                <g fill="url(#sc-ol-marble)" stroke="#AEB6C6" strokeWidth="0.8">
                    {[222, 246, 270, 294, 318, 342, 366].map((x, i) => (
                        <g key={i}>
                            <rect x={x} y="182" width="11" height="40" rx="1.5" />
                            <rect x={x - 1.5} y="180" width="14" height="4" rx="1" fill="#EFF2F7" />
                            <rect x={x - 1.5} y="220" width="14" height="3.5" rx="1" fill="#CDD4E0" />
                        </g>
                    ))}
                </g>
                {/* Architrave + pediment */}
                <rect x="210" y="170" width="180" height="11" rx="1.5" fill="#E8ECF3" stroke="#AEB6C6" strokeWidth="0.8" />
                <path d="M204,170 L300,142 L396,170 Z" fill="url(#sc-ol-marble)" stroke="#AEB6C6" strokeWidth="0.8" />
                <path d="M222,168 L300,150 L378,168 Z" fill="#D8DEE8" opacity="0.7" />
                {/* Acroterion finial */}
                <circle cx="300" cy="140" r="3.2" fill="#FFD86B" />
            </g>

            {/* Cloud sea rolling across the base of the summit */}
            <g fill="url(#sc-ol-cloud)">
                {[[120, 252, 60, 18, 0], [300, 262, 90, 22, -20], [470, 254, 70, 18, 0], [40, 268, 70, 20, 0], [560, 266, 64, 18, -10]].map(([cx, cy, rx, ry, dx], i) => (
                    <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} opacity="0.92">
                        <animateTransform attributeName="transform" type="translate" values={`0 0; ${dx} 0; 0 0`} dur={`${14 + i * 3}s`} repeatCount="indefinite" />
                    </ellipse>
                ))}
            </g>
            <rect x="0" y="250" width="600" height="50" fill="url(#sc-ol-cloud)" opacity="0.5" />

            {/* Golden motes of light drifting up */}
            <g fill="#FFE8A8">
                {[[180, 200, 0], [360, 210, 0.6], [260, 190, 1.2], [420, 196, 1.8]].map(([x, y, b], i) => (
                    <circle key={i} cx={x} cy={y} r="1.6" opacity="0">
                        <animate attributeName="opacity" values="0;0.9;0" dur="3.4s" begin={`${b}s`} repeatCount="indefinite" />
                        <animateTransform attributeName="transform" type="translate" values="0 0; -6 -22" dur="3.4s" begin={`${b}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>
        </SceneWrap>
    );
}

const SCENE_RENDERERS = {
    africa: Africa,
    asia: Asia,
    europe: Europe,
    north_america: NorthAmerica,
    south_america: SouthAmerica,
    oceania: Oceania,
    antarctica: Antarctica,
    bp_reptile: Reptile,
    bp_olympus: Olympus,
    pride_parade: PrideParade,
};

// Render the equipped scene SVG. Returns null for `default` (or any unknown
// id) so the caller can fall back to the default hero backdrop.
export default function Scene({ id }) {
    if (!id || id === 'default') return null;
    const Renderer = SCENE_RENDERERS[id];
    if (!Renderer) return null;
    return <Renderer />;
}

// Whether a scene id is anything other than the free default. Useful when
// deciding whether to hide the default blobs/dots.
export function isCustomScene(id) {
    return !!(id && id !== 'default' && SCENE_RENDERERS[id]);
}
