import type { IAchievementDefinition } from "@/utils/resolveUnlockableAchievements";
import type { IBadgeDefinition } from "@/utils/resolveUnlockableBadges";

interface IResolveAchievementProgress {
    achievementDefinitions: IAchievementDefinition[];
    badgeDefinitions: IBadgeDefinition[];
    unlockedAchievementKeys: string[];
}

export interface IAchievementProgress {
    unlockedAchievements: string[];
    nextAvailableAchievements: string[];
    currentBadge: string | null;
    nextBadge: string | null;
    remainingToUnlockNextBadge: number;
}

/**
 * Builds the achievements endpoint payload from definitions plus the keys the
 * user holds. Pure so the rules can be tested without a database.
 *
 * nextAvailableAchievements yields at most one entry per achievement group: the
 * cheapest not-yet-unlocked achievement in that group, per the brief's "only
 * the next available achievement should be returned for each group".
 */
const resolveAchievementProgress = ({
    achievementDefinitions,
    badgeDefinitions,
    unlockedAchievementKeys,
}: IResolveAchievementProgress): IAchievementProgress => {
    const unlocked = new Set(unlockedAchievementKeys);

    const unlockedAchievements = achievementDefinitions
        .filter(({ achievementKey }) => unlocked.has(achievementKey))
        .sort(
            (first, second) =>
                first.requiredProductPurchaseCount -
                second.requiredProductPurchaseCount,
        )
        .map(({ achievementName }) => achievementName);

    const nextByGroup = new Map<string, IAchievementDefinition>();

    achievementDefinitions
        .filter(({ achievementKey }) => !unlocked.has(achievementKey))
        .forEach((definition) => {
            const currentNext = nextByGroup.get(definition.achievementGroupKey);

            if (
                !currentNext ||
                definition.requiredProductPurchaseCount <
                    currentNext.requiredProductPurchaseCount
            ) {
                nextByGroup.set(definition.achievementGroupKey, definition);
            }
        });

    const nextAvailableAchievements = [...nextByGroup.values()]
        .sort(
            (first, second) =>
                first.requiredProductPurchaseCount -
                second.requiredProductPurchaseCount,
        )
        .map(({ achievementName }) => achievementName);

    const orderedBadges = [...badgeDefinitions].sort(
        (first, second) =>
            first.requiredAchievementCount - second.requiredAchievementCount,
    );

    const earnedBadges = orderedBadges.filter(
        ({ requiredAchievementCount }) =>
            requiredAchievementCount <= unlocked.size,
    );

    const nextBadge = orderedBadges.find(
        ({ requiredAchievementCount }) =>
            requiredAchievementCount > unlocked.size,
    );

    return {
        unlockedAchievements,
        nextAvailableAchievements,
        // null rather than a placeholder: a user with no achievements has no
        // badge, and a user holding the top badge has nothing left to earn.
        currentBadge: earnedBadges.at(-1)?.badgeName ?? null,
        nextBadge: nextBadge?.badgeName ?? null,
        remainingToUnlockNextBadge: nextBadge
            ? nextBadge.requiredAchievementCount - unlocked.size
            : 0,
    };
};

export default resolveAchievementProgress;
