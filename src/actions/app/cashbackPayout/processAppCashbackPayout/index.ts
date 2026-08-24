import monitoring from "@/utils/monitoring";
import resolvePaymentProvider from "@/services/payment";
import NonRetryablePaymentError from "@/services/payment/nonRetryablePaymentError";
import selectAppBadgeByName from "./queries/selectAppBadgeByName";
import claimAppCashbackPayout from "./queries/claimAppCashbackPayout";
import selectAppPayoutRecipient from "./queries/selectAppPayoutRecipient";
import markAppCashbackPayoutSucceeded from "./queries/markAppCashbackPayoutSucceeded";
import recordAppCashbackPayoutFailure from "./queries/recordAppCashbackPayoutFailure";

interface IProcessAppCashbackPayout {
    userId: string;
    badgeName: string;
}

const TRANSFER_REASON_PREFIX = "Cashback for badge";

/**
 * Sends the cashback a badge owes, then records the outcome.
 *
 * The payout id is used as the provider's reference, so a retry after an
 * ambiguous timeout presents the same reference and the provider rejects the
 * duplicate rather than paying twice.
 *
 * Transient failures are rethrown for the queue to retry with backoff;
 * non-retryable ones are swallowed after being recorded, because repeating a
 * request the provider has already refused only wastes attempts.
 */
const processAppCashbackPayout = async ({
    userId,
    badgeName,
}: IProcessAppCashbackPayout) => {
    const badge = await selectAppBadgeByName({ badgeName });

    if (!badge) {
        throw new NonRetryablePaymentError(
            `No badge found named ${badgeName}`,
        );
    }

    const payout = await claimAppCashbackPayout({
        userId,
        badgeKey: badge.badgeKey,
    });

    if (!payout) {
        monitoring.info(
            `No claimable cashback payout for user ${userId} and badge ${badge.badgeKey}; already settled or in flight`,
        );

        return { data: null };
    }

    const recipient = await selectAppPayoutRecipient({
        userId,
        provider: payout.provider,
        currencyCode: payout.currencyCode,
    });

    if (!recipient) {
        const message = `No ${payout.currencyCode} payout recipient on file for user ${userId}`;

        await recordAppCashbackPayoutFailure({
            cashbackPayoutId: payout.cashbackPayoutId,
            lastErrorMessage: message,
        });

        monitoring.warn(message);

        return { data: null };
    }

    try {
        const { providerReference } = await resolvePaymentProvider().transfer({
            reference: payout.cashbackPayoutId,
            amountInMinorUnits: payout.amountInMinorUnits,
            currencyCode: payout.currencyCode,
            reason: `${TRANSFER_REASON_PREFIX} ${badge.badgeName}`,
            recipient: {
                bankCode: recipient.bankCode,
                bankAccountNumber: recipient.bankAccountNumber,
                bankAccountName: recipient.bankAccountName,
                currencyCode: recipient.currencyCode,
                providerRecipientCode: recipient.providerRecipientCode,
            },
        });

        const data = await markAppCashbackPayoutSucceeded({
            cashbackPayoutId: payout.cashbackPayoutId,
            providerReference,
            payoutRecipientId: recipient.payoutRecipientId,
        });

        return { data };
    } catch (error) {
        await recordAppCashbackPayoutFailure({
            cashbackPayoutId: payout.cashbackPayoutId,
            lastErrorMessage: (error as Error).message,
        });

        if (error instanceof NonRetryablePaymentError) {
            monitoring.error(
                `Cashback payout ${payout.cashbackPayoutId} permanently failed`,
                error as Error,
            );

            return { data: null };
        }

        throw error;
    }
};

export default processAppCashbackPayout;
