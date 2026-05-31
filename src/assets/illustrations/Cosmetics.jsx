import React from 'react';
import { HATS, GLASSES, MOUTHS, EFFECTS, EMOTES } from '../../lib/cosmetics';

// SVG cosmetic overlays drawn in the Mascot's 96x96 viewBox.
// Globe is centered at (48,48) with radius 34 (top edge ~y14); eyes sit at y46.
// Each renderer takes a colorway object `c` so one shape yields many cosmetics.

const HAT_SHAPES = {
    party: (c) => (
        <g>
            <path d="M48 -6 L60 20 L36 20 Z" fill={c.main} />
            <path d="M48 -6 L54 8 L42 8 Z" fill={c.accent} />
            <circle cx="48" cy="-6" r="3.5" fill={c.accent} />
        </g>
    ),
    beanie: (c) => (
        <g>
            <path d="M22 22 Q48 -10 74 22 Z" fill={c.main} />
            <rect x="22" y="19" width="52" height="7" rx="3.5" fill={c.dark} />
            <circle cx="48" cy="-8" r="4" fill={c.accent} />
        </g>
    ),
    grad: (c) => (
        <g>
            <polygon points="48,2 72,13 48,24 24,13" fill={c.main} />
            <rect x="44" y="11" width="8" height="6" fill={c.dark} />
            <path d="M72 13 L72 26" stroke={c.accent} strokeWidth="2" />
            <circle cx="72" cy="27" r="3" fill={c.accent} />
        </g>
    ),
    crown: (c) => (
        <g>
            <path d="M28 24 L32 6 L40 18 L48 4 L56 18 L64 6 L68 24 Z"
                fill={c.main} stroke={c.dark} strokeWidth="2" strokeLinejoin="round" />
            <circle cx="48" cy="14" r="2.5" fill={c.accent} />
            <circle cx="34" cy="18" r="2" fill={c.trim} />
            <circle cx="62" cy="18" r="2" fill={c.trim} />
        </g>
    ),
    tophat: (c) => (
        <g>
            <rect x="26" y="20" width="44" height="5" rx="2.5" fill={c.main} />
            <rect x="34" y="-4" width="28" height="25" rx="3" fill={c.main} />
            <rect x="34" y="12" width="28" height="5" fill={c.accent} />
        </g>
    ),
    halo: (c) => (
        <ellipse cx="48" cy="6" rx="16" ry="5" fill="none" stroke={c.accent} strokeWidth="4" opacity="0.9" />
    ),
    cap: (c) => (
        <g>
            <path d="M24 24 Q24 6 48 6 Q72 6 72 24 Z" fill={c.main} />
            <ellipse cx="42" cy="24" rx="26" ry="5" fill={c.dark} />
            <circle cx="48" cy="8" r="2" fill={c.accent} />
        </g>
    ),
    cowboy: (c) => (
        <g>
            <path d="M30 22 Q30 4 48 4 Q66 4 66 22 Z" fill={c.main} />
            <path d="M16 23 Q48 14 80 23 Q48 32 16 23 Z" fill={c.dark} />
            <path d="M34 20 Q48 16 62 20" stroke={c.accent} strokeWidth="2" fill="none" />
        </g>
    ),
    wizard: (c) => (
        <g>
            <path d="M48 -14 L64 24 L32 24 Z" fill={c.main} />
            <path d="M26 24 Q48 18 70 24 Q48 30 26 24 Z" fill={c.dark} />
            <circle cx="46" cy="6" r="1.6" fill={c.accent} />
            <circle cx="52" cy="14" r="1.4" fill={c.accent} />
            <circle cx="44" cy="18" r="1.2" fill={c.accent} />
        </g>
    ),
    chef: (c) => (
        <g>
            <rect x="32" y="14" width="32" height="12" rx="2" fill={c.main} />
            <circle cx="38" cy="8" r="8" fill={c.main} />
            <circle cx="48" cy="5" r="9" fill={c.main} />
            <circle cx="58" cy="8" r="8" fill={c.main} />
            <rect x="32" y="20" width="32" height="6" fill={c.dark} />
        </g>
    ),
    bandana: (c) => (
        <g>
            <path d="M22 18 Q48 4 74 18 Q48 26 22 18 Z" fill={c.main} />
            <path d="M22 18 L12 26 L20 28 L24 22 Z" fill={c.main} />
            <circle cx="33" cy="14" r="1.5" fill={c.accent} />
            <circle cx="48" cy="11" r="1.5" fill={c.accent} />
            <circle cx="63" cy="14" r="1.5" fill={c.accent} />
        </g>
    ),
    viking: (c) => (
        <g>
            <path d="M28 22 Q28 6 48 6 Q68 6 68 22 Z" fill={c.main} />
            <rect x="28" y="20" width="40" height="5" rx="2" fill={c.dark} />
            <path d="M30 16 Q20 2 14 8 Q22 10 26 20 Z" fill={c.accent} />
            <path d="M66 16 Q76 2 82 8 Q74 10 70 20 Z" fill={c.accent} />
        </g>
    ),
    santa: (c) => (
        <g>
            <path d="M26 24 Q30 6 54 6 Q72 6 78 14 Q70 18 64 16 L62 20 Q60 12 48 12 Q34 12 30 24 Z" fill={c.main} />
            <rect x="24" y="22" width="40" height="6" rx="3" fill="#FFFFFF" />
            <circle cx="80" cy="13" r="4" fill="#FFFFFF" />
        </g>
    ),
    sombrero: (c) => (
        <g>
            <path d="M14 24 Q48 14 82 24 Q48 34 14 24 Z" fill={c.main} />
            <path d="M34 22 Q34 8 48 8 Q62 8 62 22 Z" fill={c.main} />
            <path d="M34 20 Q48 24 62 20" stroke={c.accent} strokeWidth="2" fill="none" />
            <path d="M16 24 Q48 18 80 24" stroke={c.dark} strokeWidth="1.5" fill="none" opacity="0.6" />
        </g>
    ),
    flower: (c) => {
        const bloom = (x, y) => (
            <g>
                <circle cx={x} cy={y - 3} r="2.4" fill={c.main} />
                <circle cx={x - 3} cy={y} r="2.4" fill={c.main} />
                <circle cx={x + 3} cy={y} r="2.4" fill={c.main} />
                <circle cx={x - 2} cy={y + 3} r="2.4" fill={c.main} />
                <circle cx={x + 2} cy={y + 3} r="2.4" fill={c.main} />
                <circle cx={x} cy={y} r="2" fill={c.accent} />
            </g>
        );
        return (
            <g>
                <path d="M18 22 Q48 10 78 22" stroke={c.dark} strokeWidth="3" fill="none" />
                {bloom(28, 18)}
                {bloom(48, 12)}
                {bloom(68, 18)}
            </g>
        );
    },
    headphones: (c) => (
        <g>
            <path d="M22 46 Q22 8 48 8 Q74 8 74 46" stroke={c.main} strokeWidth="5" fill="none" />
            <rect x="15" y="40" width="11" height="16" rx="4" fill={c.dark} />
            <rect x="70" y="40" width="11" height="16" rx="4" fill={c.dark} />
            <rect x="17" y="44" width="7" height="8" rx="2" fill={c.accent} />
            <rect x="72" y="44" width="7" height="8" rx="2" fill={c.accent} />
        </g>
    ),
    propeller: (c) => (
        <g>
            <path d="M28 22 Q28 6 48 6 Q68 6 68 22 Z" fill={c.main} />
            <path d="M28 22 L68 22 L66 25 L30 25 Z" fill={c.dark} />
            <rect x="46" y="-2" width="4" height="8" fill={c.dark} />
            <rect x="34" y="-5" width="28" height="3" rx="1.5" fill={c.accent} transform="rotate(12 48 -3)" />
            <circle cx="48" cy="-3" r="2" fill={c.dark} />
        </g>
    ),
    bow: (c) => (
        <g>
            <path d="M48 18 L32 10 Q26 16 32 24 Z" fill={c.main} />
            <path d="M48 18 L64 10 Q70 16 64 24 Z" fill={c.main} />
            <circle cx="48" cy="18" r="4" fill={c.dark} />
        </g>
    ),
    beret: (c) => (
        <g>
            <path d="M26 20 Q26 8 48 8 Q72 8 72 18 Q72 24 48 24 Q28 24 26 20 Z" fill={c.main} />
            <circle cx="70" cy="9" r="2" fill={c.dark} />
        </g>
    ),
    fez: (c) => (
        <g>
            <path d="M36 22 L34 8 Q48 5 62 8 L60 22 Z" fill={c.main} />
            <rect x="34" y="20" width="28" height="4" fill={c.dark} />
            <path d="M48 6 Q54 10 54 16" stroke={c.accent} strokeWidth="1.5" fill="none" />
            <circle cx="48" cy="6" r="2" fill={c.accent} />
        </g>
    ),
    laurel: (c) => {
        const leaf = (x, y, rot) => (
            <ellipse cx={x} cy={y} rx="3" ry="1.6" fill={c.main} transform={`rotate(${rot} ${x} ${y})`} />
        );
        return (
            <g>
                <path d="M30 28 Q20 14 32 2" stroke={c.dark} strokeWidth="1.5" fill="none" />
                <path d="M66 28 Q76 14 64 2" stroke={c.dark} strokeWidth="1.5" fill="none" />
                {leaf(26, 22, -40)}{leaf(24, 14, -10)}{leaf(28, 7, 30)}
                {leaf(70, 22, 40)}{leaf(72, 14, 10)}{leaf(68, 7, -30)}
            </g>
        );
    },
    // Devil/imp horns: a thick base tapering through a single outward curve to a
    // SHARP point — no rounded tip cap (that read as a bunny ear). Layered
    // dark→main→sheen to fake a gradient, with a couple of keratin bands and a
    // gloss streak down the front instead of a tip jewel.
    horns: (c) => (
        <g strokeLinejoin="round">
            {/* --- Left horn --- */}
            <path d="M27 23 Q18 9 22 -4 Q31 8 41 23 Z" fill={c.dark} />
            <path d="M28 22 Q20 9 23 -2 Q31 8 40 22 Z" fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            <path d="M32 20 Q28 11 26 4 Q29 10 35 20 Z" fill={c.accent} opacity="0.4" />
            <g stroke={c.dark} strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.75">
                <path d="M29 16 Q32 15 35 17" />
                <path d="M28 9 Q30 8.5 32 10" />
            </g>
            <path d="M24 0 Q28 7 33 14" stroke="#FFFFFF" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.5" />

            {/* --- Right horn (mirrored across x=48) --- */}
            <path d="M69 23 Q78 9 74 -4 Q65 8 55 23 Z" fill={c.dark} />
            <path d="M68 22 Q76 9 73 -2 Q65 8 56 22 Z" fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            <path d="M64 20 Q68 11 70 4 Q67 10 61 20 Z" fill={c.accent} opacity="0.4" />
            <g stroke={c.dark} strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.75">
                <path d="M67 16 Q64 15 61 17" />
                <path d="M68 9 Q66 8.5 64 10" />
            </g>
            <path d="M72 0 Q68 7 63 14" stroke="#FFFFFF" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.5" />
        </g>
    ),
    catEars: (c) => (
        <g>
            <path d="M28 18 L26 2 L42 14 Z" fill={c.main} stroke={c.dark} strokeWidth="1.5" />
            <path d="M68 18 L70 2 L54 14 Z" fill={c.main} stroke={c.dark} strokeWidth="1.5" />
            <path d="M30 14 L29 6 L37 12 Z" fill={c.accent} />
            <path d="M66 14 L67 6 L59 12 Z" fill={c.accent} />
        </g>
    ),
    bunnyEars: (c) => (
        <g>
            <ellipse cx="40" cy="2" rx="4" ry="14" fill={c.main} stroke={c.dark} strokeWidth="1.5" transform="rotate(-12 40 2)" />
            <ellipse cx="56" cy="2" rx="4" ry="14" fill={c.main} stroke={c.dark} strokeWidth="1.5" transform="rotate(12 56 2)" />
            <ellipse cx="40" cy="2" rx="1.8" ry="9" fill={c.accent} transform="rotate(-12 40 2)" />
            <ellipse cx="56" cy="2" rx="1.8" ry="9" fill={c.accent} transform="rotate(12 56 2)" />
        </g>
    ),
    antenna: (c) => (
        <g>
            <path d="M40 14 Q36 2 32 -2" stroke={c.main} strokeWidth="2.5" fill="none" />
            <path d="M56 14 Q60 2 64 -2" stroke={c.main} strokeWidth="2.5" fill="none" />
            <circle cx="31" cy="-3" r="3" fill={c.accent} />
            <circle cx="65" cy="-3" r="3" fill={c.accent} />
        </g>
    ),
    astronaut: (c) => (
        <g strokeLinejoin="round">
            {/* Glass bubble — STROKE ONLY so the inside stays see-through. The
                outer dark rim is a separate outline above the main stroke, NOT
                a filled shape, otherwise it shows through the tinted glass. */}
            <path d="M20 30 Q 20 -2 48 -2 Q 76 -2 76 30 Z"
                fill="rgba(180, 220, 255, 0.14)" stroke={c.main} strokeWidth="2.4" />
            {/* Outer dark rim outline (just the curve, not a filled dome) */}
            <path d="M18 30 Q 18 -4 48 -4 Q 78 -4 78 30"
                fill="none" stroke={c.dark} strokeWidth="1.2" opacity="0.85" />
            {/* Inner thin glass rim for depth */}
            <path d="M23 30 Q 23 1 48 1 Q 73 1 73 30" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
            {/* Branded collar at the base */}
            <rect x="18" y="28" width="60" height="6" rx="1.4" fill={c.dark} />
            <rect x="20" y="30" width="56" height="2" fill={c.accent} opacity="0.55" />
            {/* Bolts/rivets along the collar */}
            <circle cx="26" cy="31" r="1.2" fill={c.accent} stroke={c.dark} strokeWidth="0.3" />
            <circle cx="36" cy="31" r="1.2" fill={c.accent} stroke={c.dark} strokeWidth="0.3" />
            <circle cx="48" cy="31" r="1.2" fill={c.accent} stroke={c.dark} strokeWidth="0.3" />
            <circle cx="60" cy="31" r="1.2" fill={c.accent} stroke={c.dark} strokeWidth="0.3" />
            <circle cx="70" cy="31" r="1.2" fill={c.accent} stroke={c.dark} strokeWidth="0.3" />
            {/* Big specular highlight sweep across the bubble */}
            <path d="M26 6 Q 38 -6 56 -4" stroke="#FFFFFF" strokeWidth="3.4" fill="none" opacity="0.6" strokeLinecap="round" />
            {/* Secondary highlight curve */}
            <path d="M66 4 Q 71 12 70 22" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity="0.42" strokeLinecap="round" />
            {/* Sparkle points on the glass */}
            <circle cx="36" cy="-6" r="1.4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="34.4" cy="-7.2" r="0.6" fill="#FFFFFF" />
            <circle cx="62" cy="-2" r="0.9" fill="#FFFFFF" opacity="0.85" />
            {/* Antenna mast */}
            <rect x="46.6" y="-15" width="3" height="12" rx="0.6" fill={c.dark} />
            {/* Blinking comms light at the tip */}
            <circle cx="48" cy="-15" r="2.6" fill={c.accent}>
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="48" cy="-15" r="1.0" fill="#FFFFFF" opacity="0.9" />
        </g>
    ),
    tiara: (c) => (
        <g strokeLinejoin="round">
            {/* Outer dark band shadow */}
            <path d="M22 22 Q 22 18 30 18 L 66 18 Q 74 18 74 22 L 74 24 L 22 24 Z" fill={c.dark} />
            {/* Main band */}
            <path d="M24 22 Q 24 18 32 18 L 64 18 Q 72 18 72 22 L 72 23 L 24 23 Z" fill={c.main} stroke={c.dark} strokeWidth="0.7" />
            {/* Sheen along the band */}
            <path d="M26 19.5 L 70 19.5" stroke={c.accent} strokeWidth="0.8" opacity="0.65" />

            {/* Central tall arch (princess peak) with apex jewel */}
            <path d="M40 18 Q 48 -4 56 18 L 54 18 Q 48 0 42 18 Z" fill={c.main} stroke={c.dark} strokeWidth="0.7" />
            {/* Apex teardrop diamond */}
            <path d="M48 -6 Q 51.5 2 48 7 Q 44.5 2 48 -6 Z" fill={c.accent} stroke={c.dark} strokeWidth="0.5" />
            <ellipse cx="46.6" cy="0" rx="0.7" ry="1.6" fill="#FFFFFF" opacity="0.9" />

            {/* Side smaller arches */}
            <path d="M32 18 Q 36 8 40 18 L 39 18 Q 36 11 33 18 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <path d="M56 18 Q 60 8 64 18 L 63 18 Q 60 11 57 18 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />

            {/* Outer minor spikes between arches */}
            <path d="M28 18 L 30 14 L 32 18 Z" fill={c.main} stroke={c.dark} strokeWidth="0.5" />
            <path d="M64 18 L 66 14 L 68 18 Z" fill={c.main} stroke={c.dark} strokeWidth="0.5" />

            {/* Round jewels nested in each arch */}
            <circle cx="48" cy="10" r="1.9" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
            <circle cx="47.4" cy="9.4" r="0.55" fill="#FFFFFF" opacity="0.95" />
            <circle cx="36" cy="14" r="1.3" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
            <circle cx="60" cy="14" r="1.3" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />

            {/* Band jewels — alternating dots */}
            <g fill={c.accent}>
                <circle cx="27" cy="21" r="0.85" />
                <circle cx="34" cy="21" r="0.85" />
                <circle cx="42" cy="21" r="0.85" />
                <circle cx="48" cy="21.2" r="1.05" />
                <circle cx="54" cy="21" r="0.85" />
                <circle cx="62" cy="21" r="0.85" />
                <circle cx="69" cy="21" r="0.85" />
            </g>
            {/* Filigree swirls on the band */}
            <g stroke={c.dark} strokeWidth="0.4" fill="none" opacity="0.55">
                <path d="M30 22 Q 32 19 34 22" />
                <path d="M38 22 Q 40 19 42 22" />
                <path d="M54 22 Q 56 19 58 22" />
                <path d="M62 22 Q 64 19 66 22" />
            </g>
        </g>
    ),
    visor: (c) => (
        <g>
            <path d="M22 22 Q48 16 74 22 L72 26 Q48 22 24 26 Z" fill={c.main} />
            <path d="M30 22 Q30 16 48 16 Q66 16 66 22 Z" fill={c.dark} opacity="0.5" />
        </g>
    ),
    nightcap: (c) => (
        <g>
            <path d="M26 22 Q26 6 50 6 Q66 6 74 12 Q66 20 58 16 Q56 22 48 20 Q34 18 30 24 Z" fill={c.main} />
            <rect x="24" y="20" width="34" height="6" rx="3" fill={c.dark} />
            <circle cx="76" cy="11" r="3.5" fill={c.accent} />
        </g>
    ),
    jester: (c) => (
        <g>
            <path d="M30 22 Q30 8 48 8 Q66 8 66 22 Z" fill={c.main} />
            <path d="M30 12 Q22 2 16 8 L24 16 Z" fill={c.accent} />
            <path d="M66 12 Q74 2 80 8 L72 16 Z" fill={c.accent} />
            <path d="M48 8 Q48 -2 44 -4 L52 2 Z" fill={c.accent} />
            <circle cx="20" cy="8" r="2" fill={c.dark} />
            <circle cx="76" cy="8" r="2" fill={c.dark} />
            <circle cx="46" cy="-4" r="2" fill={c.dark} />
        </g>
    ),

    // ---- Silly novelty hats --------------------------------------------
    pirate: (c) => (
        <g>
            {/* Tricorn body */}
            <path d="M14 22 Q48 -4 82 22 Q72 28 60 24 L48 18 L36 24 Q24 28 14 22 Z" fill={c.main} stroke={c.dark} strokeWidth="1.5" />
            <path d="M14 22 Q48 14 82 22" stroke={c.dark} strokeWidth="1.2" fill="none" opacity="0.7" />
            {/* Skull */}
            <g transform="translate(48 14)">
                <ellipse cx="0" cy="0" rx="5" ry="4.5" fill={c.accent} />
                <circle cx="-1.7" cy="-0.4" r="0.9" fill={c.dark} />
                <circle cx="1.7" cy="-0.4" r="0.9" fill={c.dark} />
                <path d="M-1.2 2 L 1.2 2" stroke={c.dark} strokeWidth="0.7" />
                {/* Crossbones */}
                <path d="M-6 5 L 6 9 M-6 9 L 6 5" stroke={c.accent} strokeWidth="1.6" strokeLinecap="round" />
            </g>
        </g>
    ),
    // A centre-line mohawk (front view): ONE connected crest of liberty spikes,
    // tallest in the middle and fanning outward at the sides, clustered into a
    // narrow central strip. (The old version spread separate spikes across the
    // whole head on a wide wrap-around band, which read as a crown.)
    mohawk: (c) => (
        <g strokeLinejoin="round">
            <path d="M35 20 L33 1 L39 15 L41 -9 L45 14 L48 -14 L51 14 L55 -9 L57 15 L63 1 L61 20 Q48 23 35 20 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            {/* Glossy strand highlight up the centre of each spike */}
            <g stroke={c.accent} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.55">
                <path d="M35 12 L 33.7 2.5" />
                <path d="M42 9 L 41 -7" />
                <path d="M48 11 L 48 -12" />
                <path d="M54 9 L 55 -7" />
                <path d="M61 12 L 62.3 2.5" />
            </g>
        </g>
    ),
    duck: (c) => (
        <g>
            {/* Rubber duck sitting on head */}
            <ellipse cx="48" cy="20" rx="16" ry="9" fill={c.main} stroke={c.dark} strokeWidth="1" />
            {/* Head */}
            <circle cx="58" cy="10" r="8" fill={c.main} stroke={c.dark} strokeWidth="1" />
            {/* Eye */}
            <circle cx="60" cy="8" r="1.5" fill="#1F1A3B" />
            {/* Beak */}
            <path d="M64 10 L 70 10 L 70 13 L 64 13 Z" fill={c.accent} stroke={c.dark} strokeWidth="0.6" />
            {/* Tail */}
            <path d="M32 16 L 26 8 L 34 14 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
        </g>
    ),
    pineapple: (c) => (
        <g>
            {/* Body */}
            <ellipse cx="48" cy="18" rx="14" ry="14" fill={c.main} stroke={c.dark} strokeWidth="1.2" />
            {/* Cross-hatch on body */}
            <g stroke={c.dark} strokeWidth="0.8" opacity="0.7" fill="none">
                <path d="M36 14 L 48 22 L 60 14" />
                <path d="M36 22 L 48 30 L 60 22" />
                <path d="M40 6 L 48 14 L 56 6" />
            </g>
            {/* Leaves */}
            <g fill={c.accent} stroke={c.dark} strokeWidth="0.6">
                <path d="M48 6 L 42 -6 L 46 4 Z" />
                <path d="M48 6 L 50 -10 L 52 4 Z" />
                <path d="M48 6 L 58 -4 L 54 6 Z" />
                <path d="M48 6 L 40 -2 L 46 6 Z" />
            </g>
        </g>
    ),
    mushroom: (c) => (
        <g>
            {/* Cap */}
            <path d="M22 22 Q22 0 48 0 Q74 0 74 22 Q60 28 48 26 Q36 28 22 22 Z" fill={c.main} stroke={c.dark} strokeWidth="1.2" />
            {/* White spots */}
            <circle cx="34" cy="12" r="3.5" fill={c.accent} />
            <circle cx="48" cy="6" r="3" fill={c.accent} />
            <circle cx="60" cy="14" r="4" fill={c.accent} />
            <circle cx="42" cy="20" r="2.4" fill={c.accent} />
            {/* Stem hint */}
            <rect x="40" y="22" width="16" height="6" rx="3" fill={c.accent} opacity="0.7" />
        </g>
    ),
    cupcake: (c) => (
        <g>
            {/* Wrapper */}
            <path d="M30 22 L 26 8 L 70 8 L 66 22 Z" fill={c.dark} />
            <g stroke={c.main} strokeWidth="0.6" opacity="0.5" fill="none">
                <path d="M34 10 L 32 22" /><path d="M42 10 L 41 22" />
                <path d="M50 10 L 50 22" /><path d="M58 10 L 59 22" />
                <path d="M66 10 L 68 22" />
            </g>
            {/* Frosting */}
            <path d="M26 8 Q30 -4 40 0 Q48 -8 56 0 Q66 -4 70 8 Q60 12 48 10 Q36 12 26 8 Z" fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            {/* Cherry */}
            <circle cx="48" cy="-6" r="3" fill={c.accent} stroke={c.dark} strokeWidth="0.6" />
            <path d="M48 -8 q3 -2 5 -6" stroke={c.dark} strokeWidth="0.8" fill="none" />
            {/* Sprinkles */}
            <g stroke={c.accent} strokeWidth="1.4" strokeLinecap="round">
                <line x1="34" y1="4" x2="36" y2="6" />
                <line x1="62" y1="4" x2="60" y2="6" />
                <line x1="42" y1="8" x2="44" y2="10" />
                <line x1="55" y1="8" x2="57" y2="6" />
            </g>
        </g>
    ),
    cone: (c) => (
        <g>
            {/* Traffic cone body */}
            <path d="M36 24 L 48 -8 L 60 24 Z" fill={c.main} stroke={c.dark} strokeWidth="1" />
            <path d="M40 12 L 56 12 L 58 16 L 38 16 Z" fill={c.accent} />
            <path d="M42 4 L 54 4 L 56 8 L 40 8 Z" fill={c.accent} />
            {/* Base */}
            <rect x="32" y="22" width="32" height="5" rx="1.5" fill={c.dark} />
        </g>
    ),
    sharkFin: (c) => (
        <g>
            <path d="M30 24 L 56 -4 L 62 24 Q48 26 30 24 Z" fill={c.main} stroke={c.dark} strokeWidth="1.2" />
            {/* Belly */}
            <path d="M40 22 L 54 6 L 56 22 Z" fill={c.accent} opacity="0.6" />
        </g>
    ),
    disco: (c) => (
        <g>
            <circle cx="48" cy="12" r="12" fill={c.main} stroke={c.dark} strokeWidth="1" />
            {/* Mirror tiles */}
            <g opacity="0.65">
                {[[42,6],[48,5],[54,6],[40,11],[46,10],[52,11],[42,16],[48,16],[54,16]].map(([x,y],i)=>(
                    <rect key={i} x={x-1.8} y={y-1.8} width="3.6" height="3.6" fill={c.accent} />
                ))}
            </g>
            {/* Shine */}
            <ellipse cx="44" cy="8" rx="3" ry="2" fill="#FFFFFF" opacity="0.7" />
            {/* Cord */}
            <path d="M48 0 L 48 -6" stroke={c.dark} strokeWidth="1" />
        </g>
    ),

    // ---- Reptile/dragon-themed hats (Atlas Pass exclusives) -----------------
    // dragonHorns: a pair of curved keratin horns sweeping up + out, layered
    // with a dark base + main body + lighter sheen to fake a gradient, plus
    // banding rings and a SHARP point at the tip (no jewel cap — that blunted
    // the horn). A small diadem connects them at the brow for a regal feel.
    dragonHorns: (c) => (
        <g strokeLinejoin="round">
            {/* --- Left horn ----------------------------------------------- */}
            {/* Dark backshadow (slightly larger, behind main body) */}
            <path d="M30 22 Q16 8 8 -14 Q22 -12 36 2 Q42 12 40 22 Z" fill={c.dark} />
            {/* Main body */}
            <path d="M32 21 Q19 8 12 -12 Q22 -8 36 4 Q40 12 38 21 Z" fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            {/* Front-edge sheen (lighter wash) */}
            <path d="M34 19 Q23 8 18 -8 Q24 -4 34 8 Q36 12 36 19 Z" fill={c.accent} opacity="0.42" />
            {/* Banding rings for keratin/bone detail */}
            <g stroke={c.dark} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.85">
                <path d="M24 8 Q28 6 32 10" />
                <path d="M20 1 Q25 -1 29 3" />
                <path d="M16 -6 Q21 -8 25 -4" />
                <path d="M12 -12 Q17 -13 21 -10" />
            </g>
            {/* Sharp-tip gloss (no jewel) */}
            <circle cx="11" cy="-11" r="0.6" fill="#FFFFFF" opacity="0.85" />

            {/* --- Right horn (mirrored) ----------------------------------- */}
            <path d="M66 22 Q80 8 88 -14 Q74 -12 60 2 Q54 12 56 22 Z" fill={c.dark} />
            <path d="M64 21 Q77 8 84 -12 Q74 -8 60 4 Q56 12 58 21 Z" fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            <path d="M62 19 Q73 8 78 -8 Q72 -4 62 8 Q60 12 60 19 Z" fill={c.accent} opacity="0.42" />
            <g stroke={c.dark} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.85">
                <path d="M72 8 Q68 6 64 10" />
                <path d="M76 1 Q71 -1 67 3" />
                <path d="M80 -6 Q75 -8 71 -4" />
                <path d="M84 -12 Q79 -13 75 -10" />
            </g>
            <circle cx="85" cy="-11" r="0.6" fill="#FFFFFF" opacity="0.85" />

            {/* --- Brow diadem connecting both horns ----------------------- */}
            <path d="M34 20 Q48 16 62 20" stroke={c.dark} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M34 20 Q48 17 62 20" stroke={c.main} strokeWidth="1.0" fill="none" strokeLinecap="round" />
            <ellipse cx="48" cy="17" rx="2.2" ry="1.5" fill={c.accent} stroke={c.dark} strokeWidth="0.5" />
            <circle cx="47.4" cy="16.4" r="0.5" fill="#FFFFFF" opacity="0.85" />
            <circle cx="40" cy="20" r="0.9" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
            <circle cx="56" cy="20" r="0.9" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
        </g>
    ),

    // frill: a Dilophosaurus-style fanning collar with a darker outer rim,
    // gradient-faked main body, tooth-like spikes along the top, ribbed
    // spines from the base outward, and varied dappled markings.
    frill: (c) => (
        <g strokeLinejoin="round">
            {/* Dark rim halo (slightly larger, behind everything) */}
            <path d="M12 22 Q48 -28 84 22 Q74 26 64 22 Q60 18 48 18 Q36 18 32 22 Q22 26 12 22 Z"
                fill={c.dark} />
            {/* Main fan */}
            <path d="M16 21 Q48 -24 80 21 Q72 24 64 20 Q60 16 48 16 Q36 16 32 20 Q24 24 16 21 Z"
                fill={c.main} stroke={c.dark} strokeWidth="1.2" />
            {/* Inner lighter wash for fake gradient depth */}
            <path d="M22 18 Q48 -14 74 18 Q68 19 62 16 Q60 14 48 14 Q36 14 34 16 Q28 19 22 18 Z"
                fill={c.accent} opacity="0.35" />
            {/* Sharp tooth spikes along the upper rim */}
            <g fill={c.main} stroke={c.dark} strokeWidth="0.7">
                <path d="M22 6 L 26 -4 L 28 6 Z" />
                <path d="M32 -2 L 36 -14 L 38 -2 Z" />
                <path d="M44 -14 L 48 -26 L 52 -14 Z" />
                <path d="M58 -2 L 62 -14 L 64 -2 Z" />
                <path d="M68 6 L 72 -4 L 74 6 Z" />
            </g>
            {/* Rib spines fanning out from base */}
            <g stroke={c.dark} strokeWidth="0.9" fill="none" opacity="0.65" strokeLinecap="round">
                <path d="M26 18 Q28 6 30 -4" />
                <path d="M38 16 Q40 4 42 -10" />
                <path d="M58 16 Q56 4 54 -10" />
                <path d="M70 18 Q68 6 66 -4" />
            </g>
            {/* Highlight sheen along upper edge */}
            <path d="M22 14 Q48 -8 74 14" stroke={c.accent} strokeWidth="1.0" fill="none" opacity="0.5" />
            {/* Spotted markings — varied size + opacity, with an inner dot */}
            <g>
                <ellipse cx="36" cy="6" rx="1.6" ry="1.1" fill={c.accent} />
                <ellipse cx="48" cy="0" rx="2.0" ry="1.4" fill={c.accent} />
                <ellipse cx="60" cy="6" rx="1.6" ry="1.1" fill={c.accent} />
                <ellipse cx="30" cy="12" rx="1.2" ry="0.9" fill={c.accent} opacity="0.85" />
                <ellipse cx="66" cy="12" rx="1.2" ry="0.9" fill={c.accent} opacity="0.85" />
                <ellipse cx="42" cy="-8" rx="1.0" ry="0.7" fill={c.accent} opacity="0.8" />
                <ellipse cx="54" cy="-8" rx="1.0" ry="0.7" fill={c.accent} opacity="0.8" />
                <circle cx="48" cy="0" r="0.5" fill={c.dark} opacity="0.7" />
            </g>
        </g>
    ),

    // scaleHelm: a hood of overlapping shingle-style scales (curved tops, not
    // flat diamonds) draping over the head. Three rows of scales, each with a
    // light highlight crescent, plus a tooth fringe at the brow and a centred
    // gemstone for a clear focal point.
    scaleHelm: (c) => {
        const fringe = c.trim || c.accent;
        // A single overlapping shingle scale + its inner highlight.
        const scale = (x, y, op = 1) => (
            <g key={`${x}-${y}`} opacity={op}>
                <path
                    d={`M${x - 4.4} ${y} a 4.4 3.6 0 0 1 8.8 0 L ${x + 4.4} ${y + 1.5} L ${x - 4.4} ${y + 1.5} Z`}
                    fill={c.accent} stroke={c.dark} strokeWidth="0.55"
                />
                <path
                    d={`M${x - 3} ${y - 0.2} a 3 2.4 0 0 1 6 0`}
                    fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5"
                />
            </g>
        );
        return (
            <g strokeLinejoin="round">
                {/* Dark halo (outline) */}
                <path d="M20 22 Q20 -4 48 -4 Q76 -4 76 22 L 76 24 L 20 24 Z" fill={c.dark} />
                {/* Hood body */}
                <path d="M22 22 Q22 -2 48 -2 Q74 -2 74 22 L 74 24 L 22 24 Z" fill={c.main} />
                {/* Inner sheen down the centre to fake top-light gradient */}
                <path d="M30 -1 Q48 -3 66 -1 Q60 8 48 8 Q36 8 30 -1 Z" fill={c.accent} opacity="0.35" />

                {/* Row 1 (top, partial — front of crown only) */}
                {[34, 42, 50, 56].map((x) => scale(x, 2))}
                {/* Row 2 */}
                {[28, 36, 44, 52, 60, 68].map((x) => scale(x, 8, 0.97))}
                {/* Row 3 */}
                {[26, 34, 42, 50, 58, 66].map((x) => scale(x, 14, 0.93))}
                {/* Row 4 (brow line) */}
                {[28, 36, 44, 52, 60, 68].map((x) => scale(x, 20, 0.9))}

                {/* Tooth fringe along the brow edge */}
                <g fill={fringe} stroke={c.dark} strokeWidth="0.45" strokeLinejoin="miter">
                    {[26, 33, 40, 48, 56, 63, 70].map((x, i) => (
                        <path key={i} d={`M${x - 2} 24 L${x} 30 L${x + 2} 24 Z`} />
                    ))}
                </g>

                {/* Centred brow gem */}
                <ellipse cx="48" cy="20" rx="2.6" ry="1.8" fill={fringe} stroke={c.dark} strokeWidth="0.6" />
                <ellipse cx="47.4" cy="19.4" rx="0.7" ry="0.5" fill="#FFFFFF" opacity="0.9" />
            </g>
        );
    },

    // wyvernCrown (Atlas Pass — S1 extension): a fanned circlet of upswept,
    // outward-leaning bony spikes (wyvern-style), each layered dark→main with a
    // sheen rib, sitting on a crescent band with a central diamond gem + side
    // jewels. Reads as a regal reptilian crown.
    wyvernCrown: (c) => {
        const trim = c.trim || c.accent;
        // One bony spike: dark backing + main body. Curves from a base on the
        // band (y≈21) up to (tipX, tipY); negative tipY points it skyward.
        const spike = (bx, tipX, tipY) => (
            <g key={`${bx}`}>
                <path d={`M${bx - 3.6} 21 Q${bx - 1} 10 ${tipX} ${tipY} Q${bx + 1} 10 ${bx + 3.6} 21 Z`} fill={c.dark} />
                <path d={`M${bx - 2.5} 21 Q${bx - 0.6} 11 ${tipX} ${tipY + 1.6} Q${bx + 0.6} 11 ${bx + 2.5} 21 Z`} fill={c.main} stroke={c.dark} strokeWidth="0.55" />
                <path d={`M${bx - 0.6} 20 Q${bx - 0.2} 12 ${tipX} ${tipY + 2.4}`} stroke={trim} strokeWidth="0.6" fill="none" opacity="0.6" />
            </g>
        );
        return (
            <g strokeLinejoin="round">
                {/* Spikes (drawn first so the band overlaps their bases) */}
                {spike(30, 24, 4)}
                {spike(39, 38, -5)}
                {spike(48, 48, -13)}
                {spike(57, 58, -5)}
                {spike(66, 72, 4)}
                {/* Crescent circlet band: dark backing + main + top sheen */}
                <path d="M17 24 Q48 17 79 24 Q48 20 17 24 Z" fill={c.dark} />
                <path d="M19 23.4 Q48 17.6 77 23.4 Q48 20.4 19 23.4 Z" fill={c.main} stroke={c.dark} strokeWidth="0.7" />
                <path d="M23 21.8 Q48 18.2 73 21.8" stroke={trim} strokeWidth="0.8" fill="none" opacity="0.55" />
                {/* Central diamond gem */}
                <path d="M48 14.6 l 3 4 l -3 4 l -3 -4 Z" fill={c.accent} stroke={c.dark} strokeWidth="0.6" />
                <circle cx="47.1" cy="17" r="0.7" fill="#FFFFFF" opacity="0.9" />
                {/* Side jewels seated on the band */}
                <circle cx="31" cy="21.4" r="1" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
                <circle cx="65" cy="21.4" r="1" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
            </g>
        );
    },
};

const GLASS_SHAPES = {
    round: (c) => (
        <g stroke={c.frame} strokeWidth="2.5" fill={c.lens}>
            <circle cx="38" cy="46" r="8" />
            <circle cx="58" cy="46" r="8" />
            <path d="M46 46 L50 46" />
            <path d="M30 44 L24 42" />
            <path d="M66 44 L72 42" />
        </g>
    ),
    shades: (c) => (
        <g fill={c.lens}>
            <rect x="29" y="41" width="17" height="11" rx="4" />
            <rect x="50" y="41" width="17" height="11" rx="4" />
            <rect x="45" y="44" width="6" height="2.5" fill={c.frame} />
            <path d="M29 43 L23 41" stroke={c.frame} strokeWidth="2.5" />
            <path d="M67 43 L73 41" stroke={c.frame} strokeWidth="2.5" />
        </g>
    ),
    heart: (c) => (
        <g fill={c.lens} stroke={c.frame} strokeWidth="1.5">
            <path d="M38 52 L31 45 a3.5 3.5 0 0 1 5 -4.6 l2 2 l2 -2 a3.5 3.5 0 0 1 5 4.6 Z" />
            <path d="M58 52 L51 45 a3.5 3.5 0 0 1 5 -4.6 l2 2 l2 -2 a3.5 3.5 0 0 1 5 4.6 Z" />
            <path d="M46 46 L50 46" stroke={c.frame} strokeWidth="2" />
        </g>
    ),
    square: (c) => (
        <g stroke={c.frame} strokeWidth="2.5" fill={c.lens}>
            <rect x="29" y="40" width="16" height="12" rx="2" />
            <rect x="51" y="40" width="16" height="12" rx="2" />
            <path d="M45 45 L51 45" />
            <path d="M29 43 L23 41" />
            <path d="M67 43 L73 41" />
        </g>
    ),
    cateye: (c) => (
        <g stroke={c.frame} strokeWidth="2" fill={c.lens} strokeLinejoin="round">
            {/* Lenses centred on the eyes (38/58, y46) with crisp upswept wing
                tips at the outer-top corners (x30/x66, y40). */}
            <path d="M46 46 Q 45 41 38 41 Q 31 41 30 44 Q 31 49 38 50 Q 45 50 46 46 Z" />
            <path d="M50 46 Q 51 41 58 41 Q 65 41 66 44 Q 65 49 58 50 Q 51 50 50 46 Z" />
            <path d="M46 45 L 50 45" />
            {/* Thickened wing tips + glass glints */}
            <path d="M30 43.5 Q 28 41 30.5 39.6" stroke={c.frame} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M66 43.5 Q 68 41 65.5 39.6" stroke={c.frame} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <ellipse cx="35" cy="44" rx="1.6" ry="0.6" fill="#FFFFFF" opacity="0.45" />
            <ellipse cx="55" cy="44" rx="1.6" ry="0.6" fill="#FFFFFF" opacity="0.45" />
        </g>
    ),
    aviator: (c) => (
        <g stroke={c.frame} strokeWidth="1.8" fill={c.lens} strokeLinejoin="round">
            {/* Teardrop lenses centred on the eyes: flat-ish top, rounded point
                at the bottom-outer. */}
            <path d="M30 42 L 46 42 Q 47 49 42 53 Q 35 55 31 49 Q 29 45 30 42 Z" />
            <path d="M66 42 L 50 42 Q 49 49 54 53 Q 61 55 65 49 Q 67 45 66 42 Z" />
            {/* Signature double brow bar + bridge */}
            <path d="M30 42 L 46 42 M 50 42 L 66 42" strokeWidth="2" />
            <path d="M46 44 L 50 44" />
            {/* Mirror-finish specular sweeps */}
            <path d="M33 45 Q 38 43 43 45" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.4" />
            <path d="M53 45 Q 58 43 63 45" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.4" />
        </g>
    ),
    star: (c) => {
        const starPath = (cx) => {
            const pts = [];
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                pts.push([cx + 6 * Math.cos(a), 46 + 6 * Math.sin(a)]);
                const a2 = a + Math.PI / 5;
                pts.push([cx + 2.6 * Math.cos(a2), 46 + 2.6 * Math.sin(a2)]);
            }
            return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
        };
        return (
            <g stroke={c.frame} strokeWidth="1.5" fill={c.lens}>
                <path d={starPath(38)} />
                <path d={starPath(58)} />
                <path d="M44 46 L52 46" stroke={c.frame} strokeWidth="2" />
            </g>
        );
    },
    monocle: (c) => (
        <g stroke={c.frame} strokeWidth="2.5" fill={c.lens}>
            <circle cx="58" cy="46" r="9" />
            <path d="M58 55 Q56 64 50 68" fill="none" />
        </g>
    ),
    nerd: (c) => (
        <g>
            <g stroke={c.frame} strokeWidth="3" fill={c.lens}>
                <circle cx="38" cy="46" r="8" />
                <circle cx="58" cy="46" r="8" />
                <path d="M46 46 L50 46" />
            </g>
            <rect x="46" y="42" width="4" height="9" fill={c.accent} />
        </g>
    ),
    visorBand: (c) => (
        <g>
            <rect x="26" y="42" width="44" height="9" rx="4.5" fill={c.lens} />
            <rect x="26" y="42" width="44" height="3" rx="1.5" fill={c.frame} opacity="0.5" />
        </g>
    ),
    pixel: (c) => (
        <g fill={c.lens}>
            <rect x="28" y="42" width="18" height="9" />
            <rect x="50" y="42" width="18" height="9" />
            <rect x="46" y="44" width="4" height="3" fill={c.frame} />
            <rect x="24" y="44" width="4" height="3" fill={c.frame} />
            <rect x="68" y="44" width="4" height="3" fill={c.frame} />
        </g>
    ),
    goggles: (c) => (
        <g>
            <rect x="28" y="40" width="40" height="14" rx="7" fill={c.frame} />
            <rect x="31" y="42" width="34" height="10" rx="5" fill={c.lens} />
            <path d="M28 44 L20 44" stroke={c.frame} strokeWidth="3" />
            <path d="M68 44 L76 44" stroke={c.frame} strokeWidth="3" />
        </g>
    ),
    groucho: (c) => (
        <g>
            <path d="M30 40 Q38 36 46 40" stroke={c.frame} strokeWidth="3" fill="none" />
            <path d="M50 40 Q58 36 66 40" stroke={c.frame} strokeWidth="3" fill="none" />
            <circle cx="38" cy="46" r="6" fill="none" stroke={c.frame} strokeWidth="2" />
            <circle cx="58" cy="46" r="6" fill="none" stroke={c.frame} strokeWidth="2" />
            <path d="M44 50 Q48 60 52 50 Q56 56 48 58 Q42 58 44 50 Z" fill={c.accent} />
        </g>
    ),
    halfmoon: (c) => (
        <g stroke={c.frame} strokeWidth="2" fill={c.lens}>
            <path d="M30 47 Q38 55 46 47 Z" />
            <path d="M50 47 Q58 55 66 47 Z" />
            <path d="M46 47 L50 47" />
            <path d="M30 47 L24 45" />
            <path d="M66 47 L72 45" />
        </g>
    ),
    rimless: (c) => (
        <g>
            {/* Genuinely frame-free: fill-only lenses (no outline) with just the
                bridge + temple wire in the frame colour — the defining rimless look. */}
            <rect x="31" y="41" width="14" height="10" rx="3" fill={c.lens} />
            <rect x="51" y="41" width="14" height="10" rx="3" fill={c.lens} />
            <g stroke={c.frame} strokeWidth="1" fill="none" strokeLinecap="round">
                <path d="M45 46 L 51 46" />
                <path d="M31 44 L 25 42" />
                <path d="M65 44 L 71 42" />
            </g>
            {/* Thin top-edge highlight defines the lens; tiny mount screws */}
            <path d="M33 42 L 43 42" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.5" />
            <path d="M53 42 L 63 42" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.5" />
            <circle cx="45.5" cy="46" r="0.6" fill={c.frame} />
            <circle cx="50.5" cy="46" r="0.6" fill={c.frame} />
        </g>
    ),
    threeD: () => (
        <g>
            <rect x="29" y="42" width="17" height="10" rx="2" fill="#FF3B4E" opacity="0.72" />
            <rect x="50" y="42" width="17" height="10" rx="2" fill="#2EC4FF" opacity="0.72" />
            <rect x="27" y="40" width="42" height="3" fill="#1F1A3B" />
        </g>
    ),
    mask: (c) => (
        <g>
            <path d="M26 42 Q48 36 70 42 Q70 52 58 52 Q52 52 48 48 Q44 52 38 52 Q26 52 26 42 Z" fill={c.lens} />
            <ellipse cx="38" cy="46" rx="4" ry="3" fill="#FFFFFF" opacity="0.85" />
            <ellipse cx="58" cy="46" rx="4" ry="3" fill="#FFFFFF" opacity="0.85" />
        </g>
    ),
    eyepatch: (c) => (
        <g>
            <path d="M30 40 L66 36" stroke={c.frame} strokeWidth="2" />
            <ellipse cx="58" cy="46" rx="8" ry="9" fill={c.lens} />
        </g>
    ),

    // ---- Party / rave eyewear ------------------------------------------
    rave: (c) => (
        // Bold square frames with lenses that cycle through rave colors via
        // SMIL (so the cycle plays on previews, leaderboards, anywhere).
        <g stroke={c.frame} strokeWidth="2.5">
            <rect x="29" y="40" width="16" height="12" rx="2" fill={c.lens}>
                <animate attributeName="fill" values="#FF3FD0;#3FE0FF;#9CFF3F;#FFC247;#FF3FD0" dur="1.6s" repeatCount="indefinite" />
            </rect>
            <rect x="51" y="40" width="16" height="12" rx="2" fill={c.lens}>
                <animate attributeName="fill" values="#3FE0FF;#9CFF3F;#FFC247;#FF3FD0;#3FE0FF" dur="1.6s" repeatCount="indefinite" />
            </rect>
            <path d="M45 45 L51 45" fill="none" />
            <path d="M29 43 L23 41" fill="none" />
            <path d="M67 43 L73 41" fill="none" />
        </g>
    ),
    nyan: (c) => (
        // Rainbow horizontal bars inside square frames.
        <g>
            <g stroke={c.frame} strokeWidth="2.5" fill="none">
                <rect x="29" y="40" width="16" height="12" rx="2" />
                <rect x="51" y="40" width="16" height="12" rx="2" />
                <path d="M45 45 L51 45" />
                <path d="M29 43 L23 41" />
                <path d="M67 43 L73 41" />
            </g>
            {['#FF5C6C','#FFC247','#FFFB6B','#19C37D','#5B5BF6','#B05BF6'].map((color, i) => (
                <g key={i}>
                    <rect x="30" y={40.5 + i * 1.8} width="14" height="1.6" fill={color} />
                    <rect x="52" y={40.5 + i * 1.8} width="14" height="1.6" fill={color} />
                </g>
            ))}
        </g>
    ),
    kaleido: (c) => (
        // Concentric multicolor rings that rotate.
        <g>
            <g stroke={c.frame} strokeWidth="2" fill="#1F1A3B">
                <circle cx="38" cy="46" r="7.5" />
                <circle cx="58" cy="46" r="7.5" />
                <path d="M46 46 L50 46" />
            </g>
            {[38, 58].map((cx) => (
                <g key={cx} transform={`rotate(0 ${cx} 46)`}>
                    <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 46`} to={`360 ${cx} 46`} dur="3.4s" repeatCount="indefinite" />
                    {[['#FFC247', 6.4, 0], ['#19C37D', 6.4, 60], ['#2EC4D3', 6.4, 120], ['#5B5BF6', 6.4, 180], ['#B05BF6', 6.4, 240], ['#FF5C6C', 6.4, 300]].map(([color, r, a], i) => {
                        const rad = (a * Math.PI) / 180;
                        return <circle key={i} cx={cx + Math.cos(rad) * 3} cy={46 + Math.sin(rad) * 3} r="2" fill={color} />;
                    })}
                </g>
            ))}
        </g>
    ),
    vr: (c) => (
        // Big rectangular VR headset with a strap line and indicator dot.
        <g>
            <rect x="24" y="38" width="48" height="16" rx="3" fill={c.frame} stroke={c.frame} strokeWidth="1" />
            <rect x="27" y="41" width="18" height="10" rx="1.5" fill={c.lens} />
            <rect x="51" y="41" width="18" height="10" rx="1.5" fill={c.lens} />
            <rect x="44" y="44" width="8" height="4" fill={c.frame} />
            {/* Indicator LED */}
            <circle cx="48" cy="40" r="1.2" fill={c.accent}>
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
            </circle>
            {/* Strap */}
            <path d="M24 46 L 18 44" stroke={c.frame} strokeWidth="2.5" />
            <path d="M72 46 L 78 44" stroke={c.frame} strokeWidth="2.5" />
        </g>
    ),
    swim: (c) => (
        // Two large round goggles joined by a thick strap.
        <g>
            <circle cx="38" cy="46" r="8.5" fill={c.lens} stroke={c.frame} strokeWidth="2.5" />
            <circle cx="58" cy="46" r="8.5" fill={c.lens} stroke={c.frame} strokeWidth="2.5" />
            <path d="M46 46 L50 46" stroke={c.frame} strokeWidth="2.5" />
            <path d="M30 44 L22 42" stroke={c.frame} strokeWidth="3" />
            <path d="M66 44 L74 42" stroke={c.frame} strokeWidth="3" />
            {/* Shine */}
            <ellipse cx="35" cy="43" rx="2" ry="1.4" fill="#FFFFFF" opacity="0.6" />
            <ellipse cx="55" cy="43" rx="2" ry="1.4" fill="#FFFFFF" opacity="0.6" />
        </g>
    ),
    party: (c) => (
        // Star-shaped novelty shades with a party tone.
        <g>
            <g fill={c.lens} stroke={c.frame} strokeWidth="1.5">
                <path d="M30 46 L 33 41 L 39 41 L 42 46 L 39 51 L 33 51 Z" />
                <path d="M54 46 L 57 41 L 63 41 L 66 46 L 63 51 L 57 51 Z" />
            </g>
            <path d="M42 46 L 54 46" stroke={c.frame} strokeWidth="2" />
            {/* Confetti dots */}
            <circle cx="36" cy="38" r="1.4" fill={c.accent} />
            <circle cx="60" cy="38" r="1.4" fill={c.accent} />
            <circle cx="48" cy="36" r="1.2" fill={c.accent} />
        </g>
    ),

    // ---- Reptile / dragon-themed glasses (Atlas Pass exclusives) -----------
    // snakeEyes: layered iris (frame ring -> lens base -> darker inner ring
    // -> vertical slit pupil) with a pupil highlight and rim-light sheen so
    // the eye reads as glossy + 3D. A scaly bridge with stacked V scales
    // sits between the eyes.
    snakeEyes: (c) => {
        const eye = (cx) => (
            <g>
                {/* Outer ring (frame) */}
                <ellipse cx={cx} cy="46" rx="7.2" ry="6.6" fill={c.frame} />
                {/* Iris (lens colour) */}
                <ellipse cx={cx} cy="46" rx="6.0" ry="5.4" fill={c.lens} />
                {/* Inner darker ring around the pupil — fakes a radial gradient */}
                <ellipse cx={cx} cy="46" rx="3.0" ry="4.6" fill={c.accent || c.frame} opacity="0.55" />
                {/* Vertical slit pupil */}
                <ellipse cx={cx} cy="46" rx="0.9" ry="5.2" fill="#0F0A18" />
                {/* Pupil sparkle */}
                <ellipse cx={cx} cy="43.8" rx="0.5" ry="1.1" fill="#FFFFFF" opacity="0.9" />
                {/* Upper rim shine */}
                <path d={`M${cx - 4.5} 41.6 Q${cx} 39.6 ${cx + 4.5} 41.6`}
                    stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.55" />
                {/* Lower rim shadow */}
                <path d={`M${cx - 4.5} 50.6 Q${cx} 52.2 ${cx + 4.5} 50.6`}
                    stroke={c.frame} strokeWidth="0.6" fill="none" opacity="0.7" />
            </g>
        );
        return (
            <g>
                {eye(38)}
                {eye(58)}
                {/* Scaly bridge — two stacked V scales */}
                <g fill={c.frame} stroke={c.accent || c.lens} strokeWidth="0.5">
                    <path d="M45 44 L 48 41 L 51 44 L 48 45 Z" />
                    <path d="M45.5 47 L 48 45 L 50.5 47 L 48 48 Z" />
                </g>
            </g>
        );
    },

    // dragonGaze: a sleek predatory visor with notched outer corners, an inner
    // brow shadow for depth, a softly pulsing fire crescent inside each lens,
    // and a tactical bridge notch. Reads like a piece of dragon-bone armour.
    dragonGaze: (c) => (
        <g strokeLinejoin="miter">
            {/* Outer notch tabs (tactical corners) */}
            <path d="M28 38 L 22 36 L 22 41 L 28 40 Z" fill={c.frame} />
            <path d="M68 38 L 74 36 L 74 41 L 68 40 Z" fill={c.frame} />

            {/* Frame outline (slightly larger, behind the lens) */}
            <path d="M27 38 L 50 42 L 50 54 L 27 52 Z" fill={c.frame} />
            <path d="M69 38 L 46 42 L 46 54 L 69 52 Z" fill={c.frame} />
            {/* Lens inset (the glass) */}
            <path d="M29 40 L 48 43 L 48 51 L 29 49 Z" fill={c.lens} />
            <path d="M67 40 L 48 43 L 48 51 L 67 49 Z" fill={c.lens} />
            {/* Inner brow shadow (top half of lens) — fakes top-light */}
            <path d="M29 40 L 48 43 L 48 45 L 29 43 Z" fill={c.frame} opacity="0.45" />
            <path d="M67 40 L 48 43 L 48 45 L 67 43 Z" fill={c.frame} opacity="0.45" />
            {/* Fiery accent crescent inside each lens — pulses */}
            <path d="M31 49 Q38 47 47 49" stroke={c.accent} strokeWidth="1.6" fill="none" strokeLinecap="round">
                <animate attributeName="opacity" values="0.55;1;0.55" dur="1.8s" repeatCount="indefinite" />
            </path>
            <path d="M65 49 Q58 47 49 49" stroke={c.accent} strokeWidth="1.6" fill="none" strokeLinecap="round">
                <animate attributeName="opacity" values="0.55;1;0.55" dur="1.8s" repeatCount="indefinite" />
            </path>
            {/* Hot spark at the centre of each lens */}
            <circle cx="38" cy="46" r="0.9" fill={c.accent} opacity="0.85">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="58" cy="46" r="0.9" fill={c.accent} opacity="0.85">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
            </circle>
            {/* Bridge notch (predatory V) */}
            <path d="M46 41 L 48 38 L 50 41 L 48 43 Z" fill={c.frame} stroke={c.accent} strokeWidth="0.5" />
            {/* Top highlight along the brow */}
            <path d="M29 40 L 48 43 L 67 40" stroke="#FFFFFF" strokeWidth="0.6" fill="none" opacity="0.4" />
        </g>
    ),

    // apexVisor (Atlas Pass — S1 extension): a single wraparound visor bar with
    // twin glowing eye-slits, a central dragon-fin crest, temple tabs, and a top
    // sheen. The slits + core pulse so it reads as powered-on tech-bone armour.
    apexVisor: (c) => (
        <g strokeLinejoin="round">
            {/* Temple arms */}
            <path d="M22 45 L 16 43 L 16 47 L 22 48 Z" fill={c.frame} />
            <path d="M74 45 L 80 43 L 80 47 L 74 48 Z" fill={c.frame} />
            {/* Frame bar — gently curved wraparound (outer) */}
            <path d="M22 44 Q48 39 74 44 L 74 52 Q48 55 22 52 Z" fill={c.frame} />
            {/* Lens inset (the glass) */}
            <path d="M25 45 Q48 41.2 71 45 L 71 50.6 Q48 53 25 50.6 Z" fill={c.lens} />
            {/* Brow shadow across the top of the lens for depth */}
            <path d="M25 45 Q48 41.2 71 45 L 71 46.6 Q48 43 25 46.6 Z" fill={c.frame} opacity="0.4" />
            {/* Glowing eye-slits over each eye — pulse in unison */}
            <ellipse cx="38" cy="47.6" rx="5" ry="1.7" fill={c.accent} opacity="0.85">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="58" cy="47.6" rx="5" ry="1.7" fill={c.accent} opacity="0.85">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </ellipse>
            {/* Hot white cores */}
            <circle cx="38" cy="47.6" r="0.9" fill="#FFFFFF" opacity="0.9" />
            <circle cx="58" cy="47.6" r="0.9" fill="#FFFFFF" opacity="0.9" />
            {/* Central dragon-fin crest */}
            <path d="M44 42 L 48 35 L 52 42 Z" fill={c.frame} stroke={c.accent} strokeWidth="0.5" />
            {/* Top sheen */}
            <path d="M26 44 Q48 40 70 44" stroke="#FFFFFF" strokeWidth="0.6" fill="none" opacity="0.45" />
        </g>
    ),
};

// ---- Mouth cosmetics -------------------------------------------------------
// Drawn over the default mood mouth (which sits around y=58-66). Items that
// fully cover or replace the mouth (lips, masks, fangs) set `hideMouth: true`
// in their MOUTHS entry so Mascot skips the default mouth underneath (the
// pacifier does this too — it draws its own puckered mouth around the teat).
// Accessory items (beards, lollipops, straws, cigars) leave the mood mouth
// visible so the expression still reads.
// ---- Mouth helpers ---------------------------------------------------------
// Atlas's mouth sits around (48, 60); eyes at y=46 with r=4.5 (bottom ~y=50.5),
// so mouth-cosmetic geometry stays at y>=53 to never clip the eyes. The default
// mood mouth is just a thin stroke — every cosmetic below uses bold filled
// shapes with dark outlines to match the mascot's chunky vector style.
const MOUTH_SHAPES = {
    // ---- Beards & moustaches -----------------------------------------------
    // Classic flat-bar moustache with a centre dip and tapered tips. Reads as
    // a moustache from the silhouette alone.
    mustache: (c) => (
        <g strokeLinejoin="round">
            {/* Fuller W-bar with the outer tips flicking UP (y56.5) above the
                centre dip (y60) so it reads as groomed, not droopy. */}
            <path
                d="M31 57 Q 35 55 39 56.8 Q 44 58.5 48 59.6 Q 52 58.5 57 56.8 Q 61 55 65 57 Q 61 63 54 60.6 Q 50 59.4 48 60.6 Q 46 59.4 42 60.6 Q 35 63 31 57 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.7"
            />
            {/* One bold groomed top highlight (survives downscale) */}
            <path d="M35 57.4 Q 48 56 61 57.4" stroke={c.accent} strokeWidth="0.9" fill="none" opacity="0.65" />
            {/* Centre part */}
            <path d="M48 58.6 L 48 60.4" stroke={c.dark} strokeWidth="0.6" opacity="0.6" />
        </g>
    ),

    // Curly twirled-tip handlebar. Tips clearly loop UP and inward — that's
    // the silhouette people read as "handlebar".
    handlebar: (c) => (
        <g strokeLinejoin="round">
            {/* Centre bar */}
            <path d="M40 58 Q 48 56 56 58 Q 52 60.2 48 59.7 Q 44 60.2 40 58 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Left twirl — sweeps out, then loops UP and back inward into a
                near-closed spiral (the iconic waxed curl). */}
            <path d="M40 58 Q 30 58.5 27 53.5 Q 25.5 49.5 29.5 49 Q 33 49 32 52.5 Q 31.2 55.5 35 56.2 Q 38 56.8 40 58 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Right twirl (mirrored) */}
            <path d="M56 58 Q 66 58.5 69 53.5 Q 70.5 49.5 66.5 49 Q 63 49 64 52.5 Q 64.8 55.5 61 56.2 Q 58 56.8 56 58 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Waxed-tip glints + top sheen */}
            <circle cx="28.8" cy="50.4" r="0.85" fill={c.accent} />
            <circle cx="67.2" cy="50.4" r="0.85" fill={c.accent} />
            <path d="M40 57.2 Q 48 55.8 56 57.2" stroke={c.accent} strokeWidth="0.6" fill="none" opacity="0.6" />
        </g>
    ),

    // Mustache + chin patch + pointed beard, all connected so it reads as one
    // continuous goatee silhouette.
    goatee: (c) => (
        <g strokeLinejoin="round">
            {/* Thin moustache */}
            <path d="M40 57.5 Q 48 55.5 56 57.5 Q 52 59.5 48 59 Q 44 59.5 40 57.5 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.5" />
            {/* One continuous chin patch (no internal seams): soft inverted
                teardrop, widest at the lip line, tapering to a rounded point
                kept above y74 so it stays on the sphere. */}
            <path d="M41 60.5 Q 40 65 42.5 69 Q 45.5 73 48 73.5 Q 50.5 73 53.5 69 Q 56 65 55 60.5 Q 50 62 48 62 Q 46 62 41 60.5 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Bold centre hair-part line + side highlight */}
            <path d="M48 62.5 L 48 71" stroke={c.dark} strokeWidth="0.6" fill="none" opacity="0.55" />
            <path d="M44 64 Q 43 68 45.5 71.5" stroke={c.accent} strokeWidth="0.7" fill="none" opacity="0.5" />
        </g>
    ),

    // Bushy wraparound full beard. Sideburns hint at the sides, a moustache
    // sits up top, and the body curves down past the chin. Texture wisps + a
    // top sheen sell the fluffiness.
    fullBeard: (c) => (
        <g strokeLinejoin="round">
            {/* Moustache */}
            <path d="M38 57.5 Q 48 55.5 58 57.5 Q 54 60 48 59.5 Q 42 60 38 57.5 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Main body — a jaw-hugging crescent that nests INSIDE the lower
                sphere arc (bottom ~y80, narrows with the globe), with the
                sideburns drawn as part of the same continuous fill so they
                connect instead of floating as stray tufts. */}
            <path
                d="M31 58 Q 28 54 31 51 Q 33 55 35 58 Q 41 62 48 61.5 Q 55 62 61 58 Q 63 55 65 51 Q 68 54 65 58 Q 67 70 57 78 Q 48 81 39 78 Q 29 70 31 58 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.7"
            />
            {/* Scalloped bottom edge — real notches read as fluff at thumbnail size */}
            <path d="M39 77 Q 43 74.5 46 77 Q 48 75 50 77 Q 53 74.5 57 77" stroke={c.dark} strokeWidth="0.6" fill="none" opacity="0.5" />
            {/* Bold upper sheen band */}
            <path d="M35 63 Q 48 61 61 63" stroke={c.accent} strokeWidth="1.1" fill="none" opacity="0.5" />
        </g>
    ),

    // Long viking braided beard: moustache + chin base + TWO distinct braid
    // strands hanging down, each cinched with gold rings.
    vikingBeard: (c) => (
        <g strokeLinejoin="round">
            {/* Moustache */}
            <path d="M38 57.5 Q 48 55.5 58 57.5 Q 54 60 48 59.5 Q 42 60 38 57.5 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Beard base — stays inside the lower sphere arc */}
            <path d="M35 59 Q 31 65 35 71 Q 42 75 48 74.5 Q 54 75 61 71 Q 65 65 61 59 Q 55 63 48 62.5 Q 41 63 35 59 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.7" />
            {/* Two braids — pinched at each ring, tapering to fine points and
                curving slightly inward so they don't read as rigid pegs. */}
            <path d="M40 73 Q 37 78 39 82 Q 40 85 41.5 86 Q 43 85 43 82 Q 44 78 43 73 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <path d="M56 73 Q 59 78 57 82 Q 56 85 54.5 86 Q 53 85 53 82 Q 52 78 53 73 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Braid weave — small chevrons between the rings */}
            <g stroke={c.dark} strokeWidth="0.5" fill="none" opacity="0.6" strokeLinecap="round">
                <path d="M40 76 Q 41.5 77 43 76" /><path d="M40.2 80 Q 41.5 81 42.8 80" />
                <path d="M53 76 Q 54.5 77 56 76" /><path d="M53.2 80 Q 54.5 81 55.8 80" />
            </g>
            {/* Gold cinch rings (pinch points) + highlights */}
            <g stroke={c.dark} strokeWidth="0.4">
                <ellipse cx="41.5" cy="78" rx="2.6" ry="1.1" fill={c.accent} />
                <ellipse cx="42" cy="83.5" rx="2" ry="0.9" fill={c.accent} />
                <ellipse cx="54.5" cy="78" rx="2.6" ry="1.1" fill={c.accent} />
                <ellipse cx="54" cy="83.5" rx="2" ry="0.9" fill={c.accent} />
            </g>
            <ellipse cx="40.6" cy="77.6" rx="0.9" ry="0.3" fill="#FFFFFF" opacity="0.75" />
            <ellipse cx="53.6" cy="77.6" rx="0.9" ry="0.3" fill="#FFFFFF" opacity="0.75" />
        </g>
    ),

    // Tiny chin tuft under the lower lip.
    soulPatch: (c) => (
        <g strokeLinejoin="round">
            {/* Soft rounded tuft below the lip, with a full-opacity outline so it
                reads on dark globes. */}
            <path d="M45.4 63.5 Q 48 62.2 50.6 63.5 Q 51.2 67 48.4 69.6 Q 48 69.9 47.6 69.6 Q 44.8 67 45.4 63.5 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Centre hair-part hint */}
            <path d="M48 64 L 48 68" stroke={c.dark} strokeWidth="0.5" opacity="0.5" />
            <path d="M46.4 64.5 Q 46 66.5 47 68.5" stroke={c.accent} strokeWidth="0.5" fill="none" opacity="0.5" />
        </g>
    ),

    // ---- Lip cosmetics (hideMouth) ----------------------------------------
    // Bold painted lips with a clean cupid's bow and a fuller lower lip.
    lipstick: (c) => (
        <g strokeLinejoin="round">
            {/* Upper lip — a true cupid's bow: two clear peaks (y59) with a
                sharp central notch (y58.8 valley between them). */}
            <path
                d="M37 61 Q 41 58.5 44.5 59.2 Q 46.6 56.4 48 58.8 Q 49.4 56.4 51.5 59.2 Q 55 58.5 59 61 Q 54 61.6 48 61 Q 42 61.6 37 61 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.5"
            />
            {/* Lower lip — fuller, pillowy pout */}
            <path
                d="M37 61 Q 42 67.5 48 68 Q 54 67.5 59 61 Q 54 63 48 62.4 Q 42 63 37 61 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.5"
            />
            {/* Inner-lip tint (accent) + centre line for depth */}
            <path d="M40 61 Q 48 62 56 61" stroke={c.accent} strokeWidth="0.7" fill="none" opacity="0.55" />
            <path d="M40 61 Q 48 61.8 56 61" stroke={c.dark} strokeWidth="0.45" fill="none" opacity="0.5" />
            {/* Symmetric upper-lip speculars + one centred lower sheen */}
            <ellipse cx="44.5" cy="59.1" rx="1.2" ry="0.45" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="51.5" cy="59.1" rx="1.2" ry="0.45" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="48" cy="65" rx="2.4" ry="0.7" fill="#FFFFFF" opacity="0.5" />
        </g>
    ),

    // Tinted lips with prominent glass-like reflections.
    lipGloss: (c) => (
        <g strokeLinejoin="round">
            {/* Two-lobe lip silhouette (like lipstick) so it reads as a mouth,
                with a soft tint + dark rim that survives on light globes. */}
            <path
                d="M37 61 Q 41 58.5 44.5 59.2 Q 46.6 56.6 48 58.8 Q 49.4 56.6 51.5 59.2 Q 55 58.5 59 61 Q 54 61.6 48 61 Q 42 61.6 37 61 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.5"
            />
            <path d="M37 61 Q 42 67 48 67.5 Q 54 67 59 61 Q 54 63 48 62.4 Q 42 63 37 61 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.5" />
            {/* Centre line */}
            <path d="M40 61 Q 48 61.8 56 61" stroke={c.dark} strokeWidth="0.4" fill="none" opacity="0.4" />
            {/* Glassy gloss — symmetric upper speculars + a crisp lower sheen */}
            <ellipse cx="44" cy="59.4" rx="1.6" ry="0.7" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="52" cy="59.4" rx="1.6" ry="0.7" fill="#FFFFFF" opacity="0.9" />
            <path d="M43 65 Q 48 66.2 53 65" stroke="#FFFFFF" strokeWidth="0.7" fill="none" opacity="0.8" />
        </g>
    ),

    // ---- Silly accessories -------------------------------------------------
    // Open grin + bright tongue lolling out the side.
    tongueOut: (c) => (
        <g strokeLinejoin="round">
            {/* Open smiling mouth (dark cavity) with a lip rim so it doesn't
                float on the globe. */}
            <path d="M38 57.5 Q 48 55.5 58 57.5 Q 58 65 48 65.5 Q 38 65 38 57.5 Z"
                fill="#2A0E1A" stroke={c.dark} strokeWidth="0.5" />
            {/* Individual upper teeth */}
            <g fill="#FFFDF7">
                <rect x="41.5" y="57.8" width="2.6" height="2.4" rx="0.5" />
                <rect x="44.6" y="57.8" width="2.6" height="2.4" rx="0.5" />
                <rect x="48.8" y="57.8" width="2.6" height="2.4" rx="0.5" />
                <rect x="51.9" y="57.8" width="2.6" height="2.4" rx="0.5" />
            </g>
            {/* Tongue — centred, with a big rounded bulb lolling down */}
            <path d="M43 63 Q 42 71 48 75 Q 54 71 53 63 Q 50.5 64.8 48 64.8 Q 45.5 64.8 43 63 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Centred groove + highlight */}
            <path d="M48 65 L 48 72.5" stroke={c.dark} strokeWidth="0.45" fill="none" opacity="0.5" />
            <ellipse cx="48" cy="68" rx="1" ry="2.4" fill={c.accent} opacity="0.5" />
        </g>
    ),

    // Big pink bubble being blown out of the lips. Lips are parted to show
    // where the bubble emerges from.
    bubblegum: (c) => (
        <g strokeLinejoin="round">
            {/* Parted lips */}
            <path d="M40 59.5 Q 44 58 47 59 Q 46 61.5 43.5 61.5 Q 41 61.5 40 59.5 Z" fill="#2A0E1A" stroke={c.dark} strokeWidth="0.4" />
            <ellipse cx="43.5" cy="60" rx="2" ry="1" fill={c.main} />
            {/* Gum neck stretching from the lips into the bubble */}
            <path d="M46 60 Q 51 59.4 55 60" stroke={c.main} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* The bubble — centred over the face, inside the globe (no longer
                a detached balloon off to the right) */}
            <circle cx="58" cy="60" r="7" fill={c.main} stroke={c.dark} strokeWidth="0.8" opacity="0.95">
                <animate attributeName="r" values="6.4;7.6;6.4" dur="3.4s" repeatCount="indefinite" />
            </circle>
            <ellipse cx="55" cy="57.5" rx="2.2" ry="1.4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="60.5" cy="62.5" r="0.8" fill="#FFFFFF" opacity="0.6" />
        </g>
    ),

    // Thin tapered toothpick poking out at a jaunty angle.
    toothpick: (c) => (
        <g strokeLinejoin="round">
            {/* Mouth-corner clench so the pick reads as gripped, not stuck to the cheek */}
            <path d="M43 60.5 Q 46 59.5 48 60.5 Q 46 62 43 61.2 Z" fill={c.dark} opacity="0.55" />
            <g transform="rotate(-8 48 61)">
                {/* Tapered body: thicker at the mouth, pointy at the (pulled-in) tip */}
                <path d="M44 60 L 46 60.2 L 66 61.4 L 67.5 62 L 66 62.6 L 46 62 L 44 62 Z"
                    fill={c.main} stroke={c.dark} strokeWidth="0.45" />
                {/* Woody top highlight */}
                <line x1="46" y1="60.6" x2="64" y2="61.6" stroke={c.accent} strokeWidth="0.4" opacity="0.7" />
            </g>
        </g>
    ),

    // Classic baby pacifier, shown plugged INTO the mouth: the player's mouth
    // becomes a small puckered ring gripping the teat (no nipple pokes out — a
    // visible tip read as "not actually in the mouth"). Below the lips sit the
    // shield (face plate) and the handle ring. The catalog marks this `hideMouth`
    // so the mood mouth is suppressed and this puckered mouth is the only one.
    pacifier: (c) => (
        <g strokeLinejoin="round">
            {/* Puckered mouth gripping the teat — replaces the mood mouth. The
                dark lip ring reads as the mouth wrapped around the pacifier. */}
            <circle cx="48" cy="57.5" r="4.8" fill="#1F1A3B" />
            {/* Teat seated inside the mouth — a small dome, no protruding tip */}
            <circle cx="48" cy="57.5" r="2.7" fill={c.accent} stroke={c.dark} strokeWidth="0.4" />
            <ellipse cx="46.9" cy="56.6" rx="0.7" ry="1" fill="#FFFFFF" opacity="0.85" />
            {/* Shield (oval guard pressed against the lips) */}
            <ellipse cx="48" cy="63.5" rx="8" ry="3.4" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Cute smiley face on the shield */}
            <circle cx="45" cy="63" r="0.6" fill={c.dark} />
            <circle cx="51" cy="63" r="0.6" fill={c.dark} />
            <path d="M45.5 64.5 Q 48 65.5 50.5 64.5" stroke={c.dark} strokeWidth="0.5" fill="none" />
            {/* Handle ring (hangs below) */}
            <circle cx="48" cy="71.5" r="3.6" fill="none" stroke={c.main} strokeWidth="2" />
            <circle cx="48" cy="71.5" r="3.6" fill="none" stroke={c.dark} strokeWidth="0.4" />
            {/* Tiny shield highlight */}
            <ellipse cx="44.5" cy="62" rx="1.4" ry="0.5" fill="#FFFFFF" opacity="0.55" />
        </g>
    ),

    // Stripey drinking straw at an angle, with a bendy elbow at the top.
    straw: (c) => (
        <g transform="rotate(18 51 62)" strokeLinejoin="round">
            {/* Main straw shaft */}
            <rect x="49" y="46" width="4" height="22" rx="1.6" fill={c.main} stroke={c.dark} strokeWidth="0.5" />
            {/* Diagonal stripes (paper-straw style) */}
            <g fill={c.accent}>
                <path d="M49 49 L 53 49 L 53 51 L 49 51 Z" />
                <path d="M49 55 L 53 55 L 53 57 L 49 57 Z" />
                <path d="M49 61 L 53 61 L 53 63 L 49 63 Z" />
                <path d="M49 67 L 53 67 L 53 68 L 49 68 Z" />
            </g>
            {/* Bend rings at the top */}
            <g stroke={c.dark} strokeWidth="0.35" fill="none" opacity="0.7">
                <line x1="49" y1="47.5" x2="53" y2="47.5" />
                <line x1="49" y1="48.5" x2="53" y2="48.5" />
            </g>
            {/* Length highlight */}
            <line x1="50" y1="48" x2="50" y2="66" stroke="#FFFFFF" strokeWidth="0.45" opacity="0.7" />
        </g>
    ),

    // Round disc lollipop on a white stick poking out the side of the mouth.
    lollipop: (c) => (
        <g strokeLinejoin="round">
            {/* Stick */}
            <rect x="55" y="61.2" width="14" height="1.6" rx="0.6" fill="#F4F4F8" stroke={c.dark} strokeWidth="0.4" />
            {/* Candy disc */}
            <circle cx="73" cy="62" r="7" fill={c.main} stroke={c.dark} strokeWidth="0.8" />
            {/* Spiral swirl — clean teardrop swept around the centre */}
            <path d="M73 56 Q 78 60 73 67 Q 68 60 73 56 Z" fill={c.accent} opacity="0.9" />
            <circle cx="73" cy="62" r="1.4" fill={c.main} />
            {/* Glossy highlight */}
            <ellipse cx="70.4" cy="58.8" rx="1.6" ry="1" fill="#FFFFFF" opacity="0.85" />
            <circle cx="75.5" cy="65" r="0.7" fill="#FFFFFF" opacity="0.55" />
        </g>
    ),

    // Rainbow swirl lollipop — wedges of colour around a central pip.
    lollipopSwirl: (c) => (
        <g strokeLinejoin="round">
            {/* Stick */}
            <rect x="55" y="61.2" width="14" height="1.6" rx="0.6" fill="#F4F4F8" stroke={c.dark} strokeWidth="0.4" />
            {/* Candy disc backdrop (white) */}
            <circle cx="73" cy="62" r="7" fill="#FFFFFF" stroke={c.dark} strokeWidth="0.8" />
            {/* Coloured swirl arms — spiraling out from centre */}
            <g fill="none" strokeWidth="1.5" strokeLinecap="round">
                <path d="M73 62 Q 74 56 79 59" stroke="#FF5C6C" />
                <path d="M73 62 Q 79 62 78 68" stroke="#FFC247" />
                <path d="M73 62 Q 72 68 67 65" stroke="#19C37D" />
                <path d="M73 62 Q 67 62 68 56" stroke="#3F6FF6" />
            </g>
            {/* Centre pip */}
            <circle cx="73" cy="62" r="1" fill={c.dark} />
            {/* Glossy highlight */}
            <ellipse cx="70.4" cy="58.8" rx="1.6" ry="1" fill="#FFFFFF" opacity="0.85" />
        </g>
    ),

    // Lit cigar with a bright ember tip, wrapper band, and rising smoke.
    cigar: (c) => (
        <g strokeLinejoin="round">
            {/* Cigar body — slightly tapered at both ends */}
            <path d="M48 60 L 70 60 L 71 60.8 L 71 63.4 L 70 64.2 L 48 64.2 Q 47 62 48 60 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.5" />
            {/* Wrapper band */}
            <rect x="51" y="60" width="4" height="4.2" fill={c.accent} stroke={c.dark} strokeWidth="0.3" />
            <circle cx="53" cy="62" r="0.6" fill={c.dark} />
            {/* Ash (lighter section near tip) */}
            <rect x="67" y="60" width="3" height="4.2" fill="#9AA7B4" />
            <line x1="68.5" y1="60" x2="68.5" y2="64.2" stroke="#7A8090" strokeWidth="0.3" />
            {/* Glowing ember tip */}
            <ellipse cx="71" cy="62.1" rx="1.5" ry="2.2" fill="#FF6A2E">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="71" cy="62.1" r="0.7" fill="#FFD86B">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
            </circle>
            {/* Smoke wisps */}
            <g stroke="#D7DEE8" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M72 60 Q 76 54 74 48 Q 78 42 76 36">
                    <animate attributeName="opacity" values="0;0.7;0" dur="3.2s" repeatCount="indefinite" />
                </path>
                <path d="M74 58 Q 78 52 76 46">
                    <animate attributeName="opacity" values="0;0.5;0" dur="2.6s" begin="0.6s" repeatCount="indefinite" />
                </path>
            </g>
        </g>
    ),

    // Sherlock-style pipe — straight stem coming out the mouth, bulbous bowl
    // on the right with a glowing ember and rising smoke.
    pipe: (c) => (
        <g strokeLinejoin="round">
            {/* Mouthpiece (dark stub at the mouth) */}
            <rect x="42" y="60.5" width="3" height="3" rx="0.6" fill={c.dark} />
            {/* Stem */}
            <path d="M44 62 L 60 62" stroke={c.dark} strokeWidth="3" strokeLinecap="round" />
            <path d="M44 62 L 60 62" stroke={c.main} strokeWidth="1.8" strokeLinecap="round" />
            {/* Bowl body */}
            <path d="M58 58 L 68 58 Q 70 58 70 60.5 L 70 70 Q 70 73 67 73 L 60 73 Q 57 73 57 70 L 57 61 Q 57 58 58 58 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.7" />
            {/* Bowl rim opening (top ellipse) */}
            <ellipse cx="63.5" cy="58.2" rx="5.5" ry="1.5" fill={c.dark} />
            <ellipse cx="63.5" cy="58" rx="4.3" ry="0.9" fill={c.accent} />
            {/* Glowing tobacco inside */}
            <ellipse cx="63.5" cy="58.4" rx="3.4" ry="0.7" fill="#FF6A2E">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="64.5" cy="58.4" r="0.4" fill="#FFD86B" />
            {/* Bowl side highlight */}
            <line x1="58.5" y1="62" x2="58.5" y2="70" stroke={c.accent} strokeWidth="0.5" opacity="0.55" />
            {/* Rising smoke */}
            <g stroke="#D7DEE8" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M63 56 Q 67 50 65 44 Q 69 38 67 32">
                    <animate attributeName="opacity" values="0;0.7;0" dur="3.4s" repeatCount="indefinite" />
                </path>
            </g>
        </g>
    ),

    // Referee/sports whistle with the side air-hole on top and a lanyard
    // cord hanging off the ring.
    whistle: (c) => (
        <g strokeLinejoin="round">
            {/* Main barrel */}
            <path d="M50 60 L 64 56 Q 68 56 68 60 L 68 65 Q 68 68 64 68 L 50 65 Q 48 62.5 50 60 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.7" />
            {/* Air-hole slot on top */}
            <rect x="57" y="57.5" width="6" height="2" rx="0.6" fill={c.dark} />
            {/* Loop attachment on the back end */}
            <circle cx="68" cy="63" r="2" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <circle cx="68" cy="63" r="0.9" fill={c.dark} />
            {/* Lanyard cord */}
            <path d="M70 63 Q 78 64 80 72" stroke={c.accent} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Top metallic highlight */}
            <path d="M52 60.5 L 65 57.5" stroke="#FFFFFF" strokeWidth="0.55" opacity="0.7" />
        </g>
    ),

    // Open-mouth grin showing two clear downward fangs, a hint of tongue, and
    // a blood drip below one fang.
    vampireFangs: (c) => (
        <g strokeLinejoin="round">
            {/* Open mouth (dark cavity) */}
            <path d="M40 58 Q 48 56 56 58 Q 56 66 48 67 Q 40 66 40 58 Z" fill="#2A0E1A" stroke={c.dark} strokeWidth="0.4" />
            {/* Tongue at the back */}
            <path d="M43 63.5 Q 48 66 53 63.5 Q 51 65.5 48 65.5 Q 45 65.5 43 63.5 Z" fill="#E5417A" opacity="0.85" />
            {/* Small upper teeth between the fangs */}
            <rect x="46" y="58.2" width="1.4" height="2.2" fill="#FFFDF7" />
            <rect x="48.6" y="58.2" width="1.4" height="2.2" fill="#FFFDF7" />
            {/* LEFT fang — clear pointed triangle going DOWN */}
            <path d="M43.6 58.4 L 45.4 58.4 L 44.8 65 L 44 65 Z" fill="#FFFDF7" stroke={c.dark} strokeWidth="0.4" />
            {/* RIGHT fang */}
            <path d="M50.6 58.4 L 52.4 58.4 L 52 65 L 51.2 65 Z" fill="#FFFDF7" stroke={c.dark} strokeWidth="0.4" />
            {/* Fang highlights */}
            <line x1="44.2" y1="59.5" x2="44.5" y2="63.5" stroke="#FFFFFF" strokeWidth="0.35" opacity="0.95" />
            <line x1="51.2" y1="59.5" x2="51.5" y2="63.5" stroke="#FFFFFF" strokeWidth="0.35" opacity="0.95" />
            {/* Blood drip from left fang */}
            <path d="M44.4 65 Q 44 67 44.4 69" stroke={c.accent} strokeWidth="0.6" fill="none" />
            <circle cx="44.4" cy="69.5" r="0.85" fill={c.accent} />
        </g>
    ),

    // Row of four gold capped teeth with diamond inserts. Reads as "gold
    // grill" instantly from the silhouette.
    grillz: (c) => (
        <g strokeLinejoin="round">
            {/* Dark mouth/gum backdrop */}
            <path d="M40 58 Q 48 56.5 56 58 Q 56 67 48 67 Q 40 67 40 58 Z" fill="#3A1F26" stroke={c.dark} strokeWidth="0.4" />
            {/* Gold tooth caps — 4 rectangles, slightly tapered at the bottom */}
            <g fill={c.main} stroke={c.dark} strokeWidth="0.4">
                <path d="M41 58.5 L 44 58.5 L 43.6 64.5 L 41.4 64.5 Z" />
                <path d="M44.3 58.5 L 47.3 58.5 L 47 64.7 L 44.6 64.7 Z" />
                <path d="M48.7 58.5 L 51.7 58.5 L 51.4 64.7 L 49 64.7 Z" />
                <path d="M52 58.5 L 55 58.5 L 54.6 64.5 L 52.4 64.5 Z" />
            </g>
            {/* Diamond inserts in the middle two teeth */}
            <circle cx="45.8" cy="61" r="0.7" fill="#FFFFFF" stroke={c.dark} strokeWidth="0.2" />
            <circle cx="50.2" cy="61" r="0.7" fill="#FFFFFF" stroke={c.dark} strokeWidth="0.2" />
            <circle cx="45.7" cy="60.8" r="0.25" fill="#C8E0F5" />
            <circle cx="50.1" cy="60.8" r="0.25" fill="#C8E0F5" />
            {/* Top metallic shine across the row */}
            <path d="M41.5 59.5 L 54.5 59.5" stroke="#FFFDF7" strokeWidth="0.5" opacity="0.85" />
        </g>
    ),

    // ---- Masks (hideMouth) -------------------------------------------------
    // Pleated medical mask. The horizontal pleats are the iconic feature, plus
    // ear-loops curling away to the sides and a metal nose-wire crease.
    surgeonMask: (c) => (
        <g strokeLinejoin="round">
            {/* Mask body — cinched slightly at the sides, rounded bottom */}
            <path
                d="M28 54 Q 28 53 30 53 L 66 53 Q 68 53 68 54 Q 70 60 68 66 Q 64 76 48 76 Q 32 76 28 66 Q 26 60 28 54 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.8"
            />
            {/* Nose-wire crease at the top */}
            <path d="M30 55 Q 48 52.5 66 55" stroke={c.dark} strokeWidth="0.9" fill="none" />
            {/* Horizontal pleats — the iconic surgical-mask detail */}
            <g stroke={c.dark} strokeWidth="0.45" fill="none" opacity="0.55">
                <path d="M30 60 Q 48 61 66 60" />
                <path d="M30 65 Q 48 66 66 65" />
                <path d="M32 70 Q 48 71 64 70" />
            </g>
            {/* Side cinch lines */}
            <path d="M28 60 Q 30 62 28 64" stroke={c.dark} strokeWidth="0.4" fill="none" opacity="0.6" />
            <path d="M68 60 Q 66 62 68 64" stroke={c.dark} strokeWidth="0.4" fill="none" opacity="0.6" />
            {/* Ear-loops curving away to the sides */}
            <path d="M28 55 Q 18 58 14 64" stroke={c.dark} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M68 55 Q 78 58 82 64" stroke={c.dark} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Top sheen */}
            <path d="M32 57 Q 48 56 64 57" stroke={c.accent} strokeWidth="0.5" fill="none" opacity="0.5" />
        </g>
    ),

    // Aviator oxygen mask: rectangular dark-rimmed body with a round central
    // intake valve and a corrugated hose snaking off to the side.
    pilotMask: (c) => (
        <g strokeLinejoin="round">
            {/* Outer dark rim (slightly larger) */}
            <path d="M30 53 Q 30 50 36 50 L 60 50 Q 66 50 66 53 L 66 71 Q 66 76 60 76 L 36 76 Q 30 76 30 71 Z"
                fill={c.dark} />
            {/* Mask body */}
            <path d="M32 54 Q 32 51 38 51 L 58 51 Q 64 51 64 54 L 64 70 Q 64 74 58 74 L 38 74 Q 32 74 32 70 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            {/* Soft top reflection */}
            <ellipse cx="44" cy="56" rx="7" ry="2" fill="#FFFFFF" opacity="0.35" />
            {/* Nose contour line */}
            <path d="M44 54 Q 48 57 52 54" stroke={c.dark} strokeWidth="0.5" fill="none" opacity="0.55" />
            {/* Central intake valve */}
            <circle cx="48" cy="63" r="4" fill={c.dark} stroke={c.accent} strokeWidth="0.7" />
            <circle cx="48" cy="63" r="2.6" fill={c.accent} />
            <circle cx="48" cy="63" r="1" fill={c.dark} />
            {/* Bottom tube fitting */}
            <rect x="43" y="72" width="10" height="5" rx="1.2" fill={c.dark} />
            <rect x="45" y="73.5" width="6" height="2.4" rx="0.6" fill={c.accent} opacity="0.7" />
            {/* Corrugated hose curving away */}
            <path d="M48 77 Q 56 83 66 88" stroke={c.dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M48 77 Q 56 83 66 88" stroke={c.accent} strokeWidth="1.4" fill="none" opacity="0.45" />
            <g stroke="#FFFFFF" strokeWidth="0.45" opacity="0.6" fill="none" strokeLinecap="round">
                <path d="M52 80 L 53.5 81.5" />
                <path d="M56 82.5 L 57.5 84" />
                <path d="M60 84.5 L 61.5 86" />
            </g>
            {/* Side head-straps */}
            <path d="M30 56 L 18 53" stroke={c.dark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M66 56 L 78 53" stroke={c.dark} strokeWidth="2.5" strokeLinecap="round" />
        </g>
    ),

    // Full gas mask — beefy outer rim, two clear side filter ports with bright
    // accent rings, and a big front filter canister with a perforated grill.
    gasMask: (c) => (
        <g strokeLinejoin="round">
            {/* Outer dark rim halo */}
            <path d="M22 54 Q 22 50 30 50 L 66 50 Q 74 50 74 54 L 74 74 Q 74 84 62 86 L 34 86 Q 22 84 22 74 Z"
                fill={c.dark} />
            {/* Main body */}
            <path d="M24 55 Q 24 51 32 51 L 64 51 Q 72 51 72 55 L 72 74 Q 72 82 62 84 L 34 84 Q 24 82 24 74 Z"
                fill={c.main} stroke={c.dark} strokeWidth="0.7" />
            {/* Top sheen */}
            <path d="M30 55 Q 48 53 66 55" stroke={c.accent} strokeWidth="0.55" fill="none" opacity="0.6" />
            {/* Side filter ports (round canister-like circles on each cheek) */}
            <circle cx="29" cy="64" r="4" fill={c.dark} stroke={c.accent} strokeWidth="0.7" />
            <circle cx="29" cy="64" r="2.4" fill={c.accent} />
            <circle cx="29" cy="64" r="1" fill={c.dark} />
            <circle cx="67" cy="64" r="4" fill={c.dark} stroke={c.accent} strokeWidth="0.7" />
            <circle cx="67" cy="64" r="2.4" fill={c.accent} />
            <circle cx="67" cy="64" r="1" fill={c.dark} />
            {/* Highlights on side ports */}
            <ellipse cx="27.8" cy="62.7" rx="0.9" ry="0.5" fill="#FFFFFF" opacity="0.7" />
            <ellipse cx="65.8" cy="62.7" rx="0.9" ry="0.5" fill="#FFFFFF" opacity="0.7" />
            {/* Front filter canister */}
            <rect x="38" y="70" width="20" height="14" rx="2.5" fill={c.dark} />
            <rect x="40" y="72" width="16" height="10" rx="1.5" fill={c.main} opacity="0.4" />
            {/* Centre vent grill on canister */}
            <circle cx="48" cy="77" r="4" fill={c.accent} stroke={c.dark} strokeWidth="0.6" />
            <g stroke={c.dark} strokeWidth="0.45" fill="none">
                <line x1="44.5" y1="77" x2="51.5" y2="77" />
                <line x1="48" y1="73.5" x2="48" y2="80.5" />
                <line x1="45.5" y1="74.5" x2="50.5" y2="79.5" />
                <line x1="50.5" y1="74.5" x2="45.5" y2="79.5" />
            </g>
            <circle cx="48" cy="77" r="0.9" fill={c.dark} />
            {/* Head-straps */}
            <path d="M24 58 L 14 56" stroke={c.dark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M72 58 L 82 56" stroke={c.dark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 74 L 14 78" stroke={c.dark} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M72 74 L 82 78" stroke={c.dark} strokeWidth="2.2" strokeLinecap="round" />
        </g>
    ),
};

// ---- Effects ---------------------------------------------------------------
// Animated flourishes drawn over (or around) the globe. They use SMIL <animate>
// so they play even when the mascot's framer motion is held still (e.g. shop
// previews, leaderboard avatars). 'spin' is handled directly in the Mascot.
const spark = (cx, cy, r) =>
    `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;
const heartPath = (cx, cy, s) =>
    `M${cx} ${cy} C ${cx - s * 1.8} ${cy - s * 1.6}, ${cx - s * 1.8} ${cy - s * 3.4}, ${cx} ${cy - s * 2} C ${cx + s * 1.8} ${cy - s * 3.4}, ${cx + s * 1.8} ${cy - s * 1.6}, ${cx} ${cy} Z`;

// Saturn-style planet rings. The loop is split into a FAR (back) arc and a NEAR
// (front) arc so the mascot can occlude the back of the ring: the Mascot draws
// the 'back' half *behind* the globe (so the globe body hides the middle of it,
// leaving only the tips poking out the sides) and the 'front' half on top. Both
// halves share the same rotate AND ride the same `placement` transform, so they
// stay aligned and wrap correctly no matter how the player resizes/moves the
// effect — the occlusion is the globe itself, not a fixed-radius mask.
// `sweep` picks which arc of the ellipse: 1 = top (far), 0 = bottom (near).
const ringsHalf = (half) => {
    const sweep = half === 'back' ? 1 : 0;
    return (
        <g transform="rotate(-20 48 48)" fill="none">
            <path d={`M1 48 A47 13 0 0 ${sweep} 95 48`} stroke="#FFD86B" strokeWidth="3" opacity="0.85">
                <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3s" repeatCount="indefinite" />
            </path>
            <path d={`M7 48 A41 10 0 0 ${sweep} 89 48`} stroke="#FFEFC2" strokeWidth="1.5" opacity="0.6" />
        </g>
    );
};

const EFFECT_SHAPES = {
    orbit: () => (
        <g>
            <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="6s" repeatCount="indefinite" />
            <circle cx="48" cy="4" r="5" fill="#D7DEE8" stroke="#AAB4C2" strokeWidth="1" />
            <circle cx="46" cy="3" r="1.3" fill="#AAB4C2" />
        </g>
    ),
    sparkle: () => (
        <g fill="#FFE08A">
            {[[16, 18, 2.6, 1.8], [80, 24, 2.2, 2.4], [20, 70, 2.0, 2.0], [78, 66, 2.4, 2.8], [48, 6, 2.2, 2.2], [10, 46, 1.8, 3.0]].map((s, i) => (
                <path key={i} d={spark(s[0], s[1], s[2])}>
                    <animate attributeName="opacity" values="0.1;1;0.1" dur={`${s[3]}s`} repeatCount="indefinite" />
                </path>
            ))}
        </g>
    ),
    rings: () => ringsHalf('front'),
    bubbles: () => (
        <g fill="none" stroke="#9AD0FF" strokeWidth="1.5">
            {[[30, 3.2, 2.6, 0], [50, 2.4, 3.2, 0.6], [66, 3, 2.2, 1.2], [40, 2, 3.6, 1.8]].map((b, i) => (
                <circle key={i} cx={b[0]} cy="82" r={b[1]}>
                    <animate attributeName="cy" values="82;6" dur={`${b[2]}s`} begin={`${b[3]}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.9;0" dur={`${b[2]}s`} begin={`${b[3]}s`} repeatCount="indefinite" />
                </circle>
            ))}
        </g>
    ),
    snow: () => (
        <g fill="#FFFFFF">
            {[[16, 2.4, 5, 0], [26, 1.4, 3.5, 0.6], [36, 2, 4.5, 1.2], [46, 1.6, 4, 0.3], [56, 2.6, 5.5, 0.9], [64, 1.4, 3.8, 1.6], [72, 2, 4.2, 0.4], [80, 1.6, 4.8, 1.1], [30, 1, 3, 2], [60, 1.2, 3.4, 2.4]].map((s, i) => (
                <circle key={i} cx={s[0]} cy="4" r={s[1]} opacity="0">
                    <animate attributeName="cy" values="4;88" dur={`${s[2]}s`} begin={`${s[3]}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.95;0.95;0" dur={`${s[2]}s`} begin={`${s[3]}s`} repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${s[0]};${s[0] + 3};${s[0] - 3};${s[0]}`} dur={`${s[2] * 0.6}s`} begin={`${s[3]}s`} repeatCount="indefinite" />
                </circle>
            ))}
        </g>
    ),
    hearts: () => (
        <g fill="#FF7BA0">
            {[[28, 3.4, 0], [48, 4, 0.8], [66, 3, 1.6]].map((h, i) => (
                <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values="0 0;0 -78" dur={`${h[1]}s`} begin={`${h[2]}s`} repeatCount="indefinite" />
                    <path d={heartPath(h[0], 84, 3)} opacity="0">
                        <animate attributeName="opacity" values="0;1;0" dur={`${h[1]}s`} begin={`${h[2]}s`} repeatCount="indefinite" />
                    </path>
                </g>
            ))}
        </g>
    ),
    flames: () => {
        // A fire AURA hugging the lower rim: layered tongues (dark→mid→core)
        // that flicker in HEIGHT (scaleY about each tongue's base), a soft glow,
        // and rising embers — instead of three static commas at the bottom edge.
        const tongue = (x, baseY, h, dur, begin) => (
            <g transform={`translate(${x} ${baseY})`}>
                <g>
                    <animateTransform attributeName="transform" type="scale" values="1 0.85;1 1.15;1 0.9;1 1" dur={dur} begin={begin} repeatCount="indefinite" />
                    <path d={`M-4 0 Q-2 ${-h} 0 ${-h - 3} Q2 ${-h} 4 0 Q0 -2 -4 0 Z`} fill="#C2410C" />
                    <path d={`M-3 0 Q-1.5 ${-h * 0.8} 0 ${-h - 1} Q1.5 ${-h * 0.8} 3 0 Q0 -1.5 -3 0 Z`} fill="#FF6A2E" />
                    <path d={`M-1.6 0 Q-0.8 ${-h * 0.55} 0 ${-h * 0.7} Q0.8 ${-h * 0.55} 1.6 0 Z`} fill="#FFD86B" />
                </g>
            </g>
        );
        return (
            <g>
                <ellipse cx="48" cy="76" rx="34" ry="12" fill="#FF6A2E" opacity="0.18" />
                {tongue(24, 74, 8, '0.7s', '0s')}
                {tongue(34, 78, 12, '0.6s', '0.15s')}
                {tongue(44, 80, 16, '0.55s', '0.3s')}
                {tongue(54, 80, 15, '0.6s', '0.1s')}
                {tongue(64, 78, 12, '0.5s', '0.25s')}
                {tongue(74, 74, 8, '0.7s', '0.2s')}
                {[[34, '1.8s', '0s'], [54, '2.1s', '0.5s'], [44, '1.6s', '1s']].map((e, i) => (
                    <circle key={i} cx={e[0]} cy="74" r="1" fill="#FFD86B">
                        <animate attributeName="cy" values="74;52" dur={e[1]} begin={e[2]} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;1;0" dur={e[1]} begin={e[2]} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>
        );
    },
    electric: () => {
        // Bolts anchored AROUND the rim that re-shape between two jagged states
        // (real crackle), each a fat blurred halo under a hot white core, plus a
        // pulsing electric ring.
        const bolt = (variants, dur, begin) => (
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path strokeWidth="4" stroke="#9AD0FF" opacity="0.5">
                    <animate attributeName="d" values={variants.join(';')} dur={dur} begin={begin} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.5;0;0.3;0" dur={dur} begin={begin} repeatCount="indefinite" />
                </path>
                <path strokeWidth="1.3" stroke="#FFFFFF">
                    <animate attributeName="d" values={variants.join(';')} dur={dur} begin={begin} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0;0.5;0" dur={dur} begin={begin} repeatCount="indefinite" />
                </path>
            </g>
        );
        return (
            <g>
                <circle cx="48" cy="48" r="36" fill="none" stroke="#7FD0FF" strokeWidth="1" opacity="0">
                    <animate attributeName="opacity" values="0;0.4;0" dur="1.1s" repeatCount="indefinite" />
                </circle>
                {bolt(['M18 38 L24 44 L20 48 L27 56', 'M18 38 L23 45 L19 49 L26 55'], '0.9s', '0s')}
                {bolt(['M78 36 L72 44 L77 48 L69 58', 'M78 36 L73 43 L76 49 L70 57'], '0.9s', '0.3s')}
                {bolt(['M40 14 L44 20 L40 23 L46 28', 'M40 14 L43 21 L39 24 L45 29'], '1.1s', '0.5s')}
                {bolt(['M70 72 L66 78 L70 80 L64 86', 'M70 72 L67 79 L71 81 L65 85'], '1s', '0.15s')}
            </g>
        );
    },
    confetti: () => (
        <g>
            {[['#FF5C6C', 26, 0, 3.2], ['#FFC247', 42, 0.6, 3.8], ['#19C37D', 58, 1.2, 3.0], ['#5B5BF6', 70, 1.8, 3.6]].map((c, i) => (
                <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values="0 0;0 82" dur={`${c[3]}s`} begin={`${c[2]}s`} repeatCount="indefinite" />
                    <rect x={c[1]} y="2" width="3.6" height="3.6" rx="0.6" fill={c[0]} opacity="0">
                        <animate attributeName="opacity" values="0;1;0" dur={`${c[3]}s`} begin={`${c[2]}s`} repeatCount="indefinite" />
                    </rect>
                </g>
            ))}
        </g>
    ),
    notes: () => (
        // Floating musical notes (8th-note glyphs) drifting up and away.
        <g fill="#7A4FD0">
            {[[16, 0, 3.0], [30, 0.7, 3.6], [66, 1.2, 3.2], [80, 1.9, 3.8]].map((n, i) => (
                <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values={`0 0;${i % 2 ? '-4' : '4'} -78`} dur={`${n[2]}s`} begin={`${n[1]}s`} repeatCount="indefinite" />
                    <g opacity="0">
                        <animate attributeName="opacity" values="0;1;0" dur={`${n[2]}s`} begin={`${n[1]}s`} repeatCount="indefinite" />
                        <ellipse cx={n[0]} cy="84" rx="2.6" ry="2" transform={`rotate(-20 ${n[0]} 84)`} />
                        <rect x={n[0] + 1.4} y="74" width="1.3" height="10" />
                        <path d={`M ${n[0] + 2.7} 74 q 4 1 4 5`} stroke="#7A4FD0" strokeWidth="1.4" fill="none" />
                    </g>
                </g>
            ))}
        </g>
    ),
    disco: () => (
        // Rotating colored "spotlight" dots circling the globe.
        <g>
            <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="4s" repeatCount="indefinite" />
            {[['#FF5C6C', 0], ['#FFC247', 60], ['#19C37D', 120], ['#2EC4D3', 180], ['#5B5BF6', 240], ['#FF3FD0', 300]].map(([color, a], i) => {
                const rad = (a * Math.PI) / 180;
                return (
                    <circle key={i} cx={48 + Math.cos(rad) * 42} cy={48 + Math.sin(rad) * 42} r="3.2" fill={color} opacity="0.85">
                        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                    </circle>
                );
            })}
        </g>
    ),

    // ---- Reptile-themed Atlas Pass effects ---------------------------------
    // scaleFall: glittering diamond scales drifting downward — each with a
    // glossy highlight crescent and a sparkle dot for a jewel-like feel.
    // Mixed greens with a gold accent flake for richness.
    scaleFall: () => (
        <g>
            {[
                ['#19C37D', '#9DEFC2', 16, 0, 3.4, 0],
                ['#3FAA60', '#B5F0CC', 30, 0.4, 3.8, 12],
                ['#7FE05B', '#FFFDF7', 44, 1.0, 3.2, -8],
                ['#19A36B', '#7FE05B', 58, 1.6, 3.6, 16],
                ['#FFD86B', '#FFFDF7', 70, 2.0, 3.0, -14],
                ['#5BAE3F', '#A8E0B5', 82, 0.7, 3.5, 4],
            ].map(([color, hi, x, begin, dur, rot], i) => (
                <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values="0 -10;0 92" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                    <g transform={`rotate(${rot} ${x} 0)`} opacity="0">
                        <animate attributeName="opacity" values="0;0.95;0" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                        {/* Diamond scale body with dark rim */}
                        <path d={`M${x} -2 l 3.4 5 l -3.4 5 l -3.4 -5 Z`} fill={color} stroke="#0F4A2A" strokeWidth="0.5" />
                        {/* Glossy crescent highlight */}
                        <path d={`M${x - 1.4} 0.3 q 1.5 1.4 2.8 0.6`} stroke={hi} strokeWidth="0.9" fill="none" strokeLinecap="round" />
                        {/* Sparkle dot */}
                        <circle cx={x - 0.4} cy="1.6" r="0.55" fill="#FFFFFF" opacity="0.85" />
                    </g>
                </g>
            ))}
        </g>
    ),

    // dragonBreath: a roiling jet of fire blasting *out of the mouth* to the
    // right — the classic dragon pose. Five layered cones (halo -> outer ->
    // mid -> inner -> white-hot tongue) with billowing top/bottom edges, each
    // pulsing out of phase. Trailing ember sparks ride the slipstream outward
    // and up. The whole jet sits beyond the right edge of the globe (Mascot
    // renders with overflow:visible) so it reads as breath, not a side flame.
    dragonBreath: () => (
        <g>
            {/* Soft outer glow halo — widest billowing cone */}
            <path d="M54 58 Q72 38 96 42 Q116 50 122 60 Q116 70 96 78 Q72 82 54 62 Z" fill="#FF6A2E" opacity="0.3">
                <animate attributeName="opacity" values="0.14;0.46;0.14" dur="1.7s" repeatCount="indefinite" />
            </path>
            {/* Outer cone */}
            <path d="M55 58 Q72 44 94 48 Q112 54 116 60 Q112 66 94 74 Q72 76 55 62 Z" fill="#FF6A2E" opacity="0.6">
                <animate attributeName="opacity" values="0.35;0.85;0.35" dur="1.4s" repeatCount="indefinite" />
            </path>
            {/* Middle warmer band */}
            <path d="M55 58 Q74 48 92 52 Q106 56 108 60 Q106 64 92 70 Q74 72 55 62 Z" fill="#FFA34A" opacity="0.78">
                <animate attributeName="opacity" values="0.45;1;0.45" dur="1.15s" repeatCount="indefinite" />
            </path>
            {/* Inner bright core */}
            <path d="M55 59 Q74 54 88 56 Q98 58 100 60 Q98 62 88 66 Q74 68 55 61 Z" fill="#FFD86B" opacity="0.9">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
            </path>
            {/* White-hot tongue flicker */}
            <path d="M55 60 Q66 59 78 59 Q86 60 86 60 Q86 60 78 61 Q66 61 55 60 Z" fill="#FFFDF7" opacity="0.9">
                <animate attributeName="opacity" values="0.25;1;0.25" dur="0.7s" repeatCount="indefinite" />
            </path>
            {/* Ember sparks riding the jet outward + drifting up.
                Start points seeded along the cone; each animates to its target
                ~18px further right and ~10px up over 2s, with a bright pip. */}
            {[[70, 52, 1.8, 0], [82, 58, 1.4, 0.5], [78, 68, 1.6, 1.0], [94, 54, 1.2, 1.5], [102, 62, 1.5, 0.8], [88, 72, 1.1, 1.8]].map(([x, y, r, b], i) => (
                <g key={i}>
                    <circle cx={x} cy={y} r={r} fill="#FFC247">
                        <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                        <animate attributeName="cx" values={`${x};${x + 18}`} dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values={`${y};${y - 10}`} dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                    </circle>
                    <circle cx={x} cy={y} r={r * 0.45} fill="#FFFDF7">
                        <animate attributeName="opacity" values="0;0.9;0" dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                        <animate attributeName="cx" values={`${x};${x + 18}`} dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values={`${y};${y - 10}`} dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                    </circle>
                </g>
            ))}
        </g>
    ),

    // swampMist: soft green tendrils rising from below the globe. Each tendril
    // has a thicker, lower-opacity halo layer behind a sharper stroke, plus a
    // drifting droplet, so the mist reads as volumetric and slowly billowing.
    swampMist: () => (
        <g>
            {/* Lower fog band hugging the globe */}
            <ellipse cx="48" cy="84" rx="44" ry="5" fill="#7FE05B" opacity="0.22">
                <animate attributeName="opacity" values="0.12;0.32;0.12" dur="3s" repeatCount="indefinite" />
            </ellipse>
            {[
                [20, 0.0, 3.6, '#3FAA60'],
                [40, 0.6, 4.2, '#7FE05B'],
                [56, 1.2, 3.4, '#A8E0B5'],
                [72, 1.8, 4.0, '#5BAE3F'],
            ].map(([x, b, d, color], i) => (
                <g key={i}>
                    {/* Soft halo layer behind */}
                    <path d={`M${x} 88 Q${x + 6} 76 ${x - 4} 60 Q${x + 8} 44 ${x} 28`}
                        stroke={color} strokeWidth="5.5" fill="none" opacity="0" strokeLinecap="round">
                        <animate attributeName="opacity" values="0;0.32;0" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
                        <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
                    </path>
                    {/* Main tendril */}
                    <path d={`M${x} 88 Q${x + 6} 76 ${x - 4} 60 Q${x + 8} 44 ${x} 28`}
                        stroke={color} strokeWidth="2" fill="none" opacity="0" strokeLinecap="round">
                        <animate attributeName="opacity" values="0;0.75;0" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
                        <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
                    </path>
                    {/* Droplet trailing up the tendril */}
                    <circle cx={x + 3} cy="70" r="1" fill={color} opacity="0">
                        <animate attributeName="opacity" values="0;0.8;0" dur={`${d}s`} begin={`${b + 0.4}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values="72;28" dur={`${d}s`} begin={`${b + 0.4}s`} repeatCount="indefinite" />
                    </circle>
                </g>
            ))}
        </g>
    ),

    // meteorShower (Atlas Pass — S1 extension): meteors streak diagonally down
    // across the globe, each a white-hot head trailing a tapered fiery tail,
    // with a few impact sparkles popping near the lower-left rim. The parent g
    // owns the travel translate; the inner g positions + draws each meteor.
    meteorShower: () => {
        const meteor = (sx, sy, len, dur, begin, hue) => (
            <g opacity="0">
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.7;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="24 -24; -30 54" keyTimes="0;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                <g transform={`translate(${sx} ${sy})`}>
                    {/* Tail trails up-right (behind the down-left motion) */}
                    <path d={`M0 0 L ${len * 0.72} ${-len} L ${len * 0.2} ${-len * 0.5} Z`} fill={hue} opacity="0.5" />
                    <path d={`M0 0 L ${len * 0.42} ${-len * 0.92} L ${len * 0.1} ${-len * 0.5} Z`} fill="#FFE08A" opacity="0.85" />
                    {/* Glowing head */}
                    <circle cx="0" cy="0" r="3.4" fill={hue} opacity="0.5" />
                    <circle cx="0" cy="0" r="2.1" fill="#FFFDF7" />
                </g>
            </g>
        );
        return (
            <g>
                {meteor(70, 8, 14, 1.6, 0, '#FF8A3F')}
                {meteor(86, 26, 11, 1.9, 0.5, '#FFC247')}
                {meteor(60, 2, 16, 2.2, 1.0, '#FF6A2E')}
                {meteor(92, 44, 10, 1.7, 1.5, '#FFD86B')}
                {/* Impact sparkles flaring near the lower-left rim */}
                {[[20, 72, 0.3], [30, 80, 0.9], [14, 60, 1.4]].map(([x, y, b], i) => (
                    <circle key={i} cx={x} cy={y} r="1.5" fill="#FFE08A" opacity="0">
                        <animate attributeName="opacity" values="0;1;0" dur="0.6s" begin={`${b}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>
        );
    },
};

export function renderEffect(id) {
    const item = EFFECTS[id];
    if (!item || !item.kind || item.kind === 'spin') return null; // 'spin' handled in Mascot
    const draw = EFFECT_SHAPES[item.kind];
    return draw ? draw() : null;
}

// The far side of an effect that should render *behind* the globe so the mascot
// occludes it. Only the planet rings need this (the back half of the loop); for
// every other effect this is null and the whole thing draws on top via
// renderEffect. Mascot wraps this in the same `placement` transform as the
// front half so the two stay aligned.
export function renderEffectBehind(id) {
    const item = EFFECTS[id];
    if (!item || item.kind !== 'rings') return null;
    return ringsHalf('back');
}

export function renderHat(id) {
    const item = HATS[id];
    if (!item || !item.shape) return null;
    const draw = HAT_SHAPES[item.shape];
    return draw ? draw(item.c || {}) : null;
}

export function renderGlasses(id) {
    const item = GLASSES[id];
    if (!item || !item.shape) return null;
    const draw = GLASS_SHAPES[item.shape];
    return draw ? draw(item.c || {}) : null;
}

export function renderMouth(id) {
    const item = MOUTHS[id];
    if (!item || !item.shape) return null;
    const draw = MOUTH_SHAPES[item.shape];
    return draw ? draw(item.c || {}) : null;
}

// True if the equipped mouth cosmetic visually replaces the default mood mouth
// (lipstick, masks, fangs, etc.). Mascot hides the mood mouth in that case so
// the cosmetic reads cleanly instead of having a line bleeding through.
export function mouthHidesMood(id) {
    const item = MOUTHS[id];
    return !!(item && item.hideMouth);
}

// ---- Emotes ---------------------------------------------------------------
// Emotes are short, one-shot SMIL animations that layer on top of the mascot
// when a spectator reacts. Each EMOTE_SHAPES[kind] is a function returning
// SVG nodes; the SMIL `begin` triggers run from element mount. The whole
// overlay is keyed on `playId` upstream (see Mascot.jsx) so a new reaction
// remounts the SVG and replays cleanly.
const EMOTE_DUR = 2.0; // seconds — one-shot, then the overlay component unmounts
const EMOTE_SHAPES = {
    // Wave: a flagpole planted to the right of the mascot with a brightly
    // coloured flag that ripples nonstop. The whole pole rocks gently back
    // and forth (pivoting at the base) for the classic "wave" motion, and
    // a popping "HI!" speech bubble + friendship sparkles round it out.
    wave: () => (
        <g>
            {/* Flagpole + flag — pivots around the base (82, 58) so the rig
                sways like a hand wave. The flag itself flutters continuously
                by animating its `d` between two ripple shapes. */}
            <g>
                <animateTransform attributeName="transform" type="rotate"
                    values="-14 82 58; 14 82 58; -12 82 58; 12 82 58; -6 82 58; 4 82 58; 0 82 58"
                    keyTimes="0; 0.16; 0.32; 0.48; 0.64; 0.8; 1"
                    dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                {/* pole shaft */}
                <rect x="80.6" y="6" width="2.8" height="54" rx="1.2" fill="#8A5A30" stroke="#1F1A3B" strokeWidth="1.4" />
                {/* gold ball finial */}
                <circle cx="82" cy="5" r="3" fill="#FFC247" stroke="#1F1A3B" strokeWidth="1.4" />
                {/* Pennant flag — triangular celebration flag, not any
                    nation's design. Pink-red top half, gold bottom half (the
                    Flag Game brand colors). The tip ripples by animating the
                    middle vertex's Y position. Two stacked triangles share
                    the same animated `d` shape so the seam stays aligned. */}
                <path fill="#FF5C6C" stroke="#1F1A3B" strokeWidth="1.6" strokeLinejoin="round"
                    d="M83 8 L 110 16 L 96 16 Z">
                    <animate attributeName="d"
                        values="M83 8 L 110 16 L 96 16 Z;
                                M83 8 L 110 13 L 96 16 Z;
                                M83 8 L 110 16 L 96 16 Z;
                                M83 8 L 110 19 L 96 16 Z;
                                M83 8 L 110 16 L 96 16 Z"
                        keyTimes="0; 0.25; 0.5; 0.75; 1"
                        dur="0.7s"
                        repeatCount="indefinite" />
                </path>
                <path fill="#FFC247" stroke="#1F1A3B" strokeWidth="1.6" strokeLinejoin="round"
                    d="M83 24 L 110 16 L 96 16 Z">
                    <animate attributeName="d"
                        values="M83 24 L 110 16 L 96 16 Z;
                                M83 24 L 110 13 L 96 16 Z;
                                M83 24 L 110 16 L 96 16 Z;
                                M83 24 L 110 19 L 96 16 Z;
                                M83 24 L 110 16 L 96 16 Z"
                        keyTimes="0; 0.25; 0.5; 0.75; 1"
                        dur="0.7s"
                        repeatCount="indefinite" />
                </path>
            </g>
            {/* Speech bubble with HI! — nested groups so scale + translate
                stack reliably without additive="sum" */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 1; 0" keyTimes="0; 0.15; 0.55; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate"
                    values="0 8; 0 0; 0 -4; 0 -12"
                    keyTimes="0; 0.3; 0.7; 1"
                    dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g>
                    <animateTransform attributeName="transform" type="scale"
                        values="0.3; 1.35; 1; 1.1; 1"
                        keyTimes="0; 0.2; 0.5; 0.75; 1"
                        dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <g transform="translate(2 -6)">
                        <rect x="0" y="0" width="44" height="24" rx="10" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="2" />
                        <path d="M16 24 L22 34 L28 24 Z" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="2" />
                        <text x="22" y="17" textAnchor="middle" fontSize="14" fontWeight="900" fill="#1F1A3B">HI!</text>
                    </g>
                </g>
            </g>
            {/* Friendship sparkles drifting up around the hand. Static
                position on the parent g; the path itself owns the translate
                animation so no additive stacking is needed. */}
            {[[88, 18, 0], [76, 4, 0.2], [94, 30, 0.35], [70, 14, 0.5]].map(([cx, cy, begin], i) => (
                <g key={i} transform={`translate(${cx} ${cy})`}>
                    <path d="M0 -6 L 1.6 -1.6 L 6 0 L 1.6 1.6 L 0 6 L -1.6 1.6 L -6 0 L -1.6 -1.6 Z" fill="#FFD86B" opacity="0">
                        <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10" keyTimes="0; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                    </path>
                </g>
            ))}
        </g>
    ),
    // Cheer: full-screen confetti rain + bursting sparkles + "YAY!" banner.
    cheer: () => (
        <g>
            {/* Sun-burst halo bloom behind everything */}
            <circle cx="48" cy="48" r="20" fill="#FFC247" opacity="0">
                <animate attributeName="opacity" values="0; 0.55; 0" keyTimes="0; 0.3; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animate attributeName="r" values="20; 56" keyTimes="0; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </circle>
            {/* Sparkle bursts — two waves */}
            {[[20, 20, 0, 8], [76, 22, 0.05, 9], [18, 70, 0.1, 7], [78, 70, 0.15, 8],
              [10, 46, 0.05, 7], [86, 46, 0.1, 8], [48, 8, 0, 9], [48, 88, 0.15, 8],
              [30, 88, 0.45, 7], [66, 6, 0.55, 8], [4, 30, 0.5, 7], [92, 64, 0.45, 7]].map(([cx, cy, begin, size], i) => (
                <g key={i} transform={`translate(${cx} ${cy})`}>
                    <path d={`M0 -${size} L 1.6 -1.6 L ${size} 0 L 1.6 1.6 L 0 ${size} L -1.6 1.6 L -${size} 0 L -1.6 -1.6 Z`} fill="#FFC247" opacity="0">
                        <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.5; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                        <animateTransform attributeName="transform" type="scale" values="0.2; 1.6; 0.3" keyTimes="0; 0.5; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                    </path>
                </g>
            ))}
            {/* Confetti rectangles raining down */}
            {[['#FF5C6C', 14, -8, 0], ['#19C37D', 28, -14, 0.15], ['#5AC8FA', 44, -10, 0.3],
              ['#FFC247', 60, -16, 0.05], ['#B16BFF', 76, -10, 0.2], ['#FF8A3F', 88, -14, 0.35]].map(([color, x, y, begin], i) => (
                <rect key={i} x={x} y={y} width="4" height="7" rx="1" fill={color} opacity="0">
                    <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.15; 0.85; 1" begin={`${begin}s`} dur="1.4s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values="0 0; 0 110" keyTimes="0; 1" begin={`${begin}s`} dur="1.4s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="rotate" values="0; 720" keyTimes="0; 1" begin={`${begin}s`} dur="1.4s" repeatCount="1" fill="freeze" additive="sum" />
                </rect>
            ))}
            {/* YAY! banner — pops in, hangs, drifts up */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 4; 0 -2; 0 -6; 0 -14" keyTimes="0; 0.3; 0.7; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="scale" values="0.3; 1.3; 1.15; 1.1" keyTimes="0; 0.25; 0.6; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" additive="sum" />
                <text x="48" y="0" textAnchor="middle" fontSize="22" fontWeight="900" fill="#FFC247" stroke="#1F1A3B" strokeWidth="2" paintOrder="stroke">YAY!</text>
            </g>
        </g>
    ),
    // Laugh: multiple "HA" bursts at different sizes, tears of joy, full body shake.
    laugh: () => (
        <g>
            {/* The big HAHAHA! shaking banner */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.1; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate"
                    values="0 0; 3 -2; -3 -1; 3 -2; -3 -1; 2 -2; -2 -1; 0 0"
                    keyTimes="0; 0.14; 0.28; 0.42; 0.56; 0.7; 0.85; 1"
                    dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="scale"
                    values="0.5; 1.3; 1.1; 1.2; 1.1"
                    keyTimes="0; 0.2; 0.5; 0.8; 1"
                    dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" additive="sum" />
                <text x="48" y="14" textAnchor="middle" fontSize="20" fontWeight="900" fill="#FFC247" stroke="#1F1A3B" strokeWidth="2" paintOrder="stroke">HAHAHA!</text>
            </g>
            {/* Smaller satellite HAs orbiting at staggered times */}
            {[[8, 36, 'HA', 0.3, 11], [86, 38, 'HA', 0.5, 11], [16, 76, 'ha', 0.7, 9], [82, 78, 'ha', 0.9, 9]].map(([x, y, txt, begin, size], i) => (
                <text key={i} x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="900" fill="#FFC247" stroke="#1F1A3B" strokeWidth="1.4" paintOrder="stroke" opacity="0">
                    {txt}
                    <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.3; 0.8; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="scale" values="0.4; 1.3; 1" keyTimes="0; 0.5; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                </text>
            ))}
            {/* Tears of joy squirting from the eyes */}
            {[36, 60].map((cx, i) => (
                <path key={i} d={`M${cx} 48 q-2 5 0 8 q2 -3 0 -8 Z`} fill="#2EC4D3" stroke="#1F8AAE" strokeWidth="0.8" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.2; 1" begin="0.4s" dur="1.2s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values={`0 0; ${i === 0 ? -10 : 10} 26`} keyTimes="0; 1" begin="0.4s" dur="1.2s" repeatCount="1" fill="freeze" />
                </path>
            ))}
        </g>
    ),
    // Crying: heavy fountain of tears, droplet splash, sad cloud raining above.
    cry: () => (
        <g>
            {/* Sad rain cloud above the mascot */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0.6" keyTimes="0; 0.25; 0.9; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 -6; 0 0" keyTimes="0; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <ellipse cx="48" cy="6" rx="22" ry="9" fill="#6E7E9A" stroke="#3D4761" strokeWidth="1.4" />
                <circle cx="34" cy="4" r="6" fill="#6E7E9A" stroke="#3D4761" strokeWidth="1.4" />
                <circle cx="60" cy="2" r="7" fill="#6E7E9A" stroke="#3D4761" strokeWidth="1.4" />
            </g>
            {/* Drips from the cloud */}
            {[[36, 14, 0.3], [48, 16, 0.5], [60, 14, 0.7], [42, 18, 0.9], [56, 18, 1.1]].map(([cx, cy, begin], i) => (
                <path key={i} d={`M${cx} ${cy} q-1.6 4 0 7 q1.6 -3 0 -7 Z`} fill="#2EC4D3" stroke="#1F8AAE" strokeWidth="0.7" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.3; 1" begin={`${begin}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values="0 0; 0 28" keyTimes="0; 1" begin={`${begin}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                </path>
            ))}
            {/* The mascot's own big eye-tears — bigger, more, longer */}
            {[[36, 50, 0, -6], [38, 52, 0.15, -8], [60, 50, 0.05, 6], [58, 52, 0.2, 8]].map(([cx, cy, begin, dx], i) => (
                <path key={i} d={`M${cx} ${cy} q-2.5 7 0 11 q2.5 -4 0 -11 Z`} fill="#2EC4D3" stroke="#1F8AAE" strokeWidth="1" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.15; 0.85; 1" begin={`${begin}s`} dur={`${EMOTE_DUR - begin}s`} repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values={`0 0; ${dx} 22; ${dx * 1.4} 36`} keyTimes="0; 0.6; 1" begin={`${begin}s`} dur={`${EMOTE_DUR - begin}s`} repeatCount="1" fill="freeze" />
                </path>
            ))}
            {/* Splash puddles where the tears land */}
            {[28, 68].map((cx, i) => (
                <ellipse key={i} cx={cx} cy="92" rx="0" ry="0" fill="#2EC4D3" stroke="#1F8AAE" strokeWidth="0.8" opacity="0">
                    <animate attributeName="opacity" values="0; 0.8; 0.6" keyTimes="0; 0.5; 1" begin="0.9s" dur="1.1s" repeatCount="1" fill="freeze" />
                    <animate attributeName="rx" values="0; 8; 11" keyTimes="0; 0.5; 1" begin="0.9s" dur="1.1s" repeatCount="1" fill="freeze" />
                    <animate attributeName="ry" values="0; 2; 2.4" keyTimes="0; 0.5; 1" begin="0.9s" dur="1.1s" repeatCount="1" fill="freeze" />
                </ellipse>
            ))}
        </g>
    ),
    // Shocked: white flash, giant "!", radial impact lines, mark shakes hard.
    shocked: () => (
        <g>
            {/* Bright white flash burst */}
            <circle cx="48" cy="48" r="20" fill="#FFFFFF" opacity="0">
                <animate attributeName="opacity" values="0; 0.85; 0" keyTimes="0; 0.1; 0.45" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animate attributeName="r" values="10; 60" keyTimes="0; 0.45" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </circle>
            {/* Radial impact lines */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line key={deg} x1="48" y1="48" x2="48" y2="48" stroke="#1F1A3B" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${deg} 48 48)`} opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" dur="0.8s" repeatCount="1" fill="freeze" />
                    <animate attributeName="y1" values="48; 14" keyTimes="0; 1" dur="0.8s" repeatCount="1" fill="freeze" />
                    <animate attributeName="y2" values="48; 4" keyTimes="0; 1" dur="0.8s" repeatCount="1" fill="freeze" />
                </line>
            ))}
            {/* The giant "!" — pops in big, shakes, lingers */}
            <g transform="translate(48 -6)" opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 1; 0" keyTimes="0; 0.2; 0.5; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="scale" values="0; 1.8; 1.3; 1.5; 1.2" keyTimes="0; 0.25; 0.5; 0.75; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 0; 2 0; -2 0; 1 0; 0 0" keyTimes="0; 0.55; 0.7; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" additive="sum" />
                <rect x="-5" y="-22" width="10" height="22" rx="2.5" fill="#E5414C" stroke="#1F1A3B" strokeWidth="1.6" />
                <circle cx="0" cy="6" r="4.2" fill="#E5414C" stroke="#1F1A3B" strokeWidth="1.6" />
            </g>
            {/* Two extra mini "!" on the sides */}
            {[[14, 14, 0.4], [82, 14, 0.5]].map(([x, y, begin], i) => (
                <g key={i} transform={`translate(${x} ${y})`} opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.3; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="scale" values="0; 1.2; 0.6" keyTimes="0; 0.4; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                    <rect x="-2" y="-10" width="4" height="10" rx="1" fill="#E5414C" stroke="#1F1A3B" strokeWidth="1" />
                    <circle cx="0" cy="4" r="2" fill="#E5414C" stroke="#1F1A3B" strokeWidth="1" />
                </g>
            ))}
        </g>
    ),
    // Spin Around: counter-rotating dashed rings, rainbow orbiters, motion-
    // blur arcs sweeping the circle, and a "WHEEE!" banner orbiting around
    // the mascot. All rotations bake in the (48, 48) pivot directly so no
    // additive="sum" stacking is needed (browsers are unreliable about that).
    spinAround: () => (
        <g>
            {/* Outer dashed ring spinning clockwise */}
            <circle cx="48" cy="48" r="44" fill="none" stroke="#FFC247" strokeWidth="3" strokeDasharray="6 8" opacity="0">
                <animate attributeName="opacity" values="0; 0.9; 0.9; 0" keyTimes="0; 0.15; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="900 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </circle>
            {/* Inner dashed ring spinning counter-clockwise */}
            <circle cx="48" cy="48" r="32" fill="none" stroke="#5AC8FA" strokeWidth="2.5" strokeDasharray="4 6" opacity="0">
                <animate attributeName="opacity" values="0; 0.85; 0.85; 0" keyTimes="0; 0.15; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="-900 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </circle>
            {/* Rainbow orbiters — positions baked at construction so the
                rotate replaces (not stacks with) the base transform. */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.1; 0.9; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="1080 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                {[['#FF5C6C', 0], ['#FFC247', 60], ['#19C37D', 120], ['#5AC8FA', 180], ['#B16BFF', 240], ['#FF8A3F', 300]].map(([color, deg], i) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const cx = 48 + 42 * Math.cos(rad);
                    const cy = 48 + 42 * Math.sin(rad);
                    return <circle key={i} cx={cx} cy={cy} r="4" fill={color} stroke="#1F1A3B" strokeWidth="0.8" />;
                })}
            </g>
            {/* Motion-blur arcs sweeping around the perimeter */}
            {[0, 0.2, 0.4, 0.6, 0.8].map((begin, i) => (
                <path key={i} d="M 18 48 A 30 30 0 0 1 78 48" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0">
                    <animate attributeName="opacity" values="0; 0.8; 0" keyTimes="0; 0.3; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                </path>
            ))}
            {/* WHEEE! banner orbiting around the mascot. The text is parked
                above (48, 0) and the parent g rotates around (48, 48), so it
                sweeps in a full circle. */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="540 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <text x="48" y="-2" textAnchor="middle" fontSize="14" fontWeight="900" fill="#FFC247" stroke="#1F1A3B" strokeWidth="1.8" paintOrder="stroke">WHEEE!</text>
            </g>
            {/* Tiny stars circling at a tighter radius, also baked positions */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.15; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="-720 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                {[0, 90, 180, 270].map((deg, i) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const cx = 48 + 22 * Math.cos(rad);
                    const cy = 48 + 22 * Math.sin(rad);
                    return (
                        <path key={i} d={`M${cx} ${cy - 4} L ${cx + 1.2} ${cy - 1.2} L ${cx + 4} ${cy} L ${cx + 1.2} ${cy + 1.2} L ${cx} ${cy + 4} L ${cx - 1.2} ${cy + 1.2} L ${cx - 4} ${cy} L ${cx - 1.2} ${cy - 1.2} Z`} fill="#FFFFFF" />
                    );
                })}
            </g>
        </g>
    ),
    // Heart Burst: pink halo bloom, a tight radial wave of 12 hearts shooting
    // out from the mascot, and 5 bigger drifting hearts that float up after.
    // End positions are baked at construction so each heart owns a single
    // translate animation — no additive="sum" stacking (browsers handle that
    // unreliably and the hearts vanish on some builds).
    heartBurst: () => (
        <g>
            {/* Pink halo bloom behind everything */}
            <circle cx="48" cy="48" r="18" fill="#FFB5C5" opacity="0">
                <animate attributeName="opacity" values="0; 0.7; 0" keyTimes="0; 0.35; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animate attributeName="r" values="18; 56" keyTimes="0; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </circle>
            {/* Wave 1: 12 hearts radiating out. Each heart sits at (48, 48)
                and translates toward its baked end position. */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const rad = ((deg - 90) * Math.PI) / 180;
                const endX = 44 * Math.cos(rad);
                const endY = 44 * Math.sin(rad);
                return (
                    <g key={deg} transform="translate(48 48)">
                        <path d="M0 -2 q-4 -6 -8 -2 q-4 4 0 10 q4 6 8 8 q4 -2 8 -8 q4 -6 0 -10 q-4 -4 -8 2 Z"
                            fill="#FF5C6C" stroke="#B5303A" strokeWidth="1" opacity="0">
                            <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.7; 1" dur="1.3s" repeatCount="1" fill="freeze" />
                            <animateTransform attributeName="transform" type="translate" values={`0 0; ${endX} ${endY}`} keyTimes="0; 1" dur="1.3s" repeatCount="1" fill="freeze" />
                        </path>
                    </g>
                );
            })}
            {/* Wave 2: bigger drifting hearts. Static `scale(1.6)` on the
                parent g (size is fixed; no need to animate it) and the path
                handles the upward translate animation. */}
            {[[22, 60, 0.5, '#FF5C6C'], [74, 60, 0.55, '#FFB5C5'], [48, 64, 0.65, '#FF5C6C'], [12, 42, 0.75, '#FFB5C5'], [84, 42, 0.85, '#FF5C6C']].map(([cx, cy, begin, color], i) => (
                <g key={i} transform={`translate(${cx} ${cy}) scale(1.6)`}>
                    <path d="M0 -2 q-4 -6 -8 -2 q-4 4 0 10 q4 6 8 8 q4 -2 8 -8 q4 -6 0 -10 q-4 -4 -8 2 Z"
                        fill={color} stroke="#B5303A" strokeWidth="1" opacity="0">
                        <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.25; 0.75; 1" begin={`${begin}s`} dur="1.2s" repeatCount="1" fill="freeze" />
                        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -28" keyTimes="0; 1" begin={`${begin}s`} dur="1.2s" repeatCount="1" fill="freeze" />
                    </path>
                </g>
            ))}
            {/* A big pulsing heart at the center of the bloom — anchors the
                whole effect so even before the hearts fly the eye reads
                "love" immediately. */}
            <g transform="translate(48 48)">
                <path d="M0 -4 q-8 -12 -16 -4 q-8 8 0 20 q8 12 16 16 q8 -4 16 -16 q8 -12 0 -20 q-8 -8 -16 4 Z"
                    fill="#FF5C6C" stroke="#B5303A" strokeWidth="1.4" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.15; 0.55; 0.8" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="scale" values="0.3; 1.2; 1; 1.15; 0.9" keyTimes="0; 0.2; 0.45; 0.65; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                </path>
            </g>
        </g>
    ),
    // Big Bounce: deep squash shadow + impact rings + dust puffs + "BOING!"
    bounce: () => (
        <g>
            {/* Shadow squash + stretch */}
            <ellipse cx="48" cy="90" rx="26" ry="4" fill="#1F1A3B" opacity="0">
                <animate attributeName="rx" values="26; 10; 34; 14; 32; 20; 28" keyTimes="0; 0.25; 0.45; 0.65; 0.8; 0.92; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animate attributeName="ry" values="4; 2; 5; 3; 4.5; 3.5; 4" keyTimes="0; 0.25; 0.45; 0.65; 0.8; 0.92; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animate attributeName="opacity" values="0; 0.6; 0.2; 0.55; 0.25; 0.4; 0.2" keyTimes="0; 0.25; 0.45; 0.65; 0.8; 0.92; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </ellipse>
            {/* Impact rings at first landing */}
            {[0.4, 0.55].map((begin, i) => (
                <ellipse key={i} cx="48" cy="90" rx="0" ry="0" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0">
                    <animate attributeName="opacity" values="0; 0.9; 0" keyTimes="0; 0.2; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                    <animate attributeName="rx" values="6; 36" keyTimes="0; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                    <animate attributeName="ry" values="1.5; 7" keyTimes="0; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                </ellipse>
            ))}
            {/* Dust puff clouds */}
            {[[18, 86, 0.42, -1], [78, 86, 0.42, 1], [10, 80, 0.45, -1], [86, 80, 0.45, 1]].map(([cx, cy, begin, dx], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="#C9C2D1" stroke="#5B5168" strokeWidth="0.8" opacity="0">
                    <animate attributeName="opacity" values="0; 0.8; 0" keyTimes="0; 0.3; 1" begin={`${begin}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                    <animate attributeName="r" values="3; 7" keyTimes="0; 1" begin={`${begin}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values={`0 0; ${dx * 10} -4`} keyTimes="0; 1" begin={`${begin}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                </circle>
            ))}
            {/* Whoosh lines when launching upward */}
            <g stroke="#1F1A3B" strokeWidth="1.6" strokeLinecap="round" opacity="0">
                <animate attributeName="opacity" values="0; 0.85; 0" keyTimes="0; 0.18; 0.35" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <line x1="18" y1="80" x2="6" y2="86" />
                <line x1="78" y1="80" x2="90" y2="86" />
                <line x1="30" y1="88" x2="14" y2="94" />
                <line x1="66" y1="88" x2="82" y2="94" />
            </g>
            {/* BOING! text on impact */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 0; 1; 1; 0" keyTimes="0; 0.4; 0.5; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 0; 0 -4; 0 -10" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="scale" values="0.4; 1.3; 1.1" keyTimes="0; 0.55; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" additive="sum" />
                <text x="48" y="20" textAnchor="middle" fontSize="16" fontWeight="900" fill="#5AC8FA" stroke="#1F1A3B" strokeWidth="1.8" paintOrder="stroke">BOING!</text>
            </g>
        </g>
    ),
    // Snooze: closed-eye crescents, big drifting Z's, a tiny snore puff, and a
    // dream cloud popping in/out.
    sleep: () => (
        <g>
            {/* Dream cloud appearing top-right */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 0.85; 0.85; 0" keyTimes="0; 0.3; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="scale" values="0.5; 1.1; 1" keyTimes="0; 0.4; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g transform="translate(70 18)">
                    <ellipse cx="0" cy="0" rx="14" ry="8" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="1.6" />
                    <circle cx="-8" cy="-3" r="6" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="1.6" />
                    <circle cx="8" cy="-3" r="5" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="1.6" />
                </g>
            </g>
            {/* Z stack — much bigger, more, and they shimmy as they rise */}
            {[[58, 28, 12, 0], [66, 18, 16, 0.25], [76, 8, 20, 0.5], [86, -2, 24, 0.8]].map(([x, y, size, begin], i) => (
                <text key={i} x={x} y={y} fontSize={size} fontWeight="900" fill="#1F1A3B" stroke="#FFFFFF" strokeWidth="1" paintOrder="stroke" opacity="0">
                    Z
                    <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.8; 1" begin={`${begin}s`} dur={`${EMOTE_DUR - begin}s`} repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values="0 0; 4 -8; -4 -16; 0 -22" keyTimes="0; 0.33; 0.66; 1" begin={`${begin}s`} dur={`${EMOTE_DUR - begin}s`} repeatCount="1" fill="freeze" />
                </text>
            ))}
            {/* Snore puff — small breath from the mouth */}
            {[0, 0.7, 1.4].map((begin, i) => (
                <ellipse key={i} cx="62" cy="60" rx="3" ry="2" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="1" opacity="0">
                    <animate attributeName="opacity" values="0; 0.9; 0" keyTimes="0; 0.4; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values="0 0; 14 -2" keyTimes="0; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                    <animate attributeName="rx" values="3; 6" keyTimes="0; 1" begin={`${begin}s`} dur="0.6s" repeatCount="1" fill="freeze" />
                </ellipse>
            ))}
            {/* Sleepy eye crescents drawn over the eye area */}
            <g stroke="#1F1A3B" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0">
                <animate attributeName="opacity" values="0; 1; 1" keyTimes="0; 0.2; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <path d="M30 48 q6 5 12 0" />
                <path d="M54 48 q6 5 12 0" />
            </g>
        </g>
    ),
    // Fireworks: five staggered starbursts with rocket trails + sparkly tails.
    fireworks: () => (
        <g>
            {/* Rocket trails launching upward before each burst */}
            {[[20, 14, 0, '#FF5C6C'], [76, 18, 0.3, '#FFC247'], [48, 4, 0.6, '#19C37D'], [10, 28, 0.9, '#B16BFF'], [86, 32, 1.2, '#5AC8FA']].map(([cx, cy, begin, color], i) => (
                <line key={`trail-${i}`} x1={cx} y1="90" x2={cx} y2="90" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.5; 1" begin={`${begin}s`} dur="0.35s" repeatCount="1" fill="freeze" />
                    <animate attributeName="y2" values="90; 70" keyTimes="0; 0.5" begin={`${begin}s`} dur="0.35s" repeatCount="1" fill="freeze" />
                    <animate attributeName="y1" values="90; 80; 70" keyTimes="0; 0.5; 1" begin={`${begin}s`} dur="0.35s" repeatCount="1" fill="freeze" />
                </line>
            ))}
            {/* The bursts themselves — larger and with more rays */}
            {[[20, 14, 0.35, '#FF5C6C'], [76, 18, 0.65, '#FFC247'], [48, 4, 0.95, '#19C37D'], [10, 28, 1.25, '#B16BFF'], [86, 32, 1.55, '#5AC8FA']].map(([cx, cy, begin, color], i) => (
                <g key={`burst-${i}`} transform={`translate(${cx} ${cy})`}>
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                        <line key={deg} x1="0" y1="0" x2="0" y2="-3" stroke={color} strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg})`} opacity="0">
                            <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                            <animate attributeName="y2" values="-3; -16" keyTimes="0; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                            <animate attributeName="y1" values="0; -8" keyTimes="0; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                        </line>
                    ))}
                    {/* Sparkle drop trail */}
                    {[0, 0.15, 0.3].map((tdelay, j) => (
                        <circle key={`spark-${j}`} cx="0" cy="0" r="1.2" fill={color} opacity="0">
                            <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.3; 1" begin={`${begin + tdelay + 0.4}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                            <animateTransform attributeName="transform" type="translate" values="0 0; 0 14" keyTimes="0; 1" begin={`${begin + tdelay + 0.4}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                        </circle>
                    ))}
                    {/* Bright core */}
                    <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" opacity="0">
                        <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.3; 1" begin={`${begin}s`} dur="0.5s" repeatCount="1" fill="freeze" />
                        <animate attributeName="r" values="1; 5" keyTimes="0; 1" begin={`${begin}s`} dur="0.5s" repeatCount="1" fill="freeze" />
                    </circle>
                </g>
            ))}
        </g>
    ),
    // ---- Reptile Kingdom BP exclusives ----
    // Dragon's Roar: hot screen tint, expanding heat-shimmer rings from the
    // mouth, a flame cone that pops out to the right, swirling embers, and
    // a punchy ROAR! banner. All scale/translate animations are isolated
    // (no additive="sum" stacking) and the flame cone is drawn around (0, 0)
    // so its scale-pop anchors at the mouth, not the SVG origin.
    dragonRoar: () => (
        <g>
            {/* Hot orange screen tint */}
            <rect x="-4" y="-4" width="104" height="104" fill="#FF6A2E" opacity="0">
                <animate attributeName="opacity" values="0; 0.4; 0; 0.3; 0" keyTimes="0; 0.15; 0.4; 0.55; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </rect>
            {/* Heat-shimmer rings expanding from the mascot's mouth */}
            {[0, 0.18, 0.36, 0.54, 0.72].map((begin, i) => (
                <circle key={i} cx="48" cy="62" r="8" fill="none" stroke="#FF6A2E" strokeWidth="2.5" opacity="0">
                    <animate attributeName="r" values="8; 44" keyTimes="0; 1" begin={`${begin}s`} dur="1s" repeatCount="1" fill="freeze" />
                    <animate attributeName="opacity" values="0; 0.95; 0" keyTimes="0; 0.3; 1" begin={`${begin}s`} dur="1s" repeatCount="1" fill="freeze" />
                </circle>
            ))}
            {/* The flame cone bursting to the right. Two nested groups:
                outer parks the cone at the mouth (78, 62); inner owns the
                scale pop, which now centers on (0, 0) of the local frame =
                the mouth in world coords. */}
            <g transform="translate(78 62)" opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.1; 0.7; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g>
                    <animateTransform attributeName="transform" type="scale" values="0.2; 1.3; 1; 1.15; 1" keyTimes="0; 0.2; 0.45; 0.7; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    {/* outer flame body (cone extending right from origin) */}
                    <path d="M-18 -6 Q 2 -12 22 -6 Q 12 2 22 8 Q 4 8 -18 6 Q -8 0 -18 -6 Z" fill="#FF6A2E" stroke="#8A1F0F" strokeWidth="1.6" strokeLinejoin="round" />
                    {/* inner brighter flame */}
                    <path d="M-14 -4 Q 0 -6 16 -2 Q 8 2 16 5 Q 2 4 -14 4 Q -4 0 -14 -4 Z" fill="#FFD86B" />
                    {/* hot white core */}
                    <ellipse cx="-4" cy="0" rx="7" ry="3" fill="#FFFFFF" />
                </g>
            </g>
            {/* Embers shooting out to the right and rising. Single translate
                animation per ember — no stacking. */}
            {[[68, 60, 0.1, '#FFE08A', 18], [72, 58, 0.2, '#FF6A2E', 24], [70, 66, 0.3, '#FFD86B', 16],
              [76, 62, 0.4, '#FF8A3F', 28], [72, 70, 0.5, '#E5412E', 22], [78, 64, 0.6, '#FFC247', 30],
              [70, 56, 0.7, '#FF8A3F', 24]].map(([x, y, begin, color, dx], i) => (
                <circle key={i} cx={x} cy={y} r="2.8" fill={color} stroke="#8A1F0F" strokeWidth="0.6" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" begin={`${begin}s`} dur={`${EMOTE_DUR - begin}s`} repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values={`0 0; ${dx} -16; ${dx * 1.3} -28`} keyTimes="0; 0.6; 1" begin={`${begin}s`} dur={`${EMOTE_DUR - begin}s`} repeatCount="1" fill="freeze" />
                </circle>
            ))}
            {/* ROAR! banner — outer g handles translate, inner g handles
                scale, so both stack reliably without additive="sum". */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.75; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 8; 0 0; 0 -8" keyTimes="0; 0.4; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g>
                    <animateTransform attributeName="transform" type="scale" values="0.4; 1.4; 1.2; 1.3; 1.15" keyTimes="0; 0.3; 0.55; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <text x="48" y="18" textAnchor="middle" fontSize="22" fontWeight="900" fill="#FFD86B" stroke="#8A1F0F" strokeWidth="2.2" paintOrder="stroke">ROAR!</text>
                </g>
            </g>
        </g>
    ),
    // Scale Flex: triple gold halo pulse, radial flare lines, scales orbiting
    // around the mascot, shimmering flecks, and a "FLEX!" banner. All rotates
    // bake the (48, 48) pivot in directly.
    scaleFlex: () => (
        <g>
            {/* Triple pulse halo */}
            {[0, 0.4, 0.8].map((begin, i) => (
                <circle key={i} cx="48" cy="48" r="36" fill="#FFD86B" opacity="0">
                    <animate attributeName="opacity" values="0; 0.6; 0" keyTimes="0; 0.4; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                    <animate attributeName="r" values="32; 56" keyTimes="0; 1" begin={`${begin}s`} dur="0.9s" repeatCount="1" fill="freeze" />
                </circle>
            ))}
            {/* Big radial flare lines — animate y1/y2 outward from (48,48) */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <line key={deg} x1="48" y1="48" x2="48" y2="48" stroke="#FFC247" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${deg} 48 48)`} opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" dur="0.7s" repeatCount="1" fill="freeze" />
                    <animate attributeName="y1" values="48; 8" keyTimes="0; 1" dur="0.7s" repeatCount="1" fill="freeze" />
                    <animate attributeName="y2" values="48; -2" keyTimes="0; 1" dur="0.7s" repeatCount="1" fill="freeze" />
                </line>
            ))}
            {/* Orbiting scales — positions baked at construction (40px radius
                around the mascot center) so the rotate animation REPLACES the
                base transform instead of summing. */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="540 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const cx = 48 + 40 * Math.cos(rad);
                    const cy = 48 + 40 * Math.sin(rad);
                    return (
                        <path key={deg} d={`M${cx - 5} ${cy} a 5 4 0 0 1 10 0 Z`} fill="#FFD86B" stroke="#A07A1A" strokeWidth="1" />
                    );
                })}
            </g>
            {/* Distant scale flecks shimmering. Opacity pulse only — no
                scale animation, since scale around (0,0) would launch them
                across the canvas. */}
            {[[12, 22, 0.1], [82, 26, 0.2], [10, 66, 0.3], [86, 62, 0.4], [24, 8, 0.15], [72, 84, 0.25], [4, 46, 0.35], [92, 50, 0.45]].map(([cx, cy, begin], i) => (
                <path key={i} d={`M${cx - 4} ${cy} a 4 3.4 0 0 1 8 0 Z`} fill="#FFE08A" stroke="#A07A1A" strokeWidth="0.6" opacity="0">
                    <animate attributeName="opacity" values="0; 1; 0; 1; 0" keyTimes="0; 0.3; 0.5; 0.7; 1" begin={`${begin}s`} dur="1.2s" repeatCount="1" fill="freeze" />
                </path>
            ))}
            {/* FLEX! banner — nested groups for stacked translate + scale */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.25; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 8; 0 -2; 0 -10" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g>
                    <animateTransform attributeName="transform" type="scale" values="0.4; 1.35; 1.15" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <text x="48" y="18" textAnchor="middle" fontSize="20" fontWeight="900" fill="#FFD86B" stroke="#5B4100" strokeWidth="2.2" paintOrder="stroke">FLEX!</text>
                </g>
            </g>
        </g>
    ),
    // Serpent Coil: a sinuous coil that rotates around the mascot, painted
    // in stroke-dash style so it "draws on" then retreats, with a snake head
    // + fangs + diamondback markings + green energy aura + "SSSS!" banner.
    serpentCoil: () => (
        <g>
            {/* Green energy aura */}
            <circle cx="48" cy="48" r="42" fill="#3F8A3F" opacity="0">
                <animate attributeName="opacity" values="0; 0.45; 0; 0.35; 0" keyTimes="0; 0.25; 0.5; 0.75; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animate attributeName="r" values="32; 52; 38; 54; 38" keyTimes="0; 0.25; 0.5; 0.75; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
            </circle>
            {/* The coil + snake head live in two nested groups. The outer
                rotates around (48, 48) — pivot baked into from/to so no
                additive="sum" stacking on the inner translate is needed. The
                inner translates everything from world (0,0) → mascot center. */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.15; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g transform="translate(48 48)">
                    {/* shadow underlay */}
                    <path
                        d="M -44 0 Q -30 -18 -10 -10 Q 10 0 26 -12 Q 42 -22 48 -10 Q 52 4 38 16 Q 24 24 4 20 Q -16 16 -30 24 Q -46 32 -44 14 Z"
                        fill="none"
                        stroke="#1F3A1F"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="0 240"
                        opacity="0.6"
                    >
                        <animate attributeName="stroke-dasharray" values="0 240; 240 0; 240 0; 0 240" keyTimes="0; 0.4; 0.7; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    </path>
                    {/* main coil */}
                    <path
                        d="M -44 0 Q -30 -18 -10 -10 Q 10 0 26 -12 Q 42 -22 48 -10 Q 52 4 38 16 Q 24 24 4 20 Q -16 16 -30 24 Q -46 32 -44 14 Z"
                        fill="none"
                        stroke="#5BAE3F"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="0 240"
                    >
                        <animate attributeName="stroke-dasharray" values="0 240; 240 0; 240 0; 0 240" keyTimes="0; 0.4; 0.7; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    </path>
                    {/* Diamondback markings along the coil */}
                    {[[-26, -12], [-8, -6], [10, -4], [28, -8], [32, 8], [16, 18], [-2, 20], [-22, 16], [-32, 4]].map(([x, y], i) => (
                        <path key={i} d={`M${x} ${y} l 3.5 2.4 l -3.5 2.4 l -3.5 -2.4 Z`} fill="#FFD86B" stroke="#3F5F2A" strokeWidth="0.5" opacity="0">
                            <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.5; 0.85; 1" dur={`${EMOTE_DUR}s`} begin={`${(i % 4) * 0.08}s`} repeatCount="1" fill="freeze" />
                        </path>
                    ))}
                    {/* Snake head with fangs + forked tongue */}
                    <g opacity="0">
                        <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.4; 0.85; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                        <g transform="translate(-44 6)">
                            <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#5BAE3F" stroke="#1F3A1F" strokeWidth="1.4" />
                            <circle cx="-3" cy="-1.5" r="1.4" fill="#FFD86B" />
                            <circle cx="-3" cy="-1.5" r="0.6" fill="#1F1A3B" />
                            {/* fangs */}
                            <path d="M-2 4 l 0.5 4 l -1 0 Z" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="0.3" />
                            <path d="M2 4 l -0.5 4 l 1 0 Z" fill="#FFFFFF" stroke="#1F1A3B" strokeWidth="0.3" />
                            {/* forked tongue */}
                            <path d="M-6 1 l -6 1.2 l 3 0.6 l -4 1.2 l 4 -0.4 l -1 1.2" stroke="#E5414C" strokeWidth="1" fill="none" strokeLinecap="round" />
                        </g>
                    </g>
                </g>
            </g>
            {/* SSSS! banner — nested groups for stacked translate + scale */}
            <g opacity="0">
                <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.3; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <animateTransform attributeName="transform" type="translate" values="0 8; 0 0; 0 -8" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                <g>
                    <animateTransform attributeName="transform" type="scale" values="0.4; 1.35; 1.15" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <text x="48" y="16" textAnchor="middle" fontSize="18" fontWeight="900" fill="#5BAE3F" stroke="#1F3A1F" strokeWidth="2.2" paintOrder="stroke">SSSS!</text>
                </g>
            </g>
        </g>
    ),
    // Wing Beat (Atlas Pass — S1 extension): Atlas unfurls a pair of dragon
    // wings and beats them, kicking up a wind gust + lift glow + "SOAR!" banner.
    // Each wing nests translate(shoulder) → scale(unfurl) → rotate(flap); the
    // mirrored scale on the right wing makes the rotate flap symmetrically.
    wingBeat: () => {
        const wing = (px, flip) => (
            <g transform={`translate(${px} 40)`}>
                <g>
                    <animateTransform attributeName="transform" type="scale" values={`0 0; ${flip} 1; ${flip} 1`} keyTimes="0; 0.3; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <g>
                        <animateTransform attributeName="transform" type="rotate" values="-22 0 0; 14 0 0; -16 0 0; 8 0 0; -6 0 0" keyTimes="0; 0.32; 0.55; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                        {/* Membrane */}
                        <path d="M0 0 Q -24 -18 -38 -6 Q -28 -3 -30 7 Q -20 4 -25 16 Q -13 10 -16 20 Q -7 13 -6 17 Q -2 7 0 0 Z" fill="#2FA0C0" stroke="#15506A" strokeWidth="1.6" strokeLinejoin="round" />
                        {/* Finger ribs */}
                        <g stroke="#15506A" strokeWidth="1" fill="none" opacity="0.85">
                            <path d="M0 0 Q -20 -10 -37 -5" />
                            <path d="M0 0 Q -17 -1 -25 15" />
                            <path d="M0 0 Q -9 4 -15 19" />
                        </g>
                        {/* Leading-edge frost highlight */}
                        <path d="M0 0 Q -24 -18 -38 -6" stroke="#A8E8FF" strokeWidth="0.9" fill="none" opacity="0.6" />
                    </g>
                </g>
            </g>
        );
        return (
            <g>
                {/* Soft lift glow behind the mascot */}
                <ellipse cx="48" cy="48" rx="30" ry="30" fill="#3FE0D0" opacity="0">
                    <animate attributeName="opacity" values="0; 0.3; 0" keyTimes="0; 0.35; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                </ellipse>
                {wing(40, 1)}
                {wing(56, -1)}
                {/* Wind gust streaks sweeping outward + up as the wings beat */}
                {[[30, 30, -10], [26, 44, -14], [66, 30, 10], [70, 44, 14]].map(([x, y, dx], i) => (
                    <path key={i} d={`M${x} ${y} q ${dx} -2 ${dx * 1.8} -1`} stroke="#A8E8FF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0">
                        <animate attributeName="opacity" values="0; 0.8; 0" keyTimes="0; 0.5; 1" begin={`${0.3 + (i % 2) * 0.15}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                        <animateTransform attributeName="transform" type="translate" values={`0 0; ${dx > 0 ? 10 : -10} -8`} keyTimes="0; 1" begin={`${0.3 + (i % 2) * 0.15}s`} dur="0.7s" repeatCount="1" fill="freeze" />
                    </path>
                ))}
                {/* SOAR! banner — outer translate, inner scale (no additive stacking) */}
                <g opacity="0">
                    <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.25; 0.8; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <animateTransform attributeName="transform" type="translate" values="0 10; 0 0; 0 -8" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                    <g>
                        <animateTransform attributeName="transform" type="scale" values="0.4; 1.35; 1.15" keyTimes="0; 0.5; 1" dur={`${EMOTE_DUR}s`} repeatCount="1" fill="freeze" />
                        <text x="48" y="20" textAnchor="middle" fontSize="20" fontWeight="900" fill="#3FE0D0" stroke="#15506A" strokeWidth="2.2" paintOrder="stroke">SOAR!</text>
                    </g>
                </g>
            </g>
        );
    },
};

export function renderEmote(id) {
    // Dispatch by EMOTES[id].kind, not by id directly: for the 11 free emotes
    // the id and kind happen to match (`wave`/`wave` etc.), but the BP-only
    // emotes have distinct IDs (`bp_dragon_roar`, `bp_scale_flex`,
    // `bp_serpent_coil`) that map to kinds `dragonRoar`/`scaleFlex`/
    // `serpentCoil`. Falling back to the id keeps the original behaviour
    // for anything that doesn't carry a kind.
    const meta = EMOTES[id];
    const kind = (meta && meta.kind) || id;
    const draw = EMOTE_SHAPES[kind];
    return draw ? draw() : null;
}

// Total length the emote animation plays for (seconds). Mascot uses this to
// time how long the overlay is rendered before it disappears.
export const EMOTE_DURATION_S = EMOTE_DUR;
