import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAudio } from '../../audio/AudioProvider';
import { useBattlepass } from '../../lib/battlepass';
import { TIER_COUNT } from '../../lib/battlepassCatalog';
import { springs } from '../../motion/index';

// Hero card on the main menu announcing the Atlas Pass — Reptile Kingdom.
// Sized to span a 2x2 chunk of the mode grid (.mode-card--xl); rendered with
// a hex-scale emblem (dragon-hide tessellation + central reptile-face glyph)
// rather than a Material Symbols icon so it reads as a feature, not a tab.

function ReptileEmblem() {
    return (
        <svg
            className="bp-card__art"
            viewBox="0 0 280 200"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="bpScaleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9BE96A" />
                    <stop offset="55%" stopColor="#2F8B3F" />
                    <stop offset="100%" stopColor="#143F1F" />
                </linearGradient>
                <linearGradient id="bpAccentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE08A" />
                    <stop offset="100%" stopColor="#C49A3A" />
                </linearGradient>
                <radialGradient id="bpHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFD86B" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FFD86B" stopOpacity="0" />
                </radialGradient>
                {/* Hex-scale tessellation. patternWidth = √3·s, patternHeight = 3·s
                    for s=8. Pattern contains 5 hex segments — the 4 corner hexes
                    (each contributing the in-tile quarter) plus the center hex,
                    which together render a clean honeycomb when tiled. */}
                <pattern id="bpHexPattern" patternUnits="userSpaceOnUse" width="13.86" height="24">
                    <g fill="url(#bpScaleGrad)" stroke="#143F1F" strokeOpacity="0.35" strokeWidth="0.5">
                        <path d="M 0 -8 L 6.93 -4 L 6.93 4 L 0 8 L -6.93 4 L -6.93 -4 Z" />
                        <path d="M 13.86 -8 L 20.79 -4 L 20.79 4 L 13.86 8 L 6.93 4 L 6.93 -4 Z" />
                        <path d="M 6.93 4 L 13.86 8 L 13.86 16 L 6.93 20 L 0 16 L 0 8 Z" />
                        <path d="M 0 16 L 6.93 20 L 6.93 28 L 0 32 L -6.93 28 L -6.93 20 Z" />
                        <path d="M 13.86 16 L 20.79 20 L 20.79 28 L 13.86 32 L 6.93 28 L 6.93 20 Z" />
                    </g>
                </pattern>
                {/* Horizontal fade: left half invisible, right half full opacity. */}
                <linearGradient id="bpFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="40%" stopColor="#000" />
                    <stop offset="62%" stopColor="#FFF" />
                </linearGradient>
                <mask id="bpFadeMask">
                    <rect x="0" y="0" width="280" height="200" fill="url(#bpFade)" />
                </mask>
            </defs>

            {/* Soft warm halo behind the emblem */}
            <circle cx="200" cy="100" r="84" fill="url(#bpHalo)" />

            {/* Hex-scale field — masked so the left half stays clear for text */}
            <rect x="0" y="0" width="280" height="200" fill="url(#bpHexPattern)" mask="url(#bpFadeMask)" />

            {/* A handful of accent hexes (gold) to break up the green field */}
            <g fill="url(#bpAccentGrad)" stroke="#143F1F" strokeOpacity="0.45" strokeWidth="0.5">
                {[[166, 40], [248, 52], [180, 156], [256, 132], [228, 172], [152, 92]].map(([cx, cy], i) => (
                    <path
                        key={i}
                        d={`M ${cx} ${cy - 8} L ${cx + 6.93} ${cy - 4} L ${cx + 6.93} ${cy + 4} L ${cx} ${cy + 8} L ${cx - 6.93} ${cy + 4} L ${cx - 6.93} ${cy - 4} Z`}
                    />
                ))}
            </g>

            {/* Central reptile-face glyph: paired slit eyes flanked by dragon horns */}
            <g>
                {/* Dragon horns — curved spikes rising up-and-out. Each horn has
                    an inner banding stripe for keratin texture. */}
                <path d="M 184 90 Q 162 76 148 44 Q 158 52 168 64 Q 178 76 192 86 Z"
                      fill="#FFD86B" stroke="#143F1F" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 160 64 Q 168 70 178 78" stroke="#C49A3A" strokeWidth="1" fill="none" opacity="0.7" />

                <path d="M 216 90 Q 238 76 252 44 Q 242 52 232 64 Q 222 76 208 86 Z"
                      fill="#FFD86B" stroke="#143F1F" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 240 64 Q 232 70 222 78" stroke="#C49A3A" strokeWidth="1" fill="none" opacity="0.7" />

                {/* Left eye with vertical slit pupil + highlight */}
                <ellipse cx="188" cy="106" rx="8" ry="7" fill="#FFD86B" stroke="#143F1F" strokeWidth="1.6" />
                <ellipse cx="188" cy="106" rx="1.3" ry="5.8" fill="#1F1A2A" />
                <circle cx="186" cy="103" r="1.3" fill="#FFFDF7" opacity="0.95" />

                {/* Right eye */}
                <ellipse cx="212" cy="106" rx="8" ry="7" fill="#FFD86B" stroke="#143F1F" strokeWidth="1.6" />
                <ellipse cx="212" cy="106" rx="1.3" ry="5.8" fill="#1F1A2A" />
                <circle cx="214" cy="103" r="1.3" fill="#FFFDF7" opacity="0.95" />
            </g>

            {/* Sparkle stars with gentle opacity pulse */}
            <g fill="#FFFDF7">
                {[[24, 32], [256, 30], [248, 176]].map(([x, y], i) => (
                    <path key={i} d={`M${x} ${y - 4} l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z`}>
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                    </path>
                ))}
            </g>
        </svg>
    );
}

export default function BattlepassCard({ onClick, index = 0 }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const bp = useBattlepass();
    const progressPct = bp.totalStars > 0 ? Math.min(100, Math.round((bp.stars / bp.totalStars) * 100)) : 0;
    const tierLabel = bp.loaded ? `Tier ${bp.tier} / ${TIER_COUNT}` : 'Season 1 · 25 tiers';

    return (
        <motion.button
            className={`mode-card mode-card--xl bp-card ${bp.owned ? 'is-premium' : ''}`}
            onClick={() => { audio.play('click'); onClick(); }}
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + index * 0.06 }}
            whileHover={prefersReduced ? undefined : { y: -3 }}
            whileTap={prefersReduced ? undefined : { scale: 0.98 }}
            aria-label="Atlas Pass — Reptile Kingdom"
        >
            <ReptileEmblem />
            <div className="bp-card__copy">
                <span className="bp-card__eyebrow">
                    <span className="bp-card__dot" />
                    Season 1 · Live now
                </span>
                <h3 className="bp-card__title">Reptile Kingdom</h3>
                <p className="bp-card__sub">
                    25 tiers of dragon-themed cosmetics. Every mode counts.
                </p>
                <div className="bp-card__meta">
                    <span className="bp-card__pill"><span className="bp-card__pill-dot" /> {tierLabel}</span>
                    {bp.owned && <span className="bp-card__pill bp-card__pill--prem">★ Premium</span>}
                </div>
                <div className="bp-card__bar">
                    <div className="bp-card__bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="bp-card__cta">
                    Open Atlas Pass <span aria-hidden="true">→</span>
                </span>
            </div>
        </motion.button>
    );
}
