import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";

interface IRecordAppCashbackPayoutBlocked {
    cashbackPayoutId: string;
    lastErrorMessage: string;
}

/**
 * Records why a payout cannot proceed while leaving it PENDING and its attempt
 * count untouched. A missing precondition is not a spent attempt: the customer
 * may supply what is needed at any point, and the next sweep should still try.
 */
const recordAppCashbackPayoutBlocked = async ({
    cashbackPayoutId,
    lastErrorMessage,
}: IRecordAppCashbackPayoutBlocked) => {
    const data = await db
        .updateTable("cashbackPayouts")
        .set({
            status: CASHBACK_PAYOUT_STATUSES.PENDING,
            lastErrorMessage,
            updatedAt: new Date(),
        })
        .where("cashbackPayoutId", "=", cashbackPayoutId)
        .returning(["cashbackPayoutId", "status", "attemptCount"])
        .executeTakeFirstOrThrow();

    return data;
};

export default recordAppCashbackPayoutBlocked;
