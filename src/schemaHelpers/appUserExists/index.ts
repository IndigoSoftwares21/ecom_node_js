import { db } from "@/database";

interface IAppUserExists {
    userId: string;
}

const appUserExists = async ({ userId }: IAppUserExists): Promise<boolean> => {
    const appUser = await db
        .selectFrom("appUsers")
        .select(["userId"])
        .where("userId", "=", userId)
        .executeTakeFirst();

    return Boolean(appUser);
};

export default appUserExists;
