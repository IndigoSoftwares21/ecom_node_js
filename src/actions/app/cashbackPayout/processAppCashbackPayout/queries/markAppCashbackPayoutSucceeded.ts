import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";

interface IMarkAppCashbackPayoutSucceeded {
    cashbackPayoutId: string;
    providerReference: string;
    payoutRecipientId: string;
}

const markAppCashbackPayoutSucceeded = async ({
    cashbackPayoutId,
    providerReference,
    payoutRecipientId,
}: IMarkAppCashbackPayoutSucceeded) => {
    const data = await db
        .updateTable("cashbackPayouts")
        .set({
            status: CASHBACK_PAYOUT_STATUSES.SUCCEEDED,
            providerReference,
            payoutRecipientId,
            lastErrorMessage: null,
            updatedAt: new Date(),
        })
        .where("cashbackPayoutId", "=", cashbackPayoutId)
        .returning(["cashbackPayoutId", "status", "providerReference"])
        .executeTakeFirstOrThrow();

    return data;
};

export default markAppCashbackPayoutSucceeded;
