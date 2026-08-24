import type { DatabaseExecutor } from "@/database/executor";

interface ISelectAppUser {
    trx: DatabaseExecutor;
    userId: string;
}

const selectAppUser = async ({ trx, userId }: ISelectAppUser) => {
    const data = await trx
        .selectFrom("appUsers")
        .select([
            "userId",
            "emailAddress",
            "firstName",
            "middleName",
            "lastName",
            "isActive",
            "createdAt",
            "updatedAt",
        ])
        .where("userId", "=", userId)
        .executeTakeFirst();

    return data;
};

export default selectAppUser;
