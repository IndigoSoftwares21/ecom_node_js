import monitoring from "@/utils/monitoring";
import type { IDomainEventJob } from "@/queue/domainEventQueue";

interface IAchievementUnlockedPayload {
    achievement_name?: string;
}

/**
 * The brief requires the event to be fired, not acted on. Kept as an explicit
 * handler because this is where marketing segmentation or notifications attach,
 * and its presence is what makes the queue's routing complete.
 */
const handleAchievementUnlocked = async ({
    aggregateId,
    payload,
}: IDomainEventJob): Promise<void> => {
    const { achievement_name: achievementName } =
        payload as IAchievementUnlockedPayload;

    monitoring.info(
        `AchievementUnlocked handled: user ${aggregateId} unlocked ${achievementName}`,
    );
};

export default handleAchievementUnlocked;
