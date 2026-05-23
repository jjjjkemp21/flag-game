import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { variants } from '../../motion';
import Icon from '../Icon';

export default function Modal({ open, onClose, title, children, labelledBy }) {
    const ref = useRef(null);
    // Stash the latest onClose so Escape always calls the current handler
    // without making this effect depend on the callback's identity. Callers
    // typically pass a fresh arrow each render (e.g. `() => setOpen(false)`);
    // re-running the effect on every keystroke would re-fire the focus
    // setTimeout below and yank focus out of any input the user is typing in.
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onCloseRef.current?.();
        };
        window.addEventListener('keydown', onKey);
        // Focus the dialog (only once per open transition).
        setTimeout(() => ref.current?.focus(), 30);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="ui-modal-backdrop"
                    variants={variants.backdrop}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
                >
                    <motion.div
                        className="ui-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy || 'ui-modal-title'}
                        tabIndex={-1}
                        ref={ref}
                        variants={variants.modal}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {onClose && (
                            <button
                                type="button"
                                className="ui-modal-close"
                                aria-label="Close"
                                onClick={() => onClose?.()}
                            >
                                <Icon name="close" />
                            </button>
                        )}
                        {title && <h2 id="ui-modal-title">{title}</h2>}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
