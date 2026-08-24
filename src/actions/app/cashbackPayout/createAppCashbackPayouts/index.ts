import type { DatabaseExecutor } from "@/database/executor";
import monitoring from "@/utils/monitoring";
import selectAppBadgeCashbackAmounts from "./queries/selectAppBadgeCashbackAmounts";
import insertAppCashbackPayouts from "./queries/insertAppCashbackPayouts";

interface ICreateAppCashbackPayouts {
    trx: DatabaseExecutor;
    userId: string;
    badgeKeys: string[];
    currencyCode: string;
}

/**
 * Records what each newly earned badge owes, on the badge award's own
 * transaction, so the obligation survives any later failure of the payment
 * provider. Sending is a separate, retryable step.
 *
 * A badge with no configured amount for the user's currency is skipped rather
 * than raising: the customer earned the badge, and our payout configuration
 * being incomplete must not undo that. The gap is logged for operators.
 */
const createAppCashbackPayouts = async ({
    trx,
    userId,
    badgeKeys,
    currencyCode,
}: ICreateAppCashbackPayouts) => {
    if (!badgeKeys.length) {
        return { data: [] };
    }

    const cashbackAmounts = await selectAppBadgeCashbackAmounts({
        trx,
        badgeKeys,
        currencyCode,
    });

    const configuredBadgeKeys = new Set(
        cashbackAmounts.map(({ badgeKey }) => badgeKey),
    );

    badgeKeys
        .filter((badgeKey) => !configuredBadgeKeys.has(badgeKey))
        .forEach((badgeKey) => {
            monitoring.warn(
                `No cashback amount configured for badge ${badgeKey} in ${currencyCode}; badge awarded without a payout`,
            );
        });

    if (!cashbackAmounts.length) {
        return { data: [] };
    }

    const data = await insertAppCashbackPayouts({
        trx,
        userId,
        payouts: cashbackAmounts.map(
            ({ badgeKey, amountInMinorUnits, currencyCode: payoutCurrency }) => ({
                badgeKey,
                amountInMinorUnits,
                currencyCode: payoutCurrency,
            }),
        ),
    });

    return { data };
};

export default createAppCashbackPayouts;
