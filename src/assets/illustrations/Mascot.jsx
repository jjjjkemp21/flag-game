import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { paletteFor } from '../../lib/cosmetics';
import { renderHat, renderGlasses, renderEffect } from './Cosmetics';

// Build an SVG <pattern> for an animal-skin palette. The pattern tiles across
// the globe-disc bounding box; the disc itself clips it to a circle. Hand-
// drawn rather than algorithmic so each animal reads instantly at the small
// sizes Atlas is rendered at (28-120px).
function renderPatternDef(id, p) {
    const { kind, base, accent, accent2 } = p;
    if (kind === 'tiger') {
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                <path d="M0 6 q10 6 22 0 q-3 5 0 9 q-12 -2 -22 4 Z" fill={accent} />
                <path d="M30 0 q4 7 12 4 q-2 8 6 12 q-12 0 -18 -8 Z" fill={accent} />
                <path d="M0 30 q14 -2 22 6 q-8 6 -22 2 Z" fill={accent} />
                <path d="M40 26 q10 -2 18 8 q-8 6 -16 0 Z" fill={accent} />
                <path d="M8 50 q14 -4 26 4 q-12 8 -26 0 Z" fill={accent} />
                <path d="M44 50 q10 -2 18 6 q-10 4 -18 0 Z" fill={accent} />
            </pattern>
        );
    }
    if (kind === 'zebra') {
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                <path d="M-4 4 q10 8 20 0 q12 8 24 0 q12 8 28 0 l0 6 q-14 8 -28 0 q-12 8 -24 0 q-10 6 -20 0 Z" fill={accent} />
                <path d="M-4 22 q10 6 20 0 q12 6 24 -2 q12 8 28 0 l0 7 q-14 8 -28 0 q-12 8 -24 0 q-10 6 -20 0 Z" fill={accent} />
                <path d="M-4 40 q10 6 20 0 q12 8 24 0 q12 6 28 0 l0 7 q-14 8 -28 0 q-12 8 -24 0 q-10 6 -20 0 Z" fill={accent} />
                <path d="M-4 58 q10 6 20 0 q12 6 24 0 q12 6 28 0 l0 6 -68 0 Z" fill={accent} />
            </pattern>
        );
    }
    if (kind === 'cow') {
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                <path d="M6 8 q14 -6 22 4 q4 10 -6 14 q-14 4 -20 -6 q-4 -8 4 -12 Z" fill={accent} />
                <path d="M40 30 q12 -2 16 8 q-2 12 -14 12 q-12 -2 -14 -10 q-2 -8 12 -10 Z" fill={accent} />
                <path d="M12 44 q8 -2 10 6 q-2 8 -8 8 q-8 -2 -8 -8 q0 -4 6 -6 Z" fill={accent} />
                <path d="M48 6 q8 0 8 8 q-2 6 -8 6 q-8 -2 -8 -8 q0 -4 8 -6 Z" fill={accent} />
            </pattern>
        );
    }
    if (kind === 'cheetah') {
        // Cheetah: scattered solid spots over a tan base.
        const spots = [[8,10],[20,18],[34,8],[48,16],[58,26],[12,30],[24,38],[40,30],[52,40],[6,46],[18,54],[32,50],[44,56],[58,52],[28,24],[10,18]];
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                {spots.map(([x, y], i) => (
                    <ellipse key={i} cx={x} cy={y} rx={2.4 + (i % 3) * 0.4} ry={2 + (i % 2) * 0.5} fill={accent} />
                ))}
            </pattern>
        );
    }
    if (kind === 'dalmatian') {
        const spots = [[6,12],[22,6],[40,14],[54,8],[14,24],[30,22],[48,28],[60,32],[8,40],[24,42],[40,40],[56,46],[16,54],[34,56],[50,58],[6,28]];
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                {spots.map(([x, y], i) => (
                    <ellipse key={i} cx={x} cy={y} rx={2.6 + (i % 4) * 0.5} ry={2.2 + (i % 3) * 0.4} fill={accent} />
                ))}
            </pattern>
        );
    }
    if (kind === 'giraffe') {
        // Irregular polygonal patches separated by thin tan veins — the
        // characteristic giraffe look. Hand-placed so the tile reads as the
        // animal even at small avatar sizes.
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                <g fill={accent}>
                    <polygon points="6,4 18,2 22,10 14,16 4,12" />
                    <polygon points="28,2 40,4 44,12 36,18 26,12" />
                    <polygon points="48,6 60,4 62,14 52,18 46,12" />
                    <polygon points="2,22 12,20 18,28 10,34 0,30" />
                    <polygon points="22,22 34,20 38,30 28,36 20,30" />
                    <polygon points="44,22 56,24 60,32 50,38 42,30" />
                    <polygon points="6,42 18,40 22,48 14,54 4,50" />
                    <polygon points="26,42 38,44 42,52 32,58 24,52" />
                    <polygon points="46,44 60,42 62,52 52,58 44,52" />
                </g>
            </pattern>
        );
    }
    if (kind === 'leopard') {
        // Leopard rosettes: ring of dark dots with a lighter centre spot.
        const rosettes = [[10,12],[28,8],[46,14],[58,24],[14,26],[34,28],[52,32],[20,42],[40,46],[56,48],[10,52],[30,56]];
        const ring = accent;
        const centre = accent2 || base;
        return (
            <pattern id={id} patternUnits="userSpaceOnUse" width="64" height="64">
                <rect width="64" height="64" fill={base} />
                {rosettes.map(([x, y], i) => (
                    <g key={i}>
                        {[[0,-3],[3,-1.5],[3,1.5],[0,3],[-3,1.5],[-3,-1.5]].map(([dx, dy], j) => (
                            <circle key={j} cx={x + dx} cy={y + dy} r="1.1" fill={ring} />
                        ))}
                        <circle cx={x} cy={y} r="1.3" fill={centre} opacity="0.85" />
                    </g>
                ))}
            </pattern>
        );
    }
    return null;
}

/**
 * Friendly globe mascot ("Atlas"). Moods rig the expression and animation.
 * moods: 'idle' | 'cheer' | 'sad' | 'think' | 'wave'
 *      | 'hungry' | 'sleepy' | 'sick' | 'dead'
 * cosmetics: { color, hat, glasses } equips skins/hats/glasses.
 */
export default function Mascot({ size = 96, mood = 'idle', cosmetics, still = false, chubby = false, bruised = false }) {
    const prefersReduced = useReducedMotion();
    const calm = prefersReduced || still;
    const uid = useId();
    const bodyId = `globeBody-${uid}`;
    const flagId = `globeFlag-${uid}`;
    const cos = cosmetics || {};
    const palette = paletteFor(cos.color);
    const anim = palette.anim;
    const pattern = palette.pattern || null;
    const glow = palette.glow || null;
    const glowId = `globeGlow-${uid}`;
    // Cosmetic animations (color cycling, overlays, effects) run via SMIL so they
    // play everywhere the mascot appears — previews, leaderboard avatars, other
    // players — and regardless of `still` or a reduced-motion preference. They're
    // opt-in flourishes the player unlocked, so we always show them; only the
    // idle bob (framer) respects `calm`/reduced-motion.
    const animate = !!anim;
    const effectEl = renderEffect(cos.effect);
    const spinning = cos.effect === 'spin';
    const stopVals = (i) => (anim ? [...anim.frames.map((f) => f[i]), anim.frames[0][i]].join(';') : '');

    // Player-chosen placement for cosmetics: translate + scale about an anchor.
    const placement = (p, ax, ay) => {
        const x = (p && p.x) || 0;
        const y = (p && p.y) || 0;
        const s = p && p.s != null ? p.s : 1;
        return `translate(${x} ${y}) translate(${ax} ${ay}) scale(${s}) translate(${-ax} ${-ay})`;
    };
    const hatEl = renderHat(cos.hat);
    const glassesEl = renderGlasses(cos.glasses);

    const bobVariants = {
        idle:   { y: [0, -3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
        cheer:  { y: [0, -10, 0], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } },
        sad:    { y: 4, transition: { duration: 0.4 } },
        think:  { rotate: [0, -3, 3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
        wave:   { rotate: [0, -6, 6, -4, 0], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
        hungry: { y: [0, -2, 0], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
        sleepy: { y: [0, -1.5, 0], transition: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' } },
        sick:   { rotate: [0, -2.5, 2.5, -1.5, 0], transition: { duration: 1.3, repeat: Infinity, ease: 'easeInOut' } },
        dead:   { y: 6, opacity: 0.75, transition: { duration: 0.6 } },
    };

    const mouth = {
        idle:   <path d="M40 60 Q48 66 56 60" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
        cheer:  <path d="M37 56 Q48 72 59 56 Q55 70 48 70 Q41 70 37 56 Z" fill="#1F1A3B" />,
        sad:    <path d="M40 64 Q48 56 56 64" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
        think:  <path d="M40 62 L 56 62" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" />,
        wave:   <path d="M40 60 Q48 68 56 60" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
        hungry: <ellipse cx="48" cy="63" rx="5" ry="6" fill="#1F1A3B" />,
        sleepy: <circle cx="48" cy="62" r="3" fill="#1F1A3B" />,
        sick:   <path d="M40 62 Q44 58 48 62 T56 62" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
        dead:   <path d="M41 64 L 55 64" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" />,
    }[mood];

    const openEyes = (
        <>
            <circle cx="38" cy="46" r="4.5" fill="#1F1A3B" />
            <circle cx="58" cy="46" r="4.5" fill="#1F1A3B" />
            <circle cx="39.5" cy="44.5" r="1.4" fill="#fff" />
            <circle cx="59.5" cy="44.5" r="1.4" fill="#fff" />
        </>
    );
    const blink = (dur, delay) => ({
        animate: calm ? undefined : { scaleY: [1, 1, 0.12, 1] },
        transition: { duration: dur, repeat: Infinity, repeatDelay: delay, times: [0, 0.94, 0.97, 1] },
        style: { transformOrigin: 'center' },
    });

    // Each mood gets its own eye shape; combined with the mood-specific eyebrows
    // and mouth below, Atlas shows a distinct expression for every state.
    const eyesByMood = {
        idle:   <motion.g {...blink(4, 2)}>{openEyes}</motion.g>,
        wave:   <motion.g {...blink(3.4, 1.4)}>{openEyes}</motion.g>,
        cheer: (
            <g stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M33 48 Q38 42 43 48" />
                <path d="M53 48 Q58 42 63 48" />
            </g>
        ),
        think: (
            <g fill="#1F1A3B">
                <circle cx="38" cy="46" r="4.5" />
                <circle cx="58" cy="46" r="4.5" />
                <circle cx="38" cy="43.8" r="1.6" fill="#fff" />
                <circle cx="58" cy="43.8" r="1.6" fill="#fff" />
            </g>
        ),
        hungry: (
            <g fill="#1F1A3B">
                <circle cx="38" cy="46" r="5.6" />
                <circle cx="58" cy="46" r="5.6" />
                <circle cx="39.9" cy="43.9" r="1.9" fill="#fff" />
                <circle cx="59.9" cy="43.9" r="1.9" fill="#fff" />
            </g>
        ),
        sad: (
            <g>
                <circle cx="38" cy="47.5" r="4" fill="#1F1A3B" />
                <circle cx="58" cy="47.5" r="4" fill="#1F1A3B" />
                <circle cx="39" cy="46.4" r="1.2" fill="#fff" />
                <circle cx="59" cy="46.4" r="1.2" fill="#fff" />
                <path d="M33 45 Q38 48 43 45" stroke="#1F1A3B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                <path d="M53 45 Q58 48 63 45" stroke="#1F1A3B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </g>
        ),
        sick: (
            <g stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M34 46 Q38 49 42 46" />
                <path d="M54 47 Q58 44 62 47" />
            </g>
        ),
        sleepy: (
            <g stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M33 46 Q38 50 43 46" />
                <path d="M53 46 Q58 50 63 46" />
            </g>
        ),
        dead: (
            <g stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round">
                <path d="M34 42 L 42 50 M42 42 L 34 50" />
                <path d="M54 42 L 62 50 M62 42 L 54 50" />
            </g>
        ),
    };
    const eyes = eyesByMood[mood] || eyesByMood.idle;

    // Mood-specific eyebrows (none for 'dead').
    const browsByMood = {
        idle:   <><path d="M33 39 Q38 37.5 43 39" /><path d="M53 39 Q58 37.5 63 39" /></>,
        cheer:  <><path d="M31 36 Q38 32 45 36" /><path d="M51 36 Q58 32 65 36" /></>,
        wave:   <><path d="M32 37 Q38 35 44 37" /><path d="M52 37 Q58 35 64 37" /></>,
        think:  <><path d="M30 40 L 44 37" /><path d="M66 37 L 52 37" /></>,
        hungry: <><path d="M31 37 Q38 34 45 37" /><path d="M51 37 Q58 34 65 37" /></>,
        sad:    <><path d="M32 38 L 44 42" /><path d="M64 38 L 52 42" /></>,
        sick:   <><path d="M32 39 L 44 42" /><path d="M64 39 L 52 42" /></>,
        sleepy: <><path d="M33 41 Q38 42.5 43 41" /><path d="M53 41 Q58 42.5 63 41" /></>,
    };
    const brows = browsByMood[mood];

    return (
        <motion.div
            aria-hidden="true"
            style={{ display: 'inline-block', width: size, height: size }}
            animate={calm ? undefined : bobVariants[mood]}
            initial={false}
        >
            <svg width={size} height={size} viewBox="0 0 96 96" overflow="visible" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id={bodyId} cx="0.35" cy="0.3" r="0.8">
                        <stop offset="0" stopColor={palette.stops[0]}>
                            {animate && <animate attributeName="stop-color" values={stopVals(0)} dur={anim.dur} repeatCount="indefinite" />}
                        </stop>
                        <stop offset="0.55" stopColor={palette.stops[1]}>
                            {animate && <animate attributeName="stop-color" values={stopVals(1)} dur={anim.dur} repeatCount="indefinite" />}
                        </stop>
                        <stop offset="1" stopColor={palette.stops[2]}>
                            {animate && <animate attributeName="stop-color" values={stopVals(2)} dur={anim.dur} repeatCount="indefinite" />}
                        </stop>
                    </radialGradient>
                    <linearGradient id={flagId} x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor="#FF5C6C" />
                        <stop offset="1" stopColor="#FFC247" />
                    </linearGradient>
                    {pattern && renderPatternDef(`pat-${uid}`, pattern)}
                    {glow && (
                        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="3.2" result="b1" />
                            <feMerge>
                                <feMergeNode in="b1" />
                                <feMergeNode in="b1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    )}
                </defs>

                {/* Soft shadow */}
                <ellipse cx="48" cy="88" rx="26" ry="4" fill="#1F1A3B" opacity=".18" />

                {/* Glow halo behind the globe for neon skins */}
                {glow && (
                    <circle cx="48" cy="48" r="38" fill={glow.color} opacity="0.45" filter={`url(#${glowId})`}>
                        <animate attributeName="opacity" values="0.3;0.65;0.3" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                )}

                {/* Globe — solid pattern fill (with subtle gradient overlay for shading) or pure gradient */}
                {pattern ? (
                    <>
                        <circle cx="48" cy="48" r="34" fill={`url(#pat-${uid})`} stroke={palette.stroke} strokeWidth="2" />
                        {/* Soft highlight to keep the sphere feeling round */}
                        <circle cx="48" cy="48" r="34" fill={`url(#${bodyId})`} opacity="0.18" style={{ mixBlendMode: 'screen' }} />
                    </>
                ) : (
                    <circle cx="48" cy="48" r="34" fill={`url(#${bodyId})`} stroke={palette.stroke} strokeWidth="2" />
                )}

                {/* Continents (stylized) — hidden under animal-pattern skins so
                    the pattern reads cleanly. Rotate for the "spinning globe" effect. */}
                {!pattern && (
                    <g>
                        {spinning && (
                            <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="8s" repeatCount="indefinite" />
                        )}
                        <path
                            d="M22 44 C 30 36, 36 40, 42 36 C 44 44, 36 52, 28 50 Z M58 30 C 64 30, 70 36, 68 44 C 60 46, 56 38, 58 30 Z M50 56 C 60 54, 68 60, 64 70 C 56 70, 50 64, 50 56 Z"
                            fill="#19C37D"
                            opacity=".85"
                        />
                    </g>
                )}

                {/* Animated overlays for flashy globe skins (twinkle / rising embers) */}
                {animate && palette.overlay === 'stars' && (
                    <g fill="#FFFFFF">
                        {[[30, 40, 1.2, 2.2], [60, 38, 1, 2.6], [40, 60, 1.3, 3], [64, 56, 0.9, 2], [48, 30, 1, 2.4], [26, 52, 0.8, 3.2]].map((s, i) => (
                            <circle key={i} cx={s[0]} cy={s[1]} r={s[2]}>
                                <animate attributeName="opacity" values="0.15;1;0.15" dur={`${s[3]}s`} repeatCount="indefinite" />
                            </circle>
                        ))}
                    </g>
                )}
                {animate && palette.overlay === 'embers' && (
                    <g fill="#FFD08A">
                        {[[34, 66, 1.4, 2.4], [50, 68, 1.1, 3], [62, 64, 1.3, 2], [42, 70, 1, 2.7]].map((s, i) => (
                            <circle key={i} cx={s[0]} cy={s[1]} r={s[2]}>
                                <animate attributeName="cy" values={`${s[1]};${s[1] - 22}`} dur={`${s[3]}s`} repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0;0.9;0" dur={`${s[3]}s`} repeatCount="indefinite" />
                            </circle>
                        ))}
                    </g>
                )}

                {/* Queasy tint when sick */}
                {mood === 'sick' && <circle cx="48" cy="48" r="34" fill="#19C37D" opacity=".22" />}

                {/* Cheeks (flushed brighter when sick; puffed out when chubby) */}
                <circle cx={chubby ? 31 : 34} cy={chubby ? 60 : 58} r={chubby ? 8 : 4} fill={mood === 'sick' ? '#9AD7A0' : '#FF8A98'} opacity=".75" />
                <circle cx={chubby ? 65 : 62} cy={chubby ? 60 : 58} r={chubby ? 8 : 4} fill={mood === 'sick' ? '#9AD7A0' : '#FF8A98'} opacity=".75" />

                {/* Battle bruises + bandages (Atlas Battle "beat up" look) */}
                {bruised && mood !== 'dead' && (
                    <g>
                        {/* Bold purple/blue bruise patches */}
                        <ellipse cx="29" cy="41" rx="6.5" ry="5" fill="#7A3FB0" opacity="0.72" />
                        <ellipse cx="67" cy="56" rx="6" ry="4.8" fill="#3F5BC8" opacity="0.68" />
                        {/* A swelling lump near the brow */}
                        <circle cx="64" cy="33" r="4.2" fill="#9A4FC8" opacity="0.7" />
                        {/* Crossed plaster on the cheek */}
                        <g transform="rotate(28 62 44)">
                            <rect x="52" y="39" width="20" height="9" rx="3" fill="#FFE7C2" stroke="#D9A86A" strokeWidth="1.4" />
                            <line x1="57" y1="39" x2="57" y2="48" stroke="#D9A86A" strokeWidth="1" />
                            <line x1="62" y1="39" x2="62" y2="48" stroke="#D9A86A" strokeWidth="1" />
                            <line x1="67" y1="39" x2="67" y2="48" stroke="#D9A86A" strokeWidth="1" />
                        </g>
                        {/* A single plaster strip on the other cheek */}
                        <rect x="22" y="50" width="14" height="6" rx="2.5" transform="rotate(-18 29 53)" fill="#FFE7C2" stroke="#D9A86A" strokeWidth="1.2" />
                    </g>
                )}

                {/* Eyes */}
                {eyes}

                {/* Glasses cosmetic (over the eyes) */}
                {mood !== 'dead' && glassesEl && (
                    <g transform={placement(cos.glassesPos, 48, 46)}>{glassesEl}</g>
                )}

                {/* Mood-specific eyebrows */}
                {brows && (
                    <g stroke="#1F1A3B" strokeWidth="2.5" strokeLinecap="round" fill="none">
                        {brows}
                    </g>
                )}

                {/* Mouth */}
                {mouth}

                {/* Sweat drop when hungry or sick */}
                {(mood === 'hungry' || mood === 'sick') && !calm && (
                    <motion.path
                        d="M70 32 q3 6 0 9 q-3 -3 0 -9 Z"
                        fill="#2EC4D3"
                        animate={{ y: [0, 2, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                    />
                )}

                {/* Zzz when sleepy */}
                {mood === 'sleepy' && !calm && (
                    <motion.g
                        fill="#1F1A3B"
                        opacity="0.7"
                        animate={{ y: [0, -6, -12], opacity: [0, 1, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity }}
                    >
                        <text x="66" y="26" fontSize="10" fontWeight="700">z</text>
                        <text x="74" y="18" fontSize="13" fontWeight="700">Z</text>
                    </motion.g>
                )}

                {/* Tiny flag pole + flag — the default "hat". Hidden once the player
                    equips a real hat, and gone when Atlas has died. */}
                {mood !== 'dead' && !hatEl && (
                    <motion.g
                        style={{ transformOrigin: '76px 22px' }}
                        animate={calm ? undefined : {
                            rotate: mood === 'wave' || mood === 'cheer' ? [0, -10, 10, -8, 0] : [0, -3, 3, 0],
                        }}
                        transition={{ duration: mood === 'wave' ? 1.6 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <rect x="74" y="14" width="2" height="22" rx="1" fill="#1F1A3B" />
                        <path d="M76 14 L 92 18 L 76 24 Z" fill={`url(#${flagId})`} />
                    </motion.g>
                )}

                {/* Hat cosmetic (drawn on top) */}
                {hatEl && <g transform={placement(cos.hatPos, 48, 12)}>{hatEl}</g>}

                {/* Sparkles on cheer */}
                {mood === 'cheer' && !calm && (
                    <motion.g
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.0, repeat: Infinity }}
                    >
                        <circle cx="14" cy="20" r="2" fill="#FFC247" />
                        <circle cx="82" cy="70" r="2" fill="#FFC247" />
                        <circle cx="12" cy="68" r="1.5" fill="#FF5C6C" />
                        <circle cx="86" cy="14" r="1.5" fill="#19C37D" />
                    </motion.g>
                )}

                {/* Cosmetic effect overlay (animated flourish) */}
                {effectEl}
            </svg>
        </motion.div>
    );
}
