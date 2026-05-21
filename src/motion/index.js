/* Shared Framer Motion variants and easing presets.
   Imported by components needing motion. */

export const springs = {
    gentle:  { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 },
    bouncy:  { type: 'spring', stiffness: 380, damping: 14, mass: 0.7 },
    snappy:  { type: 'spring', stiffness: 600, damping: 30 },
    crisp:   { type: 'spring', stiffness: 500, damping: 40 },
};

export const eases = {
    outQuart: [0.25, 0.46, 0.45, 0.94],
    pop:      [0.18, 0.89, 0.32, 1.28],
    inOut:    [0.4, 0, 0.2, 1],
};

export const variants = {
    page: {
        initial: { opacity: 0, y: 16, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { ...springs.gentle, opacity: { duration: 0.22 } } },
        exit:    { opacity: 0, y: -12, scale: 0.985, transition: { duration: 0.18, ease: eases.outQuart } },
    },

    fadeOnly: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.22 } },
        exit:    { opacity: 0, transition: { duration: 0.15 } },
    },

    card: {
        initial: { opacity: 0, y: 24, scale: 0.96 },
        animate: (i = 0) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { ...springs.gentle, delay: i * 0.05 },
        }),
    },

    choice: {
        rest:    { scale: 1, y: 0 },
        hover:   { scale: 1.02, y: -2, transition: springs.snappy },
        tap:     { scale: 0.96, y: 1, transition: { duration: 0.08 } },
        correct: {
            scale: [1, 1.06, 1],
            transition: { duration: 0.42, ease: eases.pop },
        },
        wrong:   {
            x: [0, -10, 9, -7, 6, 0],
            transition: { duration: 0.45, ease: eases.pop },
        },
    },

    scorePop: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.25, 1], transition: { duration: 0.34, ease: eases.pop } },
    },

    flagReveal: {
        initial: { opacity: 0, scale: 0.84, rotate: -3 },
        animate: { opacity: 1, scale: 1, rotate: 0, transition: springs.bouncy },
    },

    modal: {
        initial: { opacity: 0, scale: 0.92, y: 30 },
        animate: { opacity: 1, scale: 1, y: 0, transition: springs.gentle },
        exit:    { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.16 } },
    },

    backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.18 } },
        exit:    { opacity: 0, transition: { duration: 0.14 } },
    },

    toast: {
        initial: { opacity: 0, y: -20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1, transition: springs.bouncy },
        exit:    { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.14 } },
    },

    floatScore: {
        initial: { opacity: 0, y: 0, scale: 0.8 },
        animate: { opacity: [0, 1, 1, 0], y: -50, scale: [0.8, 1.2, 1, 0.9], transition: { duration: 1.0, ease: eases.outQuart } },
    },
};

export const confettiPalette = [
    '#FFC247', '#FF5C6C', '#19C37D', '#2EC4D3', '#5B5BF6', '#A270FF', '#FFD075',
];
