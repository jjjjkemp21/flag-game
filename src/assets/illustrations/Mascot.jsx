import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Friendly globe mascot. Moods rig the expression and animation.
 * moods: 'idle' | 'cheer' | 'sad' | 'think' | 'wave'
 */
export default function Mascot({ size = 96, mood = 'idle' }) {
    const prefersReduced = useReducedMotion();

    const bobVariants = {
        idle:  { y: [0, -3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
        cheer: { y: [0, -10, 0], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } },
        sad:   { y: 4, transition: { duration: 0.4 } },
        think: { rotate: [0, -3, 3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
        wave:  { rotate: [0, -6, 6, -4, 0], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
    };

    const mouth = {
        idle:  <path d="M40 60 Q48 66 56 60" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
        cheer: <path d="M37 56 Q48 72 59 56 Q55 70 48 70 Q41 70 37 56 Z" fill="#1F1A3B" />,
        sad:   <path d="M40 64 Q48 56 56 64" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
        think: <path d="M40 62 L 56 62" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" />,
        wave:  <path d="M40 60 Q48 68 56 60" stroke="#1F1A3B" strokeWidth="3" strokeLinecap="round" fill="none" />,
    }[mood];

    return (
        <motion.div
            aria-hidden="true"
            style={{ display: 'inline-block', width: size, height: size }}
            animate={prefersReduced ? undefined : bobVariants[mood]}
            initial={false}
        >
            <svg width={size} height={size} viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="globeBody" cx="0.35" cy="0.3" r="0.8">
                        <stop offset="0" stopColor="#9FE5C9" />
                        <stop offset="0.55" stopColor="#2EC4D3" />
                        <stop offset="1" stopColor="#1FA0AC" />
                    </radialGradient>
                    <linearGradient id="globeFlag" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor="#FF5C6C" />
                        <stop offset="1" stopColor="#FFC247" />
                    </linearGradient>
                </defs>

                {/* Soft shadow */}
                <ellipse cx="48" cy="88" rx="26" ry="4" fill="#1F1A3B" opacity=".18" />

                {/* Globe */}
                <circle cx="48" cy="48" r="34" fill="url(#globeBody)" stroke="#1FA0AC" strokeWidth="2" />

                {/* Continents (stylized) */}
                <path
                    d="M22 44 C 30 36, 36 40, 42 36 C 44 44, 36 52, 28 50 Z M58 30 C 64 30, 70 36, 68 44 C 60 46, 56 38, 58 30 Z M50 56 C 60 54, 68 60, 64 70 C 56 70, 50 64, 50 56 Z"
                    fill="#19C37D"
                    opacity=".85"
                />

                {/* Cheeks */}
                <circle cx="34" cy="58" r="4" fill="#FF8A98" opacity=".75" />
                <circle cx="62" cy="58" r="4" fill="#FF8A98" opacity=".75" />

                {/* Eyes */}
                <motion.g
                    animate={prefersReduced ? undefined : { scaleY: mood === 'sad' ? 0.6 : [1, 1, 0.12, 1] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, times: [0, 0.94, 0.97, 1] }}
                    style={{ transformOrigin: 'center' }}
                >
                    <circle cx="38" cy="46" r="4.5" fill="#1F1A3B" />
                    <circle cx="58" cy="46" r="4.5" fill="#1F1A3B" />
                    <circle cx="39.5" cy="44.5" r="1.4" fill="#fff" />
                    <circle cx="59.5" cy="44.5" r="1.4" fill="#fff" />
                </motion.g>

                {/* Eyebrows for sad/think */}
                {mood === 'sad' && (
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

                {/* Tiny flag pole + flag */}
                <motion.g
                    style={{ transformOrigin: '76px 22px' }}
                    animate={prefersReduced ? undefined : { rotate: mood === 'wave' ? [0, -10, 10, -8, 0] : [0, -3, 3, 0] }}
                    transition={{ duration: mood === 'wave' ? 1.6 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <rect x="74" y="14" width="2" height="22" rx="1" fill="#1F1A3B" />
                    <path d="M76 14 L 92 18 L 76 24 Z" fill="url(#globeFlag)" />
                </motion.g>

                {/* Sparkles on cheer */}
                {mood === 'cheer' && !prefersReduced && (
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
