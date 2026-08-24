import resolveUnlockableAchievements from ".";
import {
    ACHIEVEMENT_GROUP_KEYS,
    ACHIEVEMENT_KEYS,
    achievementDefinitions,
} from "@fixtures/achievements";

const keysFor = (completedProductPurchaseCount: number) =>
    resolveUnlockableAchievements({
        definitions: achievementDefinitions,
        completedProductPurchaseCount,
    }).map(({ achievementKey }) => achievementKey);

describe("resolveUnlockableAchievements", () => {
    it("entitles nothing before the first purchase", () => {
        expect(keysFor(0)).toEqual([]);
    });

    it("entitles the first achievement on the first purchase", () => {
        expect(keysFor(1)).toEqual([ACHIEVEMENT_KEYS.FIRST_PURCHASE]);
    });

    it("entitles the next achievement exactly on its threshold", () => {
        expect(keysFor(2)).toEqual([
            ACHIEVEMENT_KEYS.FIRST_PURCHASE,
            ACHIEVEMENT_KEYS.TWO_PURCHASES,
        ]);
    });

    it("returns everything earned, not only the newest", () => {
        expect(keysFor(5)).toEqual([
            ACHIEVEMENT_KEYS.FIRST_PURCHASE,
            ACHIEVEMENT_KEYS.TWO_PURCHASES,
            ACHIEVEMENT_KEYS.THREE_PURCHASES,
            ACHIEVEMENT_KEYS.FOUR_PURCHASES,
            ACHIEVEMENT_KEYS.FIVE_PURCHASES,
        ]);
    });

    it("entitles the whole ladder once every threshold is met", () => {
        expect(keysFor(achievementDefinitions.length)).toEqual(
            Object.values(ACHIEVEMENT_KEYS),
        );
    });

    it("is derived from the count, so repeated calls agree", () => {
        // What makes a redelivered purchase event harmless: the caller discards
        // already-held achievements via ON CONFLICT DO NOTHING.
        expect(keysFor(5)).toEqual(keysFor(5));
    });

    it("applies a newly configured achievement retroactively", () => {
        const NEW_TIER_KEY = "ONE_AND_A_HALF_PURCHASES";

        const keys = resolveUnlockableAchievements({
            definitions: [
                ...achievementDefinitions,
                {
                    achievementKey: NEW_TIER_KEY,
                    achievementGroupKey: ACHIEVEMENT_GROUP_KEYS.PURCHASES,
                    achievementName: "A New Tier",
                    requiredProductPurchaseCount: 2,
                },
            ],
            completedProductPurchaseCount: 5,
        }).map(({ achievementKey }) => achievementKey);

        expect(keys).toContain(NEW_TIER_KEY);
    });

    it("entitles nothing when no achievements are configured", () => {
        expect(
            resolveUnlockableAchievements({
                definitions: [],
                completedProductPurchaseCount: 100,
            }),
        ).toEqual([]);
    });
});
