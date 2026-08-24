import { sql } from "kysely";
import { db } from "@/database";

interface IEmailAddressIsAvailable {
    emailAddress: string;
}

/**
 * Matches on lower(email_address) to use the case-insensitive unique index, so
 * the same address in different casing is correctly reported as taken.
 */
const emailAddressIsAvailable = async ({
    emailAddress,
}: IEmailAddressIsAvailable): Promise<boolean> => {
    const appUser = await db
        .selectFrom("appUsers")
        .select(["userId"])
        .where(sql`lower(email_address)`, "=", emailAddress.toLowerCase())
        .executeTakeFirst();

    return !appUser;
};

export default emailAddressIsAvailable;
