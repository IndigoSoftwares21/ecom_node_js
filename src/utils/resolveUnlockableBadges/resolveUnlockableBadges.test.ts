import resolveUnlockableBadges from ".";
import { ADVANCED_BADGE, badgeDefinitions } from "@fixtures/achievements";

const keysFor = (unlockedAchievementCount: number) =>
    resolveUnlockableBadges({
        definitions: badgeDefinitions,
        unlockedAchievementCount,
    }).map(({ badgeKey }) => badgeKey);

describe("resolveUnlockableBadges", () => {
    it("entitles nothing below the threshold", () => {
        expect(keysFor(0)).toEqual([]);
        expect(keysFor(ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT - 1)).toEqual(
            [],
        );
    });

    it("entitles the badge exactly on its threshold", () => {
        expect(keysFor(ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT)).toEqual([
            ADVANCED_BADGE.KEY,
        ]);
    });

    it("keeps entitling the badge above the threshold", () => {
        expect(
            keysFor(ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT * 2),
        ).toEqual([ADVANCED_BADGE.KEY]);
    });

    it("entitles every tier at or below the count", () => {
        const FIRST_TIER = { key: "BEGINNER", required: 1 };
        const SECOND_TIER = { key: "INTERMEDIATE", required: 4 };

        const keys = resolveUnlockableBadges({
            definitions: [
                {
                    badgeKey: FIRST_TIER.key,
                    badgeName: FIRST_TIER.key,
                    requiredAchievementCount: FIRST_TIER.required,
                },
                {
                    badgeKey: SECOND_TIER.key,
                    badgeName: SECOND_TIER.key,
                    requiredAchievementCount: SECOND_TIER.required,
                },
                ...badgeDefinitions,
            ],
            unlockedAchievementCount: SECOND_TIER.required,
        }).map(({ badgeKey }) => badgeKey);

        expect(keys).toEqual([FIRST_TIER.key, SECOND_TIER.key]);
    });

    it("entitles nothing when no badges are configured", () => {
        expect(
            resolveUnlockableBadges({
                definitions: [],
                unlockedAchievementCount: 50,
            }),
        ).toEqual([]);
    });
});
