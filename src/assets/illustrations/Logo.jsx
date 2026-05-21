import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ size = 56, animate = true }) {
    const stroke = '#5B5BF6';
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            initial={animate ? { rotate: -8, scale: 0.8, opacity: 0 } : false}
            animate={animate ? { rotate: 0, scale: 1, opacity: 1 } : false}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{ filter: 'drop-shadow(0 6px 12px rgba(91,91,246,.28))' }}
        >
            <defs>
                <linearGradient id="logoG1" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#FFC247" />
                    <stop offset="0.5" stopColor="#FF7E8A" />
                    <stop offset="1" stopColor="#5B5BF6" />
                </linearGradient>
            </defs>
            {/* Flag pole */}
            <rect x="14" y="8" width="4" height="50" rx="2" fill={stroke} />
            {/* Waving flag */}
            <motion.path
                d="M18 12 C 30 8, 42 18, 54 14 L 54 36 C 42 40, 30 30, 18 34 Z"
                fill="url(#logoG1)"
                initial={animate ? { pathLength: 0 } : false}
                animate={animate ? { pathLength: 1 } : false}
                transition={{ duration: 0.7, delay: 0.1 }}
            />
            {/* Highlight on flag */}
            <circle cx="40" cy="22" r="3.5" fill="#fff" opacity=".55" />
            {/* Base */}
            <ellipse cx="16" cy="58" rx="8" ry="2" fill={stroke} opacity=".35" />
        </motion.svg>
    );
}
