import { sql } from "kysely";
import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";

interface IClaimAppCashbackPayout {
    userId: string;
    badgeKey: string;
}

/**
 * Claims the payout by moving it out of PENDING in a single conditional update.
 * Whichever worker wins gets the row back; every other delivery of the same
 * event matches no row and returns undefined, so the transfer is attempted once
 * even when the queue delivers twice.
 *
 * FAILED is claimable so a retry can pick up where a transient provider error
 * left off.
 */
const claimAppCashbackPayout = async ({
    userId,
    badgeKey,
}: IClaimAppCashbackPayout) => {
    const data = await db
        .updateTable("cashbackPayouts")
        .set({
            status: CASHBACK_PAYOUT_STATUSES.PROCESSING,
            attemptCount: sql<number>`attempt_count + 1`,
            updatedAt: new Date(),
        })
        .where("userId", "=", userId)
        .where("badgeKey", "=", badgeKey)
        .where("status", "in", [
            CASHBACK_PAYOUT_STATUSES.PENDING,
            CASHBACK_PAYOUT_STATUSES.FAILED,
        ])
        .returning([
            "cashbackPayoutId",
            "userId",
            "badgeKey",
            "amountInMinorUnits",
            "currencyCode",
            "provider",
            "attemptCount",
        ])
        .executeTakeFirst();

    return data;
};

export default claimAppCashbackPayout;
