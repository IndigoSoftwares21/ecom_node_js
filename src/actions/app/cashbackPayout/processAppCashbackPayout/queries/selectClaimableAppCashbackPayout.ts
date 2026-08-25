import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";

interface ISelectClaimableAppCashbackPayout {
    userId: string;
    badgeKey: string;
}

/**
 * Reads the payout without claiming it, so preconditions can be checked before
 * an attempt is spent. Claiming here would count "the customer has not given us
 * their bank details yet" as a failed attempt against the retry budget.
 */
const selectClaimableAppCashbackPayout = async ({
    userId,
    badgeKey,
}: ISelectClaimableAppCashbackPayout) => {
    const data = await db
        .selectFrom("cashbackPayouts")
        .select([
            "cashbackPayoutId",
            "userId",
            "badgeKey",
            "amountInMinorUnits",
            "currencyCode",
            "provider",
            "status",
        ])
        .where("userId", "=", userId)
        .where("badgeKey", "=", badgeKey)
        .where("status", "in", [
            CASHBACK_PAYOUT_STATUSES.PENDING,
            CASHBACK_PAYOUT_STATUSES.FAILED,
        ])
        .executeTakeFirst();

    return data;
};

export default selectClaimableAppCashbackPayout;
