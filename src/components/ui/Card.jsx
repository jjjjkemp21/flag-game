import React from 'react';
import { motion } from 'framer-motion';

const ELEV_CLASS = {
    flat: 'ui-card--flat',
    raised: 'ui-card--raised',
    floating: 'ui-card--floating',
};

const Card = React.forwardRef(function Card({
    elevation = 'raised',
    interactive = false,
    className = '',
    as = 'div',
    children,
    style,
    ...rest
}, ref) {
    const cls = [
        'ui-card',
        ELEV_CLASS[elevation],
        interactive ? 'ui-card--interactive' : '',
        className,
    ].filter(Boolean).join(' ');

    if (interactive) {
        return (
            <motion.div
                ref={ref}
                className={cls}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                style={style}
                {...rest}
            >
                {children}
            </motion.div>
        );
    }

    const Tag = as;
    return (
        <Tag ref={ref} className={cls} style={style} {...rest}>{children}</Tag>
    );
});

export default Card;
