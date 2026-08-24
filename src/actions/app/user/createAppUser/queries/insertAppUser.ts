import { db } from "@/database";

interface IInsertAppUser {
    emailAddress: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
}

const insertAppUser = async ({
    emailAddress,
    firstName,
    middleName,
    lastName,
}: IInsertAppUser) => {
    const data = await db
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
