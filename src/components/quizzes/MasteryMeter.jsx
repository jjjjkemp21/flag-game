import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../common/Icon';
import { MASTERY_STREAK } from '../../lib/xp';

const GOAL = MASTERY_STREAK + 1; // correct-in-a-row to master a flag

// A slim bar showing how close the CURRENT flag is to being mastered. Animates as
// the per-flag streak grows (or shrinks after a miss).
export default function MasteryMeter({ streak = 0 }) {
    const value = Math.max(0, Math.min(streak, GOAL));
    const mastered = streak > MASTERY_STREAK;
    const pct = Math.round((value / GOAL) * 100);
    return (
        <div className={`mastery-meter ${mastered ? 'is-mastered' : ''}`}>
            <span className="mastery-meter__label">
                <Icon name={mastered ? 'workspace_premium' : 'trending_up'} />
                {mastered ? 'Mastered' : `Mastery ${value}/${GOAL}`}
            </span>
            <span className="mastery-meter__track">
                <motion.span
                    className="mastery-meter__fill"
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </span>
        </div>
    );
}
