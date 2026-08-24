import resolveAchievementProgress from ".";
import {
    ACHIEVEMENT_GROUP_KEYS,
    ACHIEVEMENT_KEYS,
    ACHIEVEMENT_NAMES,
    ADVANCED_BADGE,
    achievementDefinitions,
    badgeDefinitions,
} from "@fixtures/achievements";

const progressFor = (unlockedAchievementKeys: string[]) =>
    resolveAchievementProgress({
        achievementDefinitions,
        badgeDefinitions,
        unlockedAchievementKeys,
    });

const FIVE_UNLOCKED = [
    ACHIEVEMENT_KEYS.FIRST_PURCHASE,
    ACHIEVEMENT_KEYS.TWO_PURCHASES,
    ACHIEVEMENT_KEYS.THREE_PURCHASES,
    ACHIEVEMENT_KEYS.FOUR_PURCHASES,
    ACHIEVEMENT_KEYS.FIVE_PURCHASES,
];

describe("resolveAchievementProgress", () => {
    it("describes a user who has bought nothing", () => {
        expect(progressFor([])).toEqual({
            unlockedAchievements: [],
            nextAvailableAchievements: [ACHIEVEMENT_NAMES.FIRST_PURCHASE],
            currentBadge: null,
            nextBadge: ADVANCED_BADGE.NAME,
            remainingToUnlockNextBadge:
                ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT,
        });
    });

    it("reproduces the specification's example: 5 unlocked leaves 3 to Advanced", () => {
        const progress = progressFor(FIVE_UNLOCKED);

        expect(progress.nextBadge).toBe(ADVANCED_BADGE.NAME);
        expect(progress.remainingToUnlockNextBadge).toBe(
            ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT - FIVE_UNLOCKED.length,
        );
        expect(progress.currentBadge).toBeNull();
    });

    it("returns only the next achievement per group, not every remaining one", () => {
        const progress = progressFor([ACHIEVEMENT_KEYS.FIRST_PURCHASE]);

        expect(progress.nextAvailableAchievements).toEqual([
            ACHIEVEMENT_NAMES.TWO_PURCHASES,
        ]);
    });

    it("returns one next achievement for each group", () => {
        const REVIEWS_GROUP_KEY = "REVIEWS";
        const FIRST_REVIEW_KEY = "FIRST_REVIEW";
        const FIVE_REVIEWS_NAME = "5 Reviews";

        const progress = resolveAchievementProgress({
            achievementDefinitions: [
                ...achievementDefinitions,
                {
                    achievementKey: FIRST_REVIEW_KEY,
                    achievementGroupKey: REVIEWS_GROUP_KEY,
                    achievementName: "First Review",
                    requiredProductPurchaseCount: 1,
                },
                {
                    achievementKey: "FIVE_REVIEWS",
                    achievementGroupKey: REVIEWS_GROUP_KEY,
                    achievementName: FIVE_REVIEWS_NAME,
                    requiredProductPurchaseCount: 5,
                },
            ],
            badgeDefinitions,
            unlockedAchievementKeys: [
                ACHIEVEMENT_KEYS.FIRST_PURCHASE,
                FIRST_REVIEW_KEY,
            ],
        });

        expect(progress.nextAvailableAchievements).toEqual([
            ACHIEVEMENT_NAMES.TWO_PURCHASES,
            FIVE_REVIEWS_NAME,
        ]);
    });

    it("reports no next badge once the top badge is held", () => {
        const progress = progressFor(
            achievementDefinitions.map(({ achievementKey }) => achievementKey),
        );

        expect(progress).toEqual({
            unlockedAchievements: Object.values(ACHIEVEMENT_NAMES),
            nextAvailableAchievements: [],
            currentBadge: ADVANCED_BADGE.NAME,
            nextBadge: null,
            remainingToUnlockNextBadge: 0,
        });
    });

    it("names the highest badge earned as the current one", () => {
        const FIRST_TIER = { key: "BEGINNER", name: "Beginner", required: 1 };
        const SECOND_TIER = {
            key: "INTERMEDIATE",
            name: "Intermediate",
            required: 4,
        };

        const progress = resolveAchievementProgress({
            achievementDefinitions,
            badgeDefinitions: [
                {
                    badgeKey: FIRST_TIER.key,
                    badgeName: FIRST_TIER.name,
                    requiredAchievementCount: FIRST_TIER.required,
                },
                {
                    badgeKey: SECOND_TIER.key,
                    badgeName: SECOND_TIER.name,
                    requiredAchievementCount: SECOND_TIER.required,
                },
                ...badgeDefinitions,
            ],
            unlockedAchievementKeys: FIVE_UNLOCKED.slice(
                0,
                SECOND_TIER.required,
            ),
        });

        expect(progress.currentBadge).toBe(SECOND_TIER.name);
        expect(progress.nextBadge).toBe(ADVANCED_BADGE.NAME);
        expect(progress.remainingToUnlockNextBadge).toBe(
            ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT - SECOND_TIER.required,
        );
    });

    it("orders unlocked achievements by the purchases they required", () => {
        const progress = progressFor([
            ACHIEVEMENT_KEYS.FIVE_PURCHASES,
            ACHIEVEMENT_KEYS.FIRST_PURCHASE,
            ACHIEVEMENT_KEYS.THREE_PURCHASES,
        ]);

        expect(progress.unlockedAchievements).toEqual([
            ACHIEVEMENT_NAMES.FIRST_PURCHASE,
            ACHIEVEMENT_NAMES.THREE_PURCHASES,
            ACHIEVEMENT_NAMES.FIVE_PURCHASES,
        ]);
    });

    it("ignores unlocked keys with no matching definition", () => {
        const RETIRED_KEY = "RETIRED_ACHIEVEMENT";

        const progress = progressFor([
            ACHIEVEMENT_KEYS.FIRST_PURCHASE,
            RETIRED_KEY,
        ]);

        expect(progress.unlockedAchievements).toEqual([
            ACHIEVEMENT_NAMES.FIRST_PURCHASE,
        ]);
    });

    it("reports no badge at all when none are configured", () => {
        const progress = resolveAchievementProgress({
            achievementDefinitions,
            badgeDefinitions: [],
            unlockedAchievementKeys: [ACHIEVEMENT_KEYS.FIRST_PURCHASE],
        });

        expect(progress.currentBadge).toBeNull();
        expect(progress.nextBadge).toBeNull();
        expect(progress.remainingToUnlockNextBadge).toBe(0);
    });

    it("keeps the fixture ladder in one group", () => {
        const groups = new Set(
            achievementDefinitions.map(
                ({ achievementGroupKey }) => achievementGroupKey,
            ),
        );

        expect([...groups]).toEqual([ACHIEVEMENT_GROUP_KEYS.PURCHASES]);
    });
});
