import { db } from "@/database";

interface ISelectAppBadgeKeyByName {
    badgeName: string;
}

const selectAppBadgeKeyByName = async ({
    badgeName,
}: ISelectAppBadgeKeyByName) => {
    const data = await db
        .selectFrom("badges")
        .select(["badgeKey"])
        .where("badgeName", "=", badgeName)
        .executeTakeFirst();

    return data;
};

export default selectAppBadgeKeyByName;
