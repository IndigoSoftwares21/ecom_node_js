import request from "supertest";
import app from "@/app";
import HTTP_STATUSES from "@/constants/http_statuses";
import createAppProductPurchase from "@/actions/app/productPurchase/createAppProductPurchase";
import {
    ACHIEVEMENT_NAMES,
    ADVANCED_BADGE,
    TEST_CURRENCY_CODE,
} from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";

const PURCHASE_AMOUNT = "5000.00";

const achievementsPath = (userId: string) =>
    `/api/${process.env.API_VERSION ?? "v1"}/users/${userId}/achievements`;

const buy = async (userId: string, times: number) => {
    for (let index = 0; index < times; index += 1) {
        await createAppProductPurchase({
            userId,
            amount: PURCHASE_AMOUNT,
            currencyCode: TEST_CURRENCY_CODE,
        });
    }
};

afterAll(async () => {
    await app.closeServer();
});

describe("GET /users/:userId/achievements", () => {
    it("returns the specified fields for a user who has bought nothing", async () => {
        const { userId } = await createTestAppUser();

        const response = await request(app.express).get(
            achievementsPath(userId),
        );

        expect(response.status).toBe(HTTP_STATUSES.OK);
        expect(response.body.data).toEqual({
            unlocked_achievements: [],
            next_available_achievements: [ACHIEVEMENT_NAMES.FIRST_PURCHASE],
            current_badge: null,
            next_badge: ADVANCED_BADGE.NAME,
            remaining_to_unlock_next_badge:
                ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT,
        });
    });

    it("reproduces the specification's example after five purchases", async () => {
        const { userId } = await createTestAppUser();
        await buy(userId, 5);

        const response = await request(app.express).get(
            achievementsPath(userId),
        );

        expect(response.body.data).toMatchObject({
            unlocked_achievements: [
                ACHIEVEMENT_NAMES.FIRST_PURCHASE,
                ACHIEVEMENT_NAMES.TWO_PURCHASES,
                ACHIEVEMENT_NAMES.THREE_PURCHASES,
                ACHIEVEMENT_NAMES.FOUR_PURCHASES,
                ACHIEVEMENT_NAMES.FIVE_PURCHASES,
            ],
            next_available_achievements: [ACHIEVEMENT_NAMES.SIX_PURCHASES],
            next_badge: ADVANCED_BADGE.NAME,
            remaining_to_unlock_next_badge: 3,
        });
    });

    it("reports the badge held and no next badge once the ladder is complete", async () => {
        const { userId } = await createTestAppUser();
        await buy(userId, ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT);

        const response = await request(app.express).get(
            achievementsPath(userId),
        );

        expect(response.body.data).toMatchObject({
            next_available_achievements: [],
            current_badge: ADVANCED_BADGE.NAME,
            next_badge: null,
            remaining_to_unlock_next_badge: 0,
        });
    });

    it("rejects a user that does not exist", async () => {
        const response = await request(app.express).get(
            achievementsPath("6f8b9a1c-0d2e-4f3a-8b5c-7d9e1f2a3b4c"),
        );

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects an identifier that is not a uuid", async () => {
        const response = await request(app.express).get(
            achievementsPath("not-a-uuid"),
        );

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });
});
