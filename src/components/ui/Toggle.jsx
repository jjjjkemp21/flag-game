import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAudio } from '../../audio/AudioProvider';

export default function Toggle({ checked, onChange, ariaLabel, disabled }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            className={`ui-toggle ${checked ? 'is-on' : ''}`}
            onClick={() => {
                audio.play('click');
                onChange?.(!checked);
            }}
            disabled={disabled}
        >
            <motion.span
                className="ui-toggle__knob"
                animate={{ x: checked ? 24 : 0 }}
                transition={prefersReduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 500, damping: 30 }}
            />
        </button>
    );
}
