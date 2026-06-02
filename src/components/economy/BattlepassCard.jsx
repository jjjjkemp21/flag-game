import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAudio } from '../../audio/AudioProvider';
import { useBattlepass } from '../../lib/battlepass';
import { getSeason } from '../../lib/battlepassCatalog';
import { springs } from '../../motion/index';

// Hero card on the main menu announcing the Atlas Pass. It reflects the season
// the player has SELECTED (the season dropdown on the pass screen persists this
// choice), so switching seasons re-skins this card. Each season has its own
// emblem so the home screen reads as the chosen theme at a glance.

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
                <pattern id="bpHexPattern" patternUnits="userSpaceOnUse" width="13.86" height="24">
                    <g fill="url(#bpScaleGrad)" stroke="#143F1F" strokeOpacity="0.35" strokeWidth="0.5">
                        <path d="M 0 -8 L 6.93 -4 L 6.93 4 L 0 8 L -6.93 4 L -6.93 -4 Z" />
                        <path d="M 13.86 -8 L 20.79 -4 L 20.79 4 L 13.86 8 L 6.93 4 L 6.93 -4 Z" />
                        <path d="M 6.93 4 L 13.86 8 L 13.86 16 L 6.93 20 L 0 16 L 0 8 Z" />
                        <path d="M 0 16 L 6.93 20 L 6.93 28 L 0 32 L -6.93 28 L -6.93 20 Z" />
                        <path d="M 13.86 16 L 20.79 20 L 20.79 28 L 13.86 32 L 6.93 28 L 6.93 20 Z" />
                    </g>
                </pattern>
                <linearGradient id="bpFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="40%" stopColor="#000" />
                    <stop offset="62%" stopColor="#FFF" />
                </linearGradient>
                <mask id="bpFadeMask">
                    <rect x="0" y="0" width="280" height="200" fill="url(#bpFade)" />
                </mask>
            </defs>

            <circle cx="200" cy="100" r="84" fill="url(#bpHalo)" />
            <rect x="0" y="0" width="280" height="200" fill="url(#bpHexPattern)" mask="url(#bpFadeMask)" />
            <g fill="url(#bpAccentGrad)" stroke="#143F1F" strokeOpacity="0.45" strokeWidth="0.5">
                {[[166, 40], [248, 52], [180, 156], [256, 132], [228, 172], [152, 92]].map(([cx, cy], i) => (
                    <path
                        key={i}
                        d={`M ${cx} ${cy - 8} L ${cx + 6.93} ${cy - 4} L ${cx + 6.93} ${cy + 4} L ${cx} ${cy + 8} L ${cx - 6.93} ${cy + 4} L ${cx - 6.93} ${cy - 4} Z`}
                    />
                ))}
            </g>
            <g>
                <path d="M 184 90 Q 162 76 148 44 Q 158 52 168 64 Q 178 76 192 86 Z"
                      fill="#FFD86B" stroke="#143F1F" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 160 64 Q 168 70 178 78" stroke="#C49A3A" strokeWidth="1" fill="none" opacity="0.7" />
                <path d="M 216 90 Q 238 76 252 44 Q 242 52 232 64 Q 222 76 208 86 Z"
                      fill="#FFD86B" stroke="#143F1F" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 240 64 Q 232 70 222 78" stroke="#C49A3A" strokeWidth="1" fill="none" opacity="0.7" />
                <ellipse cx="188" cy="106" rx="8" ry="7" fill="#FFD86B" stroke="#143F1F" strokeWidth="1.6" />
                <ellipse cx="188" cy="106" rx="1.3" ry="5.8" fill="#1F1A2A" />
                <circle cx="186" cy="103" r="1.3" fill="#FFFDF7" opacity="0.95" />
                <ellipse cx="212" cy="106" rx="8" ry="7" fill="#FFD86B" stroke="#143F1F" strokeWidth="1.6" />
                <ellipse cx="212" cy="106" rx="1.3" ry="5.8" fill="#1F1A2A" />
                <circle cx="214" cy="103" r="1.3" fill="#FFFDF7" opacity="0.95" />
            </g>
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

// Olympus emblem — a marble temple on the right against a dawn sky, crowned by
// a golden thunderbolt and laurel, with twinkling stars. The left fades out so
// the card copy stays legible.
function OlympusEmblem() {
    return (
        <svg
            className="bp-card__art"
            viewBox="0 0 280 200"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="bpOlSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A3F72" />
                    <stop offset="55%" stopColor="#6E84BC" />
                    <stop offset="100%" stopColor="#FFD89A" />
                </linearGradient>
                <linearGradient id="bpOlMarble" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBFCFE" />
                    <stop offset="100%" stopColor="#C7CEDC" />
                </linearGradient>
                <linearGradient id="bpOlGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF1C2" />
                    <stop offset="100%" stopColor="#E5A018" />
                </linearGradient>
                <radialGradient id="bpOlSun" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFDEC" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#FFC247" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="bpOlFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="38%" stopColor="#000" />
                    <stop offset="60%" stopColor="#FFF" />
                </linearGradient>
                <mask id="bpOlFadeMask">
                    <rect x="0" y="0" width="280" height="200" fill="url(#bpOlFade)" />
                </mask>
            </defs>

            {/* Sky + sun glow only on the right (faded) */}
            <g mask="url(#bpOlFadeMask)">
                <rect x="0" y="0" width="280" height="200" fill="url(#bpOlSky)" />
                <circle cx="206" cy="150" r="90" fill="url(#bpOlSun)" />
                {/* Distant peaks */}
                <path d="M120,150 L160,108 L196,150 L232,104 L280,150 L280,200 L120,200 Z" fill="#4A5887" opacity="0.5" />
                {/* Temple */}
                <g>
                    <rect x="170" y="150" width="86" height="6" fill="#D4DAE4" />
                    <rect x="174" y="146" width="78" height="5" fill="#E8ECF3" />
                    <g fill="url(#bpOlMarble)" stroke="#AEB6C6" strokeWidth="0.6">
                        {[178, 196, 214, 232].map((x, i) => (
                            <rect key={i} x={x} y="118" width="8" height="30" rx="1" />
                        ))}
                    </g>
                    <rect x="172" y="110" width="82" height="8" rx="1" fill="#E8ECF3" stroke="#AEB6C6" strokeWidth="0.6" />
                    <path d="M168,110 L213,88 L258,110 Z" fill="url(#bpOlMarble)" stroke="#AEB6C6" strokeWidth="0.6" />
                </g>
            </g>

            {/* Golden thunderbolt + laurel crest, centred over the temple */}
            <g>
                <path d="M150 36 L132 84 L150 80 L138 120 L172 70 L152 74 Z"
                      fill="url(#bpOlGold)" stroke="#7A5210" strokeWidth="1.6" strokeLinejoin="round" />
                {/* Laurel sprigs flanking the bolt */}
                <g stroke="#C49A3A" strokeWidth="1.4" fill="none" strokeLinecap="round">
                    <path d="M120 110 Q 116 86 134 72" />
                    <path d="M186 110 Q 190 86 172 72" />
                </g>
                <g fill="url(#bpOlGold)" stroke="#7A5210" strokeWidth="0.5">
                    {[[120, 104], [122, 94], [128, 84], [186, 104], [184, 94], [178, 84]].map(([x, y], i) => (
                        <ellipse key={i} cx={x} cy={y} rx="3.2" ry="1.6" transform={`rotate(${x < 153 ? -40 : 40} ${x} ${y})`} />
                    ))}
                </g>
            </g>

            {/* Twinkling stars */}
            <g fill="#FFFDF7">
                {[[24, 30], [60, 56], [250, 28], [236, 172]].map(([x, y], i) => (
                    <path key={i} d={`M${x} ${y - 4} l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 l 3 -1 Z`}>
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
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
    const season = getSeason(bp.season);
    const theme = bp.theme || season.theme;
    const tierCount = bp.tierCount || season.tierCount;
    const isActive = bp.season === bp.activeSeason;
    const Emblem = theme.key === 'olympus' ? OlympusEmblem : ReptileEmblem;
    const progressPct = bp.totalStars > 0 ? Math.min(100, Math.round((bp.stars / bp.totalStars) * 100)) : 0;
    const tierLabel = bp.loaded ? `Tier ${bp.tier} / ${tierCount}` : `${tierCount} tiers`;

    return (
        <motion.button
            className={`mode-card mode-card--xl bp-card bp-card--${theme.key} ${bp.owned ? 'is-premium' : ''}`}
            onClick={() => { audio.play('click'); onClick(); }}
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + index * 0.06 }}
            whileHover={prefersReduced ? undefined : { y: -3 }}
            whileTap={prefersReduced ? undefined : { scale: 0.98 }}
            aria-label={`Atlas Pass — ${theme.title}`}
        >
            <Emblem />
            <div className="bp-card__copy">
                <span className="bp-card__eyebrow">
                    <span className="bp-card__dot" />
                    {isActive ? 'Live now' : 'Past season'}
                </span>
                <h3 className="bp-card__title">{theme.title}</h3>
                <p className="bp-card__sub">{theme.cardSub}</p>
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
