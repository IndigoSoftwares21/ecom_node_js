import type { DatabaseExecutor } from "@/database/executor";

interface ISelectBadgeDefinitions {
    trx: DatabaseExecutor;
}

const selectAppBadgeDefinitions = async ({ trx }: ISelectBadgeDefinitions) => {
    const data = await trx
        .selectFrom("badges")
        .select(["badgeKey", "badgeName", "requiredAchievementCount"])
        .execute();

    return data;
};

export default selectAppBadgeDefinitions;
