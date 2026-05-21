import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* Stylized dotted world silhouette behind hero content */
export default function WorldDots({ opacity = 0.18, width = '100%' }) {
    const prefersReduced = useReducedMotion();
    const dots = React.useMemo(() => {
        const arr = [];
        for (let y = 0; y < 14; y++) {
            for (let x = 0; x < 28; x++) {
                if (Math.random() > 0.42) {
                    arr.push({
                        cx: 10 + x * 18,
                        cy: 10 + y * 18,
                        r: 1.4 + Math.random() * 1.8,
                        d: Math.random() * 4,
                    });
                }
            }
        }
        return arr;
    }, []);

    return (
        <svg
            viewBox="0 0 520 260"
            preserveAspectRatio="xMidYMid slice"
            style={{ width, height: '100%', opacity, position: 'absolute', inset: 0, pointerEvents: 'none' }}
            aria-hidden="true"
        >
            {dots.map((d, i) => (
                <motion.circle
                    key={i}
                    cx={d.cx}
                    cy={d.cy}
                    r={d.r}
                    fill="currentColor"
                    initial={false}
                    animate={prefersReduced ? undefined : { opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3 + d.d, repeat: Infinity, ease: 'easeInOut', delay: d.d }}
                />
            ))}
        </svg>
    );
}
