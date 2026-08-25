import { sql } from "kysely";
import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";

interface ISelectUnsettledCashbackPayouts {
    batchSize: number;
    maxAttemptCount: number;
    minimumAgeSeconds: number;
}

/**
 * Payouts owed but not sent. PROCESSING is excluded so an in-flight transfer is
 * left alone, and the age filter keeps the sweeper from racing the queue on a
 * payout that was only just created.
 */
const selectUnsettledCashbackPayouts = async ({
    batchSize,
    maxAttemptCount,
    minimumAgeSeconds,
}: ISelectUnsettledCashbackPayouts) => {
    const data = await db
        .selectFrom("cashbackPayouts")
        .select(["cashbackPayoutId", "userId", "badgeKey", "attemptCount"])
        .where("status", "in", [
            CASHBACK_PAYOUT_STATUSES.PENDING,
            CASHBACK_PAYOUT_STATUSES.FAILED,
        ])
        .where("attemptCount", "<", maxAttemptCount)
        .where(
            "createdAt",
            "<",
            sql<Date>`now() - make_interval(secs => ${minimumAgeSeconds})`,
        )
        .orderBy("createdAt", "asc")
        .limit(batchSize)
        .execute();

    return data;
};

export default selectUnsettledCashbackPayouts;

