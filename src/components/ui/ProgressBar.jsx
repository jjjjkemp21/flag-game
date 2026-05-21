import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ value = 0, tone = 'primary', label, animated = true, height = 12 }) {
    const safe = Math.max(0, Math.min(1, value));
    const toneClass = {
        primary: '',
        success: 'ui-progress-bar--success',
        danger:  'ui-progress-bar--danger',
        accent:  'ui-progress-bar--accent',
    }[tone] || '';

    return (
        <div style={{ width: '100%' }}>
            {label && <div style={{ marginBottom: 4, fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', fontWeight: 700 }}>{label}</div>}
            <div className={`ui-progress-bar ${toneClass}`} style={{ height }} role="progressbar" aria-valuenow={Math.round(safe * 100)} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                    className="ui-progress-bar__fill"
                    initial={{ scaleX: animated ? 0 : safe }}
                    animate={{ scaleX: safe }}
                    transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                />
            </div>
        </div>
    );
}
