import { db } from "@/database";

interface ISelectAppUserUnlockedAchievementKeys {
    userId: string;
}

const selectAppUserUnlockedAchievementKeys = async ({
    userId,
}: ISelectAppUserUnlockedAchievementKeys) => {
    const data = await db
        .selectFrom("appUserAchievements")
        .select(["achievementKey"])
        .where("userId", "=", userId)
        .execute();

    return data;
};

export default selectAppUserUnlockedAchievementKeys;
