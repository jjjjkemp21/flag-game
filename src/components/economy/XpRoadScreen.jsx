import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import { Button } from '../ui/index';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import Mascot from '../../assets/illustrations/Mascot';
import VineSegment from '../../assets/illustrations/VineSegment';
import VineLeaf from '../../assets/illustrations/VineLeaf';
import XpRoadBackdrop, { XpRoadFog, XpRoadMeadowGrass } from '../../assets/illustrations/XpRoadBackdrop';
import { useAuth } from '../../auth/AuthProvider';
import { useProfile } from '../../lib/profile';
import { usePet } from '../../lib/pet';
import { computeXp } from '../../lib/xp';
import { useXpRoad, loadXpRoad } from '../../lib/xpRoad';
import {
    XP_ROAD_MILESTONES,
    chestTierFromXp,
    nextMilestoneIndex,
    reachedCount,
} from '../../lib/xpRoadCatalog';
import { HATS, GLASSES, EFFECTS, COLORS } from '../../lib/cosmetics';

// XP Road — the vertical beanstalk climbing screen.
// Bottom of the canvas is where everyone starts; milestones climb upward.
// The screen auto-scrolls to the player's current position on mount so they
// see "where they are" first; user can then scroll up to see what's ahead.

// Layout constants. Each milestone occupies a fixed vertical slot so the
// spacing reads as evenly-paced, even though XP between milestones isn't
// linear. Climbers SNAP to the highest tier they've reached — they don't
// interpolate within sub-tiers, so finishing a quiz that crosses a milestone
// visibly bumps the mascot up to the next leaf.
const ROAD_BASE = 80;        // empty padding below the first milestone
const SLOT_HEIGHT = 220;     // vertical distance between adjacent milestones
const TILE_HEIGHT = 300;     // height of one VineSegment tile (must match viewBox)

// Vertical offset above a milestone's line where the climber sits, so the
// mascot reads as "perched on top of the leaf" rather than dangling from it.
const CLIMBER_PERCH_OFFSET = 14;

const COSMETIC_TABLES = { hat: HATS, glasses: GLASSES, effect: EFFECTS, color: COLORS };

function totalHeight() {
    return ROAD_BASE * 2 + SLOT_HEIGHT * XP_ROAD_MILESTONES.length;
}

// Vertical position (from bottom) of a milestone slot's centre.
function milestoneY(index) {
    return ROAD_BASE + (index + 0.5) * SLOT_HEIGHT;
}

// Progression tier (0..5) for one vine background tile. The tile's vertical
// centre is mapped back to the closest milestone slot, then to that slot's
// chest-yield tier — so tiles transition from sapling green at the bottom to
// mythic violet/gold at the top in step with the milestones the climber
// passes.
function tierForTile(tileIdx) {
    const centerY = (tileIdx + 0.5) * TILE_HEIGHT;
    const slotIdx = Math.round((centerY - ROAD_BASE) / SLOT_HEIGHT - 0.5);
    const clamped = Math.max(0, Math.min(XP_ROAD_MILESTONES.length - 1, slotIdx));
    return chestTierFromXp(XP_ROAD_MILESTONES[clamped].xp);
}

// Vertical position (from bottom) of a climber at a given XP. Climbers SNAP
// to the highest milestone they've reached and perch ~14px above that level
// line so it reads as "you've cleared this tier" — no sub-tier crawling.
function climberY(xp) {
    if (xp <= 0) return 16;
    // Highest milestone index the climber has reached at this XP.
    let reachedIdx = -1;
    for (let i = 0; i < XP_ROAD_MILESTONES.length; i++) {
        if (xp >= XP_ROAD_MILESTONES[i].xp) reachedIdx = i;
        else break;
    }
    if (reachedIdx < 0) return 16; // hasn't passed the first milestone yet
    return milestoneY(reachedIdx) + CLIMBER_PERCH_OFFSET;
}

// Cosmetic-category label + Material icon used for the small "kind" eyebrow
// above a cosmetic preview, plus the chip iconography used on non-major
// milestones that have a cosmetic.
const COSMETIC_LABELS = { hat: 'New Hat', glasses: 'New Glasses', effect: 'New Effect', color: 'New Skin' };
const COSMETIC_ICONS  = { hat: 'theater_comedy', glasses: 'eyeglasses', effect: 'auto_awesome', color: 'palette' };

// Mini-mascot preview of a cosmetic reward — shows exactly what the player
// will look like wearing the unlocked item. We render the Mascot at a small
// size with `still` so the framer bob doesn't run, but its SMIL-driven
// cosmetic animations (color cycles, effect particles) still play so the
// preview feels alive.
function CosmeticPreview({ cosmetic, reached }) {
    const cosmetics = { [cosmetic.cat]: cosmetic.id };
    const tbl = COSMETIC_TABLES[cosmetic.cat];
    const item = tbl ? tbl[cosmetic.id] : null;
    return (
        <div className={`xpr-preview xpr-preview--cosmetic ${reached ? 'is-reached' : 'is-locked'}`}>
            <div className="xpr-preview__mascot">
                <Mascot size={40} cosmetics={cosmetics} mood="cheer" still />
                {!reached && (
                    <span className="xpr-preview__lock" aria-hidden="true">
                        <Icon name="lock" />
                    </span>
                )}
            </div>
            <div className="xpr-preview__caption">
                <span className="xpr-preview__eyebrow">
                    <Icon name={COSMETIC_ICONS[cosmetic.cat]} />
                    {COSMETIC_LABELS[cosmetic.cat]}
                </span>
                <span className="xpr-preview__name">{item ? item.name : cosmetic.id}</span>
            </div>
        </div>
    );
}

// Reward block for one milestone — picks the right presentation based on
// payload type. Cosmetics get a live mascot preview, titles get a ribbon,
// chest-tier bumps get a badge, and bucks-only minor leaves get a coin row.
function MilestoneReward({ milestone, reached }) {
    const blocks = [];

    if (milestone.cosmetic) {
        blocks.push(
            <CosmeticPreview key="cos" cosmetic={milestone.cosmetic} reached={reached} />
        );
    }

    if (milestone.title) {
        const titleIcon = milestone.icon === 'emoji_events' ? 'emoji_events' : 'military_tech';
        blocks.push(
            <div key="title" className={`xpr-preview xpr-preview--title ${reached ? 'is-reached' : 'is-locked'}`}>
                <span className="xpr-preview__ribbon">
                    <Icon name={titleIcon} />
                    <span className="xpr-preview__title-text">{milestone.title}</span>
                </span>
                <span className="xpr-preview__eyebrow xpr-preview__eyebrow--title">Title unlocked</span>
            </div>
        );
    }

    if (milestone.chestTier > 0) {
        blocks.push(
            <div key="chest" className={`xpr-preview xpr-preview--chest ${reached ? 'is-reached' : 'is-locked'}`}>
                <span className="xpr-preview__chest-icon"><Icon name="redeem" /></span>
                <span className="xpr-preview__chest-text">
                    <span className="xpr-preview__chest-pct">+{milestone.chestTier * 5}%</span>
                    <span className="xpr-preview__chest-lbl">Chest yield</span>
                </span>
            </div>
        );
    }

    // Bucks payouts ride along as a compact coin row at the bottom — they
    // appear by themselves for minor milestones, and as an extra payout under
    // the cosmetic/title for the final "Beanstalk Champion" milestone.
    if (milestone.bucks > 0) {
        blocks.push(
            <div key="bucks" className={`xpr-preview xpr-preview--bucks ${reached ? 'is-reached' : 'is-locked'}`}>
                <AtlasBucksIcon size={18} />
                <span className="xpr-preview__bucks-amount">+{milestone.bucks.toLocaleString()}</span>
                <span className="xpr-preview__bucks-lbl">Bucks</span>
            </div>
        );
    }

    return <div className="xpr-plaque__rewards">{blocks}</div>;
}

// One milestone row — a dashed "level line" crosses the canvas, anchored at
// the vine by a symmetric pair of leaves. A compact, translucent reward tile
// is offset to the alternating side (LEFT on odd rows, RIGHT on even), with a
// floating XP pill on the opposite side of the line so the central aisle
// stays clear for climbing mascots. Inspired by Clash Royale's Trophy Road.
function MilestoneRow({ milestone, index, reached, reducedMotion }) {
    const side = index % 2 === 0 ? 'right' : 'left';
    const oppSide = side === 'right' ? 'left' : 'right';
    const y = milestoneY(index);
    const size = milestone.major ? 'md' : 'sm';
    const isMajor = milestone.major;
    const hoverAnim = reducedMotion ? undefined : { y: -2, scale: 1.015 };
    // Leaf tier matches the chest-yield tier reached at this milestone, so
    // leaves visually escalate alongside the background vine as you climb.
    const leafTier = chestTierFromXp(milestone.xp);

    return (
        <div
            className={`xpr-milestone ${reached ? 'is-reached' : 'is-locked'} ${isMajor ? 'is-major' : 'is-minor'}`}
            style={{ bottom: `${y}px` }}
        >
            {/* Faint dashed level line across the canvas — the visual "rung"
                that says "this is a new level". */}
            <span
                className={`xpr-level-line ${reached ? 'is-reached' : 'is-locked'} ${isMajor ? 'is-major' : 'is-minor'}`}
                aria-hidden="true"
            />

            {/* Symmetric leaves anchoring the level line at the vine — every
                milestone shows BOTH leaves so the line reads as one continuous
                level marker, not a one-sided branch. */}
            <div className="xpr-leaf-slot xpr-leaf-slot--left">
                <VineLeaf side="left" size={size} reached={reached} tier={leafTier} />
            </div>
            <div className="xpr-leaf-slot xpr-leaf-slot--right">
                <VineLeaf side="right" size={size} reached={reached} tier={leafTier} />
            </div>

            {/* Floating XP pill on the OPPOSITE side from the plaque so the
                level line is anchored visually at both ends without
                crowding the central climbing aisle. */}
            <span
                className={`xpr-level-xp xpr-level-xp--${oppSide} ${reached ? 'is-reached' : 'is-locked'} ${isMajor ? 'is-major' : ''}`}
                aria-hidden="true"
            >
                {milestone.xp.toLocaleString()} XP
            </span>

            <motion.div
                className={`xpr-plaque xpr-plaque--${side} ${isMajor ? 'xpr-plaque--major' : 'xpr-plaque--minor'} ${reached ? 'is-reached' : 'is-locked'}`}
                whileHover={hoverAnim}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
                {/* Short connector vein from the plaque to the vine — both
                    minor AND major plaques are now side-anchored, so both
                    get a vein. */}
                <span className={`xpr-plaque__vein xpr-plaque__vein--${side}`} aria-hidden="true" />
                {isMajor && (
                    <span className={`xpr-plaque__crown xpr-plaque__crown--${side}`} aria-hidden="true">
                        <Icon name="auto_awesome" />
                    </span>
                )}

                <div className="xpr-plaque__head">
                    <span className="xpr-plaque__name">{milestone.label}</span>
                </div>

                <MilestoneReward milestone={milestone} reached={reached} />

                {reached && (
                    <span className="xpr-plaque__check" aria-label="Reached">
                        <Icon name="check_circle" />
                    </span>
                )}
                {reached && isMajor && <span className="xpr-plaque__shine" aria-hidden="true" />}
            </motion.div>
        </div>
    );
}

// Player's climber — full-size mascot, with the player's cosmetics, anchored
// to the central stem at the player's interpolated XP position.
function PlayerClimber({ xp, cosmetics, mood }) {
    const y = climberY(xp);
    return (
        <motion.div
            className="xpr-climber xpr-climber--me"
            initial={{ bottom: 12 }}
            animate={{ bottom: y }}
            transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        >
            <Mascot size={72} cosmetics={cosmetics} mood={mood} />
            <span className="xpr-climber__tag">You · {xp.toLocaleString()} XP</span>
        </motion.div>
    );
}

// Friend climber — smaller, no tag by default; tapping pops the tag.
function FriendClimber({ friend, onTap, isOpen }) {
    const y = climberY(friend.xp || 0);
    return (
        <div
            className={`xpr-climber xpr-climber--friend ${isOpen ? 'is-open' : ''}`}
            style={{ bottom: `${y}px` }}
            onClick={() => onTap(friend)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(friend); } }}
            aria-label={`${friend.username}, ${friend.xp.toLocaleString()} XP`}
        >
            <Mascot size={44} cosmetics={friend.cosmetics} mood="idle" still />
            {isOpen && (
                <div className="xpr-climber__popover">
                    <strong>{friend.username}</strong>
                    {friend.selectedTitle && <span className="xpr-climber__title">{friend.selectedTitle}</span>}
                    <span className="xpr-climber__xp">{friend.xp.toLocaleString()} XP</span>
                </div>
            )}
        </div>
    );
}

export default function XpRoadScreen({ setView }) {
    const { isAuthed } = useAuth();
    const profile = useProfile();
    const pet = usePet();
    const xpRoad = useXpRoad();
    const prefersReduced = useReducedMotion();
    const scrollRef = useRef(null);
    const didInitialScrollRef = useRef(false);
    const [openFriendId, setOpenFriendId] = useState(null);

    // Always fetch a fresh snapshot on mount — claims may have happened in
    // other tabs / sessions since the App.js load.
    useEffect(() => {
        if (isAuthed) loadXpRoad();
    }, [isAuthed]);

    const xp = computeXp();
    const reached = reachedCount(xp);
    const nextIdx = nextMilestoneIndex(xp);
    const tier = chestTierFromXp(xp);
    const canvasH = totalHeight();
    const tileCount = Math.ceil(canvasH / TILE_HEIGHT);

    // Progress percentage toward the next milestone (resets after each cross).
    // For the "Road complete" state we just sit at 100%.
    const next = nextIdx >= 0 ? XP_ROAD_MILESTONES[nextIdx] : null;
    const prevXp = nextIdx <= 0
        ? 0
        : XP_ROAD_MILESTONES[nextIdx - 1].xp;
    const segmentPct = next
        ? Math.max(0, Math.min(100, Math.round(((xp - prevXp) / (next.xp - prevXp)) * 100)))
        : 100;
    const xpToGo = next ? Math.max(0, next.xp - xp) : 0;

    // Auto-scroll to the player's position once on mount so they see "where
    // they are" before browsing what's ahead. Scroll containers measure from
    // the top, so scrollTop = canvasH - playerYFromBottom - viewportSlice.
    useEffect(() => {
        if (!isAuthed) return;
        if (didInitialScrollRef.current) return;
        const el = scrollRef.current;
        if (!el) return;
        const y = climberY(xp);
        // Place the player ~70% from the top of the visible area so they can
        // see what's coming up next without losing track of where they are.
        const target = canvasH - y - el.clientHeight * 0.3;
        el.scrollTop = Math.max(0, Math.min(canvasH - el.clientHeight, target));
        didInitialScrollRef.current = true;
    }, [xp, canvasH, isAuthed]);

    // All hooks must run before the auth gate, so memoise claimed set + friend
    // list here even though only the authed branch uses them.
    const claimedSet = useMemo(() => new Set(xpRoad.claimed || []), [xpRoad.claimed]);
    const friends = Array.isArray(xpRoad.friends) ? xpRoad.friends : [];

    if (!isAuthed) {
        return (
            <div className="quiz-box xpr-screen">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="eco" size="xl" />
                    <h2>XP Road</h2>
                    <p>Log in to climb the beanstalk and earn milestone rewards.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-box xpr-screen">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
                <h2 className="text-center" style={{ margin: 0 }}>XP Road</h2>
            </div>

            <div className="xpr-hero">
                <div className="xpr-hero__stats">
                    <div className="xpr-hero__stat xpr-hero__stat--xp">
                        <span className="xpr-hero__stat-icon"><Icon name="star" /></span>
                        <span className="xpr-hero__stat-num">{xp.toLocaleString()}</span>
                        <span className="xpr-hero__stat-lbl">Total XP</span>
                    </div>
                    <div className="xpr-hero__stat xpr-hero__stat--milestones">
                        <span className="xpr-hero__stat-icon"><Icon name="eco" /></span>
                        <span className="xpr-hero__stat-num">{reached}<span className="xpr-hero__stat-frac">/{XP_ROAD_MILESTONES.length}</span></span>
                        <span className="xpr-hero__stat-lbl">Milestones</span>
                    </div>
                    <div className={`xpr-hero__stat xpr-hero__stat--chest ${tier > 0 ? 'is-active' : 'is-dim'}`}>
                        <span className="xpr-hero__stat-icon"><Icon name="redeem" /></span>
                        <span className="xpr-hero__stat-num">+{tier * 5}%</span>
                        <span className="xpr-hero__stat-lbl">Chest yield</span>
                    </div>
                </div>

                {next ? (
                    <div className="xpr-hero__next">
                        <div className="xpr-hero__next-row">
                            <span className="xpr-hero__next-eyebrow">
                                <span className="xpr-hero__next-dot" /> Next milestone
                            </span>
                            <span className="xpr-hero__next-togo">{xpToGo.toLocaleString()} XP to go</span>
                        </div>
                        <div className="xpr-hero__next-name">{next.label}</div>
                        <div className="xpr-hero__progress" role="progressbar"
                            aria-valuenow={segmentPct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="xpr-hero__progress-fill" style={{ width: `${segmentPct}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className="xpr-hero__next xpr-hero__next--done">
                        <Icon name="emoji_events" />
                        <strong>Road complete</strong>
                        <span>Every milestone reached.</span>
                    </div>
                )}
            </div>

            <div className="xpr-scroll" ref={scrollRef}>
                <div className="xpr-canvas" style={{ height: `${canvasH}px` }}>
                    {/* Ambient long-SVG backdrop — sky → cloud → meadow with a
                        sun, drifting cumulus, and grounded hills. Sits behind
                        the vine + UI. Stretched via xMidYMid slice so the
                        composition fills both mobile and desktop canvases. */}
                    <XpRoadBackdrop />

                    {/* Tiled vine background. Tiles alternate flipped so the
                        repeat is harder to spot than a uniform stack. The
                        top tile is positioned to align with the canvas top
                        (each tile is TILE_HEIGHT tall). */}
                    <div className="xpr-vine">
                        {Array.from({ length: tileCount }).map((_, i) => (
                            <VineSegment key={i} flip={i % 2 === 1} tier={tierForTile(i)} />
                        ))}
                    </div>

                    {/* Bottom-of-canvas grass strip — fixed-height SVG so the
                        tufts don't slice-stretch into vertical streaks. Sits
                        in front of the backdrop hills but behind the vine. */}
                    <XpRoadMeadowGrass />

                    {/* Thick fog bands — separate layer, painted IN FRONT of
                        the vine but BEHIND the milestone plaques. Gives the
                        climb a sense of depth as the vine recedes through fog. */}
                    <XpRoadFog />

                    {/* Milestones layered on top of the vine + fog */}
                    {XP_ROAD_MILESTONES.map((mi, i) => (
                        <MilestoneRow
                            key={mi.id}
                            milestone={mi}
                            index={i}
                            reached={claimedSet.has(mi.id) || xp >= mi.xp}
                            reducedMotion={prefersReduced}
                        />
                    ))}

                    {/* Friend mini-climbers — render before the player so the
                        player's larger climber sits on top of any overlap. */}
                    {friends.map((f) => (
                        <FriendClimber
                            key={f.id}
                            friend={f}
                            onTap={(fr) => setOpenFriendId((cur) => (cur === fr.id ? null : fr.id))}
                            isOpen={openFriendId === f.id}
                        />
                    ))}

                    {/* The player's climber, with their equipped cosmetics. */}
                    <PlayerClimber xp={xp} cosmetics={profile.cosmetics} mood={pet.mood} />

                    {/* Tap-away handler for friend popovers */}
                    {openFriendId !== null && (
                        <div className="xpr-popover-shade" onClick={() => setOpenFriendId(null)} />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {xpRoad.titles && xpRoad.titles.length > 0 && (
                    <motion.div
                        className="xpr-titles"
                        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? false : { opacity: 1, y: 0 }}
                        exit={prefersReduced ? undefined : { opacity: 0 }}
                    >
                        <Icon name="military_tech" /> XP Road titles unlocked:{' '}
                        {xpRoad.titles.map((t, i) => (
                            <span key={t} className="xpr-title-chip">{t}{i < xpRoad.titles.length - 1 ? ',' : ''}</span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
