import unlockAppUserAchievements from "@/actions/app/achievement/unlockAppUserAchievements";
import unlockAppUserBadges from "@/actions/app/badge/unlockAppUserBadges";
import fetchAppUser from "@/actions/app/user/fetchAppUser";
import createAppCashbackPayouts from "@/actions/app/cashbackPayout/createAppCashbackPayouts";
import recordOutboxEvents from "@/events/recordOutboxEvents";
import type {
    DomainEventListener,
    IProductPurchasedPayload,
} from "@/events/types";
import DOMAIN_EVENTS from "@/constants/domain_events";
import AGGREGATE_TYPES from "@/constants/aggregate_types";

/**
 * Unlocks achievements, then badges, then records one event per genuine unlock.
 *
 * Order matters: badge thresholds are measured against the achievement count
 * this transaction just wrote. The achievement_name and badge_name payload keys
 * are snake_case because the specification defines them that way.
 */
const unlockAchievementsOnProductPurchased: DomainEventListener<
    IProductPurchasedPayload
> = async ({ trx, payload }) => {
    const { userId } = payload;

    const { data: unlockedAchievements } = await unlockAppUserAchievements({
        trx,
        userId,
    });

    const { data: unlockedBadges } = await unlockAppUserBadges({
        trx,
        userId,
    });

    if (!unlockedAchievements.length && !unlockedBadges.length) {
        return;
    }

    await createAppCashbackPayouts({
        trx,
        userId,
        badgeKeys: unlockedBadges.map(({ badgeKey }) => badgeKey),
        currencyCode: payload.currencyCode,
    });

    const { data: user } = await fetchAppUser({ trx, userId });

    await recordOutboxEvents({
        trx,
        events: [
            ...unlockedAchievements.map(({ achievementName }) => ({
                eventName: DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED,
                aggregateType: AGGREGATE_TYPES.APP_USER,
                aggregateId: userId,
                payload: { achievement_name: achievementName, user },
            })),
            ...unlockedBadges.map(({ badgeName }) => ({
                eventName: DOMAIN_EVENTS.BADGE_UNLOCKED,
                aggregateType: AGGREGATE_TYPES.APP_USER,
                aggregateId: userId,
                payload: { badge_name: badgeName, user },
            })),
        ],
    });
};

export default unlockAchievementsOnProductPurchased;
