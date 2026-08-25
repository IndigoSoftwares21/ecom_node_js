import type { IAchievementDefinition } from "@/utils/resolveUnlockableAchievements";
import type { IBadgeDefinition } from "@/utils/resolveUnlockableBadges";

/**
 * Mirrors the seeded reference data so unit and integration tests describe the
 * same ladder. These keys are deliberately absent from src/constants: no
 * production code branches on an individual achievement or badge, which is what
 * lets a new one be added as a row rather than a code change.
 */
export const ACHIEVEMENT_GROUP_KEYS = {
    PURCHASES: "PURCHASES",
} as const;

export const ACHIEVEMENT_KEYS = {
    FIRST_PURCHASE: "FIRST_PURCHASE",
    TWO_PURCHASES: "TWO_PURCHASES",
    THREE_PURCHASES: "THREE_PURCHASES",
    FOUR_PURCHASES: "FOUR_PURCHASES",
    FIVE_PURCHASES: "FIVE_PURCHASES",
    SIX_PURCHASES: "SIX_PURCHASES",
    SEVEN_PURCHASES: "SEVEN_PURCHASES",
    EIGHT_PURCHASES: "EIGHT_PURCHASES",
} as const;

export const ACHIEVEMENT_NAMES = {
    FIRST_PURCHASE: "First Purchase",
    TWO_PURCHASES: "2 Purchases",
    THREE_PURCHASES: "3 Purchases",
    FOUR_PURCHASES: "4 Purchases",
    FIVE_PURCHASES: "5 Purchases",
    SIX_PURCHASES: "6 Purchases",
    SEVEN_PURCHASES: "7 Purchases",
    EIGHT_PURCHASES: "8 Purchases",
} as const;

export const ADVANCED_BADGE = {
    KEY: "ADVANCED",
    NAME: "Advanced",
    REQUIRED_ACHIEVEMENT_COUNT: 8,
} as const;

export const CASHBACK_AMOUNT_IN_MINOR_UNITS = 30000;

export const TEST_CURRENCY_CODE = "NGN";

const achievementKeyOrder = Object.keys(
    ACHIEVEMENT_KEYS,
) as (keyof typeof ACHIEVEMENT_KEYS)[];

export const achievementDefinitions: IAchievementDefinition[] =
    achievementKeyOrder.map((key, index) => ({
        achievementKey: ACHIEVEMENT_KEYS[key],
        achievementGroupKey: ACHIEVEMENT_GROUP_KEYS.PURCHASES,
        achievementName: ACHIEVEMENT_NAMES[key],
        requiredProductPurchaseCount: index + 1,
    }));

export const badgeDefinitions: IBadgeDefinition[] = [
    {
        badgeKey: ADVANCED_BADGE.KEY,
        badgeName: ADVANCED_BADGE.NAME,
        requiredAchievementCount: ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT,
    },
];
