// One-shot helper: parse the vendored Wikimedia US-states SVG and emit a JS
// module of { [postalCode]: pathD } so the React US-map component can ship the
// geometry without a runtime fetch. Re-run only if the source SVG changes.
//
// Source: public/assets/us-map/states.svg
//   ("Blank_US_Map_(states_only).svg" — Wikimedia Commons, CC0 1.0)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'assets', 'us-map', 'states.svg');
const OUT = path.join(__dirname, '..', 'src', 'data', 'usStatesPaths.js');

const STATE_CODES = new Set([
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia',
  'ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj',
  'nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt',
  'va','wa','wv','wi','wy','dc',
]);

const svg = fs.readFileSync(SRC, 'utf8');
const pathRe = /<path[^>]*\bclass="([a-z]{2,3})"[^>]*\bd="([^"]+)"/g;
const out = {};
let m;
while ((m = pathRe.exec(svg)) !== null) {
  const cls = m[1];
  if (!STATE_CODES.has(cls)) continue;
  if (out[cls]) continue;
  out[cls] = m[2].trim();
}
const missing = [...STATE_CODES].filter((c) => !out[c]);
if (missing.length) {
  console.error('Missing state paths:', missing.join(','));
  process.exit(1);
}

const viewBoxMatch = svg.match(/<svg[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/);
const width = viewBoxMatch ? Number(viewBoxMatch[1]) : 959;
const height = viewBoxMatch ? Number(viewBoxMatch[2]) : 593;

// Also capture the AK/HI separator polyline so the inset boxes still read
// correctly when we render the cleaned-up map.
const sepMatch = svg.match(/<path class="separator1"[^>]*d="([^"]+)"/);
const separator = sepMatch ? sepMatch[1].trim() : '';

const lines = [];
lines.push('// AUTO-GENERATED — do not edit by hand. Re-run tools/extract_us_states_paths.js.');
lines.push('// Source: public/assets/us-map/states.svg (Wikimedia Commons, CC0 1.0)');
lines.push('');
lines.push(`export const US_MAP_VIEW_WIDTH = ${width};`);
lines.push(`export const US_MAP_VIEW_HEIGHT = ${height};`);
lines.push(`export const US_MAP_SEPARATOR_D = ${JSON.stringify(separator)};`);
lines.push('');
lines.push('export const US_STATE_PATHS = Object.freeze({');
for (const code of Object.keys(out).sort()) {
  lines.push(`  ${code}: ${JSON.stringify(out[code])},`);
}
lines.push('});');
lines.push('');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Wrote ${OUT} with ${Object.keys(out).length} state paths.`);
