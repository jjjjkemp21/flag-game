// In-sync guard for the files that are intentionally duplicated across the
// client (src/lib, ESM) and server (server/, CommonJS) packages. A true shared
// module is impossible here — CRA's build refuses imports outside src/, and the
// server is a separate package built in its own Docker stage — so instead this
// test fails CI whenever the mirrors drift. It runs only under `npm test`
// (Jest), never in the production Docker build (`npm run build`), so it cannot
// break the deploy pipeline.
//
// This is the regression net for bugs like the battlepass `lang_75` goal that
// diverged silently between the two copies. Keep server/xp.js ⇄ src/lib/xp.js,
// server/battlepassCatalog.js ⇄ src/lib/battlepassCatalog.js, and
// server/cosmeticsCatalog.js ⇄ src/lib/cosmetics.js in lock-step.

import * as clientXp from '../lib/xp';
import * as clientBp from '../lib/battlepassCatalog';
import { COLORS, HATS, GLASSES, MOUTHS, EFFECTS, EMOTES, COMPANIONS, SCENES } from '../lib/cosmetics';

const serverXp = require('../../server/xp');
const serverBp = require('../../server/battlepassCatalog');
const serverCos = require('../../server/cosmeticsCatalog');

describe('xp.js client/server sync', () => {
    test('MASTERY_STREAK matches', () => {
        expect(clientXp.MASTERY_STREAK).toBe(serverXp.MASTERY_STREAK);
    });

    test('bonusTotal agrees on sample scores', () => {
        const samples = [
            {},
            { frenzy: 100, pixelated: 50, language: 30, longestRoute: 10 },
            { frenzy: 0, pixelated: 7, language: 75 },
        ];
        samples.forEach((s) => {
            expect(clientXp.bonusTotal(s)).toBe(serverXp.bonusTotal(s));
        });
    });

    test('geoPlacedCount agrees on a sample stats array', () => {
        const stats = [
            { code: 'FR', geoStreak: 1 },
            { code: 'DE', geoStreak: 0 },
            { code: 'JP', geoStreak: 9 },
        ];
        expect(clientXp.geoPlacedCount(stats)).toBe(serverXp.geoPlacedCount(stats));
    });
});

describe('battlepass catalog client/server sync', () => {
    test('shared + active-season constants match', () => {
        expect(clientBp.SEASON_ID).toBe(serverBp.SEASON_ID);
        expect(clientBp.SEASON_NAME).toBe(serverBp.SEASON_NAME);
        expect(clientBp.PREMIUM_PRICE).toBe(serverBp.PREMIUM_PRICE);
        expect(clientBp.TIER_COUNT).toBe(serverBp.TIER_COUNT);
        expect(clientBp.TOTAL_STARS).toBe(serverBp.TOTAL_STARS);
        expect(clientBp.TIER_STAR_COST).toEqual(serverBp.TIER_STAR_COST);
        expect(clientBp.ACTIVE_SEASON_ID).toBe(serverBp.ACTIVE_SEASON_ID);
        expect(clientBp.SEASON_ORDER).toEqual(serverBp.SEASON_ORDER);
        expect(clientBp.SEASON_ENDS_AT).toBe(serverBp.SEASON_ENDS_AT);
    });

    test('season ids, names + tier curves match', () => {
        expect(Object.keys(clientBp.SEASONS).sort()).toEqual(Object.keys(serverBp.SEASONS).sort());
        clientBp.SEASON_ORDER.forEach((id) => {
            expect(clientBp.SEASONS[id].name).toBe(serverBp.SEASONS[id].name);
            expect(clientBp.SEASONS[id].tierCount).toBe(serverBp.SEASONS[id].tierCount);
            expect(clientBp.SEASONS[id].totalStars).toBe(serverBp.SEASONS[id].totalStars);
            expect(clientBp.SEASONS[id].tierStarCost).toEqual(serverBp.SEASONS[id].tierStarCost);
        });
    });

    test('challenges match per season (id → metric/goal/stars)', () => {
        const norm = (list) => list
            .map((c) => ({ id: c.id, metric: c.metric, goal: c.goal, stars: c.stars }))
            .sort((a, b) => a.id.localeCompare(b.id));
        clientBp.SEASON_ORDER.forEach((id) => {
            expect(norm(clientBp.SEASONS[id].challenges)).toEqual(norm(serverBp.SEASONS[id].challenges));
        });
    });

    test('tiers match per season (tier → free/prem rewards)', () => {
        const norm = (list) => list
            .map((t) => ({ tier: t.tier, free: t.free, prem: t.prem }))
            .sort((a, b) => a.tier - b.tier);
        clientBp.SEASON_ORDER.forEach((id) => {
            expect(norm(clientBp.SEASONS[id].tiers)).toEqual(norm(serverBp.SEASONS[id].tiers));
        });
    });

    test('tierFromStars agrees across the star range', () => {
        for (let s = 0; s <= clientBp.TOTAL_STARS; s += 25) {
            expect(clientBp.tierFromStars(s)).toBe(serverBp.tierFromStars(s));
        }
    });
});

describe('battlepass catalog integrity', () => {
    const CAT = { color: COLORS, hat: HATS, glasses: GLASSES, mouth: MOUTHS, effect: EFFECTS, emote: EMOTES, companion: COMPANIONS, scene: SCENES };

    test('every tier cosmetic reward resolves to a real cosmetic id', () => {
        clientBp.SEASON_ORDER.forEach((id) => {
            clientBp.SEASONS[id].tiers.forEach((t) => {
                [t.free, t.prem].forEach((r) => {
                    if (r && r.type === 'cosmetic') {
                        expect(CAT[r.cat] && CAT[r.cat][r.id]).toBeTruthy();
                    }
                });
            });
        });
    });

    test('challenge id sets are unique within each season', () => {
        clientBp.SEASON_ORDER.forEach((id) => {
            const ids = clientBp.SEASONS[id].challenges.map((c) => c.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

    test('obtainable challenge stars can reach the capstone in every season', () => {
        clientBp.SEASON_ORDER.forEach((id) => {
            const season = clientBp.SEASONS[id];
            const sum = season.challenges.reduce((a, c) => a + c.stars, 0);
            expect(sum).toBeGreaterThanOrEqual(season.totalStars);
        });
    });
});

describe('cosmetic prices client/server sync', () => {
    const categories = [
        ['color', COLORS], ['hat', HATS], ['glasses', GLASSES],
        ['mouth', MOUTHS], ['effect', EFFECTS], ['emote', EMOTES],
        ['companion', COMPANIONS],
    ];
    categories.forEach(([cat, clientMap]) => {
        test(`${cat}: every id's price matches server, and id sets agree`, () => {
            const clientIds = Object.keys(clientMap).sort();
            const serverIds = Object.keys(serverCos.CATALOG[cat]).sort();
            expect(clientIds).toEqual(serverIds);
            clientIds.forEach((id) => {
                expect(serverCos.priceOf(cat, id)).toBe(clientMap[id].xp);
            });
        });
    });
});
