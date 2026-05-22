// Catalog of cosmetics for Atlas. Everything unlocks by XP earned from playing,
// then equips for free — no separate currency. One item per category is equipped.

export const COLORS = {
    teal:    { name: 'Teal',    xp: 0,    stops: ['#9FE5C9', '#2EC4D3', '#1FA0AC'], stroke: '#1FA0AC' },
    emerald: { name: 'Emerald', xp: 150,  stops: ['#B8F0C8', '#19C37D', '#109764'], stroke: '#109764' },
    sunset:  { name: 'Sunset',  xp: 400,  stops: ['#FFD8A8', '#FF8A5B', '#E5532E'], stroke: '#E5532E' },
    royal:   { name: 'Royal',   xp: 800,  stops: ['#B7B6FF', '#5B5BF6', '#3F3FD1'], stroke: '#3F3FD1' },
    rose:    { name: 'Rose',    xp: 1300, stops: ['#FFD0DC', '#FF7BA0', '#E5417A'], stroke: '#E5417A' },
    gold:    { name: 'Gold',    xp: 2200, stops: ['#FFECA8', '#FFC247', '#E5A018'], stroke: '#E5A018' },
    galaxy:  { name: 'Galaxy',  xp: 4000, stops: ['#A89BE0', '#5B3FA0', '#241850'], stroke: '#1A1240' },
};

export const HATS = {
    none:   { name: 'None',     xp: 0 },
    party:  { name: 'Party Hat', xp: 100 },
    beanie: { name: 'Beanie',   xp: 300 },
    grad:   { name: 'Grad Cap', xp: 700 },
    crown:  { name: 'Crown',    xp: 1200 },
    tophat: { name: 'Top Hat',  xp: 1800 },
    halo:   { name: 'Halo',     xp: 3000 },
};

export const GLASSES = {
    none:   { name: 'None',         xp: 0 },
    round:  { name: 'Round Specs',  xp: 200 },
    shades: { name: 'Cool Shades',  xp: 600 },
    heart:  { name: 'Heart Shades', xp: 2500 },
};

export const CATEGORIES = [
    { key: 'color',   label: 'Globe Color', icon: 'palette',    items: COLORS },
    { key: 'hat',     label: 'Hats',        icon: 'theater_comedy', items: HATS },
    { key: 'glasses', label: 'Glasses',     icon: 'eyeglasses', items: GLASSES },
];

export const DEFAULT_COSMETICS = { color: 'teal', hat: 'none', glasses: 'none' };

export function isUnlocked(xp, item) {
    return (xp || 0) >= (item ? item.xp || 0 : 0);
}

export function paletteFor(color) {
    return COLORS[color] || COLORS.teal;
}

// Coerce stored cosmetics to valid, known ids (falls back to defaults).
export function normalizeCosmetics(c) {
    return {
        color: COLORS[c && c.color] ? c.color : 'teal',
        hat: HATS[c && c.hat] ? c.hat : 'none',
        glasses: GLASSES[c && c.glasses] ? c.glasses : 'none',
    };
}
