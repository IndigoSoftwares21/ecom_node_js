export interface IAchievementDefinition {
    achievementKey: string;
    achievementGroupKey: string;
    achievementName: string;
    requiredProductPurchaseCount: number;
}

interface IResolveUnlockableAchievements {
    definitions: IAchievementDefinition[];
    completedProductPurchaseCount: number;
}

/**
 * Returns every achievement the purchase count entitles the user to, including
 * ones they already hold.
 *
 * Deliberately derived from the count rather than from the previous unlock, so
 * the result is identical however many times it runs. That is what makes a
 * redelivered purchase event harmless, lets two concurrent purchases settle on
 * one outcome, and applies a newly configured achievement retroactively. The
 * caller discards the ones already held via ON CONFLICT DO NOTHING.
 */
const resolveUnlockableAchievements = ({
    definitions,
    completedProductPurchaseCount,
}: IResolveUnlockableAchievements): IAchievementDefinition[] =>
    definitions.filter(
        ({ requiredProductPurchaseCount }) =>
            requiredProductPurchaseCount <= completedProductPurchaseCount,
    );

export default resolveUnlockableAchievements;
