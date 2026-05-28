import { computeXp } from './xp';

// XP Road — milestone catalog. The vine-climb progression: every milestone is
// a leaf along the beanstalk that grants a one-shot reward when the player's
// lifetime earned XP crosses it. Mirror of server/xpRoadCatalog.js — keep in
// lock-step. The server validates auto-grants against its copy on every stats
// push; the client uses this one to render the road, the hero card progress,
// the chest yield multiplier, and friend climber positions.
//
// Milestone shape:
//   { id, xp, major, bucks, chestTier, cosmetic: {cat, id} | null,
//     title, label, icon }
// `major` leaves render larger on both sides of the vine; `minor` are small
// single-side leaves. `chestTier` 1..5 unlocks a +5%/10%/15%/20%/25% chest
// yield multiplier (highest reached tier wins; see chestYieldMultFromXp).

const m = (xp, opts) => ({
    id: `xpr_${xp}`,
    xp,
    major: false,
    bucks: 0,
    chestTier: 0,
    cosmetic: null,
    title: null,
    label: '',
    icon: 'eco',
    ...opts,
});

export const XP_ROAD_MILESTONES = [
    m(250,    { bucks: 150,   label: 'Sapling',            icon: 'spa' }),
    m(500,    { bucks: 200,   label: 'Tender Shoot',       icon: 'eco' }),
    m(1000,   { major: true, chestTier: 1, title: 'Sprout',           label: 'Sprout',             icon: 'redeem' }),
    m(1500,   { bucks: 400,   label: 'Growing Vine',       icon: 'eco' }),
    m(2000,   { bucks: 500,   label: 'Leafy Branch',       icon: 'eco' }),
    m(3000,   { major: true, cosmetic: { cat: 'hat', id: 'xpr_vine_crown' }, label: 'Vine Crown', icon: 'theater_comedy' }),
    m(4500,   { bucks: 800,   label: 'Climbing Strong',    icon: 'eco' }),
    m(6000,   { major: true, chestTier: 2, title: 'Climber',          label: 'Climber',            icon: 'redeem' }),
    m(8000,   { bucks: 1200,  label: 'Higher Reach',       icon: 'eco' }),
    m(10000,  { major: true, cosmetic: { cat: 'glasses', id: 'xpr_leaflet' }, label: 'Leaflet Lenses', icon: 'eyeglasses' }),
    m(13000,  { bucks: 1600,  label: 'Bountiful Vine',     icon: 'eco' }),
    m(16000,  { major: true, chestTier: 3, title: 'Vinekeeper',       label: 'Vinekeeper',         icon: 'redeem' }),
    m(20000,  { bucks: 2000,  label: 'Soaring',            icon: 'eco' }),
    m(25000,  { major: true, cosmetic: { cat: 'color', id: 'xpr_beanstalk' }, label: 'Beanstalk Globe', icon: 'palette' }),
    m(32000,  { major: true, chestTier: 4, title: 'Skyward',          label: 'Skyward',            icon: 'redeem' }),
    m(40000,  { bucks: 4000,  label: 'Above the Clouds',   icon: 'eco' }),
    m(50000,  { major: true, cosmetic: { cat: 'effect', id: 'xpr_leaves' }, label: 'Drifting Leaves', icon: 'auto_awesome' }),
    m(65000,  { major: true, chestTier: 5, title: 'Cloud Warden',     label: 'Cloud Warden',       icon: 'redeem' }),
    m(85000,  { bucks: 6000,  label: 'Castle in Sight',    icon: 'eco' }),
    m(110000, { major: true, bucks: 10000, title: 'Beanstalk Champion', label: 'Beanstalk Champion', icon: 'emoji_events' }),
];

export const XP_ROAD_BY_ID = Object.fromEntries(XP_ROAD_MILESTONES.map((mi) => [mi.id, mi]));

// Last milestone's XP — used for the "topped out" pill on the hero card and
// for normalising progress bars.
export const XP_ROAD_MAX_XP = XP_ROAD_MILESTONES[XP_ROAD_MILESTONES.length - 1].xp;

// Highest chest yield tier the player has reached (0..5). The highest tier
// found at or below `xp` wins — so chest yield is persistent and never goes
// down even if XP is reset (server-side, see stats /reset).
export function chestTierFromXp(xp) {
    const x = Math.max(0, Math.floor(Number(xp) || 0));
    let tier = 0;
    for (const mi of XP_ROAD_MILESTONES) {
        if (mi.chestTier > 0 && x >= mi.xp) tier = Math.max(tier, mi.chestTier);
    }
    return tier;
}

// Chest yield multiplier applied to the bucks rolled by rollChest(). +5% per
// chest tier reached, cap +25% at tier 5.
export function chestYieldMultFromXp(xp) {
    return 1 + chestTierFromXp(xp) * 0.05;
}

// One-liner used by quiz components — reads live total XP and returns the
// current multiplier. Kept here (rather than at the call sites) so a future
// change to the yield curve only touches this file.
export function currentChestYieldMult() {
    return chestYieldMultFromXp(computeXp());
}

// Index of the next un-reached milestone (for the hero card's "Next:" hint).
// Returns -1 once every milestone is in the bag.
export function nextMilestoneIndex(xp) {
    const x = Math.max(0, Math.floor(Number(xp) || 0));
    for (let i = 0; i < XP_ROAD_MILESTONES.length; i++) {
        if (XP_ROAD_MILESTONES[i].xp > x) return i;
    }
    return -1;
}

// How many milestones the player has reached.
export function reachedCount(xp) {
    const x = Math.max(0, Math.floor(Number(xp) || 0));
    return XP_ROAD_MILESTONES.filter((mi) => mi.xp <= x).length;
}

// Y-position along the road (0 at the bottom, 1 at the top). Used by the
// XP Road screen to place a climber's mascot on the vine at their XP. Below
// the first milestone the climber sits at the very bottom; above the last
// they sit at the very top.
export function roadPosition(xp) {
    const x = Math.max(0, Math.floor(Number(xp) || 0));
    if (x <= 0) return 0;
    if (x >= XP_ROAD_MAX_XP) return 1;
    return x / XP_ROAD_MAX_XP;
}

// User-facing summary of a milestone's reward for chips/tooltips.
export function rewardSummary(mi) {
    const parts = [];
    if (mi.bucks > 0) parts.push(`+${mi.bucks.toLocaleString()} Bucks`);
    if (mi.chestTier > 0) parts.push(`Chest yield +${mi.chestTier * 5}%`);
    if (mi.cosmetic) parts.push(`New ${mi.cosmetic.cat}`);
    if (mi.title) parts.push(`Title: ${mi.title}`);
    return parts.join(' · ');
}
