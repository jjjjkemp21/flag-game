import React, { useId } from 'react';
import { motion } from 'framer-motion';

// Atlas treasure chest — a hand-rolled SVG with the lid as a separate group
// so callers can animate it (translate + tilt) independently from the body.
// Palette + glow colors are driven by the rarity tier:
//   common    — slate
//   rare      — blue
//   epic      — violet
//   legendary — gold
//
// Props:
//   size      px (square)
//   rarity    palette tier
//   open      static "open" pose (used when no lidMotion is supplied)
//   lidMotion motion props spread on the lid <motion.g>. The pivot is set
//             to the bottom-center of the lid (where it meets the body) so
//             rotation tilts the lid like a hinged plate rather than
//             swinging it sideways.
//   showGlow  ground glow under the chest
//   style     style on the outer SVG

const PALETTES = {
    common: {
        wood: '#9aa3b2', woodDark: '#6b7280',
        band: '#cfd5e0', bandDark: '#7b8392',
        glow: '#cfd5e0',
        sparkle: '#eef1f7',
        gem: '#9aa3b2',
    },
    rare: {
        wood: '#3a6fb8', woodDark: '#1e4a8a',
        band: '#cfd5e0', bandDark: '#7b8392',
        glow: '#8bc0ff',
        sparkle: '#cfe6ff',
        gem: '#54a0ff',
    },
    epic: {
        wood: '#6a3aa5', woodDark: '#3f1f7a',
        band: '#e9d6ff', bandDark: '#7b56b8',
        glow: '#d39bff',
        sparkle: '#ffe1ff',
        gem: '#a55eea',
    },
    legendary: {
        wood: '#b07a2a', woodDark: '#7a4a10',
        band: '#ffe49b', bandDark: '#b0832e',
        glow: '#ffd166',
        sparkle: '#fff4c2',
        gem: '#ffd166',
    },
};

export const CHEST_PALETTES = PALETTES;

export default function TreasureChest({
    size = 160,
    rarity = 'common',
    open = false,
    lidMotion = null,
    showGlow = true,
    style,
}) {
    const id = useId().replace(/[:]/g, '');
    const p = PALETTES[rarity] || PALETTES.common;

    // Pivot at the bottom-center of the lid (SVG coords 50,50) so rotation
    // tilts the lid like a plate balanced on the chest's top edge. With a
    // small upward translate the result reads as "lid ajar" — lifted a
    // hair off the body, leaning to one side.
    const lidStyle = { originX: '50px', originY: '50px' };
    const staticOpenTransform = 'translate(0 -6) rotate(10 50 50)';
    const lidGroupProps = lidMotion
        ? { ...lidMotion, style: lidStyle }
        : { transform: open ? staticOpenTransform : undefined };

    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            style={style}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`${rarity} treasure chest`}
        >
            <defs>
                <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id={`floor-${id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={p.glow} stopOpacity="0.55" />
                    <stop offset="60%" stopColor={p.glow} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Ground glow (under the chest) */}
            {showGlow && (
                <ellipse cx="50" cy="86" rx="32" ry="6" fill={`url(#floor-${id})`} />
            )}

            {/* Body — wooden trunk + dark base + side shadow */}
            <g>
                {/* Side shadow strip */}
                <rect x="18" y="52" width="64" height="30" rx="3" fill={p.woodDark} />
                {/* Wood front */}
                <rect x="18" y="50" width="64" height="28" rx="3" fill={p.wood} />
                {/* Wood planks (thin darker lines) */}
                <line x1="22" y1="55" x2="78" y2="55" stroke={p.woodDark} strokeWidth="0.6" opacity="0.4" />
                <line x1="22" y1="64" x2="78" y2="64" stroke={p.woodDark} strokeWidth="0.6" opacity="0.4" />
                <line x1="22" y1="73" x2="78" y2="73" stroke={p.woodDark} strokeWidth="0.6" opacity="0.4" />

                {/* Vertical metal bands */}
                <rect x="29" y="50" width="4" height="28" fill={p.band} />
                <rect x="29" y="50" width="4" height="28" fill={p.bandDark} opacity="0.25" />
                <rect x="67" y="50" width="4" height="28" fill={p.band} />
                <rect x="67" y="50" width="4" height="28" fill={p.bandDark} opacity="0.25" />

                {/* Lock plate */}
                <rect x="45" y="58" width="10" height="14" rx="1.5" fill={p.band} />
                <rect x="45" y="58" width="10" height="14" rx="1.5" fill={p.bandDark} opacity="0.2" />
                <circle cx="50" cy="65" r="2.2" fill={p.woodDark} />
                <rect x="49.2" y="65" width="1.6" height="4" rx="0.4" fill={p.woodDark} />

                {/* Rivets */}
                <circle cx="22" cy="55" r="1" fill={p.bandDark} />
                <circle cx="22" cy="73" r="1" fill={p.bandDark} />
                <circle cx="78" cy="55" r="1" fill={p.bandDark} />
                <circle cx="78" cy="73" r="1" fill={p.bandDark} />

                {/* Dark interior strip — sits at the top of the body so the
                    gap beneath an ajar lid reads as the inside of the chest
                    rather than transparent backdrop. */}
                <rect x="20" y="50" width="60" height="3" fill={p.woodDark} opacity="0.85" />
                {/* Inner edge highlight */}
                <rect x="18" y="50" width="64" height="2" rx="1" fill={p.bandDark} opacity="0.35" />
            </g>

            {/* Lid — separate group so callers can pop it up & tilt it ajar */}
            <motion.g {...lidGroupProps}>
                {/* Lid back shadow */}
                <path d="M18 50 Q18 32 50 32 Q82 32 82 50 Z" fill={p.woodDark} />
                {/* Lid front */}
                <path d="M20 50 Q20 34 50 34 Q80 34 80 50 Z" fill={p.wood} />
                {/* Lid metal band (curved) */}
                <path
                    d="M50 34 Q50 34 50 50"
                    stroke={p.band}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M50 34 Q50 34 50 50"
                    stroke={p.bandDark}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.22"
                />
                {/* Lid rivets */}
                <circle cx="31" cy="48" r="1" fill={p.bandDark} />
                <circle cx="69" cy="48" r="1" fill={p.bandDark} />
                {/* Lid top highlight (a thin lighter arc) */}
                <path
                    d="M24 47 Q28 38 50 38 Q72 38 76 47"
                    stroke={p.sparkle}
                    strokeWidth="0.9"
                    fill="none"
                    opacity="0.55"
                />
                {/* Lid underside — a thin darker strip along the bottom edge
                    of the lid. Hidden behind the body when closed; visible
                    once the lid lifts, selling the lid as a 3D object with
                    a separate underside. */}
                <rect x="20" y="48.5" width="60" height="1.5" fill={p.woodDark} opacity="0.7" />
            </motion.g>
        </svg>
    );
}
