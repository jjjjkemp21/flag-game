import React, { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAudio } from '../audio/AudioProvider';
import { useAuth } from '../auth/AuthProvider';
import { useProfile } from '../lib/profile';
import { usePet } from '../lib/pet';
import { useXpRoad, loadXpRoad } from '../lib/xpRoad';
import { computeXp } from '../lib/xp';
import {
    XP_ROAD_MILESTONES,
    XP_ROAD_MAX_XP,
    chestTierFromXp,
    nextMilestoneIndex,
    reachedCount,
} from '../lib/xpRoadCatalog';
import Mascot from '../assets/illustrations/Mascot';
import { springs } from '../motion';

// Hero card on the main menu announcing the XP Road. Same shape as the Atlas
// Pass card (mode-card--xl) so it slots into the same hero-row layout; the art
// is bespoke vine + climbing-mascot rather than the Reptile emblem.

// One perch leaf — exactly the same shape/veins as the regular leaves but
// rendered at a precise SVG position so a foreignObject Mascot can sit on top
// of it. Drawn AFTER the regular leaves so it sits on top where they overlap.
function PerchLeaf({ x, y, rot, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
            <path d="M 0 0 L -7 0" stroke="#1F5A2A" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 0 0 Q 10 -12 24 -7 Q 32 0 24 7 Q 10 12 0 0 Z"
                fill="url(#xprLeafG)" stroke="#1F5A2A" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 0 0 L 26 0" stroke="#1F5A2A" strokeWidth="0.8" opacity="0.55" fill="none" />
            <path d="M 6 -1 Q 9 -5 13 -6" stroke="#1F5A2A" strokeWidth="0.6" opacity="0.55" fill="none" />
            <path d="M 13 -1 Q 16 -4 19 -4" stroke="#1F5A2A" strokeWidth="0.6" opacity="0.5"  fill="none" />
            <path d="M 6 1  Q 9 5  13 6"  stroke="#1F5A2A" strokeWidth="0.6" opacity="0.55" fill="none" />
            <path d="M 13 1  Q 16 4  19 4"  stroke="#1F5A2A" strokeWidth="0.6" opacity="0.5"  fill="none" />
        </g>
    );
}

// One climber — a real <Mascot> rendered inside a foreignObject so it shares
// the parent SVG's slice/scale behaviour. Sized + positioned so the mascot's
// belly rests on its perch leaf. `nameTag` is an optional friend username
// shown below as a tiny ribbon.
function ClimberMascot({ x, y, size, cosmetics, mood = 'idle', still = false, nameTag = null }) {
    return (
        <foreignObject x={x} y={y} width={size} height={size + (nameTag ? 14 : 0)} style={{ overflow: 'visible' }}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: size, textAlign: 'center', pointerEvents: 'none' }}>
                <Mascot size={size} cosmetics={cosmetics || {}} mood={mood} still={still} />
                {nameTag && (
                    <div style={{
                        marginTop: -2,
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: 'rgba(31, 90, 42, 0.92)',
                        color: '#FFFDF7',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 9,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                    }}>
                        {nameTag}
                    </div>
                )}
            </div>
        </foreignObject>
    );
}

// Sky-themed emblem: drifting clouds + sun + an organic beanstalk climbing
// up the right side of the card, with the player's Atlas + top-2 friends each
// perched on a leaf. The card background gradient is sky-blue, so the art has
// no fade mask and instead keeps cloud opacity low enough that copy on the
// left still reads. Climbers are embedded as <foreignObject> so they
// slice/scale with the rest of the SVG content.
//
// Composition: player Atlas anchors the middle on the LEFT side of the stalk
// at the largest size (it's "you"), with the two friends flanking on the
// RIGHT — one near the top and one near the bottom. The trio forms a triangle
// around the stalk so they read as climbing companions rather than a stacked
// vertical column.
function VineEmblem({ player, friends }) {
    const [friend1, friend2] = friends || [];

    // Shared stalk geometry — a single gentle S-curve climbing from the
    // bottom-right to the top. Used by the shadow, outer dark stroke,
    // gradient body, and highlight passes so they all trace exactly the
    // same path (otherwise edges visibly diverge at the bends).
    const STALK_D = "M 205 215 C 215 175 195 138 210 102 C 222 66 198 30 207 -10";
    // Companion vine — same start/end points as the main stalk but bulges
    // to the OPPOSITE side at each bend, so the two strands clearly cross
    // each other twice on their way up (the classic twisted-beanstalk look).
    const TWIN_D  = "M 205 215 C 195 175 220 138 200 102 C 188 66 215 30 207 -10";

    return (
        <svg
            className="bp-card__art"
            viewBox="0 0 280 200"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="xprCloudG" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#E6EEF6" stopOpacity="0.7" />
                </radialGradient>
                <radialGradient id="xprSunG" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFF7D6" />
                    <stop offset="65%" stopColor="#FFD86B" />
                    <stop offset="100%" stopColor="#FFB845" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="xprStemG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1F5A2A" />
                    <stop offset="45%" stopColor="#5FBF55" />
                    <stop offset="100%" stopColor="#1F5A2A" />
                </linearGradient>
                <radialGradient id="xprLeafG" cx="28%" cy="30%" r="85%">
                    <stop offset="0%" stopColor="#D2F3A8" />
                    <stop offset="55%" stopColor="#5FBF55" />
                    <stop offset="100%" stopColor="#1F5A2A" />
                </radialGradient>
                <radialGradient id="xprPodG" cx="40%" cy="35%" r="80%">
                    <stop offset="0%" stopColor="#A8E060" />
                    <stop offset="100%" stopColor="#2F7D3F" />
                </radialGradient>

                {/* Fluffy cloud — base anchored at the symbol origin */}
                <symbol id="xprCloud" overflow="visible">
                    <ellipse cx="0"   cy="0"  rx="20" ry="11" fill="url(#xprCloudG)" />
                    <ellipse cx="-16" cy="2"  rx="13" ry="8"  fill="url(#xprCloudG)" />
                    <ellipse cx="16"  cy="3"  rx="12" ry="8"  fill="url(#xprCloudG)" />
                    <ellipse cx="-4"  cy="-6" rx="11" ry="7"  fill="url(#xprCloudG)" />
                    <ellipse cx="9"   cy="-5" rx="9"  ry="6"  fill="url(#xprCloudG)" />
                </symbol>
            </defs>

            {/* Soft sun in the top-right corner */}
            <circle cx="252" cy="32" r="34" fill="url(#xprSunG)" />
            <circle cx="252" cy="32" r="12" fill="#FFF2B8" opacity="0.95" />

            {/* Drifting clouds — four layers at different speeds and depths.
                Each travels left→right across the full width plus padding so
                they fade in/out at the edges of the viewBox via overflow. */}
            <g opacity="0.92">
                <g>
                    <use href="#xprCloud" />
                    <animateTransform attributeName="transform" type="translate"
                        from="-60 38" to="340 38" dur="26s" repeatCount="indefinite" />
                </g>
                <g>
                    <use href="#xprCloud" transform="scale(0.7)" />
                    <animateTransform attributeName="transform" type="translate"
                        from="-50 92" to="340 92" dur="38s" repeatCount="indefinite" />
                </g>
                <g>
                    <use href="#xprCloud" transform="scale(0.85)" />
                    <animateTransform attributeName="transform" type="translate"
                        from="-90 150" to="340 150" dur="32s" repeatCount="indefinite" />
                </g>
                <g>
                    <use href="#xprCloud" transform="scale(0.55)" />
                    <animateTransform attributeName="transform" type="translate"
                        from="-30 14" to="340 14" dur="44s" repeatCount="indefinite" />
                </g>
            </g>

            {/* Beanstalk — a main stem and a companion vine that clearly
                twist around each other. The companion is drawn FIRST so it
                reads as behind the main stem at every crossing, then the
                main stem (shadow → outer → gradient body → highlight) is
                drawn on top. */}
            <g>
                {/* Companion vine — sits behind the main stem at every cross */}
                <path
                    d={TWIN_D}
                    fill="none" stroke="#1F5A2A" strokeWidth="5" strokeLinecap="round"
                />
                <path
                    d={TWIN_D}
                    fill="none" stroke="#3E9544" strokeWidth="3" strokeLinecap="round"
                />

                {/* Soft drop shadow under the main stem */}
                <path
                    d={STALK_D}
                    fill="none" stroke="#0F2A1A" strokeWidth="13" strokeLinecap="round"
                    opacity="0.18" transform="translate(2 3)"
                />
                {/* Outer dark stroke */}
                <path
                    d={STALK_D}
                    fill="none" stroke="#1F5A2A" strokeWidth="11" strokeLinecap="round"
                />
                {/* Inner gradient body */}
                <path
                    d={STALK_D}
                    fill="none" stroke="url(#xprStemG)" strokeWidth="7" strokeLinecap="round"
                />
                {/* Highlight strand on the left side of the stalk */}
                <path
                    d={STALK_D}
                    fill="none" stroke="#D2F3A8" strokeWidth="1.6" strokeLinecap="round"
                    opacity="0.7" transform="translate(-2 0)"
                />

                {/* Curling tendrils — small flourishes at three heights, each
                    on the side opposite to whichever climber sits there. */}
                <path d="M 196 158 Q 180 152 176 140 Q 176 132 184 132 Q 190 132 188 140"
                    fill="none" stroke="#2F7D3F" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 224 76 Q 240 70 244 60 Q 244 52 236 52 Q 230 52 232 60"
                    fill="none" stroke="#2F7D3F" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 198 14 Q 184 10 180 0"
                    fill="none" stroke="#2F7D3F" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Decorative leaves on BOTH sides of the stalk so the vine reads
                as a real climbing plant, not a half-dressed pole. Negative
                rotations point left from the stalk, positive rotations point
                right. */}
            {[
                // Left-side leaves
                { x: 200, y: 198, rot: -120, sz: 1.0  },
                { x: 196, y: 152, rot: -110, sz: 0.85 },
                { x: 200, y: 70,  rot: -100, sz: 0.75 },
                { x: 204, y: 20,  rot: -100, sz: 0.55 },
                // Right-side leaves
                { x: 214, y: 182, rot:  55,  sz: 0.95 },
                { x: 218, y: 122, rot:  65,  sz: 0.85 },
                { x: 222, y: 88,  rot:  60,  sz: 0.7  },
                { x: 214, y: 6,   rot:  50,  sz: 0.55 },
            ].map((leaf, i) => (
                <g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rot}) scale(${leaf.sz})`}>
                    {/* Short stem */}
                    <path d="M 0 0 L -7 0" stroke="#1F5A2A" strokeWidth="1.6" strokeLinecap="round" />
                    {/* Leaf body — pointed at the tip */}
                    <path d="M 0 0 Q 10 -12 24 -7 Q 32 0 24 7 Q 10 12 0 0 Z"
                        fill="url(#xprLeafG)" stroke="#1F5A2A" strokeWidth="1.4" strokeLinejoin="round" />
                    {/* Central vein */}
                    <path d="M 0 0 L 26 0" stroke="#1F5A2A" strokeWidth="0.8" opacity="0.55" fill="none" />
                    {/* Side veins (upper) */}
                    <path d="M 6 -1 Q 9 -5 13 -6" stroke="#1F5A2A" strokeWidth="0.6" opacity="0.55" fill="none" />
                    <path d="M 13 -1 Q 16 -4 19 -4" stroke="#1F5A2A" strokeWidth="0.6" opacity="0.5" fill="none" />
                    {/* Side veins (lower) */}
                    <path d="M 6 1 Q 9 5 13 6" stroke="#1F5A2A" strokeWidth="0.6" opacity="0.55" fill="none" />
                    <path d="M 13 1 Q 16 4 19 4" stroke="#1F5A2A" strokeWidth="0.6" opacity="0.5" fill="none" />
                </g>
            ))}

            {/* Bean pods — two clusters hanging from the stalk */}
            <g>
                <ellipse cx="196" cy="118" rx="3" ry="9" fill="url(#xprPodG)" stroke="#1F5A2A" strokeWidth="0.9"
                    transform="rotate(-22 196 118)" />
                <ellipse cx="201" cy="122" rx="3" ry="9" fill="url(#xprPodG)" stroke="#1F5A2A" strokeWidth="0.9"
                    transform="rotate(-32 201 122)" />
            </g>
            <g>
                <ellipse cx="228" cy="46" rx="3" ry="9" fill="url(#xprPodG)" stroke="#1F5A2A" strokeWidth="0.9"
                    transform="rotate(24 228 46)" />
                <ellipse cx="233" cy="44" rx="3" ry="9" fill="url(#xprPodG)" stroke="#1F5A2A" strokeWidth="0.9"
                    transform="rotate(36 233 44)" />
            </g>

            {/* Perch leaves — broader, more horizontal leaves placed exactly
                where each climber sits. Drawn AFTER the decorative leaves so
                they overlap cleanly. Each climber's foreignObject is sized
                so the mascot's body bottom (~85% of the box) lands on the
                perch surface. The three perches point in alternating
                directions so the climbers fan out around the stalk. */}
            {/* Player perch — LEFT side, middle of the stalk */}
            <PerchLeaf x={206} y={112} rot={180} scale={1.5} />
            {/* Friend 2 perch — RIGHT side, near the bottom */}
            <PerchLeaf x={215} y={170} rot={8}   scale={1.15} />
            {/* Friend 1 perch — RIGHT side, near the top */}
            <PerchLeaf x={213} y={42}  rot={10}  scale={1.0}  />

            {/* Player Atlas — the biggest of the three (it's you), perched
                on the central LEFT leaf. Real Mascot SVG so cosmetics +
                effects render identically to everywhere else they appear. */}
            <ClimberMascot
                x={168} y={80} size={38}
                cosmetics={player?.cosmetics}
                mood={player?.mood || 'idle'}
                still
            />

            {/* Friend 1 — perched on the upper-RIGHT leaf, smaller (feels
                "further up the climb" relative to the player). */}
            {friend1 && (
                <ClimberMascot
                    x={222} y={20} size={26}
                    cosmetics={friend1.cosmetics}
                    still
                />
            )}

            {/* Friend 2 — perched on the lower-RIGHT leaf, smaller (feels
                "lower on the climb" relative to the player). Together with
                the player and friend 1, the three form a triangle around the
                stalk instead of a stacked column. */}
            {friend2 && (
                <ClimberMascot
                    x={222} y={150} size={24}
                    cosmetics={friend2.cosmetics}
                    still
                />
            )}
        </svg>
    );
}

export default function XpRoadCard({ onClick, index = 0 }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    const { isAuthed } = useAuth();
    const profile = useProfile();
    const pet = usePet();
    const xpRoad = useXpRoad();

    // Friends data is loaded lazily on the XP Road screen. On the menu card
    // we trigger the same fetch so the climbers populate without waiting for
    // the user to open the screen. The lib already debounces re-loads.
    useEffect(() => {
        if (isAuthed && (!xpRoad.friends || xpRoad.friends.length === 0)) {
            loadXpRoad();
        }
    }, [isAuthed, xpRoad.friends]);

    // Top-2 friends by XP — these are the climbers shown above the player.
    // If the player hasn't added any friends yet (or the list hasn't loaded),
    // we still want the scene to feel populated, so two cheerful made-up
    // climbers fill the empty perches with simple cosmetics.
    const topFriends = useMemo(() => {
        const list = Array.isArray(xpRoad.friends) ? xpRoad.friends.slice() : [];
        list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        if (list.length >= 2) return list.slice(0, 2);
        const fallback = [
            { id: '__fake_pip',     username: 'Pip',     xp: 0, cosmetics: { color: 'sunset', hat: 'party_red',  glasses: 'round_black' } },
            { id: '__fake_bramble', username: 'Bramble', xp: 0, cosmetics: { color: 'forest', hat: 'cap_green' } },
        ];
        return [...list, ...fallback].slice(0, 2);
    }, [xpRoad.friends]);

    const xp = computeXp();
    const reached = reachedCount(xp);
    const total = XP_ROAD_MILESTONES.length;
    const nextIdx = nextMilestoneIndex(xp);
    const tier = chestTierFromXp(xp);

    // Progress fill is the lifetime XP normalised to the road's cap, so the
    // bar fills steadily as the player climbs rather than snapping per milestone.
    const progressPct = XP_ROAD_MAX_XP > 0
        ? Math.min(100, Math.round((xp / XP_ROAD_MAX_XP) * 100))
        : 0;

    const nextLabel = nextIdx >= 0
        ? `Next: ${XP_ROAD_MILESTONES[nextIdx].label} · ${XP_ROAD_MILESTONES[nextIdx].xp.toLocaleString()} XP`
        : 'Road complete — every milestone reached.';

    return (
        <motion.button
            className="mode-card mode-card--xl bp-card xpr-card"
            onClick={() => { audio.play('click'); onClick(); }}
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + index * 0.06 }}
            whileHover={prefersReduced ? undefined : { y: -3 }}
            whileTap={prefersReduced ? undefined : { scale: 0.98 }}
            aria-label="XP Road — climb the beanstalk"
        >
            <VineEmblem
                player={{ cosmetics: profile.cosmetics, mood: pet.mood }}
                friends={topFriends}
            />
            <div className="bp-card__copy">
                <span className="bp-card__eyebrow">
                    <span className="bp-card__dot" />
                    Climb the Beanstalk · {total} milestones
                </span>
                <h3 className="bp-card__title">XP Road</h3>
                <p className="bp-card__sub">
                    Reach milestones along the vine for bucks, cosmetics, titles, and chest yield bonuses.
                </p>
                <div className="bp-card__meta">
                    <span className="bp-card__pill">
                        <span className="bp-card__pill-dot" /> {reached} / {total} reached
                    </span>
                    {tier > 0 && (
                        <span className="bp-card__pill bp-card__pill--prem">
                            ★ Chest +{tier * 5}%
                        </span>
                    )}
                </div>
                <div className="bp-card__bar">
                    <div className="bp-card__bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="bp-card__cta">
                    {nextLabel} <span aria-hidden="true">→</span>
                </span>
            </div>
        </motion.button>
    );
}
