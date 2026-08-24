import processAppCashbackPayout from "@/actions/app/cashbackPayout/processAppCashbackPayout";
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

    await processAppCashbackPayout({ userId: aggregateId, badgeName });
};

export default handleBadgeUnlocked;
