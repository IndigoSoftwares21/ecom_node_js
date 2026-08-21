import { db } from "@/database";

describe("seeded reference data", () => {
    it("seeds NGN with two minor units", async () => {
        const currency = await db
            .selectFrom("currencies")
            .select(["isoCurrencyCode", "currencyName", "minorUnitExponent"])
            .where("isoCurrencyCode", "=", "NGN")
            .executeTakeFirst();

        expect(currency).toEqual({
            isoCurrencyCode: "NGN",
            currencyName: "Nigerian Naira",
            minorUnitExponent: 2,
        });
    });

    it("seeds enough purchase achievements to reach the top badge", async () => {
        const achievements = await db
            .selectFrom("achievements")
            .select(["achievementKey", "requiredProductPurchaseCount"])
            .orderBy("requiredProductPurchaseCount", "asc")
            .execute();

        const topBadge = await db
            .selectFrom("badges")
            .select(["requiredAchievementCount"])
            .orderBy("requiredAchievementCount", "desc")
            .executeTakeFirstOrThrow();

        expect(achievements.length).toBeGreaterThanOrEqual(
            topBadge.requiredAchievementCount,
        );
    });

    it("names the first two achievements as the brief specifies", async () => {
        const achievements = await db
            .selectFrom("achievements")
            .select(["achievementName", "requiredProductPurchaseCount"])
            .where("requiredProductPurchaseCount", "in", [1, 5])
            .orderBy("requiredProductPurchaseCount", "asc")
            .execute();

        expect(achievements).toEqual([
            { achievementName: "First Purchase", requiredProductPurchaseCount: 1 },
            { achievementName: "5 Purchases", requiredProductPurchaseCount: 5 },
        ]);
    });

    it("reproduces the brief's example: 5 unlocked leaves 3 to Advanced", async () => {
        const unlockedAchievementCount = 5;

        const nextBadge = await db
            .selectFrom("badges")
            .select(["badgeName", "requiredAchievementCount"])
            .where("requiredAchievementCount", ">", unlockedAchievementCount)
            .orderBy("requiredAchievementCount", "asc")
            .executeTakeFirstOrThrow();

        expect(nextBadge.badgeName).toBe("Advanced");
        expect(
            nextBadge.requiredAchievementCount - unlockedAchievementCount,
        ).toBe(3);
    });

    it("pays 300 NGN in minor units for every badge", async () => {
        const amounts = await db
            .selectFrom("badgeCashbackAmounts")
            .select(["badgeKey", "amountInMinorUnits", "currencyCode"])
            .where("currencyCode", "=", "NGN")
            .execute();

        expect(amounts).toHaveLength(3);

        amounts.forEach((amount) => {
            expect(amount.amountInMinorUnits).toBe(30000);
            // Proves the int8 parser is registered: without it this is "30000".
            expect(typeof amount.amountInMinorUnits).toBe("number");
        });
    });
});
