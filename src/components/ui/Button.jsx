import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAudio } from '../../audio/AudioProvider';
import Icon from '../common/Icon';

const VARIANT_CLASS = {
    primary:   'ui-button ui-button--primary',
    secondary: 'ui-button ui-button--secondary',
    ghost:     'ui-button ui-button--ghost',
    danger:    'ui-button ui-button--danger',
    accent:    'ui-button ui-button--accent',
    success:   'ui-button ui-button--success',
};

const SIZE_CLASS = {
    sm: 'ui-button--sm',
    md: 'ui-button--md',
    lg: 'ui-button--lg',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    soundOnClick = 'click',
    onClick,
    children,
    disabled,
    type = 'button',
    className = '',
    ...rest
}) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const cls = [
        VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
        SIZE_CLASS[size] || SIZE_CLASS.md,
        fullWidth ? 'ui-button--full' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <motion.button
            type={type}
            className={cls}
            onClick={(e) => {
                if (soundOnClick) audio.play(soundOnClick);
                onClick?.(e);
            }}
            whileHover={!disabled && !prefersReduced ? { y: -2 } : undefined}
            whileTap={!disabled && !prefersReduced ? { scale: 0.96 } : undefined}
            disabled={disabled}
            {...rest}
        >
            {icon && iconPosition === 'left' && <Icon name={icon} variant="primary" />}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <Icon name={icon} variant="primary" />}
        </motion.button>
    );
}
