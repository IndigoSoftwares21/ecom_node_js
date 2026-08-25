import { randomUUID } from "crypto";
import { db } from "@/database";

const createTestAppUser = async () => {
    const appUser = await db
        .insertInto("appUsers")
        // A random local part keeps the address unique regardless of how test
        // files are ordered or split across workers.
        .values({
            emailAddress: `test.user.${randomUUID()}@example.com`,
            firstName: "Ada",
            middleName: null,
            lastName: "Obi",
        })
        .returning(["userId", "emailAddress", "firstName", "lastName"])
        .executeTakeFirstOrThrow();

    return appUser;
};

export default createTestAppUser;
