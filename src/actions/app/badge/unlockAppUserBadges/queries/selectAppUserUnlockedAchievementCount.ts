import type { DatabaseExecutor } from "@/database/executor";

interface ISelectAppUserUnlockedAchievementCount {
    trx: DatabaseExecutor;
    userId: string;
}

const selectAppUserUnlockedAchievementCount = async ({
    trx,
    userId,
}: ISelectAppUserUnlockedAchievementCount) => {
    const data = await trx
        .selectFrom("appUserAchievements")
        .select((eb) => eb.fn.countAll<number>().as("unlockedAchievementCount"))
        .where("userId", "=", userId)
        .executeTakeFirstOrThrow();

    return data;
};

export default selectAppUserUnlockedAchievementCount;
