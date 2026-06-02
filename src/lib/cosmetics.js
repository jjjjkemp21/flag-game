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

    // ---- Pride collection (one cosmetic per category, see HATS/GLASSES/etc.)
    // Cycles the literal 6-stripe pride flag palette as the gradient stops, in
    // sequence. Distinct from Rainbow Prism (which cycles a generic warm/cool
    // mix) — this reads as deliberately "Pride." Mid-tier animated price band.
    pride_aurora: {
        name: 'Pride Aurora', xp: 3200, stroke: '#7A4FD0',
        stops: ['#E40303', '#FFA52C', '#FFED00'],
        anim: { dur: '8s', frames: [
            ['#E40303', '#FFA52C', '#FFED00'],  // red → orange → yellow
            ['#FFA52C', '#FFED00', '#008026'],  // orange → yellow → green
            ['#FFED00', '#008026', '#004CFF'],  // yellow → green → blue
            ['#008026', '#004CFF', '#732982'],  // green → blue → purple
            ['#004CFF', '#732982', '#E40303'],  // blue → purple → back to red
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

    // ---- Reptile Kingdom (Atlas Pass exclusives) -----------------------------
    // bpOnly:true items are gated to the battlepass: the shop hides them and
    // the currency buy endpoint refuses them. They can only be unlocked by
    // claiming a pass tier — once unlocked, they appear in the player's "Owned"
    // tab and equip like any other cosmetic. Prices are kept symbolic so a
    // future migration could move them to the shop without re-pricing work.
    bp_iguana: {
        // Tier 3 — entry-tier reptile hide in fresh greens, polished scales.
        name: 'Iguana Hide', xp: 999999, bpOnly: true, stroke: '#1F5A3F',
        stops: ['#C8EFD2', '#3FAA60', '#1F5A3F'],
        pattern: { kind: 'scales', base: '#2F8A5B', accent: '#3FAA60', accent2: '#A8F0C0' },
    },
    bp_gecko: {
        // Tier 7 — sunbathing gecko: warm amber base with iridescent dotting.
        name: 'Gecko Spots', xp: 999999, bpOnly: true, stroke: '#7A4A1A',
        stops: ['#FFE5A8', '#FFB23F', '#A0681A'],
        pattern: { kind: 'gecko', base: '#FFB23F', accent: '#FFD86B', accent2: '#7A4A1A' },
    },
    bp_jade: {
        // Tier 9 — deep jade with golden rim highlights on each scale.
        name: 'Jade Scales', xp: 999999, bpOnly: true, stroke: '#0F4A2A',
        stops: ['#B5F0C8', '#19A36B', '#0F4A2A'],
        pattern: { kind: 'scales', base: '#19805A', accent: '#19A36B', accent2: '#FFD86B' },
    },
    bp_python: {
        // Tier 10 — moss/olive python with diamondback markings.
        name: 'Python Skin', xp: 999999, bpOnly: true, stroke: '#2A4015',
        stops: ['#E0EAB5', '#7F9A3F', '#2A4015'],
        pattern: { kind: 'serpent', base: '#5B7F2F', accent: '#A8C047', accent2: '#2A4015' },
    },
    bp_komodo: {
        // Tier 12 — weathered earth tones, leathery scales for a komodo feel.
        name: 'Komodo Dragon', xp: 999999, bpOnly: true, stroke: '#1F1810',
        stops: ['#C2B098', '#7A6850', '#3A2A18'],
        pattern: { kind: 'scales', base: '#5A4A38', accent: '#7A6850', accent2: '#C2B098' },
    },
    bp_anaconda: {
        // Tier 14 — swampy deep greens with crisp diamondback markings.
        name: 'Anaconda', xp: 999999, bpOnly: true, stroke: '#0F2A1A',
        stops: ['#B5D0A8', '#3F5F2A', '#0F2A1A'],
        pattern: { kind: 'serpent', base: '#3F5F2A', accent: '#7FAE5B', accent2: '#0F2A1A' },
    },

    // ---- Showpiece tier (18-25): animated + glowing + premium pattern ----
    bp_frost_serpent: {
        // Tier 18 — frost serpent: icy cyan jewel scales that shimmer + glow.
        name: 'Frost Serpent', xp: 999999, bpOnly: true, stroke: '#1F4A6A',
        stops: ['#E0F2FF', '#5BAEE0', '#1F4A6A'],
        pattern: { kind: 'jewelScales', base: '#1F4A6A', accent: '#5BAEE0', accent2: '#D0EAFF' },
        anim: { dur: '6s', frames: [
            ['#E0F2FF', '#5BAEE0', '#1F4A6A'],
            ['#FFFFFF', '#7FC2F5', '#2A5F8A'],
            ['#D0E5F5', '#3F8AC0', '#0F3A5A'],
        ] },
        glow: { color: '#7FD0FF' },
    },
    bp_basilisk: {
        // Tier 20 — king basilisk: emerald jewel scales with shifting glow.
        name: 'King Basilisk', xp: 999999, bpOnly: true, stroke: '#0F4A2A',
        stops: ['#D5F0A8', '#19C37D', '#0F4A2A'],
        pattern: { kind: 'jewelScales', base: '#0F4A2A', accent: '#19C37D', accent2: '#FFD86B' },
        anim: { dur: '5s', frames: [
            ['#D5F0A8', '#19C37D', '#0F4A2A'],
            ['#A8E0E5', '#3F8AAE', '#0F3A6A'],
            ['#FFE08A', '#7FAE2A', '#1F6A1A'],
        ] },
        glow: { color: '#7FE05B' },
        overlay: 'stars',
    },
    bp_cosmic_drake: {
        // Tier 23 — cosmic drake: starfield cosmos that cycles through three
        // wholly different colourways (cosmic violet -> emerald -> rose).
        name: 'Cosmic Drake', xp: 999999, bpOnly: true, stroke: '#241850', overlay: 'stars',
        stops: ['#E5C8FF', '#7A4FD0', '#241850'],
        pattern: { kind: 'jewelScales', base: '#241850', accent: '#7A4FD0', accent2: '#FFD86B' },
        anim: { dur: '7s', frames: [
            ['#E5C8FF', '#7A4FD0', '#241850'],
            ['#A8F0C8', '#3FAA60', '#0F4A2A'],
            ['#FFC8E0', '#C04F90', '#3A1240'],
        ] },
        glow: { color: '#B070FF' },
    },
    bp_chameleon: {
        // Tier 24 — chameleon: ultra-fast color shifting (4-frame cycle) so
        // the globe constantly slides through the spectrum. No pattern; the
        // pure colour shift IS the showpiece.
        name: 'Chameleon', xp: 999999, bpOnly: true, stroke: '#5B3FA0',
        stops: ['#A8F0C2', '#19C37D', '#3F6F30'],
        anim: { dur: '3.6s', frames: [
            ['#A8F0C2', '#19C37D', '#3F6F30'],
            ['#FFE08A', '#FFC247', '#A06A18'],
            ['#FFB0C0', '#FF5C6C', '#8A1F2A'],
            ['#B0C8FF', '#5B5BF6', '#2A2A8A'],
            ['#E0B0FF', '#B05BF6', '#5A1F8A'],
        ] },
        glow: { color: '#FFFFFF' },
    },
    bp_dragon_fire: {
        // Tier 25 — capstone. Molten dragon fire: bright fire with ember
        // overlay AND glow AND jewel scales — pulls every premium effect.
        name: 'Dragon Fire', xp: 999999, bpOnly: true, stroke: '#5A1A0F',
        stops: ['#FFEFA8', '#FF6A2E', '#8A1F0F'],
        overlay: 'embers',
        pattern: { kind: 'jewelScales', base: '#5A1A0F', accent: '#FF6A2E', accent2: '#FFE08A' },
        anim: { dur: '4s', frames: [
            ['#FFEFA8', '#FF6A2E', '#8A1F0F'],
            ['#FFD86B', '#E5412E', '#5A0F0F'],
            ['#FFFDF7', '#FF8A3F', '#A0301A'],
        ] },
        glow: { color: '#FF8A3F' },
    },

    // ---- Season 1 extension (tiers 26-30) ------------------------------------
    bp_world_serpent: {
        // Tier 30 — extended-season capstone. The World Serpent coiling the
        // globe: oceanic teal jewel-scales that cycle into emerald then cosmic
        // violet, with a starfield overlay AND glow — the richest colour here.
        name: 'World Serpent', xp: 999999, bpOnly: true, stroke: '#0F2A3A', overlay: 'stars',
        stops: ['#A8F0E0', '#1FA0AC', '#0F2A3A'],
        pattern: { kind: 'jewelScales', base: '#0F3A4A', accent: '#1FC0B0', accent2: '#FFD86B' },
        anim: { dur: '6s', frames: [
            ['#A8F0E0', '#1FA0AC', '#0F2A3A'],
            ['#A8F0C8', '#19C37D', '#0F4A2A'],
            ['#C9A8F0', '#7A4FD0', '#241850'],
        ] },
        glow: { color: '#3FE0D0' },
    },

    // ---- Olympus Ascendant (Season 2 · Atlas Pass exclusives) ----------------
    // Greek-mythology globe skins. Static marble/terracotta/bronze starter
    // hides ramp up to animated showpieces (Ambrosia, Celestial Bronze, the
    // Golden Touch + Olympian Glory capstones). Same bpOnly gating as Season 1.
    bp_marble: {
        // Parian marble — cool white stone with faint grey veining.
        name: 'Parian Marble', xp: 999999, bpOnly: true, stroke: '#8A93A0',
        stops: ['#FBFCFE', '#DDE3EA', '#A9B4C2'],
        pattern: { kind: 'marble', base: '#F2F5F9', accent: '#AEB9C8' },
    },
    bp_terracotta: {
        // Terracotta — warm fired clay banded with a painted Greek key.
        name: 'Terracotta', xp: 999999, bpOnly: true, stroke: '#7A3318',
        stops: ['#F0C49A', '#C8682E', '#7A3318'],
        pattern: { kind: 'meander', base: '#C8682E', accent: '#3A1A0E' },
    },
    bp_black_figure: {
        // Black-figure vase — terracotta ground with black palmette friezes.
        name: 'Black-Figure Vase', xp: 999999, bpOnly: true, stroke: '#1A0E08',
        stops: ['#E8B488', '#B5531F', '#5A2410'],
        pattern: { kind: 'vaseFigure', base: '#C8682E', accent: '#1A0E08', accent2: '#5A2410' },
    },
    bp_olive: {
        // Olive grove — muted silvery green sprigged with olive leaves.
        name: 'Olive Grove', xp: 999999, bpOnly: true, stroke: '#3F4A1F',
        stops: ['#DCE6B5', '#8A9A4F', '#3F4A1F'],
        pattern: { kind: 'laurel', base: '#7C8C48', accent: '#41501F', accent2: '#C8D88A' },
    },
    bp_sea_foam: {
        // Nereid foam — pale sea-green crests breaking over Aegean teal.
        name: 'Nereid Foam', xp: 999999, bpOnly: true, stroke: '#1F6A6A',
        stops: ['#E0F7F2', '#5BD0C0', '#1F8A8A'],
        pattern: { kind: 'waves', base: '#1F8A8A', accent: '#E6F9F4', accent2: '#5BD0C0' },
    },
    bp_aegean: {
        // Aegean sea — running waves over deep Mediterranean blue.
        name: 'Aegean Sea', xp: 999999, bpOnly: true, stroke: '#103A6A',
        stops: ['#B5D8F5', '#2E7AD3', '#103A6A'],
        pattern: { kind: 'waves', base: '#163F72', accent: '#CFE6FF', accent2: '#2E7AD3' },
    },
    bp_bronze: {
        // Hoplite bronze — burnished war-shield metal engraved with a key band.
        name: 'Hoplite Bronze', xp: 999999, bpOnly: true, stroke: '#5A360F',
        stops: ['#F0D8A0', '#C28A3F', '#7A4E1A'],
        pattern: { kind: 'meander', base: '#A8702F', accent: '#4A2C0C', accent2: '#F5E5B5' },
    },
    bp_wine: {
        // Wine-dark sea — Homer's oinops pontos, deep blood-purple swell.
        name: 'Wine-Dark Sea', xp: 999999, bpOnly: true, stroke: '#3A0F2A',
        stops: ['#C87A9A', '#7A1F4A', '#3A0F2A'],
        pattern: { kind: 'waves', base: '#7A1F4A', accent: '#E6B6CC', accent2: '#C04F80' },
    },
    bp_chiton: {
        // Royal chiton — Tyrian-purple cloth falling in pleated folds.
        name: 'Royal Chiton', xp: 999999, bpOnly: true, stroke: '#3A1A5A',
        stops: ['#D8C0F0', '#7A4FD0', '#3A1A5A'],
        pattern: { kind: 'fluting', base: '#6A45C0', accent: '#3A1A5A', accent2: '#E8D8FF' },
    },
    bp_storm: {
        // Storm of Zeus — thunderhead grey torn through with electric streaks.
        name: 'Storm of Zeus', xp: 999999, bpOnly: true, stroke: '#2A3344',
        stops: ['#C7D2E0', '#5B6A82', '#2A3344'],
        pattern: { kind: 'marble', base: '#5B6A82', accent: '#D6E4FA' },
        glow: { color: '#5BB0FF' },
    },
    bp_underworld: {
        // Underworld — Hades' realm: the dark rivers Styx and Lethe under stars.
        name: 'Underworld', xp: 999999, bpOnly: true, stroke: '#1A1030', overlay: 'stars',
        stops: ['#9A7FD0', '#4A2A7A', '#1A1030'],
        pattern: { kind: 'waves', base: '#1A1030', accent: '#7A4FD0', accent2: '#3FE0A8' },
        glow: { color: '#7A4FD0' },
    },
    bp_nectar: {
        // Nectar — the amber drink of the gods, slowly swirling.
        name: 'Nectar', xp: 999999, bpOnly: true, stroke: '#8A5A0F',
        stops: ['#FFE8A8', '#FFB23F', '#A0681A'],
        anim: { dur: '6s', frames: [
            ['#FFE8A8', '#FFB23F', '#A0681A'],
            ['#FFF1C2', '#FFC247', '#B5841A'],
            ['#FFE08A', '#FF9A2E', '#8A5A0F'],
        ] },
        glow: { color: '#FFD86B' },
    },
    bp_ambrosia: {
        // Ambrosia — food of immortals: gilded rosettes over gold cycling into
        // rose and violet.
        name: 'Ambrosia', xp: 999999, bpOnly: true, stroke: '#7A3F5A',
        stops: ['#FFE8C2', '#FFB0C0', '#C04F80'],
        pattern: { kind: 'coffer', base: '#C04F80', accent: '#FFE8C2', accent2: '#FFF1C2' },
        anim: { dur: '5s', frames: [
            ['#FFE8C2', '#FFB0C0', '#C04F80'],
            ['#FFF1C2', '#FFD86B', '#C28A3F'],
            ['#F0D0FF', '#B070FF', '#5B3FA0'],
        ] },
        glow: { color: '#FFC0D8' },
    },
    bp_celestial: {
        // Celestial bronze — mythic metal that shimmers between bronze and gold.
        name: 'Celestial Bronze', xp: 999999, bpOnly: true, stroke: '#5A360F', overlay: 'stars',
        stops: ['#FFE8A8', '#C28A3F', '#5A360F'],
        pattern: { kind: 'meander', base: '#7A4E1A', accent: '#3A2008', accent2: '#FFF1C2' },
        anim: { dur: '6s', frames: [
            ['#FFE8A8', '#C28A3F', '#5A360F'],
            ['#FFF6D0', '#E5B25B', '#7A4E1A'],
            ['#FFE0A8', '#D89A3F', '#6A3E12'],
        ] },
        glow: { color: '#FFD86B' },
    },
    bp_aether: {
        // Aether — the bright upper air of the heavens, a drifting cosmos.
        name: 'Aether', xp: 999999, bpOnly: true, stroke: '#1A2A5A', overlay: 'stars',
        stops: ['#CFE6FF', '#5B7BE0', '#1A2A5A'],
        anim: { dur: '8s', frames: [
            ['#CFE6FF', '#5B7BE0', '#1A2A5A'],
            ['#E0D0FF', '#8A6FD0', '#2A1A5A'],
            ['#CFF5EC', '#3FB0C0', '#0F3A4A'],
        ] },
        glow: { color: '#9DB8FF' },
    },
    bp_midas: {
        // Tier 25 capstone — the Golden Touch: molten gold with ember sparks.
        name: 'Golden Touch', xp: 999999, bpOnly: true, stroke: '#7A5210', overlay: 'embers',
        stops: ['#FFF6D0', '#FFC247', '#A0681A'],
        pattern: { kind: 'coffer', base: '#A0681A', accent: '#FFF6D0', accent2: '#FFC247' },
        anim: { dur: '4s', frames: [
            ['#FFF6D0', '#FFC247', '#A0681A'],
            ['#FFFDF0', '#FFD86B', '#C28A3F'],
            ['#FFEFA8', '#FFB23F', '#8A5A0F'],
        ] },
        glow: { color: '#FFD86B' },
    },
    bp_olympus_eternal: {
        // Tier 30 capstone — Olympian Glory: gold, sky-blue and white cycling
        // over a starfield with a divine glow. The richest skin of the pass.
        name: 'Olympian Glory', xp: 999999, bpOnly: true, stroke: '#1F3A6A', overlay: 'stars',
        stops: ['#FFF6D0', '#FFC247', '#2E7AD3'],
        pattern: { kind: 'coffer', base: '#1F3A6A', accent: '#FFE8A8', accent2: '#FFC247' },
        anim: { dur: '6s', frames: [
            ['#FFF6D0', '#FFC247', '#2E7AD3'],
            ['#FFFFFF', '#9DB8FF', '#1F3A6A'],
            ['#FFF1C2', '#FFD86B', '#C28A3F'],
        ] },
        glow: { color: '#FFE8A8' },
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

    // ---- Reptile Kingdom hats (Atlas Pass exclusives) ----------------------
    bp_horns_jade:     { name: 'Jade Horns',     xp: 999999, bpOnly: true, shape: 'dragonHorns', c: hc('#3FAA60', '#1F5A3F', '#FFD86B') },
    bp_horns_obsidian: { name: 'Obsidian Horns', xp: 999999, bpOnly: true, shape: 'dragonHorns', c: hc('#1F1A2A', '#0F0A18', '#FF6A2E') },
    bp_horns_fire:     { name: 'Fire Horns',     xp: 999999, bpOnly: true, shape: 'dragonHorns', c: hc('#FF6A2E', '#8A1F0F', '#FFD86B') },
    bp_horns_gold:     { name: 'Golden Horns',   xp: 999999, bpOnly: true, shape: 'dragonHorns', c: hc('#FFD86B', '#A07A1A', '#FFEFC2') },
    bp_frill_emerald:  { name: 'Emerald Frill',  xp: 999999, bpOnly: true, shape: 'frill',       c: hc('#3FAA60', '#1F5A3F', '#FFD86B') },
    bp_frill_crimson:  { name: 'Crimson Frill',  xp: 999999, bpOnly: true, shape: 'frill',       c: hc('#E5414C', '#8A1F1F', '#FFC247') },
    bp_frill_violet:   { name: 'Violet Frill',   xp: 999999, bpOnly: true, shape: 'frill',       c: hc('#7A4FD0', '#3F1F8A', '#FFC247') },
    bp_scale_helm:     { name: 'Scaled Hood',    xp: 999999, bpOnly: true, shape: 'scaleHelm',   c: hc('#3FAA60', '#1F5A3F', '#7FE0A8', '#FFD86B') },
    // Season 1 extension (tier 26) — a wyvern-bone circlet of upswept scaled
    // spikes around a central gem; icy teal keratin with gold + frost accents.
    bp_wyvern_crown:   { name: 'Wyvern Crown',   xp: 999999, bpOnly: true, shape: 'wyvernCrown', c: hc('#2FA0C0', '#15506A', '#FFD86B', '#A8E8FF') },

    // ---- Olympus Ascendant hats (Season 2 · Atlas Pass exclusives) ---------
    // corinthianHelm carries a horsehair crest in its `trim`; oliveWreath uses
    // `main`/`dark` for the leaves and `accent` for the berries; wingedHelm uses
    // `main`/`dark` for the cap and `accent` for the feathered wings.
    bp_helm_bronze:    { name: 'Hoplite Helm',     xp: 999999, bpOnly: true, shape: 'corinthianHelm', c: hc('#C28A3F', '#7A4E1A', '#F5E5B5', '#C8322A') },
    bp_helm_gold:      { name: 'Golden War Helm',  xp: 999999, bpOnly: true, shape: 'corinthianHelm', c: hc('#FFD86B', '#A07A1A', '#FFF1C2', '#F2F4F8') },
    bp_helm_obsidian:  { name: 'Iron War Helm',    xp: 999999, bpOnly: true, shape: 'corinthianHelm', c: hc('#5A6170', '#2A3040', '#A9B4C2', '#7A4FD0') },
    bp_olive_wreath:   { name: 'Olive Wreath',     xp: 999999, bpOnly: true, shape: 'oliveWreath',    c: hc('#8A9A4F', '#3F4A1F', '#E8EFC2') },
    bp_laurel_victor:  { name: "Victor's Laurel",  xp: 999999, bpOnly: true, shape: 'oliveWreath',    c: hc('#FFD86B', '#A07A1A', '#FFF1C2') },
    bp_winged_helm:    { name: 'Winged Helm',      xp: 999999, bpOnly: true, shape: 'wingedHelm',     c: hc('#FFD86B', '#A07A1A', '#FFFDF7') },

    // ---- Pride collection (member of the cross-category Pride set) ---------
    // Diagonal sash across Atlas's globe, six rainbow stripes baked into the
    // shape — the palette IS the design, so the colorway dict is unused.
    pride_sash:        { name: 'Pride Sash',        xp: 1600, shape: 'prideSash', c: {} },
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

    // ---- Reptile Kingdom glasses (Atlas Pass exclusives) -------------------
    bp_snake_eyes:    { name: 'Snake Eyes',      xp: 999999, bpOnly: true, shape: 'snakeEyes', c: gc('#1F5A3F', '#FFD86B', '#7FE05B') },
    bp_serpent_eyes:  { name: 'Serpent Gaze',    xp: 999999, bpOnly: true, shape: 'snakeEyes', c: gc('#3F1F8A', '#A270FF', '#FFC247') },
    bp_lizard_eyes:   { name: 'Lizard Eyes',     xp: 999999, bpOnly: true, shape: 'snakeEyes', c: gc('#5A3A18', '#FF6A2E', '#FFD86B') },
    bp_dragon_gaze:   { name: 'Dragon Gaze',     xp: 999999, bpOnly: true, shape: 'dragonGaze', c: gc('#8A1F0F', '#FF6A2E', '#FFD86B') },
    // Season 1 extension (tier 27) — a single wraparound apex visor with twin
    // glowing slits and a crest ridge; dark-teal frame, glowing cyan lens.
    bp_apex_visor:    { name: 'Apex Visor',      xp: 999999, bpOnly: true, shape: 'apexVisor',  c: gc('#15506A', '#3FE0D0', '#FFD86B') },

    // ---- Olympus Ascendant glasses (Season 2 · Atlas Pass exclusives) ------
    // helmSlits: the T-shaped eye slit of a Corinthian war helm lowered over
    // the eyes (frame = metal, lens = the dark slit, accent = rivets).
    // oracleEyes: glowing oracle eyes wreathed in mystic vapour (frame = lid,
    // lens = the glow colour, accent = the rising vapour).
    bp_helm_slits:        { name: 'War Visor',     xp: 999999, bpOnly: true, shape: 'helmSlits', c: gc('#C28A3F', '#1A130A', '#F5E5B5') },
    bp_helm_slits_gold:   { name: 'Golden Visor',  xp: 999999, bpOnly: true, shape: 'helmSlits', c: gc('#FFD86B', '#2A1E08', '#FFF1C2') },
    bp_oracle_eyes:       { name: "Oracle's Sight", xp: 999999, bpOnly: true, shape: 'oracleEyes', c: gc('#7A4E1A', '#FFE08A', '#FFD86B') },
    bp_oracle_eyes_violet:{ name: "Seer's Trance",  xp: 999999, bpOnly: true, shape: 'oracleEyes', c: gc('#3F1F8A', '#C89AFF', '#9A6FE0') },

    // ---- Pride collection -------------------------------------------------
    // Heart-shaped lenses, each filled with a vertical 6-stripe rainbow. Frame
    // stays dark for contrast; the rainbow is the lens, not the rim.
    pride_heart_shades: { name: 'Pride Heart Shades', xp: 1900, shape: 'prideHeartShades', c: gc('#1F1A3B', '#FFFFFF') },
};

// ---- Mouth colorways -------------------------------------------------------
// Reuses the `hc(main, dark, accent, trim)` helper used by hats. Beard tones,
// lip colours, etc. live here so MOUTHS entries stay readable.
const BEARD_BLACK  = hc('#3A2E26', '#1F1A14', '#7A6A55');
const BEARD_BROWN  = hc('#7A4F2E', '#4F3520', '#C29A6A');
const BEARD_GRAY   = hc('#B7BCC4', '#7A8090', '#E6ECF2');
const BEARD_RED    = hc('#C56A2E', '#7A3F1A', '#FFD8A8');
const BEARD_BLONDE = hc('#E0B66E', '#A07A1A', '#FFEFC2');
const LIP_RED      = hc('#E5414C', '#8A1F26', '#FFC0C6');
const LIP_PINK     = hc('#FF7BA0', '#C84F7A', '#FFE0EC');
const LIP_PLUM     = hc('#7A2A5B', '#3F1430', '#C870A8');
const LIP_GLOSS    = hc('#FFC0C6', '#C8868D', '#FFFFFF');
const PACI_BLUE    = hc('#7FC2F5', '#3F8AC8', '#FFD86B');
const MASK_BLUE    = hc('#7FAAD8', '#3F5F8A', '#FFFFFF');
const MASK_GREEN   = hc('#5BAE6A', '#2F7D3F', '#FFC247');
const MASK_BLACK   = hc('#2A2440', '#16122A', '#C56F2E');

// ---- Mouth catalog ---------------------------------------------------------
// Items that visually replace the mood mouth (lipstick, masks, fangs) set
// `hideMouth: true` so the default mood mouth doesn't bleed through. Accessory
// items (beards, lollipops, straws, cigars) leave it visible so the mascot
// keeps its expression.
export const MOUTHS = {
    none:            { name: 'None',               xp: 0 },

    // Beards & moustaches — sit around the lower face
    soul_patch:      { name: 'Soul Patch',         xp: 200,  shape: 'soulPatch',   c: BEARD_BROWN },
    stache_brown:    { name: 'Moustache',          xp: 240,  shape: 'mustache',    c: BEARD_BROWN },
    stache_black:    { name: 'Black Moustache',    xp: 260,  shape: 'mustache',    c: BEARD_BLACK },
    goatee:          { name: 'Goatee',             xp: 320,  shape: 'goatee',      c: BEARD_BROWN },
    goatee_black:    { name: 'Black Goatee',       xp: 340,  shape: 'goatee',      c: BEARD_BLACK },
    handlebar:       { name: 'Handlebar Stache',   xp: 420,  shape: 'handlebar',   c: BEARD_BROWN },
    handlebar_red:   { name: 'Red Handlebar',      xp: 460,  shape: 'handlebar',   c: BEARD_RED },
    full_beard:      { name: 'Full Beard',         xp: 580,  shape: 'fullBeard',   c: BEARD_BROWN },
    full_beard_red:  { name: 'Ginger Beard',       xp: 640,  shape: 'fullBeard',   c: BEARD_RED },
    full_beard_gray: { name: 'Wise Beard',         xp: 720,  shape: 'fullBeard',   c: BEARD_GRAY },
    viking_beard:    { name: 'Viking Braids',      xp: 1080, shape: 'vikingBeard', c: BEARD_BLONDE },

    // Lip cosmetics — fully replace the mood mouth
    lip_gloss:       { name: 'Lip Gloss',          xp: 320,  shape: 'lipGloss',  hideMouth: true, c: LIP_GLOSS },
    lipstick_red:    { name: 'Red Lipstick',       xp: 420,  shape: 'lipstick',  hideMouth: true, c: LIP_RED },
    lipstick_pink:   { name: 'Pink Lipstick',      xp: 460,  shape: 'lipstick',  hideMouth: true, c: LIP_PINK },
    lipstick_plum:   { name: 'Plum Lipstick',      xp: 540,  shape: 'lipstick',  hideMouth: true, c: LIP_PLUM },
    lipstick_gold:   { name: 'Gold Lipstick',      xp: 1280, shape: 'lipstick',  hideMouth: true, c: hc('#FFD86B', '#A07A1A', '#FFEFC2') },

    // Silly / accessory items
    tongue_out:      { name: 'Tongue Out',         xp: 280,  shape: 'tongueOut',  hideMouth: true, c: hc('#FF7BA0', '#C84F7A', '#FFFFFF') },
    bubblegum:       { name: 'Bubblegum',          xp: 380,  shape: 'bubblegum',  c: hc('#FFB0D8', '#E5417A', '#FFFFFF') },
    bubblegum_blue:  { name: 'Blueberry Gum',      xp: 440,  shape: 'bubblegum',  c: hc('#B0CFFF', '#3F6FF6', '#FFFFFF') },
    toothpick:       { name: 'Toothpick',          xp: 340,  shape: 'toothpick',  c: hc('#E5C68A', '#9A6F2A', '#FFFDF7') },
    pacifier:        { name: 'Pacifier',           xp: 480,  shape: 'pacifier',   hideMouth: true, c: PACI_BLUE },
    pacifier_pink:   { name: 'Pink Pacifier',      xp: 500,  shape: 'pacifier',   hideMouth: true, c: hc('#FF7BA0', '#C84F7A', '#FFD86B') },
    straw_red:       { name: 'Drinking Straw',     xp: 560,  shape: 'straw',      c: hc('#FFFFFF', '#1F1A3B', '#E5414C') },
    straw_rainbow:   { name: 'Rainbow Straw',      xp: 760,  shape: 'straw',      c: hc('#FFFFFF', '#1F1A3B', '#5B5BF6') },
    lollipop_red:    { name: 'Lollipop',           xp: 660,  shape: 'lollipop',   c: hc('#E5414C', '#8A1F26', '#FFFFFF') },
    lollipop_swirl:  { name: 'Rainbow Lollipop',   xp: 940,  shape: 'lollipopSwirl', c: hc('#FF5C6C', '#1F1A3B', '#FFC247') },
    whistle:         { name: 'Whistle',            xp: 760,  shape: 'whistle',    c: hc('#D7DEE8', '#566173', '#E5414C') },
    cigar:           { name: 'Cigar',              xp: 820,  shape: 'cigar',      c: hc('#6F4A26', '#3A2410', '#FFD86B') },
    pipe:            { name: 'Smoking Pipe',       xp: 1080, shape: 'pipe',       c: hc('#6F4A26', '#2A1810', '#C29A6A') },
    vampire_fangs:   { name: 'Vampire Fangs',      xp: 1280, shape: 'vampireFangs', hideMouth: true, c: hc('#FFFDF7', '#7A1F2A', '#E5414C') },
    grillz:          { name: 'Gold Grillz',        xp: 1450, shape: 'grillz',     hideMouth: true, c: hc('#FFD86B', '#A07A1A', '#FFFDF7') },
    surgeon_mask:    { name: 'Surgeon Mask',       xp: 920,  shape: 'surgeonMask', hideMouth: true, c: MASK_BLUE },
    surgeon_mask_blk:{ name: 'Black Mask',         xp: 1100, shape: 'surgeonMask', hideMouth: true, c: MASK_BLACK },
    pilot_mask:      { name: 'Pilot Oxygen Mask',  xp: 1700, shape: 'pilotMask',  hideMouth: true, c: hc('#1F2A40', '#0F1428', '#FFC247') },
    gas_mask:        { name: 'Gas Mask',           xp: 2300, shape: 'gasMask',    hideMouth: true, c: MASK_GREEN },

    // ---- Pride collection -------------------------------------------------
    // A rainbow-swirled bubblegum bubble — riff on the standard bubblegum
    // shape but with the bubble's fill replaced by a 6-stripe radial swirl.
    pride_bubblegum: { name: 'Pride Bubblegum', xp: 700, shape: 'prideBubblegum', c: hc('#FF5C6C', '#1F1A3B', '#FFFFFF') },
};

// ---- Effects ---------------------------------------------------------------
// Animated flourishes layered onto Atlas. `kind` selects an SVG renderer in
// assets/illustrations/Cosmetics.jsx ('spin' rotates the globe's continents and
// is handled directly in the Mascot).
export const EFFECTS = {
    none:     { name: 'None',           xp: 0 },
    spin:     { name: 'Spinning Globe', xp: 500,  kind: 'spin' },
    orbit:    { name: 'Orbiting Moon',  xp: 900,  kind: 'orbit',    sizable: true },
    sparkle:  { name: 'Sparkles',       xp: 1200, kind: 'sparkle' },
    bubbles:  { name: 'Bubbles',        xp: 1800, kind: 'bubbles' },
    snow:     { name: 'Snowfall',       xp: 2400, kind: 'snow' },
    hearts:   { name: 'Lovestruck',     xp: 3000, kind: 'hearts' },
    rings:    { name: 'Planet Rings',   xp: 3600, kind: 'rings',    sizable: true },
    flames:   { name: 'Blazing',        xp: 4400, kind: 'flames',   sizable: true },
    electric: { name: 'Electric',       xp: 5400, kind: 'electric', sizable: true },
    confetti: { name: 'Party Time',     xp: 6800, kind: 'confetti' },
    notes:    { name: 'Music Notes',    xp: 2700, kind: 'notes' },
    disco:    { name: 'Disco Lights',   xp: 5800, kind: 'disco' },

    // ---- Reptile Kingdom effects (Atlas Pass exclusives) -------------------
    bp_scales: { name: 'Scale Shower',   xp: 999999, bpOnly: true, kind: 'scaleFall' },
    bp_breath: { name: "Dragon's Breath", xp: 999999, bpOnly: true, kind: 'dragonBreath', sizable: true },
    // Season 1 extension (tier 29) — meteors streaking down across the globe
    // with fiery trails + impact sparks. Fills the canvas, so not sizable.
    bp_meteor: { name: 'Meteor Storm',   xp: 999999, bpOnly: true, kind: 'meteorShower' },

    // ---- Olympus Ascendant effects (Season 2 · Atlas Pass exclusives) ------
    // lightning: Zeus's bolts crackle down across the globe with a flash.
    // oliveLeaves: olive + laurel leaves drift down in a gentle victory shower.
    bp_lightning:   { name: "Zeus's Wrath",  xp: 999999, bpOnly: true, kind: 'lightning' },
    bp_laurel_fall: { name: 'Laurel Shower',  xp: 999999, bpOnly: true, kind: 'oliveLeaves' },

    // ---- Pride collection -------------------------------------------------
    // Soft rainbow aurora bands drifting horizontally around Atlas — bands
    // shift opacity + drift, leaving a gentle shimmer rather than a solid wash.
    pride_aurora_bands: { name: 'Pride Aurora Bands', xp: 2800, kind: 'prideAuroraBands', sizable: true },
};

// Which effects support the player-controlled position/size transform.
// Fill-the-canvas effects (snow, sparkles, etc.) ignore it — scaling them
// clips off-canvas or clusters particles, so they stay as-authored.
export function isEffectSizable(id) {
    return !!(EFFECTS[id] && EFFECTS[id].sizable);
}

// ---- Emotes ---------------------------------------------------------------
// Short, one-shot animations a spectator can fire on their own Atlas while
// watching a friend. Each entry's `kind` maps to an EMOTE_SHAPES renderer in
// assets/illustrations/Cosmetics.jsx. The player equips up to 4 emotes into
// `emoteLoadout` — the SpectatorScreen surfaces those 4 as quick-react buttons.
//
// `wave` is the free starter (every account owns it from day one). `none` is
// the empty-slot marker used by emoteLoadout — not a cosmetic you equip
// directly. BP-exclusive emotes land in Phase 3.
export const EMOTES = {
    none:      { name: 'None',         xp: 0 },
    wave:      { name: 'Wave',         xp: 0,    kind: 'wave' },
    cheer:     { name: 'Cheer',        xp: 300,  kind: 'cheer' },
    laugh:     { name: 'Laugh',        xp: 400,  kind: 'laugh' },
    cry:       { name: 'Crying',       xp: 400,  kind: 'cry' },
    shocked:   { name: 'Shocked',      xp: 500,  kind: 'shocked' },
    spin:      { name: 'Spin Around',  xp: 800,  kind: 'spinAround' },
    heart:     { name: 'Heart Burst',  xp: 1100, kind: 'heartBurst' },
    bounce:    { name: 'Big Bounce',   xp: 1300, kind: 'bounce' },
    sleep:     { name: 'Snooze',       xp: 1500, kind: 'sleep' },
    fireworks: { name: 'Fireworks',    xp: 2200, kind: 'fireworks' },

    // ---- Reptile Kingdom emotes (Atlas Pass exclusives) ----------------------
    // bpOnly:true items are gated to the battlepass: the shop hides them and
    // the currency buy endpoint refuses them. They can only be unlocked by
    // claiming a pass tier — once unlocked, they appear in the player's "Owned"
    // tab + can be slotted into the loadout like any other emote.
    bp_dragon_roar:  { name: "Dragon's Roar",   xp: 999999, bpOnly: true, kind: 'dragonRoar' },
    bp_scale_flex:   { name: 'Scale Flex',      xp: 999999, bpOnly: true, kind: 'scaleFlex' },
    bp_serpent_coil: { name: 'Serpent Coil',    xp: 999999, bpOnly: true, kind: 'serpentCoil' },
    // Season 1 extension (tier 28) — Atlas unfurls a pair of dragon wings and
    // beats them, kicking up a wind gust + "SOAR!" banner.
    bp_wing_beat:    { name: 'Wing Beat',       xp: 999999, bpOnly: true, kind: 'wingBeat' },

    // ---- Olympus Ascendant emote (Season 2 · Atlas Pass exclusive) --------
    // Atlas hurls a crackling thunderbolt — flash, bolt and a "ZEUS!" banner.
    bp_thunderbolt:  { name: 'Thunderbolt',     xp: 999999, bpOnly: true, kind: 'thunderbolt' },

    // ---- Pride collection -------------------------------------------------
    // Atlas raises a rainbow pride flag and waves it — riffs on the free
    // `wave` emote's rocking motion with a 6-stripe pennant in place of the
    // brand colors.
    pride_flag_wave: { name: 'Pride Flag Wave', xp: 1200, kind: 'prideFlagWave' },
};

// Items that ship as free starters — owned without showing up in
// owned_cosmetics_json. Mirrors `FREE_STARTERS` in server/cosmeticsCatalog.js.
export const FREE_STARTER_ITEMS = {
    emote: new Set(['wave']),
};

export function isFreeStarter(category, id) {
    return !!(FREE_STARTER_ITEMS[category] && FREE_STARTER_ITEMS[category].has(id));
}

export const EMOTE_LOADOUT_SIZE = 4;

// ---- Scenes ----------------------------------------------------------------
// Scenes change the *background* behind Atlas on the homepage hero band —
// the only cosmetic category that doesn't render onto the mascot itself.
// `default` keeps the original animated blobs + world-dots backdrop; the
// continent scenes each illustrate the player's chosen region of the world,
// and bp_reptile is the Atlas Pass capstone tied to Season 1.
export const SCENES = {
    default:       { name: 'Default',             xp: 0 },
    africa:        { name: 'African Savanna',     xp: 2000 },
    asia:          { name: 'Asian Peaks',         xp: 2000 },
    europe:        { name: 'European Castle',     xp: 2000 },
    north_america: { name: 'North American Wilds', xp: 2000 },
    south_america: { name: 'Amazon Rainforest',   xp: 2000 },
    oceania:       { name: 'Pacific Shores',      xp: 2000 },
    antarctica:    { name: 'Antarctic Aurora',    xp: 2000 },
    bp_reptile:    { name: 'Reptile Kingdom',     xp: 999999, bpOnly: true },
    bp_olympus:    { name: 'Mount Olympus',       xp: 999999, bpOnly: true },

    // Pride Parade — aurora-stripe sky with sweeping rainbow ribbons over a
    // dusk silhouette skyline. Standard scene price (matches continent scenes).
    pride_parade:  { name: 'Pride Parade',        xp: 2000 },
};

// ---- Companions -------------------------------------------------------------
// Small animal characters that stand beside Atlas at his lower-right. Each has
// a subtle SMIL idle (tail flick / nose wiggle / blink / ear twitch / belly
// breathing). Rendered LAST in Mascot (topmost layer), so the companion always
// reads in front of Atlas and his cosmetics — even when the player drags it
// across his body. Pricing band 2000–3300, sitting just above hats and well below
// scenes (companions ship with the most authored geometry of any per-slot item).
// `kind` selects an SVG renderer in assets/illustrations/Cosmetics.jsx.
export const COMPANIONS = {
    none:                     { name: 'None',         xp: 0 },
    piglet:                   { name: 'Piglet',       xp: 2000, kind: 'piglet' },
    kitten:                   { name: 'Kitten',       xp: 2200, kind: 'kitten' },
    puppy:                    { name: 'Puppy',        xp: 2400, kind: 'puppy' },
    turtle:                   { name: 'Turtle',       xp: 2600, kind: 'turtle' },
    pirate_parrot:            { name: 'Pirate Parrot',xp: 2900, kind: 'pirateParrot' },
    fox_kit:                  { name: 'Fox Kit',      xp: 3100, kind: 'foxKit' },
    frog:                     { name: 'Frog',         xp: 3300, kind: 'frog' },

    // ---- Reptile Kingdom companion (Atlas Pass exclusive) ------------------
    // Awarded on the FREE track at Tier 5 (was previously 750 Bucks). bp_ prefix
    // keeps it out of the shop the same way every other bp_* item is gated.
    bp_companion_salamander:  { name: 'Salamander',   xp: 999999, bpOnly: true, kind: 'salamander' },

    // ---- Olympus Ascendant companion (Season 2 · Atlas Pass exclusive) -----
    // Athena's owl — wise little companion awarded on the FREE track at Tier 5.
    bp_companion_owl:         { name: "Athena's Owl",  xp: 999999, bpOnly: true, kind: 'owl' },
};

// ---- Companion colour variants (tints) -------------------------------------
// A FREE per-companion reskin (like size/position) — owning a companion lets the
// player flip its whole coat to an alternate palette in the shop, beside the
// size bar. Stored per-companion-id in `cosmetics.companionTints`; the equipped
// companion's tint id is read by Mascot and handed to renderCompanion().
//
// Each kind ships a `classic` palette (the authored colours, transcribed token
// for token from the renderer) plus a couple of alternates expressed as HSL
// transforms (`t`). Transforms recolour every coat token at once while
// preserving each token's relative lightness, so a 3-stop body gradient stays a
// coherent light→dark ramp in any colour. Fixed features (eyes, nose, outline
// `#1F1A3B`, white catchlights) live outside the palette and never change.
export const DEFAULT_TINT = 'classic';

const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    return [h, s, l];
};
const hslToHex = (h, s, l) => {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Recolour one hex via an HSL transform. `h` sets an absolute hue, `dh` rotates
// it; `sSet`/`sMul` set/scale saturation; `lAdd`/`lMul` shift/scale lightness.
function tintHex(hex, t) {
    if (!t) return hex;
    let [h, s, l] = rgbToHsl(...hexToRgb(hex));
    if (t.h != null) h = t.h;
    if (t.dh) h += t.dh;
    if (t.sSet != null) s = t.sSet;
    if (t.sMul != null) s *= t.sMul;
    if (t.lAdd != null) l += t.lAdd;
    if (t.lMul != null) l *= t.lMul;
    return hslToHex(h, clamp01(s), clamp01(l));
}

// Per-kind variants. Entry 0 (`classic`) carries the real palette `p`; the rest
// carry a transform `t` applied to the classic palette. `g0/g1/g2` are the main
// body gradient (light→mid→dark) and double as the picker swatch for every kind.
export const COMPANION_TINTS = {
    piglet: [
        { id: 'classic', name: 'Piglet Pink', p: { g0: '#FFDCE8', g1: '#FFB2CC', g2: '#F087AC', tail: '#EB8DB0', hind: '#EE8AAE', front: '#F59AB9', ear: '#F59AB9', snout: '#F58AAE', snoutHi: '#FFC4D7', blush: '#FF6F9E' } },
        { id: 'lavender', name: 'Lavender',  t: { dh: -50 } },
        { id: 'mint',     name: 'Mint',      t: { dh: -200 } },
    ],
    kitten: [
        { id: 'classic', name: 'Grey Tabby', p: { g0: '#DDE2E8', g1: '#AEB6C0', g2: '#7B8492', line: '#5B6470', chest: '#F2F5F8', paw: '#EAEEF2', earIn: '#EFF3F7' } },
        { id: 'ginger',  name: 'Ginger',     t: { h: 28, sSet: 0.55 } },
        { id: 'shadow',  name: 'Shadow',     t: { sMul: 0.45, lMul: 0.42 } },
    ],
    puppy: [
        { id: 'classic',  name: 'Chocolate', p: { g0: '#C9975E', g1: '#A06B38', g2: '#7E5226', belly: '#E4C49A', dark: '#6E4623' } },
        { id: 'golden',   name: 'Golden',    t: { dh: 8, sMul: 1.15, lAdd: 0.12 } },
        { id: 'charcoal', name: 'Charcoal',  t: { sMul: 0.25, lMul: 0.6 } },
    ],
    turtle: [
        { id: 'classic',  name: 'Leaf Green', p: { g0: '#8FD27A', g1: '#5BAE5B', g2: '#3C8A41', sk0: '#7FC36A', sk1: '#49934A', line: '#34803A', scute: '#6FBE63' } },
        { id: 'sapphire', name: 'Sapphire',   t: { dh: 85 } },
        { id: 'amethyst', name: 'Amethyst',   t: { dh: 160, sMul: 0.9 } },
    ],
    pirateParrot: [
        { id: 'classic', name: 'Green Macaw', p: { g0: '#3FD08C', g1: '#19A36B', g2: '#0E7E4F' } },
        { id: 'scarlet', name: 'Scarlet',     t: { dh: -135 } },
        { id: 'azure',   name: 'Azure',       t: { dh: 60 } },
    ],
    foxKit: [
        { id: 'classic', name: 'Red Fox', p: { g0: '#FFB07A', g1: '#F4873F', g2: '#D9692A', cream: '#FBF1E7', socks: '#352620' } },
        { id: 'arctic',  name: 'Arctic',  t: { sMul: 0.12, lAdd: 0.28 } },
        { id: 'silver',  name: 'Silver',  t: { sMul: 0.18, lMul: 0.82 } },
    ],
    frog: [
        { id: 'classic', name: 'Tree Green', p: { g0: '#86D178', g1: '#57AE52', g2: '#3A8A3E', feet: '#4C9C49', belly: '#CDEFB0' } },
        { id: 'cobalt',  name: 'Cobalt',     t: { dh: 100 } },
        { id: 'amber',   name: 'Amber',      t: { dh: -65, sMul: 1.1, lAdd: 0.05 } },
    ],
    salamander: [
        { id: 'classic', name: 'Fire Orange', p: { g0: '#FFB07A', g1: '#FF8A3F', g2: '#E2611F', spot: '#FFD24B' } },
        { id: 'axolotl', name: 'Axolotl',     t: { h: 335, sSet: 0.5, lAdd: 0.1 } },
        { id: 'cobalt',  name: 'Cobalt',      t: { dh: 185 } },
    ],
    owl: [
        { id: 'classic', name: 'Tawny',   p: { g0: '#D9B488', g1: '#A87C4E', g2: '#7A5430', belly: '#F3E4C8', face: '#EAD6B2', tuft: '#8A5E36' } },
        { id: 'snowy',   name: 'Snowy',   t: { sMul: 0.18, lAdd: 0.26 } },
        { id: 'dusk',    name: 'Dusk',    t: { dh: 200, sMul: 0.7 } },
    ],
};

// Resolve a kind+tint to a flat token map (classic palette, transformed by the
// variant when it isn't the classic one). Unknown kind/tint falls back safely.
export function companionPalette(kind, tintId) {
    const variants = COMPANION_TINTS[kind];
    if (!variants) return null;
    const base = variants[0].p;
    const variant = variants.find((v) => v.id === tintId) || variants[0];
    if (!variant.t) return base;
    const out = {};
    for (const [k, v] of Object.entries(base)) out[k] = tintHex(v, variant.t);
    return out;
}

// The three body-gradient stops for a kind+tint — used as the picker swatch.
export function companionTintSwatch(kind, tintId) {
    const p = companionPalette(kind, tintId);
    return p ? [p.g0, p.g1, p.g2] : ['#AEB6C0', '#8B93A0', '#6B7280'];
}

// The variants available for a given companion ID (empty for 'none'/unknown).
export function companionTintsFor(companionId) {
    const meta = COMPANIONS[companionId];
    return (meta && meta.kind && COMPANION_TINTS[meta.kind]) || [];
}

// The active tint id for the equipped companion (defaults to 'classic').
export function companionTintFor(cosmetics) {
    if (!cosmetics) return DEFAULT_TINT;
    const id = cosmetics.companion;
    if (!id || id === 'none') return DEFAULT_TINT;
    const t = cosmetics.companionTints && cosmetics.companionTints[id];
    const variants = companionTintsFor(id);
    return (t && variants.some((v) => v.id === t)) ? t : DEFAULT_TINT;
}

// Coerce a stored tint map to { [knownCompanionId]: validTintId }. Drops unknown
// companions, unknown tints, and the redundant 'classic' default.
export function normalizeCompanionTints(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [id, tintId] of Object.entries(raw)) {
        if (id === 'none' || typeof tintId !== 'string' || tintId === DEFAULT_TINT) continue;
        const variants = companionTintsFor(id);
        if (variants.some((v) => v.id === tintId)) out[id] = tintId;
    }
    return out;
}

export const CATEGORIES = [
    { key: 'color',     label: 'Globe Color', icon: 'palette',        items: COLORS },
    { key: 'hat',       label: 'Hats',        icon: 'theater_comedy', items: HATS },
    { key: 'glasses',   label: 'Glasses',     icon: 'eyeglasses',     items: GLASSES },
    { key: 'mouth',     label: 'Mouth',       icon: 'sentiment_satisfied', items: MOUTHS },
    { key: 'effect',    label: 'Effects',     icon: 'auto_awesome',   items: EFFECTS },
    { key: 'emote',     label: 'Emotes',      icon: 'sentiment_very_satisfied', items: EMOTES },
    { key: 'companion', label: 'Companion',   icon: 'pets',           items: COMPANIONS },
    { key: 'scene',     label: 'Scenes',      icon: 'landscape',      items: SCENES },
];

// Per-slot placement: x/y offset (in the 96-unit viewBox) and a scale `s`,
// applied as a transform in Mascot. Lets players nudge hats/glasses anywhere.
export const DEFAULT_POS = { x: 0, y: 0, s: 1 };
export const DEFAULT_COSMETICS = {
    color: 'teal', hat: 'none', glasses: 'none', mouth: 'none', effect: 'none',
    scene: 'default',
    // `emote` is the "currently equipped" single emote — kept for the cosmetic
    // shape to match other slots even though spectator reactions read from
    // `emoteLoadout` instead. Default loadout: wave in slot 0, rest empty.
    emote: 'none',
    emoteLoadout: ['wave', 'none', 'none', 'none'],
    // Companion: animal character standing beside Atlas. No companion by default.
    companion: 'none',
    // Per-companion display names ({ [companionId]: name }). Set when the player
    // buys a companion (they're prompted for a name) and shown beside Atlas on
    // leaderboards / the shop. Keyed by id so each owned companion keeps its own.
    companionNames: {},
    // Per-companion coat colour ({ [companionId]: tintId }). Absent / 'classic'
    // means the authored default palette. A free reskin like size/position.
    companionTints: {},
    hatPos: { ...DEFAULT_POS }, glassesPos: { ...DEFAULT_POS },
    mouthPos: { ...DEFAULT_POS }, effectPos: { ...DEFAULT_POS },
    companionPos: { ...DEFAULT_POS },
};

// Longest companion name we store / display.
export const COMPANION_NAME_MAX = 20;

const clampNum = (v, min, max, d) => (Number.isFinite(+v) ? Math.min(max, Math.max(min, +v)) : d);

// Clamp a stored placement to sane bounds so a cosmetic can't be dragged off
// the canvas or scaled into nonsense.
//
// Bounds are relative to each slot's anchor. Most cosmetics are anchored near
// the centre of the 96-unit viewBox, so a symmetric ±30/-38..28 window keeps
// them on Atlas's face. The COMPANION, however, is anchored at Atlas's foot
// (78, 86) in its renderer — a symmetric window would trap it in the
// lower-right quadrant. It gets a wider, asymmetric window (offset from (78,86)
// so the companion's centre can reach roughly -12..108 / -10..110) letting the
// player park it anywhere in — or just off — the whole viewspace.
export function clampPos(p, slot) {
    p = p || {};
    const isCompanion = slot === 'companion';
    return {
        x: clampNum(p.x, isCompanion ? -90 : -30, isCompanion ? 30 : 30, 0),
        y: clampNum(p.y, isCompanion ? -96 : -38, isCompanion ? 24 : 28, 0),
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
    color: 'teal', hat: 'none', glasses: 'none', mouth: 'none', effect: 'none',
    scene: 'default', emote: 'none', companion: 'none',
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
    const rawLoadout = c && Array.isArray(c.emoteLoadout) ? c.emoteLoadout : [];
    const loadout = Array(EMOTE_LOADOUT_SIZE).fill('none').map((_, i) => {
        const id = rawLoadout[i];
        if (typeof id !== 'string' || !EMOTES[id]) return 'none';
        return ok('emote', id) ? id : 'none';
    });
    return {
        color: pick('color', c && c.color, COLORS),
        hat: pick('hat', c && c.hat, HATS),
        glasses: pick('glasses', c && c.glasses, GLASSES),
        mouth: pick('mouth', c && c.mouth, MOUTHS),
        effect: pick('effect', c && c.effect, EFFECTS),
        scene: pick('scene', c && c.scene, SCENES),
        emote: pick('emote', c && c.emote, EMOTES),
        // Companion: animal character standing at Atlas's lower-right, behind
        // his silhouette on overlap. Has its own move/scale placement like the
        // other slots (companionPos).
        companion: pick('companion', c && c.companion, COMPANIONS),
        companionNames: normalizeCompanionNames(c && c.companionNames),
        companionTints: normalizeCompanionTints(c && c.companionTints),
        emoteLoadout: loadout,
        hatPos: clampPos(c && c.hatPos),
        glassesPos: clampPos(c && c.glassesPos),
        mouthPos: clampPos(c && c.mouthPos),
        effectPos: clampPos(c && c.effectPos),
        companionPos: clampPos(c && c.companionPos, 'companion'),
    };
}

// Coerce a stored companion-name map to { [knownCompanionId]: trimmedName }.
// Drops unknown ids, non-string values, and empty names; caps length.
export function normalizeCompanionNames(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [id, nm] of Object.entries(raw)) {
        if (!COMPANIONS[id] || id === 'none' || typeof nm !== 'string') continue;
        const t = nm.trim().slice(0, COMPANION_NAME_MAX);
        if (t) out[id] = t;
    }
    return out;
}

// The display name of the currently-equipped companion, or null when none is
// equipped / unnamed. Shared by the shop, leaderboard, and profile card.
export function companionNameFor(cosmetics) {
    if (!cosmetics) return null;
    const id = cosmetics.companion;
    if (!id || id === 'none') return null;
    const nm = cosmetics.companionNames && cosmetics.companionNames[id];
    return (typeof nm === 'string' && nm.trim()) ? nm.trim() : null;
}
