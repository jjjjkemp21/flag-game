import React from 'react';

function Icon({ name, variant = 'primary', size = 'inline', pop = false, className = '', ...rest }) {
    const classes = [
        'material-symbols-rounded',
        'app-icon',
        `icon-${size}`,
        `icon-${variant}`,
        pop ? 'icon-pop' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes} aria-hidden="true" {...rest}>
            {name}
        </span>
    );
}

export default Icon;
