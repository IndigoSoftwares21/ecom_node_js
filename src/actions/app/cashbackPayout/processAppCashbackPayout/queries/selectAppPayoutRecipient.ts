import { db } from "@/database";

interface ISelectAppPayoutRecipient {
    userId: string;
    provider: string;
    currencyCode: string;
}

const selectAppPayoutRecipient = async ({
    userId,
    provider,
    currencyCode,
}: ISelectAppPayoutRecipient) => {
    const data = await db
        .selectFrom("payoutRecipients")
        .select([
            "payoutRecipientId",
            "bankCode",
            "bankAccountNumber",
            "bankAccountName",
            "currencyCode",
            "providerRecipientCode",
        ])
        .where("userId", "=", userId)
        .where("provider", "=", provider)
        .where("currencyCode", "=", currencyCode)
        .executeTakeFirst();

    return data;
};

export default selectAppPayoutRecipient;
