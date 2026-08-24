import type { DatabaseExecutor } from "@/database/executor";
import resolveUnlockableAchievements, {
    type IAchievementDefinition,
} from "@/utils/resolveUnlockableAchievements";
import selectAppUserCompletedProductPurchaseCount from "./queries/selectAppUserCompletedProductPurchaseCount";
import selectAppAchievementDefinitions from "./queries/selectAppAchievementDefinitions";
import insertAppUserAchievements from "./queries/insertAppUserAchievements";

interface IUnlockAppUserAchievements {
    trx: DatabaseExecutor;
    userId: string;
}

/**
 * Unlocks every achievement the user's purchase count entitles them to and
 * returns only the ones newly unlocked by this call, so the caller can emit one
 * event per genuine unlock.
 */
const unlockAppUserAchievements = async ({
    trx,
    userId,
}: IUnlockAppUserAchievements): Promise<{ data: IAchievementDefinition[] }> => {
    const { completedProductPurchaseCount } =
        await selectAppUserCompletedProductPurchaseCount({ trx, userId });

    const definitions = await selectAppAchievementDefinitions({ trx });

    const unlockable = resolveUnlockableAchievements({
        definitions,
        completedProductPurchaseCount,
    });

    if (!unlockable.length) {
        return { data: [] };
    }

    const inserted = await insertAppUserAchievements({
        trx,
        userId,
        achievementKeys: unlockable.map(
            ({ achievementKey }) => achievementKey,
        ),
    });

    const insertedKeys = new Set(
        inserted.map(({ achievementKey }) => achievementKey),
    );

    const data = unlockable.filter(({ achievementKey }) =>
        insertedKeys.has(achievementKey),
    );

    return { data };
};

export default unlockAppUserAchievements;
