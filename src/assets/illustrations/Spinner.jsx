import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function Spinner({ size = 44 }) {
    const prefersReduced = useReducedMotion();
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 44 44"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            animate={prefersReduced ? undefined : { rotate: 360 }}
            transition={prefersReduced ? undefined : { duration: 1.1, repeat: Infinity, ease: 'linear' }}
        >
            <defs>
                <linearGradient id="spinG1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#5B5BF6" />
                    <stop offset="1" stopColor="#FFC247" />
                </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="17" stroke="rgba(91,91,246,.15)" strokeWidth="4" fill="none" />
            <path
                d="M22 5 a 17 17 0 0 1 17 17"
                stroke="url(#spinG1)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
        </motion.svg>
    );
}
