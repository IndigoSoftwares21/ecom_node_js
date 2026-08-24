import { db } from "@/database";

const selectAppBadgeCatalogue = async () => {
    const data = await db
        .selectFrom("badges")
        .select(["badgeKey", "badgeName", "requiredAchievementCount"])
        .execute();

    return data;
};

export default selectAppBadgeCatalogue;
