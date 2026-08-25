import type { DatabaseExecutor } from "@/database/executor";

interface IInsertAppUser {
    trx: DatabaseExecutor;
    emailAddress: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
}

const insertAppUser = async ({
    trx,
    emailAddress,
    firstName,
    middleName,
    lastName,
}: IInsertAppUser) => {
    const data = await trx
        .insertInto("appUsers")
        .values({ emailAddress, firstName, middleName, lastName })
        .returning([
            "userId",
            "emailAddress",
            "firstName",
            "middleName",
            "lastName",
            "isActive",
            "createdAt",
        ])
        .executeTakeFirstOrThrow();

    return data;
};

export default insertAppUser;
