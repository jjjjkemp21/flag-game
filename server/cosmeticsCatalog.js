// Server-side mirror of the cosmetic catalog: just enough to validate buys
// (id + price) without pulling the whole client lib into the server bundle.
// Keep this in sync with src/lib/cosmetics.js — the numeric prices match what
// used to be XP unlock thresholds and are now Atlas Bucks costs.

const COLORS = {
    teal: 0, emerald: 150, sunset: 400, royal: 800, rose: 1300, slate: 1700, gold: 2200, galaxy: 4000,
    mint: 250, coral: 550, sky: 650, lavender: 950, amber: 1100, forest: 1500, bubblegum: 1900, charcoal: 2400,
    aurora: 3000, ocean: 3500, nebula: 5000, plasma: 6500, lava: 8000, candy: 4600, toxic: 5600, rainbow: 10000,
    tiger: 2700, zebra: 2900, cow: 3100, cheetah: 3300, dalmatian: 3500, leopard: 3900, giraffe: 4050,
    neon_green: 4200, neon_pink: 4500, neon_blue: 4800, neon_violet: 5100,
};

const HATS = {
    none: 0,
    party_red: 80, party_blue: 110, party_green: 130, bow_pink: 160, bow_red: 175, bow_blue: 190,
    cap_red: 220, cap_blue: 240, cap_green: 260, visor: 280, beanie_blue: 300, beanie_pink: 320,
    beanie_orange: 340, nightcap: 360, bandana_red: 380, bandana_blue: 400, beret_red: 420, beret_black: 440,
    fez: 460, catears_black: 480, catears_white: 500, bunny: 540, propeller: 580, chef: 640, grad: 700,
    flower_pink: 760, flower_red: 800, cowboy_brown: 850, cowboy_black: 900, sombrero: 960,
    headphones: 1020, antenna: 1100, horns: 1200, tiara: 1320, jester: 1450, viking: 1600,
    crown: 1800, tophat_black: 2000, tophat_red: 2200, wizard_purple: 2450, wizard_blue: 2600,
    santa: 2800, laurel: 3000, viking_gold: 3300, astronaut: 3600, crown_jewel: 4000, halo: 4400,
    tophat_gold: 5200, tiara_diamond: 6500,
    party_purple: 95, party_gold: 140, cap_black: 250, beanie_green: 330, beret_blue: 430, beret_green: 445,
    fez_blue: 470, flower_blue: 790, cowboy_white: 880, cap_gold: 1080, horns_purple: 1250, tiara_pink: 1360,
    crown_silver: 1850, tophat_blue: 2100, wizard_green: 2550,
    pirate: 1150, mohawk_pink: 1350, mohawk_neon: 1550, rubber_duck: 1700, pineapple: 1900, mushroom: 2100,
    cupcake: 2300, traffic_cone: 2500, shark_fin: 2750, disco_ball: 3200,
};

const GLASSES = {
    none: 0,
    round_black: 200, nerd: 260, square_black: 300, square_red: 340, square_blue: 380, halfmoon: 420,
    rimless: 460, round_pink: 520, round_gold: 600, shades_black: 640, shades_blue: 680, shades_red: 700,
    shades_green: 720, shades_purple: 740, shades_teal: 760, aviator_dark: 840, rimless_gold: 900,
    aviator_silver: 1000, heart_pink: 1050, goggles_blue: 1100, goggles_orange: 1150, goggles_pink: 1200,
    aviator_gold: 1280, threed: 1320, cateye_black: 1380, cateye_pink: 1450, heart_red: 1500,
    pixel_dark: 1560, pixel_cyan: 1640, star_gold: 1700, pixel_green: 1760, star_blue: 1820,
    halfmoon_gold: 1880, visorband_red: 1950, monocle: 2050, groucho: 2150, cateye_gold: 2250,
    visorband_cyan: 2350, mask_black: 2500, mask_red: 2650, monocle_gold: 2800, eyepatch: 3000,
    heart_gold: 3400, visorband_gold: 4000,
    round_blue: 240, nerd_blue: 280, square_green: 360, shades_gold: 780, aviator_pink: 1040,
    heart_purple: 1080, goggles_green: 1180, cateye_blue: 1420, pixel_pink: 1680, star_pink: 1740,
    visorband_purple: 2000, monocle_silver: 2100,
    rave: 3200, nyan: 3500, kaleidoscope: 3800, vr_headset: 2900, swim_goggles: 1300,
    party_shades: 1900, monocle_diamond: 4200,
};

const EFFECTS = {
    none: 0, spin: 500, orbit: 900, sparkle: 1200, bubbles: 1800, snow: 2400, hearts: 3000,
    rings: 3600, flames: 4400, electric: 5400, confetti: 6800, notes: 2700, disco: 5800,
};

const CATALOG = { color: COLORS, hat: HATS, glasses: GLASSES, effect: EFFECTS };

// Items that are always considered owned (so a fresh account has a working
// equip in every slot). Mirrors DEFAULT_COSMETICS on the client.
const DEFAULTS = { color: 'teal', hat: 'none', glasses: 'none', effect: 'none' };

function priceOf(category, id) {
    const cat = CATALOG[category];
    if (!cat) return null;
    const p = cat[id];
    return Number.isFinite(p) ? p : null;
}

function isDefault(category, id) {
    return DEFAULTS[category] === id;
}

module.exports = { CATALOG, DEFAULTS, priceOf, isDefault };
