import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon';
import { variants } from '../../motion';

export default function ScoreBubble({ score = 0, label = 'Score', icon = 'star', tone = 'accent', floatingDelta = null }) {
    const [popKey, setPopKey] = useState(0);
    useEffect(() => { setPopKey(k => k + 1); }, [score]);

    return (
        <motion.div className={`ui-score-bubble ui-score-bubble--${tone}`} style={{ position: 'relative' }}>
            <Icon name={icon} variant="highlight" className="ui-score-bubble__icon" />
            <motion.span
                key={popKey}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.32, ease: [0.18, 0.89, 0.32, 1.28] }}
            >
                {score}
            </motion.span>
            <AnimatePresence>
                {floatingDelta !== null && floatingDelta !== 0 && (
                    <motion.span
                        key={`delta-${floatingDelta}-${popKey}`}
                        className={`floating-score ${floatingDelta < 0 ? 'floating-score--negative' : ''}`}
                        variants={variants.floatScore}
                        initial="initial"
                        animate="animate"
                        exit={{ opacity: 0 }}
                    >
                        {floatingDelta > 0 ? '+' : ''}{floatingDelta}
                    </motion.span>
                )}
            </AnimatePresence>
            <span className="visually-hidden" aria-live="polite">{label}: {score}</span>
        </motion.div>
    );
}
