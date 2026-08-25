import { db, withTransaction } from "@/database";
import DOMAIN_EVENTS from "@/constants/domain_events";
import PRODUCT_PURCHASE_STATUSES from "@/constants/product_purchase_statuses";
import unlockAchievementsOnProductPurchased from "@/events/listeners/unlockAchievementsOnProductPurchased";
import createAppProductPurchase from ".";
import {
    ACHIEVEMENT_KEYS,
    ACHIEVEMENT_NAMES,
    ADVANCED_BADGE,
    CASHBACK_AMOUNT_IN_MINOR_UNITS,
    TEST_CURRENCY_CODE,
} from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";

const PURCHASE_AMOUNT = "5000.00";

const buy = async (userId: string, times = 1) => {
    for (let index = 0; index < times; index += 1) {
        await createAppProductPurchase({
            userId,
            amount: PURCHASE_AMOUNT,
            currencyCode: TEST_CURRENCY_CODE,
        });
    }
};

const unlockedKeys = async (userId: string) => {
    const rows = await db
        .selectFrom("appUserAchievements")
        .innerJoin(
            "achievements",
            "achievements.achievementKey",
            "appUserAchievements.achievementKey",
        )
        .select(["appUserAchievements.achievementKey"])
        .where("userId", "=", userId)
        .orderBy("achievements.requiredProductPurchaseCount")
        .execute();

    return rows.map(({ achievementKey }) => achievementKey);
};

const eventsOfType = async (userId: string, eventName: string) => {
    const rows = await db
        .selectFrom("outboxEvents")
        .select(["outboxEventId", "eventName"])
        .where("aggregateId", "=", userId)
        .where("eventName", "=", eventName)
        .execute();

    return rows;
};

describe("createAppProductPurchase", () => {
    it("unlocks the first achievement on the first purchase", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId);

        expect(await unlockedKeys(userId)).toEqual([
            ACHIEVEMENT_KEYS.FIRST_PURCHASE,
        ]);
    });

    it("unlocks the five purchase achievement on the fifth, per the specification", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId, 1);
        const afterFirst = await unlockedKeys(userId);

        await buy(userId, 4);
        const afterFifth = await unlockedKeys(userId);

        expect(afterFirst).toEqual([ACHIEVEMENT_KEYS.FIRST_PURCHASE]);
        expect(afterFifth).toContain(ACHIEVEMENT_KEYS.FIVE_PURCHASES);
        expect(afterFifth).toHaveLength(5);
    });

    it("records one AchievementUnlocked event per unlock and no more", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId, 5);

        const events = await eventsOfType(
            userId,
            DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED,
        );

        expect(events).toHaveLength(5);
    });

    it("awards the badge and its cashback once the ladder is complete", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId, ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT);

        const badges = await db
            .selectFrom("appUserBadges")
            .select(["badgeKey"])
            .where("userId", "=", userId)
            .execute();

        const payout = await db
            .selectFrom("cashbackPayouts")
            .select([
                "badgeKey",
                "amountInMinorUnits",
                "currencyCode",
                "status",
            ])
            .where("userId", "=", userId)
            .executeTakeFirstOrThrow();

        const badgeEvents = await eventsOfType(
            userId,
            DOMAIN_EVENTS.BADGE_UNLOCKED,
        );

        expect(badges.map(({ badgeKey }) => badgeKey)).toEqual([
            ADVANCED_BADGE.KEY,
        ]);
        expect(badgeEvents).toHaveLength(1);
        expect(payout).toMatchObject({
            badgeKey: ADVANCED_BADGE.KEY,
            amountInMinorUnits: CASHBACK_AMOUNT_IN_MINOR_UNITS,
            currencyCode: TEST_CURRENCY_CODE,
        });
    });

    it("does not unlock or re-announce anything when the event is redelivered", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId, 5);

        const keysBefore = await unlockedKeys(userId);
        const eventsBefore = await eventsOfType(
            userId,
            DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED,
        );

        // Replays the listener with no new purchase, which is what an
        // at-least-once queue delivery looks like.
        await withTransaction((trx) =>
            unlockAchievementsOnProductPurchased({
                trx,
                payload: {
                    userId,
                    productPurchaseId: "redelivered",
                    currencyCode: TEST_CURRENCY_CODE,
                },
            }),
        );

        expect(await unlockedKeys(userId)).toEqual(keysBefore);
        expect(
            await eventsOfType(userId, DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED),
        ).toHaveLength(eventsBefore.length);
    });

    it("unlocks once when two purchases cross a threshold concurrently", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId, 4);

        await Promise.all([buy(userId), buy(userId)]);

        const fiveUnlocks = await db
            .selectFrom("appUserAchievements")
            .select(["achievementKey"])
            .where("userId", "=", userId)
            .where("achievementKey", "=", ACHIEVEMENT_KEYS.FIVE_PURCHASES)
            .execute();

        const events = await db
            .selectFrom("outboxEvents")
            .select(["payload"])
            .where("aggregateId", "=", userId)
            .where("eventName", "=", DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED)
            .execute();

        const fiveEvents = events.filter((event) => {
            const payload = event.payload as Record<string, unknown>;

            return payload.achievementName === ACHIEVEMENT_NAMES.FIVE_PURCHASES;
        });

        expect(fiveUnlocks).toHaveLength(1);
        expect(fiveEvents).toHaveLength(1);
    });

    it("keeps unlocked achievements when a purchase is refunded", async () => {
        const { userId } = await createTestAppUser();

        await buy(userId, 5);

        const purchases = await db
            .selectFrom("productPurchases")
            .select(["productPurchaseId"])
            .where("userId", "=", userId)
            .limit(2)
            .execute();

        await db
            .updateTable("productPurchases")
            .set({ status: PRODUCT_PURCHASE_STATUSES.REFUNDED })
            .where(
                "productPurchaseId",
                "in",
                purchases.map(({ productPurchaseId }) => productPurchaseId),
            )
            .execute();

        await buy(userId);

        // The refund lowers the completed count, so nothing new unlocks, but
        // achievements already earned are never revoked.
        expect(await unlockedKeys(userId)).toHaveLength(5);
    });
});
