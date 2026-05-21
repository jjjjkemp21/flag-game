import React from 'react';
import Icon from '../Icon';

const TONE_CLASS = {
    neutral: '',
    primary: 'ui-pill--primary',
    success: 'ui-pill--success',
    danger:  'ui-pill--danger',
    accent:  'ui-pill--accent',
    info:    'ui-pill--info',
};

export default function Pill({ tone = 'neutral', icon, children, className = '', ...rest }) {
    const cls = ['ui-pill', TONE_CLASS[tone], className].filter(Boolean).join(' ');
    return (
        <span className={cls} {...rest}>
            {icon && <Icon name={icon} />}
            <span>{children}</span>
        </span>
    );
}
