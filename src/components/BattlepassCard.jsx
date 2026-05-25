import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAudio } from '../audio/AudioProvider';
import { useBattlepass } from '../lib/battlepass';
import { TIER_COUNT } from '../lib/battlepassCatalog';
import { springs } from '../motion';

// Hero card on the main menu announcing the Atlas Pass — Reptile Kingdom.
// Sized to span a 2x2 chunk of the mode grid (.mode-card--xl); rendered with a
// bespoke SVG dragon scene rather than a Material Symbols icon so it reads as
// a feature, not another menu tab.

function DragonScene() {
    // 280-wide viewBox dragon illustration: a coiled serpent wraps around a
    // jewelled globe, with smoke wisps + drifting scales for atmosphere. All
    // pure SVG so it's crisp at any size and theme-able with CSS variables.
    return (
        <svg
            className="bp-card__art"
            viewBox="0 0 280 200"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="bpGlobe" cx="42%" cy="40%" r="62%">
                    <stop offset="0%" stopColor="#A8E0B5" />
                    <stop offset="55%" stopColor="#19A36B" />
                    <stop offset="100%" stopColor="#0F4A2A" />
                </radialGradient>
                <linearGradient id="bpScale" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7FE05B" />
                    <stop offset="100%" stopColor="#1F5A2A" />
                </linearGradient>
                <linearGradient id="bpFire" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#8A1F0F" />
                    <stop offset="60%" stopColor="#FF6A2E" />
                    <stop offset="100%" stopColor="#FFD86B" />
                </linearGradient>
                <radialGradient id="bpHalo" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#FFD86B" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#FFD86B" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Sun-halo backdrop */}
            <circle cx="140" cy="100" r="86" fill="url(#bpHalo)" />

            {/* Drifting scales (animated) */}
            <g opacity="0.7">
                {[
                    [40, 30, 6, '#7FE05B', 0],
                    [240, 50, 5, '#19C37D', 0.6],
                    [60, 160, 7, '#3FAA60', 1.2],
                    [220, 150, 6, '#FFD86B', 0.3],
                    [30, 100, 5, '#7FE05B', 1.5],
                    [255, 110, 4, '#19A36B', 0.9],
                ].map(([x, y, r, c, b], i) => (
                    <g key={i}>
                        <path d={`M${x} ${y - r} a ${r} ${r * 0.85} 0 0 1 0 ${r * 2} a ${r} ${r * 0.85} 0 0 1 0 -${r * 2} Z`}
                            fill={c} opacity="0.55">
                            <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="8s" begin={`${b}s`} repeatCount="indefinite" />
                        </path>
                    </g>
                ))}
            </g>

            {/* Globe in the centre */}
            <circle cx="140" cy="108" r="46" fill="url(#bpGlobe)" stroke="#0F4A2A" strokeWidth="2" />
            {/* Continents — stylised */}
            <g fill="#FFD86B" opacity="0.85">
                <path d="M110 100 q 10 -6 18 0 q 4 -2 8 2 q -4 6 -10 5 q -6 4 -12 -2 q -6 0 -4 -5 Z" />
                <path d="M120 122 q 12 -2 18 4 q -4 5 -10 4 q -8 0 -8 -8 Z" />
                <path d="M154 102 q 8 0 10 6 q -2 6 -8 6 q -6 -2 -8 -8 q 0 -4 6 -4 Z" />
            </g>
            {/* Globe highlight */}
            <ellipse cx="124" cy="94" rx="14" ry="6" fill="#FFFDF7" opacity="0.32" />

            {/* Coiled dragon body wrapping the globe — drawn as overlapping
                scaled segments. Tail on the right, head on the upper-left. */}
            <g>
                {/* Tail */}
                <path d="M205 130 q 30 -6 40 14 q 4 14 -10 18 q -10 0 -12 -10 q 0 -6 6 -8"
                    fill="none" stroke="url(#bpScale)" strokeWidth="14" strokeLinecap="round" />
                {/* Lower body curl behind globe */}
                <path d="M95 132 q -16 24 6 38 q 30 12 60 -2 q 30 -10 50 -6"
                    fill="none" stroke="url(#bpScale)" strokeWidth="16" strokeLinecap="round" />
                {/* Upper neck rising in front */}
                <path d="M115 78 q -22 -10 -34 4 q -16 22 4 36 q 18 8 32 -2"
                    fill="none" stroke="url(#bpScale)" strokeWidth="14" strokeLinecap="round" />
                {/* Scale shimmer dots along the body */}
                <g fill="#FFE08A" opacity="0.55">
                    {[[100, 90], [88, 100], [86, 116], [98, 132], [200, 134], [220, 142], [232, 140], [196, 152], [168, 158], [140, 162], [112, 156]].map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="2" />
                    ))}
                </g>
            </g>

            {/* Dragon head — angular snout with horns + glowing eye */}
            <g transform="translate(64, 50)">
                <path d="M0 30 Q -8 16 14 6 Q 34 -4 50 14 Q 56 22 50 32 Q 34 38 20 34 Q 8 34 0 30 Z"
                    fill="url(#bpScale)" stroke="#0F4A2A" strokeWidth="1.6" strokeLinejoin="round" />
                {/* Horns */}
                <path d="M18 4 Q 8 -14 14 -22 Q 22 -10 24 0 Z" fill="#FFD86B" stroke="#0F4A2A" strokeWidth="1.2" />
                <path d="M36 0 Q 36 -18 46 -22 Q 44 -8 42 4 Z" fill="#FFD86B" stroke="#0F4A2A" strokeWidth="1.2" />
                {/* Eye */}
                <ellipse cx="32" cy="20" rx="5" ry="4.5" fill="#FFD86B" stroke="#0F4A2A" strokeWidth="1.2" />
                <ellipse cx="32" cy="20" rx="0.9" ry="3.6" fill="#1F1A2A" />
                {/* Nostril */}
                <ellipse cx="6" cy="28" rx="1.4" ry="1" fill="#0F4A2A" />
                {/* Whisker */}
                <path d="M-2 30 q -10 -2 -16 6" stroke="#0F4A2A" strokeWidth="1" fill="none" />
            </g>

            {/* Dragon breath fire trailing left from the snout */}
            <g opacity="0.85">
                <path d="M44 80 Q 22 84 6 70 Q 18 100 44 92 Z" fill="url(#bpFire)">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.3s" repeatCount="indefinite" />
                </path>
                <path d="M40 86 Q 22 92 12 86 Q 26 102 40 96 Z" fill="#FFD86B" opacity="0.85">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
                </path>
            </g>

            {/* Sparkle stars */}
            <g fill="#FFFDF7">
                {[[20, 36], [260, 28], [256, 178], [16, 168]].map(([x, y], i) => (
                    <path key={i} d={`M${x} ${y - 4} l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z`}>
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
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
            <DragonScene />
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
