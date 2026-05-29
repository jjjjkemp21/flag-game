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
import { COLORS, HATS, GLASSES, MOUTHS, EFFECTS, EMOTES } from '../lib/cosmetics';

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
    test('season + price constants match', () => {
        expect(clientBp.SEASON_ID).toBe(serverBp.SEASON_ID);
        expect(clientBp.SEASON_NAME).toBe(serverBp.SEASON_NAME);
        expect(clientBp.PREMIUM_PRICE).toBe(serverBp.PREMIUM_PRICE);
        expect(clientBp.TIER_COUNT).toBe(serverBp.TIER_COUNT);
        expect(clientBp.TOTAL_STARS).toBe(serverBp.TOTAL_STARS);
        expect(clientBp.TIER_STAR_COST).toEqual(serverBp.TIER_STAR_COST);
    });

    test('challenges match (id → metric/goal/stars)', () => {
        const norm = (list) => list
            .map((c) => ({ id: c.id, metric: c.metric, goal: c.goal, stars: c.stars }))
            .sort((a, b) => a.id.localeCompare(b.id));
        expect(norm(clientBp.CHALLENGES)).toEqual(norm(serverBp.CHALLENGES));
    });

    test('tiers match (tier → free/prem rewards)', () => {
        const norm = (list) => list
            .map((t) => ({ tier: t.tier, free: t.free, prem: t.prem }))
            .sort((a, b) => a.tier - b.tier);
        expect(norm(clientBp.TIERS)).toEqual(norm(serverBp.TIERS));
    });

    test('tierFromStars agrees across the star range', () => {
        for (let s = 0; s <= clientBp.TOTAL_STARS; s += 25) {
            expect(clientBp.tierFromStars(s)).toBe(serverBp.tierFromStars(s));
        }
    });
});

describe('cosmetic prices client/server sync', () => {
    const categories = [
        ['color', COLORS], ['hat', HATS], ['glasses', GLASSES],
        ['mouth', MOUTHS], ['effect', EFFECTS], ['emote', EMOTES],
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
