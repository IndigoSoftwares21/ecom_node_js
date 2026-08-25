import monitoring from "@/utils/monitoring";
import processAppCashbackPayout from "@/actions/app/cashbackPayout/processAppCashbackPayout";
import selectUnsettledCashbackPayouts from "./queries/selectUnsettledCashbackPayouts";

interface ISettleUnsettledCashbackPayouts {
    batchSize: number;
    maxAttemptCount: number;
    minimumAgeSeconds: number;
}

/**
 * Retries cashback the system still owes.
 *
 * The queue cannot recover these: a payout that failed for a recorded reason
 * completed its job successfully, and its outbox event is already PUBLISHED, so
 * nothing redelivers it. The database is the record of what is owed, so this
 * reads from there rather than from Redis.
 *
 * It also covers the ordinary case of a customer adding bank details after
 * earning a badge — the next sweep settles what was waiting for them.
 */
const settleUnsettledCashbackPayouts = async ({
    batchSize,
    maxAttemptCount,
    minimumAgeSeconds,
}: ISettleUnsettledCashbackPayouts) => {
    const payouts = await selectUnsettledCashbackPayouts({
        batchSize,
        maxAttemptCount,
        minimumAgeSeconds,
    });

    let settledCount = 0;

    for (const payout of payouts) {
        try {
            const { data } = await processAppCashbackPayout({
                userId: payout.userId,
                badgeKey: payout.badgeKey,
            });

            if (data) {
                settledCount += 1;
            }
        } catch (error) {
            // Already recorded against the payout row; swallowed so one
            // unsettleable payout cannot stop the rest of the batch.
            monitoring.error(
                `Sweeping cashback payout ${payout.cashbackPayoutId} failed`,
                error as Error,
            );
        }
    }

    return { data: { sweptCount: payouts.length, settledCount } };
};

export default settleUnsettledCashbackPayouts;
