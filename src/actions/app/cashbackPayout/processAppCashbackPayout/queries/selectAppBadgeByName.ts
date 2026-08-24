import { db } from "@/database";

interface ISelectAppBadgeByName {
    badgeName: string;
}

const selectAppBadgeByName = async ({ badgeName }: ISelectAppBadgeByName) => {
    const data = await db
        .selectFrom("badges")
        .select(["badgeKey", "badgeName"])
        .where("badgeName", "=", badgeName)
        .executeTakeFirst();

    return data;
};

export default selectAppBadgeByName;
