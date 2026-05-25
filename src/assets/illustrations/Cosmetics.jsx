import React from 'react';
import { HATS, GLASSES, EFFECTS } from '../../lib/cosmetics';

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
    horns: (c) => (
        <g fill={c.main} stroke={c.dark} strokeWidth="1">
            <path d="M34 16 Q30 4 38 0 Q38 8 40 14 Z" />
            <path d="M62 16 Q66 4 58 0 Q58 8 56 14 Z" />
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
        <g>
            <path d="M22 30 Q22 -2 48 -2 Q74 -2 74 30" fill="rgba(255,255,255,0.16)" stroke={c.main} strokeWidth="2.5" />
            <path d="M30 6 Q40 0 50 2" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7" />
        </g>
    ),
    tiara: (c) => (
        <g>
            <path d="M30 22 Q30 14 48 12 Q66 14 66 22 Z" fill={c.main} stroke={c.dark} strokeWidth="1" />
            <path d="M48 4 L51 12 L45 12 Z" fill={c.accent} />
            <circle cx="48" cy="6" r="2" fill={c.accent} />
            <circle cx="36" cy="16" r="1.5" fill={c.accent} />
            <circle cx="60" cy="16" r="1.5" fill={c.accent} />
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
    mohawk: (c) => (
        <g>
            {/* Base headband */}
            <path d="M24 22 Q48 18 72 22 L70 26 Q48 23 26 26 Z" fill={c.dark} />
            {/* Spikes — tall central tuft */}
            <path d="M30 20 L 34 -4 L 38 20 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <path d="M40 20 L 44 -10 L 48 20 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <path d="M50 20 L 54 -8 L 58 20 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <path d="M60 20 L 64 -2 L 68 20 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
            <path d="M22 22 L 26 4 L 30 22 Z" fill={c.main} stroke={c.dark} strokeWidth="0.6" />
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
    // dragonHorns: a pair of curved horns that sweep outward + up. More fearsome
    // than the small `horns` shape, with banding rings for a bone/keratin feel.
    dragonHorns: (c) => (
        <g fill={c.main} stroke={c.dark} strokeWidth="1.2" strokeLinejoin="round">
            <path d="M32 18 Q22 8 16 -8 Q26 -4 36 4 Q40 12 38 18 Z" />
            <path d="M64 18 Q74 8 80 -8 Q70 -4 60 4 Q56 12 58 18 Z" />
            {/* Banding rings for keratin/bone detail */}
            <g stroke={c.dark} strokeWidth="0.9" fill="none">
                <path d="M22 6 Q26 4 30 8" />
                <path d="M20 -2 Q24 -4 28 0" />
                <path d="M74 6 Q70 4 66 8" />
                <path d="M76 -2 Q72 -4 68 0" />
            </g>
            {/* Tip highlights */}
            <circle cx="16" cy="-8" r="1.4" fill={c.accent} />
            <circle cx="80" cy="-8" r="1.4" fill={c.accent} />
        </g>
    ),

    // frill: a Dilophosaurus-style fanning collar opening behind the head, with
    // tooth-like points along the rim. Two colors blend across the fan.
    frill: (c) => (
        <g>
            {/* Back fan */}
            <path d="M18 18 Q48 -20 78 18 Q72 22 64 18 Q60 14 48 14 Q36 14 32 18 Q24 22 18 18 Z"
                fill={c.main} stroke={c.dark} strokeWidth="1.5" strokeLinejoin="round" />
            {/* Inner ribs */}
            <g stroke={c.dark} strokeWidth="0.8" fill="none" opacity="0.6">
                <path d="M30 16 Q34 4 38 14" />
                <path d="M40 14 Q44 -4 48 14" />
                <path d="M50 14 Q54 -4 58 14" />
                <path d="M60 16 Q64 4 68 16" />
            </g>
            {/* Spotted markings */}
            <g fill={c.accent} opacity="0.85">
                <circle cx="34" cy="8" r="1.6" />
                <circle cx="48" cy="2" r="1.8" />
                <circle cx="62" cy="8" r="1.6" />
                <circle cx="40" cy="-2" r="1.2" />
                <circle cx="56" cy="-2" r="1.2" />
            </g>
        </g>
    ),

    // scaleHelm: a hood of overlapping scales draping over the head. Reads as
    // chainmail / pangolin armour. `c.main` is the base, `c.dark` for the
    // outline, `c.accent` for the tooth-like fringe at the brow.
    scaleHelm: (c) => (
        <g>
            <path d="M22 22 Q22 -2 48 -2 Q74 -2 74 22" fill={c.main} stroke={c.dark} strokeWidth="1.5" />
            {/* Two rows of overlapping diamond scales */}
            <g fill={c.accent} stroke={c.dark} strokeWidth="0.6">
                {[24, 32, 40, 48, 56, 64, 72].map((x, i) => (
                    <path key={`s1-${i}`} d={`M${x} 6 l 4 6 l -4 6 l -4 -6 Z`} />
                ))}
                {[28, 36, 44, 52, 60, 68].map((x, i) => (
                    <path key={`s2-${i}`} d={`M${x} 14 l 4 6 l -4 6 l -4 -6 Z`} opacity="0.9" />
                ))}
            </g>
            {/* Glowing eye-slot accents above the brow */}
            <circle cx="40" cy="20" r="1.4" fill={c.trim || c.accent} />
            <circle cx="56" cy="20" r="1.4" fill={c.trim || c.accent} />
        </g>
    ),
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
        <g stroke={c.frame} strokeWidth="2.5" fill={c.lens}>
            <path d="M30 48 Q30 40 40 40 Q47 40 46 46 Q40 50 30 48 Z" />
            <path d="M66 48 Q66 40 56 40 Q49 40 50 46 Q56 50 66 48 Z" />
            <path d="M46 45 L50 45" />
        </g>
    ),
    aviator: (c) => (
        <g stroke={c.frame} strokeWidth="2" fill={c.lens}>
            <path d="M30 42 L46 42 Q46 54 38 54 Q30 52 30 42 Z" />
            <path d="M66 42 L50 42 Q50 54 58 54 Q66 52 66 42 Z" />
            <path d="M46 44 L50 44" />
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
        <g stroke={c.frame} strokeWidth="1.5" fill={c.lens}>
            <rect x="30" y="42" width="15" height="9" rx="2" />
            <rect x="51" y="42" width="15" height="9" rx="2" />
            <path d="M45 46 L51 46" />
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
    // snakeEyes: lens covers with vertical slit pupils — the unmistakable
    // reptile look. Lens is c.lens (the iris colour), the slit and frame use
    // c.frame, and a faint scale ridge sits along the bridge.
    snakeEyes: (c) => (
        <g>
            {/* Iris circles behind the slit */}
            <ellipse cx="38" cy="46" rx="6.5" ry="6" fill={c.lens} stroke={c.frame} strokeWidth="1.5" />
            <ellipse cx="58" cy="46" rx="6.5" ry="6" fill={c.lens} stroke={c.frame} strokeWidth="1.5" />
            {/* Vertical slit pupils */}
            <ellipse cx="38" cy="46" rx="0.8" ry="5" fill={c.frame} />
            <ellipse cx="58" cy="46" rx="0.8" ry="5" fill={c.frame} />
            {/* Scale ridge over the bridge */}
            <path d="M44 44 L48 42 L52 44" stroke={c.frame} strokeWidth="1.2" fill="none" />
            {/* Tiny highlights for liveliness */}
            <circle cx="40" cy="44" r="0.9" fill="#FFFFFF" opacity="0.85" />
            <circle cx="60" cy="44" r="0.9" fill="#FFFFFF" opacity="0.85" />
        </g>
    ),

    // dragonGaze: angular, predatory eye covers (think a stylised "dragon
    // visor" with notched corners). Uses two lens fills — a base and a fiery
    // accent crescent — for a glow-from-within effect.
    dragonGaze: (c) => (
        <g>
            <path d="M28 40 L50 44 L50 52 L28 50 Z" fill={c.lens} stroke={c.frame} strokeWidth="1.5" strokeLinejoin="miter" />
            <path d="M68 40 L46 44 L46 52 L68 50 Z" fill={c.lens} stroke={c.frame} strokeWidth="1.5" strokeLinejoin="miter" />
            {/* Fiery crescent inside each lens */}
            <path d="M30 48 Q38 46 48 48" stroke={c.accent} strokeWidth="1.6" fill="none" />
            <path d="M66 48 Q58 46 48 48" stroke={c.accent} strokeWidth="1.6" fill="none" />
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
    rings: () => (
        <g transform="rotate(-20 48 48)" fill="none">
            <ellipse cx="48" cy="48" rx="47" ry="13" stroke="#FFD86B" strokeWidth="3" opacity="0.85">
                <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="48" cy="48" rx="41" ry="10" stroke="#FFEFC2" strokeWidth="1.5" opacity="0.6" />
        </g>
    ),
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
            {[[24, 2, 3.4, 0], [40, 1.6, 4, 0.8], [56, 2.2, 3, 1.4], [70, 1.8, 3.8, 2.0]].map((s, i) => (
                <circle key={i} cx={s[0]} cy="6" r={s[1]}>
                    <animate attributeName="cy" values="6;86" dur={`${s[2]}s`} begin={`${s[3]}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.95;0" dur={`${s[2]}s`} begin={`${s[3]}s`} repeatCount="indefinite" />
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
    flames: () => (
        <g>
            {[[34, '#FF6A2E', 1.6], [48, '#FFC247', 1.2], [62, '#FF6A2E', 1.9]].map((f, i) => (
                <path key={i} d={`M${f[0]} 86 q 4 -9 0 -16 q -4 7 0 16 Z`} fill={f[1]}>
                    <animate attributeName="opacity" values="0.55;1;0.55" dur={`${f[2]}s`} repeatCount="indefinite" />
                </path>
            ))}
        </g>
    ),
    electric: () => (
        <g stroke="#9AD0FF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {['M16 40 L22 46 L18 50 L26 58', 'M80 38 L74 46 L78 50 L70 60'].map((d, i) => (
                <path key={i} d={d}>
                    <animate attributeName="opacity" values="0;1;0;0.2;0" dur="1.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                </path>
            ))}
        </g>
    ),
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
    // scaleFall: glittering diamond scales drifting downward — like emerald
    // confetti. Mixed greens with a gold accent flake for richness.
    scaleFall: () => (
        <g>
            {[
                ['#19C37D', 16, 0, 3.4, 0],
                ['#3FAA60', 30, 0.4, 3.8, 12],
                ['#7FE05B', 44, 1.0, 3.2, -8],
                ['#19A36B', 58, 1.6, 3.6, 16],
                ['#FFD86B', 70, 2.0, 3.0, -14],
                ['#5BAE3F', 82, 0.7, 3.5, 4],
            ].map(([color, x, begin, dur, rot], i) => (
                <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values="0 -8;0 88" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                    <g transform={`rotate(${rot} ${x} 0)`} opacity="0">
                        <animate attributeName="opacity" values="0;0.95;0" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                        <path d={`M${x} 0 l 3 4 l -3 4 l -3 -4 Z`} fill={color} stroke="#0F4A2A" strokeWidth="0.4" />
                    </g>
                </g>
            ))}
        </g>
    ),

    // dragonBreath: a roiling cone of fire jetting out and up from the lower
    // edge of the globe (mouth-line). Three flames pulsing out of phase plus
    // ember sparks for extra drama.
    dragonBreath: () => (
        <g>
            {/* Outer cone */}
            <path d="M30 78 Q14 64 8 38 Q22 60 30 78 Z" fill="#FF6A2E" opacity="0.55">
                <animate attributeName="opacity" values="0.35;0.85;0.35" dur="1.4s" repeatCount="indefinite" />
            </path>
            {/* Inner brighter cone */}
            <path d="M32 78 Q22 66 16 46 Q28 64 32 78 Z" fill="#FFD86B" opacity="0.85">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Tongue flicker */}
            <path d="M30 78 Q26 74 22 60 Q28 72 30 78 Z" fill="#FFFDF7" opacity="0.85">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="0.7s" repeatCount="indefinite" />
            </path>
            {/* Ember sparks drifting away */}
            {[[14, 36, 1.8, 0], [10, 28, 1.4, 0.6], [18, 18, 1.6, 1.2]].map(([x, y, r, b], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="#FFC247">
                    <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${x};${x - 6}`} dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                    <animate attributeName="cy" values={`${y};${y - 16}`} dur="2s" begin={`${b}s`} repeatCount="indefinite" />
                </circle>
            ))}
        </g>
    ),

    // swampMist: soft green tendrils rising from below the globe. Plays well
    // with the jungle/anaconda colours.
    swampMist: () => (
        <g fill="none" stroke="#7FE05B" strokeWidth="2" opacity="0.7">
            {[[20, 0, 3.6], [40, 0.6, 4.2], [56, 1.2, 3.4], [72, 1.8, 4.0]].map(([x, b, d], i) => (
                <path key={i} d={`M${x} 88 Q${x + 6} 76 ${x - 4} 60 Q${x + 8} 44 ${x} 28`}>
                    <animate attributeName="opacity" values="0;0.6;0" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
                    <animateTransform attributeName="transform" type="translate" values="0 6;0 -12" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
                </path>
            ))}
        </g>
    ),
};

export function renderEffect(id) {
    const item = EFFECTS[id];
    if (!item || !item.kind || item.kind === 'spin') return null; // 'spin' handled in Mascot
    const draw = EFFECT_SHAPES[item.kind];
    return draw ? draw() : null;
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
