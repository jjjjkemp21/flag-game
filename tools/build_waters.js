#!/usr/bin/env node
//
// build_waters.js — dev-only generator for public/data/waters.json
// ============================================================================
// Bodies-of-Water mode (a Globe-rendered multiple-choice quiz) needs geometry
// for famous oceans, seas, gulfs, lakes and rivers. Natural Earth's 50m vector
// data carries all of it, but the three source files total ~2.6 MB — far too
// heavy to fetch from a CDN on a Pi-served mobile app at runtime.
//
// So we pre-bake: fetch the 50m marine polys / lakes / river centerlines, keep
// ONLY a curated "large and/or famous" allowlist, merge multi-segment features
// (rivers are split into many local-language reaches), decimate the coordinates,
// and emit a compact public/data/waters.json the Globe loads from same-origin.
//
// Run (dev environment, has network): `node tools/build_waters.js`
// It is NOT part of the Docker build — public/data/waters.json is committed.
// ----------------------------------------------------------------------------
// Output schema (array of):
//   { id, name, type, kind: 'area'|'line', point: [lon,lat], polygons?, lines? }
//   - area features carry `polygons`: [ [ ring:[ [lon,lat],... ], ...holes ], ]
//   - line features carry `lines`:    [ [ [lon,lat],... ], ... ]
// ============================================================================

const fs = require('fs');
const path = require('path');

const BASE = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/';
const SRC = {
    marine: 'ne_50m_geography_marine_polys.geojson',
    lakes: 'ne_50m_lakes.geojson',
    rivers: 'ne_50m_rivers_lake_centerlines.geojson',
};
const COORD_PRECISION = 2; // ~1km — plenty for a world-scale globe

// Collapse whitespace, lowercase, normalise curly apostrophes so allowlist
// names match Natural Earth's raw `name` (which has double-spaces + ’).
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’`]/g, "'");

// ---- Curated allowlist -----------------------------------------------------
// Each entry: { id, name (display), type, match: [exact NE names to merge] }.
// `match` names are normalised before comparison, so double-spaces / case in
// the source don't matter. Multiple matches merge into one Multi* geometry.

const OCEANS = [
    { id: 'pacific-ocean',  name: 'Pacific Ocean',  type: 'ocean', match: ['North Pacific Ocean', 'South Pacific Ocean'] },
    { id: 'atlantic-ocean', name: 'Atlantic Ocean', type: 'ocean', match: ['North Atlantic Ocean', 'South Atlantic Ocean'] },
    { id: 'indian-ocean',   name: 'Indian Ocean',   type: 'ocean', match: ['Indian Ocean'] },
    { id: 'arctic-ocean',   name: 'Arctic Ocean',   type: 'ocean', match: ['Arctic Ocean'] },
    { id: 'southern-ocean', name: 'Southern Ocean', type: 'ocean', match: ['Southern Ocean'] },
];

const SEAS = [
    ['mediterranean-sea', 'Mediterranean Sea', ['Mediterranean Sea']],
    ['caribbean-sea', 'Caribbean Sea', ['Caribbean Sea']],
    ['black-sea', 'Black Sea', ['Black Sea']],
    ['red-sea', 'Red Sea', ['Red Sea']],
    ['caspian-sea', 'Caspian Sea', ['Caspian Sea']],
    ['baltic-sea', 'Baltic Sea', ['Baltic Sea']],
    ['north-sea', 'North Sea', ['North Sea']],
    ['arabian-sea', 'Arabian Sea', ['Arabian Sea']],
    ['south-china-sea', 'South China Sea', ['South China Sea']],
    ['east-china-sea', 'East China Sea', ['East China Sea']],
    ['sea-of-japan', 'Sea of Japan', ['Sea of Japan']],
    ['yellow-sea', 'Yellow Sea', ['Yellow Sea']],
    ['bering-sea', 'Bering Sea', ['Bering Sea']],
    ['coral-sea', 'Coral Sea', ['Coral Sea']],
    ['tasman-sea', 'Tasman Sea', ['Tasman Sea']],
    ['sea-of-okhotsk', 'Sea of Okhotsk', ['Sea of Okhotsk']],
    ['andaman-sea', 'Andaman Sea', ['Andaman Sea']],
    ['adriatic-sea', 'Adriatic Sea', ['Adriatic Sea']],
    ['aegean-sea', 'Aegean Sea', ['Aegean Sea']],
    ['norwegian-sea', 'Norwegian Sea', ['Norwegian Sea']],
    ['barents-sea', 'Barents Sea', ['Barents Sea']],
    ['kara-sea', 'Kara Sea', ['Kara Sea']],
    ['greenland-sea', 'Greenland Sea', ['Greenland Sea']],
    ['philippine-sea', 'Philippine Sea', ['Philippine Sea']],
    ['java-sea', 'Java Sea', ['Java Sea']],
    ['weddell-sea', 'Weddell Sea', ['Weddell Sea']],
    ['ross-sea', 'Ross Sea', ['Ross Sea']],
    ['irish-sea', 'Irish Sea', ['Irish Sea']],
    ['sargasso-sea', 'Sargasso Sea', ['Sargasso Sea']],
].map(([id, name, match]) => ({ id, name, type: 'sea', match }));

const GULFS = [
    ['gulf-of-mexico', 'Gulf of Mexico', ['Gulf of Mexico']],
    ['persian-gulf', 'Persian Gulf', ['Persian Gulf']],
    ['gulf-of-aden', 'Gulf of Aden', ['Gulf of Aden']],
    ['gulf-of-alaska', 'Gulf of Alaska', ['Gulf of Alaska']],
    ['gulf-of-guinea', 'Gulf of Guinea', ['Gulf of Guinea']],
    ['gulf-of-thailand', 'Gulf of Thailand', ['Gulf of Thailand']],
    ['gulf-of-oman', 'Gulf of Oman', ['Gulf of Oman']],
    ['gulf-of-california', 'Gulf of California', ['Golfo de California']],
    ['gulf-of-carpentaria', 'Gulf of Carpentaria', ['Gulf of Carpentaria']],
    ['gulf-of-finland', 'Gulf of Finland', ['Gulf of Finland']],
    ['hudson-bay', 'Hudson Bay', ['Hudson Bay']],
    ['baffin-bay', 'Baffin Bay', ['Baffin Bay']],
    ['bay-of-biscay', 'Bay of Biscay', ['Bay of Biscay']],
    ['bay-of-bengal', 'Bay of Bengal', ['Bay of Bengal']],
    ['chesapeake-bay', 'Chesapeake Bay', ['Chesapeake Bay']],
    ['great-australian-bight', 'Great Australian Bight', ['Great Australian Bight']],
].map(([id, name, match]) => ({ id, name, type: 'gulf', match }));

const STRAITS = [
    ['english-channel', 'English Channel', ['English Channel']],
    ['strait-of-gibraltar', 'Strait of Gibraltar', ['Strait of Gibraltar']],
    ['strait-of-malacca', 'Strait of Malacca', ['Strait of Malacca']],
    ['mozambique-channel', 'Mozambique Channel', ['Mozambique Channel']],
    ['korea-strait', 'Korea Strait', ['Korea Strait']],
    ['taiwan-strait', 'Taiwan Strait', ['Taiwan Strait']],
    ['davis-strait', 'Davis Strait', ['Davis Strait']],
].map(([id, name, match]) => ({ id, name, type: 'strait', match }));

const LAKES = [
    ['lake-superior', 'Lake Superior', ['Lake Superior']],
    ['lake-michigan', 'Lake Michigan', ['Lake Michigan']],
    ['lake-huron', 'Lake Huron', ['Lake Huron']],
    ['lake-erie', 'Lake Erie', ['Lake Erie']],
    ['lake-ontario', 'Lake Ontario', ['Lake Ontario']],
    ['lake-victoria', 'Lake Victoria', ['Lake Victoria']],
    ['lake-tanganyika', 'Lake Tanganyika', ['Lake Tanganyika']],
    ['lake-malawi', 'Lake Malawi', ['Lake Malawi']],
    ['lake-baikal', 'Lake Baikal', ['Lake Baikal']],
    ['great-bear-lake', 'Great Bear Lake', ['Great Bear Lake']],
    ['great-slave-lake', 'Great Slave Lake', ['Great Slave Lake']],
    ['lake-winnipeg', 'Lake Winnipeg', ['Lake Winnipeg']],
    ['lake-ladoga', 'Lake Ladoga', ['Lake Ladoga']],
    ['lake-onega', 'Lake Onega', ['Lake Onega']],
    ['lake-balkhash', 'Lake Balkhash', ['Lake Balkhash']],
    ['lake-titicaca', 'Lake Titicaca', ['Lago Titicaca']],
    ['lake-tahoe', 'Lake Tahoe', ['Lake Tahoe']],
    ['lake-geneva', 'Lake Geneva', ['Lake Geneva']],
    ['lake-chad', 'Lake Chad', ['Lake Chad']],
    ['lake-nicaragua', 'Lake Nicaragua', ['Lago de Nicaragua']],
    ['great-salt-lake', 'Great Salt Lake', ['Great Salt Lake']],
    ['lake-eyre', 'Lake Eyre', ['Lake Eyre North', 'Lake Eyre South']],
    ['dead-sea', 'Dead Sea', ['Dead Sea']],
    ['sea-of-galilee', 'Sea of Galilee', ['Sea of Galilee']],
    ['lake-turkana', 'Lake Turkana', ['Lake Turkana']],
    ['lake-nasser', 'Lake Nasser', ['Lake Nasser']],
    ['lake-volta', 'Lake Volta', ['Lake Volta']],
    ['lake-athabasca', 'Lake Athabasca', ['Lake Athabasca']],
    ['issyk-kul', 'Issyk-Kul', ['Issyk-Kul']],
    ['lake-van', 'Lake Van', ['Lake Van']],
    ['lake-tana', 'Lake Tana', ['Lake Tana']],
    ['tonle-sap', 'Tonlé Sap', ['Tonlé Sap']],
    ['lake-taupo', 'Lake Taupo', ['Lake Taupo']],
    ['aral-sea', 'Aral Sea', ['North Aral Sea', 'South Aral Sea']],
].map(([id, name, match]) => ({ id, name, type: 'lake', match }));

const RIVERS = [
    ['nile', 'Nile', ['Nile', 'Albert Nile', 'Victoria Nile', 'Bahr el Jebel', 'El Bahr el Abyad']],
    ['amazon', 'Amazon', ['Amazonas']],
    ['yangtze', 'Yangtze', ['Yangtze', 'Chang Jiang', 'Jinsha', 'Tongtian', 'Tuotuo']],
    ['mississippi', 'Mississippi', ['Mississippi']],
    ['missouri', 'Missouri', ['Missouri']],
    ['yenisei', 'Yenisei', ['Yenisey', 'Verkhniy Yenisey', 'Malyy Yenisey']],
    ['yellow-river', 'Yellow River', ['Huang']],
    ['ob', 'Ob', ['Ob']],
    ['congo', 'Congo', ['Congo', 'Lualaba']],
    ['amur', 'Amur', ['Amur', 'Heilong Jiang']],
    ['lena', 'Lena', ['Lena']],
    ['mekong', 'Mekong', ['Mekong', 'Lancang']],
    ['mackenzie', 'Mackenzie', ['Mackenzie']],
    ['niger', 'Niger', ['Niger']],
    ['murray', 'Murray', ['Murray']],
    ['volga', 'Volga', ['Volga']],
    ['danube', 'Danube', ['Danube', 'Donau']],
    ['ganges', 'Ganges', ['Ganges']],
    ['euphrates', 'Euphrates', ['Euphrates', 'Al Furat', 'Firat']],
    ['tigris', 'Tigris', ['Tigris', 'Dicle']],
    ['rhine', 'Rhine', ['Rhine', 'Rhein', 'Rhin']],
    ['rio-grande', 'Rio Grande', ['Rio Grande']],
    ['colorado-river', 'Colorado River', ['Colorado']],
    ['columbia-river', 'Columbia River', ['Columbia']],
    ['indus', 'Indus', ['Indus']],
    ['brahmaputra', 'Brahmaputra', ['Brahmaputra', 'Dihang', 'Yarlung']],
    ['zambezi', 'Zambezi', ['Zambezi']],
    ['parana', 'Paraná', ['Paraná']],
    ['orinoco', 'Orinoco', ['Orinoco']],
    ['sao-francisco', 'São Francisco', ['São Francisco']],
    ['yukon', 'Yukon', ['Yukon']],
    ['seine', 'Seine', ['Seine']],
    ['thames', 'Thames', ['Thames']],
    ['loire', 'Loire', ['Loire']],
    ['po-river', 'Po', ['Po']],
    ['don-river', 'Don', ['Don']],
    ['dnieper', 'Dnieper', ['Dnipro', 'Dnepre']],
    ['ural-river', 'Ural', ['Ural']],
    ['salween', 'Salween', ['Salween', 'Nu']],
    ['irrawaddy', 'Irrawaddy', ['Ayeyarwady', 'Irrawaddy Delta']],
    ['darling', 'Darling', ['Darling']],
    ['tocantins', 'Tocantins', ['Tocantins']],
    ['madeira-river', 'Madeira', ['Madeira']],
    ['st-lawrence', 'St. Lawrence', ['St. Lawrence']],
    ['vistula', 'Vistula', ['Vistula']],
    ['elbe', 'Elbe', ['Elbe']],
    ['syr-darya', 'Syr Darya', ['Syr Darya']],
    ['amu-darya', 'Amu Darya', ['Amu Darya']],
    ['limpopo', 'Limpopo', ['Limpopo']],
    ['orange-river', 'Orange River', ['Orange']],
].map(([id, name, match]) => ({ id, name, type: 'river', match }));

const ALLOW = {
    marine: [...OCEANS, ...SEAS, ...GULFS, ...STRAITS],
    lakes: LAKES,
    rivers: RIVERS,
};

const round = (n) => Math.round(n * 10 ** COORD_PRECISION) / 10 ** COORD_PRECISION;

// Decimate a ring/line: round coords, drop consecutive duplicates.
function decimate(coords) {
    const out = [];
    let prev = null;
    for (const c of coords) {
        if (!Array.isArray(c) || c.length < 2) continue;
        const p = [round(c[0]), round(c[1])];
        if (prev && p[0] === prev[0] && p[1] === prev[1]) continue;
        out.push(p);
        prev = p;
    }
    return out;
}

// Pull every [lon,lat] out of a geometry to compute a representative point.
function* eachCoord(geom) {
    if (!geom) return;
    const walk = (a) => {
        if (typeof a[0] === 'number') { yieldPoint(a); return; }
        for (const b of a) walk(b);
    };
    const pts = [];
    const yieldPoint = (p) => pts.push(p);
    const stack = [geom.coordinates];
    while (stack.length) {
        const a = stack.pop();
        if (typeof a[0] === 'number') pts.push(a);
        else for (const b of a) stack.push(b);
    }
    for (const p of pts) yield p;
}

function representativePoint(geom) {
    let sx = 0, sy = 0, n = 0;
    for (const [lon, lat] of eachCoord(geom)) { sx += lon; sy += lat; n++; }
    if (!n) return [0, 0];
    return [round(sx / n), round(sy / n)];
}

// Convert a merged GeoJSON geometry into our compact area/line shape.
function toAreaPolygons(geom) {
    const polys = [];
    const add = (polygon) => {
        const rings = [];
        for (const ring of polygon) {
            const d = decimate(ring);
            if (d.length >= 4) rings.push(d);
        }
        if (rings.length) polys.push(rings);
    };
    if (geom.type === 'Polygon') add(geom.coordinates);
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(add);
    return polys;
}

function toLines(geom) {
    const lines = [];
    const add = (line) => { const d = decimate(line); if (d.length >= 2) lines.push(d); };
    if (geom.type === 'LineString') add(geom.coordinates);
    else if (geom.type === 'MultiLineString') geom.coordinates.forEach(add);
    return lines;
}

// Merge the geometries of all matched features into one geometry of the right
// multi-type (so a river's reaches / a sea's basins become one body).
function mergeGeometries(feats) {
    const areaParts = [];   // each is a Polygon's coordinates ([ring,...])
    const lineParts = [];   // each is a LineString's coordinates
    for (const f of feats) {
        const g = f.geometry;
        if (!g) continue;
        if (g.type === 'Polygon') areaParts.push(g.coordinates);
        else if (g.type === 'MultiPolygon') areaParts.push(...g.coordinates);
        else if (g.type === 'LineString') lineParts.push(g.coordinates);
        else if (g.type === 'MultiLineString') lineParts.push(...g.coordinates);
    }
    if (areaParts.length) return { type: 'MultiPolygon', coordinates: areaParts };
    if (lineParts.length) return { type: 'MultiLineString', coordinates: lineParts };
    return null;
}

async function fetchSet(file) {
    const url = BASE + file;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`);
    const json = await res.json();
    return json.features || [];
}

function nameKeysOf(props) {
    return [props.name, props.NAME, props.name_en, props.namealt, props.name_alt]
        .filter(Boolean).map(norm);
}

(async () => {
    const out = [];
    const unmatched = [];

    for (const [setKey, file] of Object.entries(SRC)) {
        const feats = await fetchSet(file);
        // Index features by every normalised name they carry.
        const byName = new Map();
        for (const f of feats) {
            for (const k of nameKeysOf(f.properties || {})) {
                if (!byName.has(k)) byName.set(k, []);
                byName.get(k).push(f);
            }
        }
        for (const entry of ALLOW[setKey]) {
            const matched = [];
            const seen = new Set();
            for (const m of entry.match) {
                const hits = byName.get(norm(m)) || [];
                for (const f of hits) {
                    if (seen.has(f)) continue;
                    seen.add(f);
                    matched.push(f);
                }
            }
            if (!matched.length) { unmatched.push(entry.name); continue; }
            const merged = mergeGeometries(matched);
            if (!merged) { unmatched.push(entry.name + ' (no geom)'); continue; }
            const isLine = merged.type === 'MultiLineString';
            const rec = {
                id: entry.id,
                name: entry.name,
                type: entry.type,
                kind: isLine ? 'line' : 'area',
                point: representativePoint(merged),
            };
            if (isLine) rec.lines = toLines(merged);
            else rec.polygons = toAreaPolygons(merged);
            // Drop entries that decimated down to nothing.
            if ((rec.lines && rec.lines.length) || (rec.polygons && rec.polygons.length)) {
                out.push(rec);
            } else {
                unmatched.push(entry.name + ' (empty after decimate)');
            }
        }
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    const dataDir = path.join(__dirname, '..', 'public', 'data');
    const json = JSON.stringify(out);
    fs.writeFileSync(path.join(dataDir, 'waters.json'), json);

    // Lightweight catalog (no geometry): the waters store + home-screen mastery
    // badge load THIS so they never have to parse the heavy geometry file.
    const catalog = out.map(({ id, name, type }) => ({ id, name, type }));
    const catJson = JSON.stringify(catalog);
    fs.writeFileSync(path.join(dataDir, 'waters-catalog.json'), catJson);

    const byType = out.reduce((m, w) => { m[w.type] = (m[w.type] || 0) + 1; return m; }, {});
    console.log(`Wrote ${out.length} water bodies to public/data/waters.json (${(json.length / 1024).toFixed(0)} KB)`);
    console.log(`Wrote catalog to public/data/waters-catalog.json (${(catJson.length / 1024).toFixed(1)} KB)`);
    console.log('By type:', byType);
    if (unmatched.length) console.log(`\nUNMATCHED (${unmatched.length}):`, unmatched.join(' | '));
})().catch((e) => { console.error(e); process.exit(1); });
