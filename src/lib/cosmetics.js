// Catalog of cosmetics for Atlas. Everything unlocks by XP earned from playing,
// then equips for free — no separate currency. One item per category is equipped.
//
// Hats and glasses are described as { shape, c } where `shape` selects an SVG
// renderer (see assets/illustrations/Cosmetics.jsx) and `c` is its colorway, so
// one shape can yield many distinct cosmetics. Globe colors can be animated
// (the `anim` block); those are the pricey, flashy unlocks.

// ---- Globe colors ----------------------------------------------------------
// Static colors: { name, xp, stops:[inner,mid,outer], stroke }
// Animated colors add { anim: { dur, frames:[[3 colors], ...] }, overlay? }.

export const COLORS = {
    teal:    { name: 'Teal',     xp: 0,    stops: ['#9FE5C9', '#2EC4D3', '#1FA0AC'], stroke: '#1FA0AC' },
    emerald: { name: 'Emerald',  xp: 150,  stops: ['#B8F0C8', '#19C37D', '#109764'], stroke: '#109764' },
    sunset:  { name: 'Sunset',   xp: 400,  stops: ['#FFD8A8', '#FF8A5B', '#E5532E'], stroke: '#E5532E' },
    royal:   { name: 'Royal',    xp: 800,  stops: ['#B7B6FF', '#5B5BF6', '#3F3FD1'], stroke: '#3F3FD1' },
    rose:    { name: 'Rose',     xp: 1300, stops: ['#FFD0DC', '#FF7BA0', '#E5417A'], stroke: '#E5417A' },
    slate:   { name: 'Slate',    xp: 1700, stops: ['#D7DEE8', '#8794A6', '#56627A'], stroke: '#56627A' },
    gold:    { name: 'Gold',     xp: 2200, stops: ['#FFECA8', '#FFC247', '#E5A018'], stroke: '#E5A018' },
    galaxy:  { name: 'Galaxy',   xp: 4000, stops: ['#A89BE0', '#5B3FA0', '#241850'], stroke: '#1A1240' },

    // Animated — expensive, eye-catching unlocks.
    aurora: {
        name: 'Aurora', xp: 3000, stroke: '#2E8B8B',
        stops: ['#9DF0C9', '#3FD0C0', '#5B7BE0'],
        anim: { dur: '7s', frames: [
            ['#9DF0C9', '#3FD0C0', '#5B7BE0'],
            ['#7BE0E0', '#5BD08F', '#7B5BE0'],
            ['#5BD0A0', '#3FB0D0', '#9D5BE0'],
        ] },
    },
    ocean: {
        name: 'Deep Ocean', xp: 3500, stroke: '#155F8A',
        stops: ['#A8E0FF', '#2E9AD3', '#155F9A'],
        anim: { dur: '8s', frames: [
            ['#A8E0FF', '#2E9AD3', '#155F9A'],
            ['#8FD0FF', '#1F8AC8', '#0F4F8A'],
            ['#BFEFFF', '#3FA8DD', '#1A6FA8'],
        ] },
    },
    nebula: {
        name: 'Nebula', xp: 5000, stroke: '#241850', overlay: 'stars',
        stops: ['#C9A8F0', '#7A4FD0', '#241850'],
        anim: { dur: '9s', frames: [
            ['#C9A8F0', '#7A4FD0', '#241850'],
            ['#F0A8E0', '#A04FB0', '#1A1240'],
            ['#A8B8F0', '#5B5BD0', '#201648'],
        ] },
    },
    plasma: {
        name: 'Plasma', xp: 6500, stroke: '#3F1F8A',
        stops: ['#FF8AD8', '#9A3FD0', '#3F1F8A'],
        anim: { dur: '5s', frames: [
            ['#FF8AD8', '#9A3FD0', '#3F1F8A'],
            ['#8AD8FF', '#3F9AD0', '#1F3F8A'],
            ['#FFD88A', '#D09A3F', '#8A5F1F'],
        ] },
    },
    lava: {
        name: 'Molten Lava', xp: 8000, stroke: '#8A2A0F', overlay: 'embers',
        stops: ['#FFE08A', '#FF6A2E', '#B5301A'],
        anim: { dur: '4s', frames: [
            ['#FFE08A', '#FF6A2E', '#B5301A'],
            ['#FFC247', '#E5412E', '#8A1F0F'],
            ['#FFEFA8', '#FF8A3F', '#C5401A'],
        ] },
    },
    rainbow: {
        name: 'Rainbow Prism', xp: 10000, stroke: '#5B5BF6',
        stops: ['#FF5C6C', '#FFC247', '#19C37D'],
        anim: { dur: '6s', frames: [
            ['#FF5C6C', '#FFC247', '#19C37D'],
            ['#FFC247', '#19C37D', '#2EC4D3'],
            ['#19C37D', '#2EC4D3', '#5B5BF6'],
            ['#2EC4D3', '#5B5BF6', '#B05BF6'],
            ['#B05BF6', '#FF5C6C', '#FFC247'],
        ] },
    },
};

// ---- Hat colorways ---------------------------------------------------------
const hc = (main, dark, accent, trim) => ({ main, dark, accent, trim: trim || dark });
const RED    = hc('#E5414C', '#B5303A', '#FFC247');
const BLUE   = hc('#3F6FF6', '#2C4FD0', '#FFD86B');
const GREEN  = hc('#19A36B', '#10804F', '#FFE08A');
const PINK   = hc('#FF7BA0', '#E5417A', '#FFE3EC');
const PURPLE = hc('#7A4FD0', '#5B3FA0', '#FFD86B');
const BLACK  = hc('#2A2440', '#16122A', '#FFC247');
const GOLD   = hc('#FFD86B', '#E5A018', '#FFF1C2');
const BROWN  = hc('#9A6A3A', '#6F4A26', '#FFE0A8');
const GRAY   = hc('#9AA7B4', '#6E7B88', '#E6ECF2');
const ORANGE = hc('#FF8A4B', '#E5612E', '#FFE0A8');
const WHITE  = hc('#F2F4F8', '#C9D2DC', '#FFB3C8');
const SILVER = hc('#D7DEE8', '#A9B4C2', '#9AD0FF');

export const HATS = {
    none:          { name: 'None',              xp: 0 },
    party_red:     { name: 'Party Hat',         xp: 80,   shape: 'party',     c: RED },
    party_blue:    { name: 'Blue Party Hat',    xp: 110,  shape: 'party',     c: BLUE },
    party_green:   { name: 'Green Party Hat',   xp: 130,  shape: 'party',     c: GREEN },
    bow_pink:      { name: 'Pink Bow',          xp: 160,  shape: 'bow',       c: PINK },
    bow_red:       { name: 'Red Bow',           xp: 175,  shape: 'bow',       c: RED },
    bow_blue:      { name: 'Blue Bow',          xp: 190,  shape: 'bow',       c: BLUE },
    cap_red:       { name: 'Red Cap',           xp: 220,  shape: 'cap',       c: RED },
    cap_blue:      { name: 'Blue Cap',          xp: 240,  shape: 'cap',       c: BLUE },
    cap_green:     { name: 'Green Cap',         xp: 260,  shape: 'cap',       c: GREEN },
    visor:         { name: 'Sun Visor',         xp: 280,  shape: 'visor',     c: ORANGE },
    beanie_blue:   { name: 'Beanie',            xp: 300,  shape: 'beanie',    c: BLUE },
    beanie_pink:   { name: 'Pink Beanie',       xp: 320,  shape: 'beanie',    c: PINK },
    beanie_orange: { name: 'Autumn Beanie',     xp: 340,  shape: 'beanie',    c: ORANGE },
    nightcap:      { name: 'Nightcap',          xp: 360,  shape: 'nightcap',  c: hc('#5B5BF6', '#3F3FD1', '#E6E5FF') },
    bandana_red:   { name: 'Red Bandana',       xp: 380,  shape: 'bandana',   c: RED },
    bandana_blue:  { name: 'Blue Bandana',      xp: 400,  shape: 'bandana',   c: BLUE },
    beret_red:     { name: 'Beret',             xp: 420,  shape: 'beret',     c: RED },
    beret_black:   { name: 'Black Beret',       xp: 440,  shape: 'beret',     c: BLACK },
    fez:           { name: 'Fez',               xp: 460,  shape: 'fez',       c: RED },
    catears_black: { name: 'Cat Ears',          xp: 480,  shape: 'catEars',   c: BLACK },
    catears_white: { name: 'White Cat Ears',    xp: 500,  shape: 'catEars',   c: WHITE },
    bunny:         { name: 'Bunny Ears',        xp: 540,  shape: 'bunnyEars', c: WHITE },
    propeller:     { name: 'Propeller Cap',     xp: 580,  shape: 'propeller', c: hc('#3F6FF6', '#2C4FD0', '#E5414C') },
    chef:          { name: "Chef's Toque",      xp: 640,  shape: 'chef',      c: WHITE },
    grad:          { name: 'Grad Cap',          xp: 700,  shape: 'grad',      c: BLACK },
    flower_pink:   { name: 'Flower Crown',      xp: 760,  shape: 'flower',    c: PINK },
    flower_red:    { name: 'Rose Crown',        xp: 800,  shape: 'flower',    c: RED },
    cowboy_brown:  { name: 'Cowboy Hat',        xp: 850,  shape: 'cowboy',    c: BROWN },
    cowboy_black:  { name: 'Black Stetson',     xp: 900,  shape: 'cowboy',    c: BLACK },
    sombrero:      { name: 'Sombrero',          xp: 960,  shape: 'sombrero',  c: BROWN },
    headphones:    { name: 'Headphones',        xp: 1020, shape: 'headphones', c: hc('#2A2440', '#16122A', '#2EC4D3') },
    antenna:       { name: 'Alien Antennae',    xp: 1100, shape: 'antenna',   c: hc('#19C37D', '#10804F', '#FFE08A') },
    horns:         { name: 'Devil Horns',       xp: 1200, shape: 'horns',     c: RED },
    tiara:         { name: 'Tiara',             xp: 1320, shape: 'tiara',     c: SILVER },
    jester:        { name: 'Jester Cap',        xp: 1450, shape: 'jester',    c: hc('#7A4FD0', '#5B3FA0', '#FFC247') },
    viking:        { name: 'Viking Helm',       xp: 1600, shape: 'viking',    c: GRAY },
    crown:         { name: 'Crown',             xp: 1800, shape: 'crown',     c: GOLD },
    tophat_black:  { name: 'Top Hat',           xp: 2000, shape: 'tophat',    c: BLACK },
    tophat_red:    { name: 'Ringmaster Hat',    xp: 2200, shape: 'tophat',    c: RED },
    wizard_purple: { name: 'Wizard Hat',        xp: 2450, shape: 'wizard',    c: PURPLE },
    wizard_blue:   { name: 'Sorcerer Hat',      xp: 2600, shape: 'wizard',    c: BLUE },
    santa:         { name: 'Santa Hat',         xp: 2800, shape: 'santa',     c: hc('#E5414C', '#B5303A', '#FFFFFF') },
    laurel:        { name: 'Laurel Wreath',     xp: 3000, shape: 'laurel',    c: GOLD },
    viking_gold:   { name: 'Golden Viking Helm', xp: 3300, shape: 'viking',   c: GOLD },
    astronaut:     { name: 'Astronaut Helmet',  xp: 3600, shape: 'astronaut', c: hc('#CFE6FF', '#8FB6E8', '#FFFFFF') },
    crown_jewel:   { name: 'Jeweled Crown',     xp: 4000, shape: 'crown',     c: hc('#FFD86B', '#E5A018', '#FF5C6C', '#2EC4D3') },
    halo:          { name: 'Halo',              xp: 4400, shape: 'halo',      c: hc('#FFD86B', '#E5A018', '#FFD86B') },
    tophat_gold:   { name: 'Golden Top Hat',    xp: 5200, shape: 'tophat',    c: GOLD },
    tiara_diamond: { name: 'Diamond Tiara',     xp: 6500, shape: 'tiara',     c: hc('#EAF2FF', '#B7C6DA', '#9AD0FF') },
};

// ---- Glasses colorways -----------------------------------------------------
const gc = (frame, lens, accent) => ({ frame, lens, accent: accent || frame });
const CLEAR = 'rgba(255,255,255,0.22)';
const shade = (lens) => ({ frame: '#1F1A3B', lens, accent: '#1F1A3B' });

export const GLASSES = {
    none:          { name: 'None',              xp: 0 },
    round_black:   { name: 'Round Specs',       xp: 200,  shape: 'round',     c: gc('#1F1A3B', CLEAR) },
    nerd:          { name: 'Nerd Glasses',      xp: 260,  shape: 'nerd',      c: gc('#1F1A3B', CLEAR, '#E5414C') },
    square_black:  { name: 'Square Frames',     xp: 300,  shape: 'square',    c: gc('#1F1A3B', CLEAR) },
    square_red:    { name: 'Red Squares',       xp: 340,  shape: 'square',    c: gc('#E5414C', 'rgba(255,255,255,0.2)') },
    square_blue:   { name: 'Blue Squares',      xp: 380,  shape: 'square',    c: gc('#3F6FF6', 'rgba(255,255,255,0.2)') },
    halfmoon:      { name: 'Reading Glasses',   xp: 420,  shape: 'halfmoon',  c: gc('#9A6A3A', CLEAR) },
    rimless:       { name: 'Rimless Glasses',   xp: 460,  shape: 'rimless',   c: gc('#9AA7B4', 'rgba(255,255,255,0.18)') },
    round_pink:    { name: 'Rosy Specs',        xp: 520,  shape: 'round',     c: gc('#E5417A', 'rgba(255,123,160,0.25)') },
    round_gold:    { name: 'Gold Round Specs',  xp: 600,  shape: 'round',     c: gc('#E5A018', 'rgba(255,236,168,0.3)') },
    shades_black:  { name: 'Cool Shades',       xp: 640,  shape: 'shades',    c: shade('#1F1A3B') },
    shades_blue:   { name: 'Blue Shades',       xp: 680,  shape: 'shades',    c: shade('#2A50C8') },
    shades_red:    { name: 'Red Shades',        xp: 700,  shape: 'shades',    c: shade('#C8322A') },
    shades_green:  { name: 'Green Shades',      xp: 720,  shape: 'shades',    c: shade('#1F8A4F') },
    shades_purple: { name: 'Purple Shades',     xp: 740,  shape: 'shades',    c: shade('#6A2FB0') },
    shades_teal:   { name: 'Teal Shades',       xp: 760,  shape: 'shades',    c: shade('#1F8A9A') },
    aviator_dark:  { name: 'Aviators',          xp: 840,  shape: 'aviator',   c: gc('#3A3A3A', 'rgba(40,40,50,0.78)') },
    rimless_gold:  { name: 'Gold Rimless',      xp: 900,  shape: 'rimless',   c: gc('#E5A018', 'rgba(255,236,168,0.25)') },
    aviator_silver:{ name: 'Silver Aviators',   xp: 1000, shape: 'aviator',   c: gc('#B7C0CC', 'rgba(180,200,220,0.4)') },
    heart_pink:    { name: 'Heart Shades',      xp: 1050, shape: 'heart',     c: gc('#E5417A', '#FF7BA0') },
    goggles_blue:  { name: 'Ski Goggles',       xp: 1100, shape: 'goggles',   c: gc('#3F6FF6', 'rgba(150,210,255,0.5)') },
    goggles_orange:{ name: 'Snow Goggles',      xp: 1150, shape: 'goggles',   c: gc('#FF8A4B', 'rgba(255,200,150,0.5)') },
    goggles_pink:  { name: 'Pink Goggles',      xp: 1200, shape: 'goggles',   c: gc('#FF7BA0', 'rgba(255,200,220,0.5)') },
    aviator_gold:  { name: 'Gold Aviators',     xp: 1280, shape: 'aviator',   c: gc('#E5A018', 'rgba(255,236,168,0.4)') },
    threed:        { name: '3D Glasses',        xp: 1320, shape: 'threeD',    c: {} },
    cateye_black:  { name: 'Cat-Eye Glasses',   xp: 1380, shape: 'cateye',    c: gc('#1F1A3B', 'rgba(255,255,255,0.2)') },
    cateye_pink:   { name: 'Pink Cat-Eye',      xp: 1450, shape: 'cateye',    c: gc('#E5417A', 'rgba(255,200,220,0.25)') },
    heart_red:     { name: 'Red Heart Shades',  xp: 1500, shape: 'heart',     c: gc('#B5303A', '#E5414C') },
    pixel_dark:    { name: '8-Bit Shades',      xp: 1560, shape: 'pixel',     c: gc('#1F1A3B', '#1F1A3B') },
    pixel_cyan:    { name: 'Cyber Shades',      xp: 1640, shape: 'pixel',     c: gc('#0E2A33', '#2EC4D3') },
    star_gold:     { name: 'Star Glasses',      xp: 1700, shape: 'star',      c: gc('#E5A018', 'rgba(255,236,168,0.4)') },
    pixel_green:   { name: 'Matrix Shades',     xp: 1760, shape: 'pixel',     c: gc('#0E2A1A', '#19C37D') },
    star_blue:     { name: 'Blue Star Glasses', xp: 1820, shape: 'star',      c: gc('#3F6FF6', 'rgba(150,200,255,0.4)') },
    halfmoon_gold: { name: 'Scholar Glasses',   xp: 1880, shape: 'halfmoon',  c: gc('#E5A018', 'rgba(255,236,168,0.2)') },
    visorband_red: { name: 'Visor',             xp: 1950, shape: 'visorBand', c: gc('#E5414C', '#C8322A') },
    monocle:       { name: 'Monocle',           xp: 2050, shape: 'monocle',   c: gc('#E5A018', 'rgba(255,236,168,0.25)') },
    groucho:       { name: 'Groucho Disguise',  xp: 2150, shape: 'groucho',   c: gc('#1F1A3B', CLEAR, '#E0A878') },
    cateye_gold:   { name: 'Gold Cat-Eye',      xp: 2250, shape: 'cateye',    c: gc('#E5A018', 'rgba(255,236,168,0.3)') },
    visorband_cyan:{ name: 'Cyber Visor',       xp: 2350, shape: 'visorBand', c: gc('#1FA0AC', '#2EC4D3') },
    mask_black:    { name: 'Domino Mask',       xp: 2500, shape: 'mask',      c: gc('#1F1A3B', '#1F1A3B') },
    mask_red:      { name: 'Crimson Mask',      xp: 2650, shape: 'mask',      c: gc('#B5303A', '#E5414C') },
    monocle_gold:  { name: 'Gold Monocle',      xp: 2800, shape: 'monocle',   c: gc('#FFD86B', 'rgba(255,236,168,0.3)') },
    eyepatch:      { name: 'Eye Patch',         xp: 3000, shape: 'eyepatch',  c: gc('#1F1A3B', '#16122A') },
    heart_gold:    { name: 'Golden Hearts',     xp: 3400, shape: 'heart',     c: gc('#E5A018', '#FFD86B') },
    visorband_gold:{ name: 'Gold Visor',        xp: 4000, shape: 'visorBand', c: gc('#E5A018', '#FFD86B') },
};

export const CATEGORIES = [
    { key: 'color',   label: 'Globe Color', icon: 'palette',        items: COLORS },
    { key: 'hat',     label: 'Hats',        icon: 'theater_comedy', items: HATS },
    { key: 'glasses', label: 'Glasses',     icon: 'eyeglasses',     items: GLASSES },
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
