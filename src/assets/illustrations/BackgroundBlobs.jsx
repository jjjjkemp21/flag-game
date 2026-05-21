import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* Floating gradient blobs anchored behind hero content. */
export default function BackgroundBlobs({ density = 'normal' }) {
    const prefersReduced = useReducedMotion();
    const blobs = density === 'low'
        ? [
            { left: '8%',  top: '12%', size: 240, color: '#FFC247', delay: 0,   duration: 16, op: 0.30 },
            { left: '70%', top: '60%', size: 260, color: '#5B5BF6', delay: 2,   duration: 18, op: 0.22 },
          ]
        : [
            { left: '6%',  top: '8%',  size: 240, color: '#FFC247', delay: 0,   duration: 18, op: 0.32 },
            { left: '68%', top: '0%',  size: 200, color: '#FF7E8A', delay: 1.4, duration: 17, op: 0.28 },
            { left: '8%',  top: '60%', size: 280, color: '#19C37D', delay: 3.0, duration: 20, op: 0.22 },
            { left: '70%', top: '54%', size: 240, color: '#5B5BF6', delay: 0.7, duration: 19, op: 0.25 },
          ];

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                borderRadius: 'inherit',
                zIndex: 0,
                filter: 'blur(36px)',
            }}
        >
            {blobs.map((b, i) => (
                <motion.div
                    key={i}
                    initial={false}
                    animate={prefersReduced ? undefined : {
                        x: [0, 16, -8, 0],
                        y: [0, -12, 8, 0],
                    }}
                    transition={{
                        duration: b.duration,
                        delay: b.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{
                        position: 'absolute',
                        left: b.left,
                        top: b.top,
                        width: b.size,
                        height: b.size,
                        borderRadius: '50%',
                        background: b.color,
                        opacity: b.op,
                        willChange: 'transform',
                    }}
                />
            ))}
        </div>
    );
}
