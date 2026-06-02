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

// Olympus emblem — a marble temple on the right against a dawn sky textured with
// a Greek-key meander band and god-rays, crowned by a golden thunderbolt held in
// a full laurel wreath over a radiant halo, with twinkling stars. The left fades
// out so the card copy stays legible. Detailed to match the season-1 emblem.
function OlympusEmblem() {
    // Laurel leaves sampled along each wreath arc, angled tangent to the ring so
    // the sprigs read as a continuous wreath rather than scattered leaves.
    const laurelLeft = [[110, 96, -52], [105, 80, -74], [106, 64, -98], [113, 49, -120], [124, 38, -142], [137, 31, -162]];
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
                    <stop offset="0%" stopColor="#243A6E" />
                    <stop offset="48%" stopColor="#6E84BC" />
                    <stop offset="100%" stopColor="#FFD89A" />
                </linearGradient>
                <linearGradient id="bpOlMarble" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBFCFE" />
                    <stop offset="100%" stopColor="#C2CAD9" />
                </linearGradient>
                <linearGradient id="bpOlGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF6D6" />
                    <stop offset="48%" stopColor="#FFD86B" />
                    <stop offset="100%" stopColor="#C98A14" />
                </linearGradient>
                <linearGradient id="bpOlLeaf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE9A6" />
                    <stop offset="100%" stopColor="#C49A3A" />
                </linearGradient>
                <radialGradient id="bpOlSun" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFDEC" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#FFC247" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="bpOlHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFE9A0" stopOpacity="0.55" />
                    <stop offset="60%" stopColor="#FFD86B" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#FFD86B" stopOpacity="0" />
                </radialGradient>
                {/* Greek-key meander — the signature Hellenic border texture, the
                    Olympus analogue of season 1's reptilian scale pattern. */}
                <pattern id="bpOlMeander" patternUnits="userSpaceOnUse" width="20" height="20">
                    <path d="M2 2 H14 V14 H6 V6 H10 V10"
                          fill="none" stroke="#FFE9A6" strokeOpacity="0.5" strokeWidth="1.1"
                          strokeLinecap="square" strokeLinejoin="miter" />
                </pattern>
                <linearGradient id="bpOlFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="38%" stopColor="#000" />
                    <stop offset="60%" stopColor="#FFF" />
                </linearGradient>
                <mask id="bpOlFadeMask">
                    <rect x="0" y="0" width="280" height="200" fill="url(#bpOlFade)" />
                </mask>
                {/* A horizontal slab the meander band lives in, faded at the left. */}
                <linearGradient id="bpOlBandFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="45%" stopColor="#000" />
                    <stop offset="70%" stopColor="#FFF" />
                </linearGradient>
                <mask id="bpOlBandMask">
                    <rect x="0" y="0" width="280" height="200" fill="url(#bpOlBandFade)" />
                </mask>
            </defs>

            {/* Sky + sun glow + god-rays + temple, all faded toward the left */}
            <g mask="url(#bpOlFadeMask)">
                <rect x="0" y="0" width="280" height="200" fill="url(#bpOlSky)" />
                <circle cx="206" cy="158" r="100" fill="url(#bpOlSun)" />
                {/* God-rays fanning up from the rising sun */}
                <g fill="#FFFDEC" opacity="0.12">
                    {[-34, -18, 0, 18, 34].map((a, i) => (
                        <path key={i} d="M206 158 L200 40 L212 40 Z" transform={`rotate(${a} 206 158)`} />
                    ))}
                </g>
                {/* Distant snow-capped peaks */}
                <path d="M104,152 L150,104 L188,152 L224,98 L280,152 L280,200 L104,200 Z" fill="#46568A" opacity="0.55" />
                <path d="M150,104 L160,116 L150,120 L140,116 Z M224,98 L235,112 L224,116 L213,112 Z" fill="#EAF0FA" opacity="0.7" />
                {/* Soft clouds banking around the sanctuary */}
                <g fill="#F4F7FC" opacity="0.55">
                    <ellipse cx="172" cy="158" rx="22" ry="7" />
                    <ellipse cx="252" cy="150" rx="26" ry="8" />
                    <ellipse cx="210" cy="166" rx="34" ry="9" />
                </g>
                {/* Temple */}
                <g>
                    {/* Stepped stylobate */}
                    <rect x="166" y="156" width="96" height="7" rx="1" fill="#C7CEDC" />
                    <rect x="170" y="150" width="88" height="6" rx="1" fill="#DCE2EC" />
                    <rect x="174" y="145" width="80" height="5" rx="1" fill="#EEF2F8" />
                    {/* Fluted columns with shaded right edge */}
                    <g>
                        {[178, 196, 214, 232].map((x, i) => (
                            <g key={i}>
                                <rect x={x} y="116" width="9" height="29" rx="1" fill="url(#bpOlMarble)" stroke="#AEB6C6" strokeWidth="0.5" />
                                <rect x={x + 6} y="116" width="3" height="29" fill="#AEB6C6" opacity="0.4" />
                                <rect x={x + 2} y="116" width="1" height="29" fill="#FBFCFE" opacity="0.8" />
                            </g>
                        ))}
                    </g>
                    {/* Architrave + a tiny meander frieze */}
                    <rect x="170" y="108" width="84" height="9" rx="1" fill="#EEF2F8" stroke="#AEB6C6" strokeWidth="0.5" />
                    <g stroke="#C49A3A" strokeOpacity="0.7" strokeWidth="0.8" fill="none" strokeLinejoin="miter">
                        {[176, 192, 208, 224, 240].map((x, i) => (
                            <path key={i} d={`M${x} 115 v-5 h5 v3`} />
                        ))}
                    </g>
                    {/* Pediment with shaded tympanum + acroteria finials */}
                    <path d="M166,108 L212,84 L258,108 Z" fill="url(#bpOlMarble)" stroke="#AEB6C6" strokeWidth="0.6" strokeLinejoin="round" />
                    <path d="M178,108 L212,90 L246,108 Z" fill="#C7CEDC" opacity="0.5" />
                    <circle cx="212" cy="84" r="2.2" fill="#FFD86B" />
                    <circle cx="166" cy="108" r="1.8" fill="#FFD86B" />
                    <circle cx="258" cy="108" r="1.8" fill="#FFD86B" />
                </g>
            </g>

            {/* Greek-key meander band running across the scene as a textural ribbon */}
            <g mask="url(#bpOlBandMask)">
                <rect x="0" y="168" width="280" height="20" fill="url(#bpOlMeander)" />
            </g>

            {/* Radiant halo behind the crest */}
            <circle cx="150" cy="74" r="62" fill="url(#bpOlHalo)" />

            {/* Full laurel wreath encircling the bolt */}
            <g fill="url(#bpOlLeaf)" stroke="#7A5210" strokeWidth="0.5">
                {laurelLeft.map(([x, y, r], i) => (
                    <ellipse key={`l${i}`} cx={x} cy={y} rx="5" ry="2.1" transform={`rotate(${r} ${x} ${y})`} />
                ))}
                {laurelLeft.map(([x, y, r], i) => (
                    <ellipse key={`r${i}`} cx={300 - x} cy={y} rx="5" ry="2.1" transform={`rotate(${-r} ${300 - x} ${y})`} />
                ))}
                {/* Berries where the sprigs cross at the base */}
                <circle cx="146" cy="116" r="2" />
                <circle cx="154" cy="116" r="2" />
            </g>

            {/* Golden thunderbolt — glow underlay then the crisp bolt on top */}
            <g>
                <path d="M159 44 L139 78 L151 75 L141 106 L168 66 L155 69 Z"
                      fill="#FFE9A0" opacity="0.5" transform="scale(1.06) translate(-9 -4.5)" />
                <path d="M159 44 L139 78 L151 75 L141 106 L168 66 L155 69 Z"
                      fill="url(#bpOlGold)" stroke="#7A5210" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M153 52 L145 76 L154 73" fill="none" stroke="#FFF6D6" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
            </g>

            {/* Twinkling stars */}
            <g fill="#FFFDF7">
                {[[26, 30], [58, 54], [250, 26], [232, 170], [88, 28]].map(([x, y], i) => (
                    <path key={i} d={`M${x} ${y - 4.5} l 1.1 3.4 l 3.4 1.1 l -3.4 1.1 l -1.1 3.4 l -1.1 -3.4 l -3.4 -1.1 l 3.4 -1.1 Z`}>
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
