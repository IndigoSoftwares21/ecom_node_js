import type { DatabaseExecutor } from "@/database/executor";
import resolveUnlockableBadges, {
    type IBadgeDefinition,
} from "@/utils/resolveUnlockableBadges";
import selectAppUserUnlockedAchievementCount from "./queries/selectAppUserUnlockedAchievementCount";
import selectAppBadgeDefinitions from "./queries/selectAppBadgeDefinitions";
import insertAppUserBadges from "./queries/insertAppUserBadges";

interface IUnlockAppUserBadges {
    trx: DatabaseExecutor;
    userId: string;
}

/**
 * Must run after achievements are unlocked in the same transaction: the badge
 * threshold is measured against the achievement count this transaction wrote.
 */
const unlockAppUserBadges = async ({
    trx,
    userId,
}: IUnlockAppUserBadges): Promise<{ data: IBadgeDefinition[] }> => {
    const { unlockedAchievementCount } =
        await selectAppUserUnlockedAchievementCount({ trx, userId });

    const definitions = await selectAppBadgeDefinitions({ trx });

    const unlockable = resolveUnlockableBadges({
        definitions,
        unlockedAchievementCount,
    });

    if (!unlockable.length) {
        return { data: [] };
    }

    const inserted = await insertAppUserBadges({
        trx,
        userId,
        badgeKeys: unlockable.map(({ badgeKey }) => badgeKey),
    });

    const insertedKeys = new Set(inserted.map(({ badgeKey }) => badgeKey));

    const data = unlockable.filter(({ badgeKey }) =>
        insertedKeys.has(badgeKey),
    );

    return { data };
};

export default unlockAppUserBadges;
