import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { confettiPalette } from '../../motion';

/**
 * One-shot confetti burst. Renders a layer of randomly oriented pieces that
 * radiate outward and fall. Auto-unmount via parent AnimatePresence.
 */
export default function Confetti({ pieces = 28, radius = 220, duration = 1.2 }) {
    const prefersReduced = useReducedMotion();
    const items = React.useMemo(() => {
        return Array.from({ length: pieces }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / pieces + (Math.random() - 0.5) * 0.3;
            const dist = radius * (0.6 + Math.random() * 0.5);
            const color = confettiPalette[i % confettiPalette.length];
            const sz = 6 + Math.floor(Math.random() * 8);
            return {
                id: i,
                color,
                size: sz,
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist + 80,
                rot: Math.random() * 720 - 360,
                delay: Math.random() * 0.08,
            };
        });
    }, [pieces, radius]);

    if (prefersReduced) return null;

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
                pointerEvents: 'none',
                zIndex: 5,
            }}
        >
            {items.map((p) => (
                <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{ x: p.dx, y: p.dy, opacity: 0, rotate: p.rot }}
                    transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94], delay: p.delay }}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size * 1.6,
                        background: p.color,
                        borderRadius: 2,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 1px 0 rgba(0,0,0,.12)',
                    }}
                />
            ))}
        </div>
    );
}
