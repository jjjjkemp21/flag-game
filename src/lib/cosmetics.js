// Catalog of cosmetics for Atlas. Items are bought with Atlas Bucks (the
// numeric `xp` field on each entry is the price). Defaults (color:teal, none
// for the other slots) are free and always owned; everything else must be
// purchased before the player can equip it.
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

    // More static colorways.
    mint:      { name: 'Mint',       xp: 250,  stops: ['#C8F4DE', '#6FE0B0', '#2FB98A'], stroke: '#2FB98A' },
    coral:     { name: 'Coral',      xp: 550,  stops: ['#FFD2C2', '#FF8A6B', '#E5532E'], stroke: '#E5532E' },
    sky:       { name: 'Sky',        xp: 650,  stops: ['#CDEBFF', '#7FC2F5', '#3F8FD8'], stroke: '#3F8FD8' },
    lavender:  { name: 'Lavender',   xp: 950,  stops: ['#E6DBFF', '#B79CF0', '#8A6FD0'], stroke: '#8A6FD0' },
    amber:     { name: 'Amber',      xp: 1100, stops: ['#FFE6A8', '#FFB23F', '#E5841A'], stroke: '#E5841A' },
    forest:    { name: 'Forest',     xp: 1500, stops: ['#BFE6B0', '#5BAE5B', '#2F7D3F'], stroke: '#2F7D3F' },
    bubblegum: { name: 'Bubblegum',  xp: 1900, stops: ['#FFD6F0', '#FF8AD0', '#E54FA8'], stroke: '#E54FA8' },
    charcoal:  { name: 'Charcoal',   xp: 2400, stops: ['#B7C0CC', '#566173', '#2A3140'], stroke: '#1F2430' },

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
    candy: {
        name: 'Candy Swirl', xp: 4600, stroke: '#E54FA8',
        stops: ['#FFD6F0', '#FF8AD0', '#E54FA8'],
        anim: { dur: '5s', frames: [
            ['#FFD6F0', '#FF8AD0', '#E54FA8'],
            ['#D6E8FF', '#8AB0FF', '#5B6FE0'],
            ['#FFEFC2', '#FFC247', '#E5A018'],
        ] },
    },
    toxic: {
        name: 'Toxic', xp: 5600, stroke: '#1F8A4F', overlay: 'stars',
        stops: ['#D6FFB0', '#7FE05B', '#2FB94F'],
        anim: { dur: '4s', frames: [
            ['#D6FFB0', '#7FE05B', '#2FB94F'],
            ['#B0FFD6', '#5BE0A0', '#2FB98A'],
            ['#EFFFB0', '#A0E05B', '#5FB92F'],
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

    // ---- Animal patterns ------------------------------------------------
    // `pattern: { kind, base, accent, accent2? }` is honoured by Mascot.jsx —
    // it switches the globe fill to an SVG <pattern> built from the kind.
    // `stops`/`stroke` are kept as sensible fallbacks for places that don't
    // know about patterns.
    tiger: {
        name: 'Tiger', xp: 2700, stroke: '#7A2A0F',
        stops: ['#FFC07A', '#FF8A3F', '#C25A1A'],
        pattern: { kind: 'tiger', base: '#FF8A3F', accent: '#2A1810' },
    },
    zebra: {
        name: 'Zebra', xp: 2900, stroke: '#1F1A3B',
        stops: ['#FFFFFF', '#E8E8EE', '#9AA0AE'],
        pattern: { kind: 'zebra', base: '#F4F4F8', accent: '#1F1A3B' },
    },
    cow: {
        name: 'Cow', xp: 3100, stroke: '#1F1A3B',
        stops: ['#FFFFFF', '#F4F4F8', '#C9D2DC'],
        pattern: { kind: 'cow', base: '#FFFFFF', accent: '#1F1A2A' },
    },
    cheetah: {
        name: 'Cheetah', xp: 3300, stroke: '#6F4A26',
        stops: ['#FFE3AE', '#E5B26A', '#A6743A'],
        pattern: { kind: 'cheetah', base: '#E5B26A', accent: '#3A2410' },
    },
    dalmatian: {
        name: 'Dalmatian', xp: 3500, stroke: '#1F1A3B',
        stops: ['#FFFFFF', '#F4F4F8', '#C9D2DC'],
        pattern: { kind: 'dalmatian', base: '#FFFFFF', accent: '#1F1A2A' },
    },
    leopard: {
        name: 'Leopard', xp: 3900, stroke: '#5A3A18',
        stops: ['#FFE0A8', '#E5A861', '#A06A2A'],
        pattern: { kind: 'leopard', base: '#E5A861', accent: '#3A2410', accent2: '#FFC678' },
    },
    giraffe: {
        name: 'Giraffe', xp: 4050, stroke: '#8A5A1A',
        stops: ['#FFE6A8', '#E5B26A', '#A86F1A'],
        pattern: { kind: 'giraffe', base: '#E5B26A', accent: '#6F4A1A' },
    },

    // ---- Neon glow ------------------------------------------------------
    // `glow: { color }` adds a Gaussian-blur halo around the globe and tints
    // the gradient stops to a single saturated colour.
    neon_green: {
        name: 'Neon Lime', xp: 4200, stroke: '#1F8A1F',
        stops: ['#E5FFB0', '#7FFF3F', '#39C82A'],
        glow: { color: '#9CFF3F' },
    },
    neon_pink: {
        name: 'Neon Magenta', xp: 4500, stroke: '#8A1F6A',
        stops: ['#FFD0F0', '#FF3FB0', '#C8198A'],
        glow: { color: '#FF3FD0' },
    },
    neon_blue: {
        name: 'Neon Cyan', xp: 4800, stroke: '#1F6A8A',
        stops: ['#D0F0FF', '#3FB0FF', '#1A8AD8'],
        glow: { color: '#3FE0FF' },
    },
    neon_violet: {
        name: 'Neon Violet', xp: 5100, stroke: '#5A1F8A',
        stops: ['#E0CFFF', '#9A3FFF', '#6A19D8'],
        glow: { color: '#B05BFF' },
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

    // More colorways of existing shapes.
    party_purple:  { name: 'Purple Party Hat',  xp: 95,   shape: 'party',     c: PURPLE },
    party_gold:    { name: 'Gold Party Hat',    xp: 140,  shape: 'party',     c: GOLD },
    cap_black:     { name: 'Black Cap',         xp: 250,  shape: 'cap',       c: BLACK },
    beanie_green:  { name: 'Green Beanie',      xp: 330,  shape: 'beanie',    c: GREEN },
    beret_blue:    { name: 'Blue Beret',        xp: 430,  shape: 'beret',     c: BLUE },
    beret_green:   { name: 'Green Beret',       xp: 445,  shape: 'beret',     c: GREEN },
    fez_blue:      { name: 'Blue Fez',          xp: 470,  shape: 'fez',       c: BLUE },
    flower_blue:   { name: 'Bluebell Crown',    xp: 790,  shape: 'flower',    c: BLUE },
    cowboy_white:  { name: 'White Hat',         xp: 880,  shape: 'cowboy',    c: WHITE },
    cap_gold:      { name: 'Gold Cap',          xp: 1080, shape: 'cap',       c: GOLD },
    horns_purple:  { name: 'Imp Horns',         xp: 1250, shape: 'horns',     c: PURPLE },
    tiara_pink:    { name: 'Pink Tiara',        xp: 1360, shape: 'tiara',     c: PINK },
    crown_silver:  { name: 'Silver Crown',      xp: 1850, shape: 'crown',     c: SILVER },
    tophat_blue:   { name: 'Dapper Hat',        xp: 2100, shape: 'tophat',    c: BLUE },
    wizard_green:  { name: 'Druid Hat',         xp: 2550, shape: 'wizard',    c: GREEN },

    // ---- Silly novelty hats --------------------------------------------
    pirate:        { name: 'Pirate Tricorn',    xp: 1150, shape: 'pirate',    c: hc('#1F1A2A', '#0F0A18', '#F2F4F8') },
    mohawk_pink:   { name: 'Pink Mohawk',       xp: 1350, shape: 'mohawk',    c: hc('#FF5CD0', '#C8198A', '#FFFFFF') },
    mohawk_neon:   { name: 'Neon Mohawk',       xp: 1550, shape: 'mohawk',    c: hc('#7FFF3F', '#39C82A', '#FFFFFF') },
    rubber_duck:   { name: 'Rubber Duck',       xp: 1700, shape: 'duck',      c: hc('#FFD86B', '#E5A018', '#FF7A2E') },
    pineapple:     { name: 'Pineapple',         xp: 1900, shape: 'pineapple', c: hc('#FFD86B', '#C29018', '#19A36B') },
    mushroom:      { name: 'Toadstool',         xp: 2100, shape: 'mushroom',  c: hc('#E5414C', '#B5303A', '#FFFFFF') },
    cupcake:       { name: 'Cupcake',           xp: 2300, shape: 'cupcake',   c: hc('#FFD6F0', '#E5417A', '#FF5C6C') },
    traffic_cone:  { name: 'Traffic Cone',      xp: 2500, shape: 'cone',      c: hc('#FF8A4B', '#E5612E', '#FFFFFF') },
    shark_fin:     { name: 'Shark Fin',         xp: 2750, shape: 'sharkFin',  c: hc('#7B8AA0', '#4F5A70', '#F2F4F8') },
    disco_ball:    { name: 'Disco Ball',        xp: 3200, shape: 'disco',     c: hc('#D7DEE8', '#8A95A6', '#FFFFFF') },
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

    // More colorways of existing shapes.
    round_blue:      { name: 'Blue Round Specs',   xp: 240,  shape: 'round',     c: gc('#3F6FF6', 'rgba(150,200,255,0.2)') },
    nerd_blue:       { name: 'Blue Nerd Glasses',  xp: 280,  shape: 'nerd',      c: gc('#3F6FF6', 'rgba(150,200,255,0.2)', '#FFC247') },
    square_green:    { name: 'Green Squares',      xp: 360,  shape: 'square',    c: gc('#19A36B', 'rgba(200,255,220,0.2)') },
    shades_gold:     { name: 'Gold Shades',        xp: 780,  shape: 'shades',    c: shade('#A07A1A') },
    aviator_pink:    { name: 'Rose Aviators',      xp: 1040, shape: 'aviator',   c: gc('#E5417A', 'rgba(255,200,220,0.35)') },
    heart_purple:    { name: 'Purple Hearts',      xp: 1080, shape: 'heart',     c: gc('#7A4FD0', '#A270FF') },
    goggles_green:   { name: 'Green Goggles',      xp: 1180, shape: 'goggles',   c: gc('#19A36B', 'rgba(180,255,210,0.5)') },
    cateye_blue:     { name: 'Blue Cat-Eye',       xp: 1420, shape: 'cateye',    c: gc('#3F6FF6', 'rgba(150,200,255,0.2)') },
    pixel_pink:      { name: 'Synthwave Shades',   xp: 1680, shape: 'pixel',     c: gc('#2A0E33', '#FF5CD0') },
    star_pink:       { name: 'Pink Star Glasses',  xp: 1740, shape: 'star',      c: gc('#E5417A', 'rgba(255,200,220,0.4)') },
    visorband_purple:{ name: 'Purple Visor',       xp: 2000, shape: 'visorBand', c: gc('#7A4FD0', '#A270FF') },
    monocle_silver:  { name: 'Silver Monocle',     xp: 2100, shape: 'monocle',   c: gc('#B7C0CC', 'rgba(220,235,255,0.25)') },

    // ---- Party / rave eyewear ------------------------------------------
    rave:            { name: 'Rave Shades',        xp: 3200, shape: 'rave',      c: gc('#1F1A3B', '#FF3FD0') },
    nyan:            { name: 'Rainbow Bars',       xp: 3500, shape: 'nyan',      c: gc('#1F1A3B', '#FF5C6C') },
    kaleidoscope:    { name: 'Kaleidoscope',       xp: 3800, shape: 'kaleido',   c: gc('#1F1A3B', '#FFC247') },
    vr_headset:      { name: 'VR Headset',         xp: 2900, shape: 'vr',        c: gc('#1F1A3B', '#2EC4D3', '#FF5C6C') },
    swim_goggles:    { name: 'Swim Goggles',       xp: 1300, shape: 'swim',      c: gc('#19A36B', 'rgba(180,255,210,0.55)') },
    party_shades:    { name: 'Party Shades',       xp: 1900, shape: 'party',     c: gc('#1F1A3B', '#FF5C6C', '#FFC247') },
    monocle_diamond: { name: 'Diamond Monocle',    xp: 4200, shape: 'monocle',   c: gc('#EAF2FF', '#B7C6DA') },
};

// ---- Effects ---------------------------------------------------------------
// Animated flourishes layered onto Atlas. `kind` selects an SVG renderer in
// assets/illustrations/Cosmetics.jsx ('spin' rotates the globe's continents and
// is handled directly in the Mascot).
export const EFFECTS = {
    none:     { name: 'None',           xp: 0 },
    spin:     { name: 'Spinning Globe', xp: 500,  kind: 'spin' },
    orbit:    { name: 'Orbiting Moon',  xp: 900,  kind: 'orbit' },
    sparkle:  { name: 'Sparkles',       xp: 1200, kind: 'sparkle' },
    bubbles:  { name: 'Bubbles',        xp: 1800, kind: 'bubbles' },
    snow:     { name: 'Snowfall',       xp: 2400, kind: 'snow' },
    hearts:   { name: 'Lovestruck',     xp: 3000, kind: 'hearts' },
    rings:    { name: 'Planet Rings',   xp: 3600, kind: 'rings' },
    flames:   { name: 'Blazing',        xp: 4400, kind: 'flames' },
    electric: { name: 'Electric',       xp: 5400, kind: 'electric' },
    confetti: { name: 'Party Time',     xp: 6800, kind: 'confetti' },
    notes:    { name: 'Music Notes',    xp: 2700, kind: 'notes' },
    disco:    { name: 'Disco Lights',   xp: 5800, kind: 'disco' },
};

export const CATEGORIES = [
    { key: 'color',   label: 'Globe Color', icon: 'palette',        items: COLORS },
    { key: 'hat',     label: 'Hats',        icon: 'theater_comedy', items: HATS },
    { key: 'glasses', label: 'Glasses',     icon: 'eyeglasses',     items: GLASSES },
    { key: 'effect',  label: 'Effects',     icon: 'auto_awesome',   items: EFFECTS },
];

// Per-slot placement: x/y offset (in the 96-unit viewBox) and a scale `s`,
// applied as a transform in Mascot. Lets players nudge hats/glasses anywhere.
export const DEFAULT_POS = { x: 0, y: 0, s: 1 };
export const DEFAULT_COSMETICS = {
    color: 'teal', hat: 'none', glasses: 'none', effect: 'none',
    hatPos: { ...DEFAULT_POS }, glassesPos: { ...DEFAULT_POS },
};

const clampNum = (v, min, max, d) => (Number.isFinite(+v) ? Math.min(max, Math.max(min, +v)) : d);

// Clamp a stored placement to sane bounds so a cosmetic can't be dragged off
// the canvas or scaled into nonsense.
export function clampPos(p) {
    p = p || {};
    return {
        x: clampNum(p.x, -30, 30, 0),
        y: clampNum(p.y, -38, 28, 0),
        s: clampNum(p.s, 0.6, 1.7, 1),
    };
}

// The numeric `.xp` on each catalog item is now the Atlas Bucks price.
// Kept under the same key so existing call-sites still work; a thin alias
// (`priceOf`) is preferred in new code for readability.
export function priceOf(item) {
    return item ? Math.max(0, Math.round(Number(item.xp) || 0)) : 0;
}

// Defaults are free + always owned. Items with price 0 are also "free" — a
// player gets them implicitly without needing to buy.
const FREE_BY_DEFAULT = {
    color: 'teal', hat: 'none', glasses: 'none', effect: 'none',
};
export function isDefaultItem(category, id) {
    return FREE_BY_DEFAULT[category] === id;
}

export function paletteFor(color) {
    return COLORS[color] || COLORS.teal;
}

// Coerce stored cosmetics to valid, known ids + clamped placements. If an
// `ownedKey` predicate is provided we also fall back to the default for any
// slot whose stored id isn't in the player's owned set — that way an account
// that had an item "unlocked" under the old XP-threshold system but never
// bought it under the new currency system won't render a cosmetic it doesn't
// actually own.
export function normalizeCosmetics(c, ownedKey) {
    const ok = (cat, id) => {
        if (typeof ownedKey !== 'function') return true;
        if (isDefaultItem(cat, id)) return true;
        return ownedKey(cat, id);
    };
    const pick = (cat, id, table) => {
        if (!table[id]) return FREE_BY_DEFAULT[cat];
        return ok(cat, id) ? id : FREE_BY_DEFAULT[cat];
    };
    return {
        color: pick('color', c && c.color, COLORS),
        hat: pick('hat', c && c.hat, HATS),
        glasses: pick('glasses', c && c.glasses, GLASSES),
        effect: pick('effect', c && c.effect, EFFECTS),
        hatPos: clampPos(c && c.hatPos),
        glassesPos: clampPos(c && c.glassesPos),
    };
}
