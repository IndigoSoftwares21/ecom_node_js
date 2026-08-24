import resolveAchievementProgress from "@/utils/resolveAchievementProgress";
import selectAppUserUnlockedAchievementKeys from "./queries/selectAppUserUnlockedAchievementKeys";
import selectAppAchievementCatalogue from "./queries/selectAppAchievementCatalogue";
import selectAppBadgeCatalogue from "./queries/selectAppBadgeCatalogue";

interface IFetchAppUserAchievements {
    userId: string;
}

/**
 * Read-only, so the three queries run concurrently on separate pool
 * connections. Only the unlocked keys are volatile — both catalogues are seed
 * data — so there is no cross-read inconsistency to guard against, and no
 * transaction is needed.
 */
const fetchAppUserAchievements = async ({
    userId,
}: IFetchAppUserAchievements) => {
    const [unlockedAchievements, achievementDefinitions, badgeDefinitions] =
        await Promise.all([
            selectAppUserUnlockedAchievementKeys({ userId }),
            selectAppAchievementCatalogue(),
            selectAppBadgeCatalogue(),
        ]);

    const data = resolveAchievementProgress({
        achievementDefinitions,
        badgeDefinitions,
        unlockedAchievementKeys: unlockedAchievements.map(
            ({ achievementKey }) => achievementKey,
        ),
    });

    return { data };
};

export default fetchAppUserAchievements;
