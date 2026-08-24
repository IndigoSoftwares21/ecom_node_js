import type { DatabaseExecutor } from "@/database/executor";

interface ISelectAchievementDefinitions {
    trx: DatabaseExecutor;
}

const selectAppAchievementDefinitions = async ({
    trx,
}: ISelectAchievementDefinitions) => {
    const data = await trx
        .selectFrom("achievements")
        .select([
            "achievementKey",
            "achievementGroupKey",
            "achievementName",
            "requiredProductPurchaseCount",
        ])
        .execute();

    return data;
};

export default selectAppAchievementDefinitions;
