import React from 'react';
import { HATS, GLASSES } from '../../lib/cosmetics';

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
};

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
