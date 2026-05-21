import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* Dotted flat world map (equirectangular). Land is rendered as dots, oceans
   stay blank. Land is described as inclusive column ranges per row on a
   COLS x ROWS grid, west -> east, north -> south. */
const COLS = 40;
const ROWS = 18;

// [row, fromCol, toCol] segments approximating the continents.
const LAND = [
    // Greenland
    [0, 12, 14], [1, 12, 14],
    // North America
    [1, 3, 9], [2, 2, 11], [3, 2, 12], [4, 3, 11], [5, 4, 10], [6, 6, 9], [7, 7, 9],
    // Central America
    [8, 9, 10],
    // South America
    [8, 10, 12], [9, 9, 13], [10, 9, 13], [11, 10, 13], [12, 10, 12], [13, 10, 12], [14, 10, 11], [15, 10, 11], [16, 10, 10],
    // Europe
    [2, 18, 21], [3, 17, 21], [4, 18, 20],
    // Africa
    [5, 18, 23], [6, 18, 23], [7, 18, 23], [8, 18, 22], [9, 18, 22], [10, 18, 22], [11, 19, 21], [12, 19, 21], [13, 19, 20],
    // Middle East / India
    [5, 24, 26], [6, 24, 26],
    // Asia
    [1, 24, 35], [2, 23, 37], [3, 23, 38], [4, 24, 37], [5, 28, 35], [6, 28, 34], [7, 29, 33],
    // Japan
    [3, 38, 38], [4, 38, 38],
    // SE Asia islands
    [7, 30, 34], [8, 31, 34],
    // Australia
    [11, 31, 35], [12, 30, 36], [13, 31, 35], [14, 32, 34],
];

export default function WorldDots({ opacity = 0.18, width = '100%' }) {
    const prefersReduced = useReducedMotion();

    const dots = React.useMemo(() => {
        const cellW = 520 / COLS;
        const cellH = 260 / ROWS;
        const arr = [];
        let i = 0;
        for (const [row, from, to] of LAND) {
            for (let col = from; col <= to; col++) {
                arr.push({
                    cx: cellW / 2 + col * cellW,
                    cy: cellH / 2 + row * cellH,
                    r: 2 + Math.random() * 1.2,
                    d: (i % 9) * 0.35,
                });
                i++;
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
                    animate={prefersReduced ? undefined : { opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 3 + d.d, repeat: Infinity, ease: 'easeInOut', delay: d.d }}
                />
            ))}
        </svg>
    );
}
