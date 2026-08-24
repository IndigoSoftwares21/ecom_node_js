import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";

interface IRecordAppCashbackPayoutFailure {
    cashbackPayoutId: string;
    lastErrorMessage: string;
}

/**
 * Returns the payout to FAILED rather than PENDING so it is distinguishable from
 * one that has never been attempted, while staying claimable by a retry.
 */
const recordAppCashbackPayoutFailure = async ({
    cashbackPayoutId,
    lastErrorMessage,
}: IRecordAppCashbackPayoutFailure) => {
    const data = await db
        .updateTable("cashbackPayouts")
        .set({
            status: CASHBACK_PAYOUT_STATUSES.FAILED,
            lastErrorMessage,
            updatedAt: new Date(),
        })
        .where("cashbackPayoutId", "=", cashbackPayoutId)
        .returning(["cashbackPayoutId", "status", "attemptCount"])
        .executeTakeFirstOrThrow();

    return data;
};

export default recordAppCashbackPayoutFailure;
