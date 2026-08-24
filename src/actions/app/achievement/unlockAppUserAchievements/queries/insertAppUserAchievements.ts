import type { DatabaseExecutor } from "@/database/executor";

interface IInsertAppUserAchievements {
    trx: DatabaseExecutor;
    userId: string;
    achievementKeys: string[];
}

/**
 * RETURNING after ON CONFLICT DO NOTHING yields only rows that genuinely
 * inserted. Callers rely on that to distinguish a first unlock from a replay.
 */
const insertAppUserAchievements = async ({
    trx,
    userId,
    achievementKeys,
}: IInsertAppUserAchievements) => {
    const data = await trx
        .insertInto("appUserAchievements")
        .values(
            achievementKeys.map((achievementKey) => ({
                userId,
                achievementKey,
            })),
        )
        .onConflict((onConflict) =>
            onConflict.columns(["userId", "achievementKey"]).doNothing(),
        )
        .returning("achievementKey")
        .execute();

    return data;
};

export default insertAppUserAchievements;
