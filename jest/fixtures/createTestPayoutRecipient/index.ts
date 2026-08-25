import { db } from "@/database";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";
import { TEST_CURRENCY_CODE } from "@fixtures/achievements";

const TEST_BANK = {
    CODE: "058",
    ACCOUNT_NUMBER: "0123456789",
    ACCOUNT_NAME: "Ada Obi",
} as const;

interface ICreateTestPayoutRecipient {
    userId: string;
    currencyCode?: string;
}

const createTestPayoutRecipient = async ({
    userId,
    currencyCode = TEST_CURRENCY_CODE,
}: ICreateTestPayoutRecipient) => {
    const recipient = await db
        .insertInto("payoutRecipients")
        .values({
            userId,
            provider: PAYMENT_PROVIDERS.PAYSTACK,
            currencyCode,
            bankCode: TEST_BANK.CODE,
            bankAccountNumber: TEST_BANK.ACCOUNT_NUMBER,
            bankAccountName: TEST_BANK.ACCOUNT_NAME,
        })
        .returning(["payoutRecipientId"])
        .executeTakeFirstOrThrow();

    return recipient;
};

export default createTestPayoutRecipient;
