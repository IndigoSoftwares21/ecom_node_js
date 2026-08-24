import { db } from "@/database";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";

interface IInsertAppPayoutRecipient {
    userId: string;
    currencyCode: string;
    bankCode: string;
    bankAccountNumber: string;
    bankAccountName: string;
}

/**
 * One recipient per user, provider and currency, so re-posting updates the
 * account on file rather than colliding.
 *
 * The cached provider_recipient_code is cleared on update: it identifies the
 * previous account at the provider, and reusing it would send the transfer to
 * the account the user just replaced.
 */
const insertAppPayoutRecipient = async ({
    userId,
    currencyCode,
    bankCode,
    bankAccountNumber,
    bankAccountName,
}: IInsertAppPayoutRecipient) => {
    const data = await db
        .insertInto("payoutRecipients")
        .values({
            userId,
            provider: PAYMENT_PROVIDERS.PAYSTACK,
            currencyCode,
            bankCode,
            bankAccountNumber,
            bankAccountName,
        })
        .onConflict((onConflict) =>
            onConflict
                .columns(["userId", "provider", "currencyCode"])
                .doUpdateSet({
                    bankCode,
                    bankAccountNumber,
                    bankAccountName,
                    providerRecipientCode: null,
                    updatedAt: new Date(),
                }),
        )
        .returning([
            "payoutRecipientId",
            "userId",
            "provider",
            "currencyCode",
            "bankCode",
            "bankAccountNumber",
            "bankAccountName",
            "createdAt",
        ])
        .executeTakeFirstOrThrow();

    return data;
};

export default insertAppPayoutRecipient;
