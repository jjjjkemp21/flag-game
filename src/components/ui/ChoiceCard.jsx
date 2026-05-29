import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { variants, springs } from '../../motion/index';
import { useAudio } from '../../audio/AudioProvider';
import Icon from '../common/Icon';

/**
 * A multiple-choice answer card with state-aware animation.
 * states: 'idle' | 'correct' | 'incorrect' | 'disabled-correct'
 */
export default function ChoiceCard({
    label,
    state = 'idle',
    index = 0,
    onSelect,
    disabled,
    showIndex = true,
}) {
    const prefersReduced = useReducedMotion();
    const audio = useAudio();
    const isCorrect = state === 'correct' || state === 'disabled-correct';
    const isIncorrect = state === 'incorrect';
    const isLocked = disabled || state !== 'idle';

    const cls = [
        'choice-card',
        isCorrect ? 'is-correct' : '',
        isIncorrect ? 'is-incorrect' : '',
    ].filter(Boolean).join(' ');

    const animateState = isCorrect ? 'correct' : isIncorrect ? 'wrong' : 'rest';

    return (
        <motion.button
            type="button"
            className={cls}
            disabled={isLocked && state !== 'idle' ? true : disabled}
            onClick={() => {
                if (isLocked) return;
                audio.play('click');
                onSelect?.(label);
            }}
            variants={prefersReduced ? undefined : variants.choice}
            initial={prefersReduced ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0, scale: 1 }}
            whileHover={!isLocked && !prefersReduced ? 'hover' : undefined}
            whileTap={!isLocked && !prefersReduced ? 'tap' : undefined}
            transition={{ ...springs.gentle, delay: index * 0.05 }}
            custom={index}
        >
            <motion.div
                animate={animateState}
                variants={prefersReduced ? undefined : variants.choice}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', width: '100%' }}
            >
                {showIndex && <span className="choice-card__index">{String.fromCharCode(65 + index)}</span>}
                <span style={{ flex: 1 }}>{label}</span>
                {isCorrect && <Icon name="check_circle" variant="correct" />}
                {isIncorrect && <Icon name="cancel" variant="incorrect" />}
            </motion.div>
        </motion.button>
    );
}
