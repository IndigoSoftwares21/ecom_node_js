import { db } from "@/database";

/**
 * Every achievement definition, not just the user's. The endpoint has to name
 * the next one they can unlock, which by definition they do not hold yet.
 */
const selectAppAchievementCatalogue = async () => {
    const data = await db
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

export default selectAppAchievementCatalogue;
