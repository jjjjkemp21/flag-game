import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { paletteFor } from '../../lib/cosmetics';
import { renderHat, renderGlasses } from './Cosmetics';

/**
 * Friendly globe mascot ("Atlas"). Moods rig the expression and animation.
 * moods: 'idle' | 'cheer' | 'sad' | 'think' | 'wave'
 *      | 'hungry' | 'sleepy' | 'sick' | 'dead'
 * cosmetics: { color, hat, glasses } equips skins/hats/glasses.
 */
export default function Mascot({ size = 96, mood = 'idle', cosmetics, still = false }) {
    const prefersReduced = useReducedMotion();
    const calm = prefersReduced || still;
    const uid = useId();
    const bodyId = `globeBody-${uid}`;
    const flagId = `globeFlag-${uid}`;
    const cos = cosmetics || {};
    const palette = paletteFor(cos.color);
    const anim = palette.anim;
    const animate = !!anim && !calm;
    const stopVals = (i) => (anim ? [...anim.frames.map((f) => f[i]), anim.frames[0][i]].join(';') : '');

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

    const blinkingEyes = (
        <motion.g
            animate={calm ? undefined : { scaleY: mood === 'sad' ? 0.6 : [1, 1, 0.12, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, times: [0, 0.94, 0.97, 1] }}
            style={{ transformOrigin: 'center' }}
        >
            <circle cx="38" cy="46" r="4.5" fill="#1F1A3B" />
            <circle cx="58" cy="46" r="4.5" fill="#1F1A3B" />
            <circle cx="39.5" cy="44.5" r="1.4" fill="#fff" />
            <circle cx="59.5" cy="44.5" r="1.4" fill="#fff" />
        </motion.g>
    );

    const sleepyEyes = (
        <g stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M33 46 Q38 50 43 46" />
            <path d="M53 46 Q58 50 63 46" />
        </g>
    );

    const deadEyes = (
        <g stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round">
            <path d="M34 42 L 42 50 M42 42 L 34 50" />
            <path d="M54 42 L 62 50 M62 42 L 54 50" />
        </g>
    );

    const eyes = mood === 'dead' ? deadEyes : mood === 'sleepy' ? sleepyEyes : blinkingEyes;

    return (
        <motion.div
            aria-hidden="true"
            style={{ display: 'inline-block', width: size, height: size }}
            animate={calm ? undefined : bobVariants[mood]}
            initial={false}
        >
            <svg width={size} height={size} viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
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
                </defs>

                {/* Soft shadow */}
                <ellipse cx="48" cy="88" rx="26" ry="4" fill="#1F1A3B" opacity=".18" />

                {/* Globe */}
                <circle cx="48" cy="48" r="34" fill={`url(#${bodyId})`} stroke={palette.stroke} strokeWidth="2" />

                {/* Continents (stylized) */}
                <path
                    d="M22 44 C 30 36, 36 40, 42 36 C 44 44, 36 52, 28 50 Z M58 30 C 64 30, 70 36, 68 44 C 60 46, 56 38, 58 30 Z M50 56 C 60 54, 68 60, 64 70 C 56 70, 50 64, 50 56 Z"
                    fill="#19C37D"
                    opacity=".85"
                />

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

                {/* Cheeks (flushed brighter when sick) */}
                <circle cx="34" cy="58" r="4" fill={mood === 'sick' ? '#9AD7A0' : '#FF8A98'} opacity=".75" />
                <circle cx="62" cy="58" r="4" fill={mood === 'sick' ? '#9AD7A0' : '#FF8A98'} opacity=".75" />

                {/* Eyes */}
                {eyes}

                {/* Glasses cosmetic (over the eyes) */}
                {mood !== 'dead' && renderGlasses(cos.glasses)}

                {/* Eyebrows for sad / think / hungry */}
                {(mood === 'sad' || mood === 'hungry') && (
                    <>
                        <path d="M32 38 L 44 42" stroke="#1F1A3B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M64 38 L 52 42" stroke="#1F1A3B" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                )}
                {mood === 'think' && (
                    <>
                        <path d="M30 40 L 44 38" stroke="#1F1A3B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M66 38 L 52 38" stroke="#1F1A3B" strokeWidth="2.5" strokeLinecap="round" />
                    </>
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

                {/* Tiny flag pole + flag — droops/stops when unwell or gone */}
                {mood !== 'dead' && (
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
                {renderHat(cos.hat)}

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
            </svg>
        </motion.div>
    );
}
