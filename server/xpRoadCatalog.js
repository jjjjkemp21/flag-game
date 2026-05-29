// Server mirror of src/lib/xpRoadCatalog.js. Keep in lock-step — the server
// trusts this catalog when auto-granting milestone rewards on every stats
// push (so a doctored client can't fabricate bucks/cosmetics/titles by
// claiming a milestone with a higher payout). Auto-grant logic lives in
// server/routes/stats.js; this file is pure data + helpers.

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

const XP_ROAD_MILESTONES = [
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

const XP_ROAD_BY_ID = Object.fromEntries(XP_ROAD_MILESTONES.map((mi) => [mi.id, mi]));

function chestTierFromXp(xp) {
    const x = Math.max(0, Math.floor(Number(xp) || 0));
    let tier = 0;
    for (const mi of XP_ROAD_MILESTONES) {
        if (mi.chestTier > 0 && x >= mi.xp) tier = Math.max(tier, mi.chestTier);
    }
    return tier;
}

// Set of milestone ids the player has crossed at the given XP.
function reachedIds(xp) {
    const x = Math.max(0, Math.floor(Number(xp) || 0));
    return XP_ROAD_MILESTONES.filter((mi) => x >= mi.xp).map((mi) => mi.id);
}

module.exports = {
    XP_ROAD_MILESTONES,
    XP_ROAD_BY_ID,
    chestTierFromXp,
    reachedIds,
};
