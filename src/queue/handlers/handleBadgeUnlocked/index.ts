import processAppCashbackPayout from "@/actions/app/cashbackPayout/processAppCashbackPayout";
import fetchAppBadgeKeyByName from "@/actions/app/badge/fetchAppBadgeKeyByName";
import NonRetryablePaymentError from "@/services/payment/nonRetryablePaymentError";
import type { IDomainEventJob } from "@/queue/domainEventQueue";

interface IBadgeUnlockedPayload {
    badge_name?: string;
}

const handleBadgeUnlocked = async ({
    aggregateId,
    payload,
}: IDomainEventJob): Promise<void> => {
    const { badge_name: badgeName } = payload as IBadgeUnlockedPayload;

    if (!badgeName) {
        throw new NonRetryablePaymentError(
            "BadgeUnlocked payload is missing badge_name",
        );
    }

    const { data: badge } = await fetchAppBadgeKeyByName({ badgeName });

    if (!badge) {
        throw new NonRetryablePaymentError(
            `No badge found named ${badgeName}`,
        );
    }

    await processAppCashbackPayout({
        userId: aggregateId,
        badgeKey: badge.badgeKey,
    });
};

export default handleBadgeUnlocked;
