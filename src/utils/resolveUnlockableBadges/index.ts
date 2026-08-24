export interface IBadgeDefinition {
    badgeKey: string;
    badgeName: string;
    requiredAchievementCount: number;
}

interface IResolveUnlockableBadges {
    definitions: IBadgeDefinition[];
    unlockedAchievementCount: number;
}

/**
 * Returns every badge the unlocked-achievement count entitles the user to,
 * including ones they already hold. Derived rather than incremental for the
 * same reasons as resolveUnlockableAchievements.
 */
const resolveUnlockableBadges = ({
    definitions,
    unlockedAchievementCount,
}: IResolveUnlockableBadges): IBadgeDefinition[] =>
    definitions.filter(
        ({ requiredAchievementCount }) =>
            requiredAchievementCount <= unlockedAchievementCount,
    );

export default resolveUnlockableBadges;
