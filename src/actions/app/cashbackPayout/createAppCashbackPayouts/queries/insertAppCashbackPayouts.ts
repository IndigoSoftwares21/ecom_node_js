import type { DatabaseExecutor } from "@/database/executor";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";

export interface ICashbackPayoutInput {
    badgeKey: string;
    amountInMinorUnits: number;
    currencyCode: string;
}

interface IInsertAppCashbackPayouts {
    trx: DatabaseExecutor;
    userId: string;
    payouts: ICashbackPayoutInput[];
}

/**
 * UNIQUE (user_id, badge_key) means a badge can only ever owe one cashback, so
 * a redelivered award cannot create a second obligation. RETURNING exposes only
 * rows that genuinely inserted.
 */
const insertAppCashbackPayouts = async ({
    trx,
    userId,
    payouts,
}: IInsertAppCashbackPayouts) => {
    const data = await trx
        .insertInto("cashbackPayouts")
        .values(
            payouts.map(({ badgeKey, amountInMinorUnits, currencyCode }) => ({
                userId,
                badgeKey,
                amountInMinorUnits,
                currencyCode,
                provider: PAYMENT_PROVIDERS.PAYSTACK,
            })),
        )
        .onConflict((onConflict) =>
            onConflict.columns(["userId", "badgeKey"]).doNothing(),
        )
        .returning([
            "cashbackPayoutId",
            "badgeKey",
            "amountInMinorUnits",
            "currencyCode",
        ])
        .execute();

    return data;
};

export default insertAppCashbackPayouts;
