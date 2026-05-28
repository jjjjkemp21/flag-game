import React from 'react';

// Seamlessly-tileable vertical beanstalk segment. Stacking N copies produces a
// continuous trunk because:
//
//   1. The trunk is ONE thick stem — a single S-curve from (100, 0) to
//      (100, 300). Both seam endpoints have vertical tangents (first/last
//      cubic control points sit on x=100), giving C1 continuity across tile
//      boundaries. The trunk gently wanders left around y=85 and right around
//      y=215, so over a stack of tiles it serpentines naturally without ever
//      doubling back on itself or forming a closed shape.
//   2. A much thinner twining helper-vine spirals around the trunk, broken
//      into four halves (S1..S4) so each half can be z-layered front-or-back
//      of the trunk independently. The helper crosses the trunk's centerline
//      at (100, 0), (85, 75), (100, 150), (115, 225) and (100, 300) — every
//      depth transition therefore happens INSIDE the trunk's 30-wide stroke,
//      where the swap is invisible. The helper is ~5× thinner than the trunk
//      so it reads as a subordinate climbing vine, never a twin strand.
//   3. Both trunk and helper meet at (100, 0/300) with vertical tangents, so
//      the seam stays clean even when alternate tiles render with `flip`
//      (CSS scaleX(-1)): the wander direction reverses each tile, producing
//      a continuous serpentine across the whole stack.
//   4. Decorative appendages (coiled tendrils, pod clusters, buds, leaflets)
//      emerge from nodes well clear of the seam (y≈40–260), so a tile join
//      shows only smooth stem geometry — no half-leaves or cut pods.
//   5. viewBox preserves aspect ratio "none" so each tile stretches to fill
//      its container's width; the road's width is set in CSS.
//
// Tiers (`tier` prop, 0..5) map directly to the XP Road's chest-yield
// progression. As the climber ascends the road, tiles transition from a
// humble sapling green at the bottom (tier 0) through emerald, jade-and-gold,
// frosted silver-sky, and finally mythic violet-and-gold at the cloud top
// (tier 5). Each tier swaps:
//   - palette (trunk strokes, helper vine, leaflets, background glow)
//   - pod-cluster variant (smooth pods → gilded → crystalline → faceted gems)
//   - centre-bud shape (none → gold bud → gold flower → ice crystal → star)
//   - extra ornaments (blossoms, frost specks, twinkling sparkles, aura)
// The trunk geometry never changes between tiers so the column-stacked tiles
// still seam cleanly even where adjacent tiles render at different tiers.

const TIERS = {
    // Sapling — humble pale shoot. Sparse, soft, almost translucent.
    0: {
        dark: '#3F7333', mid: '#6BB058', light: '#A6DE7E', tip: '#D8F1AE',
        highlight: '#EEFAD2', shadow: '#1F3A1A',
        accent: '#FFE891', accentDeep: '#FFCC4A', blossom: null,
        aura: 0.05, podVariant: 'plain',
        bud: false, extraTendril: false, blossoms: 0, sparkles: 0,
    },
    // Sprout — classic healthy beanstalk. The legacy look, tiers above add to.
    1: {
        dark: '#1F5A2A', mid: '#3FAA4F', light: '#7FE05B', tip: '#A8E060',
        highlight: '#D2F3A8', shadow: '#0F2A1A',
        accent: '#FFD86B', accentDeep: '#FFB838', blossom: null,
        aura: 0.10, podVariant: 'plain',
        bud: 'gold', extraTendril: true, blossoms: 0, sparkles: 0,
    },
    // Climber — rich emerald. Denser foliage, first white blossoms.
    2: {
        dark: '#125534', mid: '#2C9A5A', light: '#5EC885', tip: '#A0E5BD',
        highlight: '#DAF8E5', shadow: '#082A16',
        accent: '#FFD86B', accentDeep: '#F1A93A', blossom: '#FFFFFF',
        aura: 0.12, podVariant: 'plain',
        bud: 'gold', extraTendril: true, blossoms: 2, sparkles: 0,
    },
    // Vinekeeper — deep jade with gilded pods + rose blossoms.
    3: {
        dark: '#0E4536', mid: '#1B8E70', light: '#48C7A8', tip: '#A0E5D0',
        highlight: '#E2F8EF', shadow: '#062019',
        accent: '#FFC74A', accentDeep: '#E48A1A', blossom: '#F8B5C8',
        aura: 0.16, podVariant: 'gilded',
        bud: 'flower', extraTendril: true, blossoms: 3, sparkles: 0,
    },
    // Skyward — frosted teal-sky. Crystalline pods, icy bud, frost specks.
    4: {
        dark: '#0F4753', mid: '#2A95AE', light: '#6CCFE0', tip: '#B8E8F0',
        highlight: '#EBFAFD', shadow: '#06222A',
        accent: '#FFE9A0', accentDeep: '#FFC962', blossom: '#D6F2F8',
        aura: 0.22, podVariant: 'crystal',
        bud: 'crystal', extraTendril: true, blossoms: 3, sparkles: 4,
    },
    // Cloud Warden — mythic violet + gold. Gem pods, star bud, full aura.
    5: {
        dark: '#322266', mid: '#6F4DC4', light: '#B292FF', tip: '#E2CCFF',
        highlight: '#F8EEFF', shadow: '#150A30',
        accent: '#FFD24A', accentDeep: '#FF9F2E', blossom: '#FFB8E8',
        aura: 0.32, podVariant: 'gem',
        bud: 'star', extraTendril: true, blossoms: 3, sparkles: 6,
    },
};

// Single thick trunk centerline. Two cubics joined at (100, 150) with parallel
// control-point directions; vertical tangents at both seams.
const TRUNK_D = 'M 100 0 C 100 60, 60 90, 100 150 C 140 210, 100 240, 100 300';

// Helper-vine segments. S1+S3 bulge RIGHT; S2+S4 bulge LEFT. Each segment's
// tangent matches its neighbour at the shared endpoint (so the four halves
// form one smooth spiral), and S1/S4 have vertical tangents at the seams.
const HELP_S1 = 'M 100 0   C 100 25, 145 30,  85 75';
const HELP_S2 = 'M 85 75   C 25 120, 55 135,  100 150';
const HELP_S3 = 'M 100 150 C 145 165, 175 180, 115 225';
const HELP_S4 = 'M 115 225 C 55 270, 100 275, 100 300';

// 5-point star polygon — used by the mythic centre bud and by the
// star-shaped blossoms / leaf accents at the top of the road.
function starPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        pts.push(`${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`);
    }
    return pts.join(' ');
}

// Four concentric strokes give the trunk a 3D barrel: shadow, dark rim,
// mid body, soft left-lit highlight, and a slim bright specular stripe.
function Trunk({ P }) {
    return (
        <g>
            <path d={TRUNK_D} fill="none" stroke={P.shadow}    strokeWidth="34" strokeLinecap="round"
                opacity="0.18" transform="translate(2 4)" />
            <path d={TRUNK_D} fill="none" stroke={P.dark}      strokeWidth="30" strokeLinecap="round" />
            <path d={TRUNK_D} fill="none" stroke={P.mid}       strokeWidth="22" strokeLinecap="round" />
            <path d={TRUNK_D} fill="none" stroke={P.light}     strokeWidth="12" strokeLinecap="round"
                opacity="0.4" transform="translate(-4 0)" />
            <path d={TRUNK_D} fill="none" stroke={P.highlight} strokeWidth="3"  strokeLinecap="round"
                opacity="0.85" transform="translate(-5 0)" />
        </g>
    );
}

// One half of the helper twining vine — three thin concentric strokes so the
// helper also reads as a rounded stem (just much smaller than the trunk).
function HelperStroke({ d, P }) {
    return (
        <g>
            <path d={d} fill="none" stroke={P.dark}      strokeWidth="6"   strokeLinecap="round" />
            <path d={d} fill="none" stroke={P.mid}       strokeWidth="3.5" strokeLinecap="round" />
            <path d={d} fill="none" stroke={P.highlight} strokeWidth="0.9" strokeLinecap="round"
                opacity="0.7" transform="translate(-0.8 0)" />
        </g>
    );
}

// Almond-shaped micro leaflet — pointed (not an ellipse) with a central vein,
// echoing VineLeaf's silhouette so milestone leaves and tendril caps read as
// the same species. Used at tendril tips and as ambient scatter.
function Leaflet({ x, y, rot = 0, scale = 1, idLeaf, P }) {
    return (
        <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
            <path d="M 0 0 Q 7 -5 16 -2 Q 21 0 16 2 Q 7 5 0 0 Z"
                fill={`url(#${idLeaf})`} stroke={P.dark} strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M 0 0 L 16 0" stroke={P.dark} strokeWidth="0.55" opacity="0.55" fill="none" />
        </g>
    );
}

// Small visible swelling on the trunk where an offshoot emerges — without
// this the appendage looks glued onto the stem; with it the trunk appears to
// have a natural node bulge that produced the offshoot.
function Node({ x, y, r = 5, P }) {
    return <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill={P.dark} opacity="0.6" />;
}

// Coiled tendril emerging from a trunk node, tightening into a re-curled
// spiral (the "once-wrapped, now released" look), capped with a leaflet. The
// path's first point sits INSIDE the trunk's body so the join is hidden by
// the trunk's 30-wide outer stroke.
function Tendril({ nodeX, nodeY, d, tipX, tipY, tipRot, idLeaf, P }) {
    return (
        <g>
            <Node x={nodeX} y={nodeY} r={4.5} P={P} />
            <path d={d} fill="none" stroke={P.dark} strokeWidth="3.5" strokeLinecap="round" />
            <path d={d} fill="none" stroke={P.mid}  strokeWidth="2"   strokeLinecap="round" opacity="0.9" />
            <Leaflet x={tipX} y={tipY} rot={tipRot} scale={1} idLeaf={idLeaf} P={P} />
        </g>
    );
}

// Hanging cluster of three pods — silhouette shifts per tier:
//   plain    : elongated seed-pods (tiers 0–2)
//   gilded   : same shape but rimmed in gold with a gleaming dot (tier 3)
//   crystal  : faceted diamond crystals with a vertical highlight (tier 4)
//   gem      : five-sided cut gems with a bright facet + sparkle (tier 5)
function PodCluster({ x, y, mirror = false, idPod, P, variant }) {
    const f = mirror ? -1 : 1;
    const SLOTS = [[3, 13, -20], [8, 17, -34], [13, 13, -48]];

    if (variant === 'crystal') {
        return (
            <g transform={`translate(${x} ${y}) scale(${f} 1)`}>
                <path d="M 0 0 Q 2 2 4 5" stroke={P.dark} strokeWidth="1.2" strokeLinecap="round" fill="none" />
                {SLOTS.map(([cx, cy, rot], i) => (
                    <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
                        <path
                            d={`M ${cx} ${cy - 8} L ${cx + 3} ${cy} L ${cx} ${cy + 8} L ${cx - 3} ${cy} Z`}
                            fill={`url(#${idPod})`} stroke={P.dark} strokeWidth="0.9" strokeLinejoin="round"
                        />
                        <path d={`M ${cx - 1.4} ${cy - 5.5} L ${cx + 0.4} ${cy + 1}`}
                            stroke={P.highlight} strokeWidth="0.7" opacity="0.85" fill="none" />
                    </g>
                ))}
            </g>
        );
    }
    if (variant === 'gem') {
        return (
            <g transform={`translate(${x} ${y}) scale(${f} 1)`}>
                <path d="M 0 0 Q 2 2 4 5" stroke={P.dark} strokeWidth="1.2" strokeLinecap="round" fill="none" />
                {SLOTS.map(([cx, cy, rot], i) => (
                    <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
                        <path
                            d={`M ${cx} ${cy - 9} L ${cx + 3.5} ${cy - 3} L ${cx + 2.5} ${cy + 6} L ${cx - 2.5} ${cy + 6} L ${cx - 3.5} ${cy - 3} Z`}
                            fill={`url(#${idPod})`} stroke={P.accent} strokeWidth="1" strokeLinejoin="round"
                        />
                        <path d={`M ${cx - 3.5} ${cy - 3} L ${cx + 3.5} ${cy - 3}`}
                            stroke={P.highlight} strokeWidth="0.6" opacity="0.75" fill="none" />
                        <circle cx={cx - 1.3} cy={cy - 1.4} r="0.9" fill={P.highlight} opacity="0.95" />
                    </g>
                ))}
            </g>
        );
    }
    // 'plain' (tiers 0–2) and 'gilded' (tier 3) share the seed-pod shape.
    const podStroke = variant === 'gilded' ? P.accent : P.dark;
    const podStrokeW = variant === 'gilded' ? 1.2 : 0.9;
    return (
        <g transform={`translate(${x} ${y}) scale(${f} 1)`}>
            <path d="M 0 0 Q 2 2 4 5" stroke={P.dark} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="3"  cy="13" rx="3"   ry="9" fill={`url(#${idPod})`}
                stroke={podStroke} strokeWidth={podStrokeW} transform="rotate(-20 3 13)" />
            <ellipse cx="8"  cy="17" rx="3"   ry="9" fill={`url(#${idPod})`}
                stroke={podStroke} strokeWidth={podStrokeW} transform="rotate(-34 8 17)" />
            <ellipse cx="13" cy="13" rx="2.7" ry="8" fill={`url(#${idPod})`}
                stroke={podStroke} strokeWidth={podStrokeW} transform="rotate(-48 13 13)" />
            {variant === 'gilded' && (
                <circle cx="8" cy="17" r="1" fill={P.accent} opacity="0.95" />
            )}
        </g>
    );
}

// Centre-trunk feature at (100, 150). Shape escalates with tier:
//   tier 0 → bare node (the sapling has no ornament yet)
//   tier 1–2 → classic gold bud (a single gleaming circle)
//   tier 3 → gold flower with five petals
//   tier 4 → ice-blue crystal
//   tier 5 → mythic gold star with twinkles
function CentreBud({ P, t }) {
    const x = 100, y = 150;
    if (!P.bud) return <Node x={x} y={y} r={5} P={P} />;
    if (P.bud === 'star') {
        return (
            <g>
                <Node x={x} y={y} r={6} P={P} />
                <polygon points={starPoints(x - 0.5, y - 0.6, 5)}
                    fill={P.accent} stroke={P.dark} strokeWidth="0.7" strokeLinejoin="round" />
                <circle cx={x - 1.4} cy={y - 1.6} r="1" fill="#FFFFFF" opacity="0.95" />
                <circle cx={x + 7} cy={y - 5} r="0.7" fill="#FFFFFF" opacity="0.85" />
                <circle cx={x - 6} cy={y + 6} r="0.5" fill="#FFFFFF" opacity="0.75" />
            </g>
        );
    }
    if (P.bud === 'crystal') {
        return (
            <g>
                <Node x={x} y={y} r={5} P={P} />
                <path
                    d={`M ${x} ${y - 5} L ${x + 3.4} ${y} L ${x} ${y + 5} L ${x - 3.4} ${y} Z`}
                    fill={P.accent} stroke={P.dark} strokeWidth="0.9" strokeLinejoin="round"
                />
                <path d={`M ${x} ${y - 5} L ${x} ${y + 5}`}
                    stroke="#FFFFFF" strokeWidth="0.55" opacity="0.85" />
                <path d={`M ${x - 3.4} ${y} L ${x + 3.4} ${y}`}
                    stroke="#FFFFFF" strokeWidth="0.4" opacity="0.55" />
            </g>
        );
    }
    if (P.bud === 'flower') {
        return (
            <g>
                <Node x={x} y={y} r={6} P={P} />
                {[0, 72, 144, 216, 288].map((rot) => (
                    <ellipse key={rot} cx={x} cy={y - 3.6} rx="1.7" ry="2.8"
                        fill={P.accent} stroke={P.dark} strokeWidth="0.55"
                        transform={`rotate(${rot} ${x} ${y})`} opacity="0.95" />
                ))}
                <circle cx={x} cy={y} r="1.7" fill={P.accentDeep} stroke={P.dark} strokeWidth="0.5" />
            </g>
        );
    }
    // 'gold' bud — classic single gleaming circle (tiers 1–2)
    return (
        <g>
            <Node x={x} y={y} r={5} P={P} />
            <circle cx={x - 0.5} cy={y - 0.6} r="3" fill={P.accent}
                stroke={P.dark} strokeWidth="0.9" />
            <circle cx={x - 1.5} cy={y - 1.6} r="1" fill="#FFF1B8" opacity="0.9" />
        </g>
    );
}

// Six-petal blossom (tiers 2–4) or a five-point star (tier 5). Petal/star
// colour comes from the tier palette so the trio of blossoms scattered around
// the trunk shifts hue with progression.
function Blossom({ x, y, color, P, kind = 'flower' }) {
    if (kind === 'star') {
        return (
            <g>
                <polygon points={starPoints(x, y, 3.2)}
                    fill={color} stroke={P.dark} strokeWidth="0.55" strokeLinejoin="round" />
                <circle cx={x} cy={y} r="0.9" fill={P.accent} opacity="0.95" />
            </g>
        );
    }
    return (
        <g transform={`translate(${x} ${y})`}>
            {[0, 60, 120, 180, 240, 300].map((rot) => (
                <ellipse key={rot} cx="0" cy="-2.4" rx="1.3" ry="2.1"
                    fill={color} stroke={P.dark} strokeWidth="0.45"
                    transform={`rotate(${rot})`} opacity="0.95" />
            ))}
            <circle cx="0" cy="0" r="1.2" fill={P.accent} stroke={P.dark} strokeWidth="0.4" />
        </g>
    );
}

// Twinkling speck — small bright disc with a four-point cross-shimmer. Used
// at tier 4 (frost specks, static) and tier 5 (mythic sparkles, animated).
function Sparkle({ x, y, r = 1.5, color = '#FFFFFF', animated = false }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r * 0.55} fill={color} opacity="0.95">
                {animated && (
                    <animate attributeName="opacity"
                        values="0.3;1;0.3" dur="2.8s" repeatCount="indefinite" />
                )}
            </circle>
            <path d={`M ${x - r} ${y} L ${x + r} ${y} M ${x} ${y - r} L ${x} ${y + r}`}
                stroke={color} strokeWidth="0.45" opacity="0.7">
                {animated && (
                    <animate attributeName="opacity"
                        values="0.15;0.85;0.15" dur="2.8s" repeatCount="indefinite" />
                )}
            </path>
        </g>
    );
}

// Fixed blossom anchors used as tiers ramp up — the first N entries are
// rendered so density grows smoothly with the tier.
const BLOSSOM_SPOTS = [
    { x: 58,  y: 44  },
    { x: 152, y: 196 },
    { x: 46,  y: 158 },
];

// Fixed sparkle anchors for tier 4 (frost) and tier 5 (mythic twinkle).
const SPARKLE_SPOTS = [
    { x: 56,  y: 64,  r: 1.6 },
    { x: 148, y: 108, r: 1.4 },
    { x: 64,  y: 196, r: 1.5 },
    { x: 146, y: 256, r: 1.3 },
    { x: 28,  y: 245, r: 1.3 },
    { x: 174, y: 168, r: 1.2 },
];

export default function VineSegment({ flip = false, tier = 1 }) {
    const t = Math.max(0, Math.min(5, Math.floor(Number(tier) || 0)));
    const P = TIERS[t];

    // Gradient IDs are document-global, so suffix every defs reference with the
    // tier number. Two tiles at the same tier safely share gradients (identical
    // definitions); tiles at different tiers each get their own colour ramp.
    const idPod   = `xprPodG_t${t}`;
    const idLeaf  = `xprMiniLeafG_t${t}`;
    const idBg    = `xprBgGlow_t${t}`;
    const idAura  = `xprAura_t${t}`;
    const blossomKind = t >= 5 ? 'star' : 'flower';
    const blossomColor = P.blossom || P.accent;

    return (
        <svg
            className={`xpr-vine-seg xpr-vine-seg--t${t} ${flip ? 'is-flipped' : ''}`}
            viewBox="0 0 200 300"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id={idPod} cx="40%" cy="35%" r="80%">
                    {P.podVariant === 'crystal' ? (
                        <>
                            <stop offset="0%"   stopColor={P.highlight} />
                            <stop offset="55%"  stopColor={P.light} />
                            <stop offset="100%" stopColor={P.mid} />
                        </>
                    ) : P.podVariant === 'gem' ? (
                        <>
                            <stop offset="0%"   stopColor={P.tip} />
                            <stop offset="55%"  stopColor={P.light} />
                            <stop offset="100%" stopColor={P.dark} />
                        </>
                    ) : (
                        <>
                            <stop offset="0%"   stopColor={P.tip} />
                            <stop offset="100%" stopColor={P.dark} />
                        </>
                    )}
                </radialGradient>
                <radialGradient id={idLeaf} cx="28%" cy="30%" r="85%">
                    <stop offset="0%"   stopColor={P.highlight} />
                    <stop offset="55%"  stopColor={P.mid} />
                    <stop offset="100%" stopColor={P.dark} />
                </radialGradient>
                <radialGradient id={idBg} cx="50%" cy="50%" r="60%">
                    <stop offset="0%"   stopColor={P.light} stopOpacity={P.aura} />
                    <stop offset="100%" stopColor={P.light} stopOpacity="0" />
                </radialGradient>
                {t >= 5 && (
                    <radialGradient id={idAura} cx="50%" cy="50%" r="55%">
                        <stop offset="0%"   stopColor={P.tip}   stopOpacity="0.30" />
                        <stop offset="55%"  stopColor={P.light} stopOpacity="0.14" />
                        <stop offset="100%" stopColor={P.light} stopOpacity="0" />
                    </radialGradient>
                )}
            </defs>

            {/* Faint tier-tinted background glow so the trunk doesn't sit on
                flat sky. Tier 5 adds a taller mythic aura column. */}
            <ellipse cx="100" cy="150" rx="120" ry="100" fill={`url(#${idBg})`} />
            {t >= 5 && (
                <ellipse cx="100" cy="150" rx="80" ry="220" fill={`url(#${idAura})`} />
            )}

            {/* Helper twining vine — BACK halves first (left-bulging). Drawn
                before the trunk so the trunk's body paints over them where
                they cross the centerline. */}
            <HelperStroke d={HELP_S2} P={P} />
            <HelperStroke d={HELP_S4} P={P} />

            {/* === The beanstalk: ONE thick fat trunk ====================== */}
            <Trunk P={P} />

            {/* Helper twining vine — FRONT halves (right-bulging). Drawn AFTER
                the trunk so they paint over it at the crossings, giving the
                clear over-and-under wrap of a real climbing vine. */}
            <HelperStroke d={HELP_S1} P={P} />
            <HelperStroke d={HELP_S3} P={P} />

            {/* === Appendages, all growing from nodes on the trunk ========== */}

            {/* Upper-left: tendril + pod cluster emerging from the trunk's
                left-bulge node. Tendril coils outward then re-curls. */}
            <Tendril
                nodeX={84} nodeY={78}
                d="M 84 78 C 64 70, 42 64, 30 52 C 20 42, 24 28, 36 30 C 46 32, 46 44, 38 44 C 32 44, 32 38, 36 38"
                tipX={36} tipY={38} tipRot={-115}
                idLeaf={idLeaf} P={P}
            />
            <PodCluster x={68} y={86} mirror idPod={idPod} P={P} variant={P.podVariant} />

            {/* Centre-trunk feature — shape escalates with tier. */}
            <CentreBud P={P} t={t} />

            {/* Lower-right: tendril + pod cluster off the trunk's right-bulge. */}
            <Tendril
                nodeX={116} nodeY={222}
                d="M 116 222 C 136 230, 158 236, 170 248 C 180 258, 176 272, 164 270 C 154 268, 154 256, 162 256 C 168 256, 168 262, 164 262"
                tipX={164} tipY={262} tipRot={75}
                idLeaf={idLeaf} P={P}
            />
            <PodCluster x={132} y={230} idPod={idPod} P={P} variant={P.podVariant} />

            {/* A smaller tendril mid-trunk, breaking the symmetry between the
                top and bottom halves so the eye doesn't catch the repeat. The
                sapling (tier 0) skips this to keep its silhouette sparse. */}
            {P.extraTendril && (
                <Tendril
                    nodeX={82} nodeY={120}
                    d="M 82 120 C 66 124, 50 128, 42 138 C 36 146, 42 156, 50 152 C 56 149, 54 142, 50 144"
                    tipX={50} tipY={144} tipRot={-70}
                    idLeaf={idLeaf} P={P}
                />
            )}

            {/* Blossoms scattered around the trunk — count + colour ramp up
                by tier; the top tier swaps petals for tiny stars. */}
            {BLOSSOM_SPOTS.slice(0, P.blossoms).map((b, i) => (
                <Blossom key={`bl-${i}`} x={b.x} y={b.y}
                    color={blossomColor} P={P} kind={blossomKind} />
            ))}

            {/* Ambient leaflets in the corners so the negative space isn't
                empty without competing with milestone plaques. Higher tiers
                add a couple more to fill out the foliage. */}
            <Leaflet x={32}  y={170} rot={-140} scale={0.7}  idLeaf={idLeaf} P={P} />
            <Leaflet x={168} y={68}  rot={-30}  scale={0.7}  idLeaf={idLeaf} P={P} />
            {t >= 2 && <Leaflet x={170} y={188} rot={-15}  scale={0.6}  idLeaf={idLeaf} P={P} />}
            {t >= 3 && <Leaflet x={22}  y={92}  rot={-160} scale={0.55} idLeaf={idLeaf} P={P} />}

            {/* Tier 4 frost specks (static) / tier 5 mythic twinkle (SMIL). */}
            {P.sparkles > 0 && SPARKLE_SPOTS.slice(0, P.sparkles).map((s, i) => (
                <Sparkle key={`sp-${i}`} x={s.x} y={s.y} r={s.r}
                    color={t >= 5 ? P.accent : '#FFFFFF'}
                    animated={t >= 5} />
            ))}
        </svg>
    );
}
