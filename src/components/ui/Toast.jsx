import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { variants } from '../../motion';
import Icon from '../Icon';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((t) => t.filter(x => x.id !== id));
    }, []);

    const show = useCallback((message, opts = {}) => {
        const id = nextId++;
        const t = {
            id,
            message,
            tone: opts.tone || 'default',
            icon: opts.icon,
            duration: opts.duration ?? 2400,
        };
        setToasts((arr) => [...arr, t]);
        setTimeout(() => remove(id), t.duration);
        return id;
    }, [remove]);

    const api = {
        show,
        success: (m, o) => show(m, { ...o, tone: 'success', icon: o?.icon || 'check_circle' }),
        danger:  (m, o) => show(m, { ...o, tone: 'danger',  icon: o?.icon || 'error' }),
        accent:  (m, o) => show(m, { ...o, tone: 'accent',  icon: o?.icon || 'whatshot' }),
        dismiss: remove,
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <div className="ui-toast-stack" role="status" aria-live="polite">
                    <AnimatePresence>
                        {toasts.map(t => (
                            <motion.div
                                key={t.id}
                                className={`ui-toast ui-toast--${t.tone}`}
                                variants={variants.toast}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                layout
                            >
                                {t.icon && <Icon name={t.icon} variant={t.tone === 'success' ? 'correct' : t.tone === 'danger' ? 'incorrect' : 'highlight'} />}
                                <span>{t.message}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        return { show: () => {}, success: () => {}, danger: () => {}, accent: () => {}, dismiss: () => {} };
    }
    return ctx;
}
