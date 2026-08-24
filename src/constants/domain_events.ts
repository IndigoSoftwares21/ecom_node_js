/**
 * AchievementUnlocked and BadgeUnlocked are a published contract, so the
 * casing of both the names and their payload keys is fixed by specification
 * rather than by internal convention.
 */
const DOMAIN_EVENTS = {
    PRODUCT_PURCHASED: "ProductPurchased",
    ACHIEVEMENT_UNLOCKED: "AchievementUnlocked",
    BADGE_UNLOCKED: "BadgeUnlocked",
} as const;

export type DomainEventName =
    (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export default DOMAIN_EVENTS;
