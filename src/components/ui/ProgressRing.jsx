import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressRing({
    value = 0,
    size = 72,
    stroke = 8,
    tone = 'primary',
    label,
    children,
}) {
    const safe = Math.max(0, Math.min(1, value));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;

    const stops = {
        primary: ['#5B5BF6', '#8A8CFF'],
        accent:  ['#FFC247', '#FF8A45'],
        success: ['#19C37D', '#2EC4D3'],
        danger:  ['#FF5C6C', '#FF9A5A'],
        info:    ['#2EC4D3', '#5B5BF6'],
    }[tone] || ['#5B5BF6', '#8A8CFF'];

    const gid = `ring-${tone}-${size}`;

    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor={stops[0]} />
                        <stop offset="1" stopColor={stops[1]} />
                    </linearGradient>
                </defs>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-soft)" strokeWidth={stroke} />
                <motion.circle
                    cx={size/2}
                    cy={size/2}
                    r={r}
                    fill="none"
                    stroke={`url(#${gid})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    transform={`rotate(-90 ${size/2} ${size/2})`}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c * (1 - safe) }}
                    transition={{ type: 'spring', stiffness: 100, damping: 24 }}
                />
            </svg>
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'var(--color-ink)',
                fontSize: size > 80 ? 'var(--fs-lg)' : 'var(--fs-sm)',
                pointerEvents: 'none',
                textAlign: 'center',
                lineHeight: 1.05,
            }} aria-label={label}>
                {children}
            </div>
        </div>
    );
}
