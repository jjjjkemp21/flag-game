import React from 'react';
import { motion } from 'framer-motion';

const TIERS = {
    bronze:   { stroke: '#C68542', fill: '#FFE8C8', icon: '#7A4B16' },
    silver:   { stroke: '#9AA3B2', fill: '#E8ECF2', icon: '#3A4150' },
    gold:     { stroke: '#E5A018', fill: '#FFF1CA', icon: '#7A4B16' },
    platinum: { stroke: '#5B5BF6', fill: '#E6E5FF', icon: '#3F3FD1' },
    locked:   { stroke: '#B0B0B8', fill: '#E8E6F0', icon: '#9B9AA4' },
};

export default function BadgeRing({ tier = 'bronze', label = '', earned = false, size = 84 }) {
    const t = TIERS[earned ? tier : 'locked'];
    const r = size / 2 - 6;
    const c = 2 * Math.PI * r;

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
                <circle cx={size/2} cy={size/2} r={r} fill={t.fill} stroke={t.stroke} strokeWidth="4" />
                {earned && (
                    <motion.circle
                        cx={size/2}
                        cy={size/2}
                        r={r}
                        fill="none"
                        stroke={t.stroke}
                        strokeWidth="4"
                        strokeDasharray={c}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size/2} ${size/2})`}
                        initial={{ strokeDashoffset: c }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                )}
                {/* Medal star */}
                <path
                    d={`M${size/2} ${size/2 - 14} l4 10 11 1 -8 7 2 11 -9 -6 -9 6 2 -11 -8 -7 11 -1z`}
                    fill={t.icon}
                    opacity={earned ? 1 : 0.4}
                />
            </motion.svg>
            <span style={{
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: earned ? t.stroke : 'var(--color-ink-muted)',
            }}>{label}</span>
        </div>
    );
}
