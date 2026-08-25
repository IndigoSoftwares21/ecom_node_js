import request from "supertest";
import app from "@/app";
import HTTP_STATUSES from "@/constants/http_statuses";
import PRODUCT_PURCHASE_STATUSES from "@/constants/product_purchase_statuses";
import { db } from "@/database";
import { ACHIEVEMENT_KEYS, TEST_CURRENCY_CODE } from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";

const purchasesPath = `/api/${process.env.API_VERSION ?? "v1"}/product-purchases`;

const AMOUNT = "5000.00";

const AMOUNT_IN_MINOR_UNITS = 500000;

const post = (body: Record<string, unknown>) =>
    request(app.express).post(purchasesPath).send(body);

afterAll(async () => {
    await app.closeServer();
});

describe("POST /product-purchases", () => {
    it("records a completed purchase", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            amount: AMOUNT,
            currencyCode: TEST_CURRENCY_CODE,
        });

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(response.body.data).toMatchObject({
            userId,
            amountInMinorUnits: AMOUNT_IN_MINOR_UNITS,
            currencyCode: TEST_CURRENCY_CODE,
            status: PRODUCT_PURCHASE_STATUSES.COMPLETED,
        });
    });

    it.each([
        ["300", 30000],
        ["300.5", 30050],
        ["300.50", 30050],
        ["19.99", 1999],
        ["0.01", 1],
    ])(
        "converts %s naira to %i kobo on the server",
        async (amount, expected) => {
            const { userId } = await createTestAppUser();

            const response = await post({
                userId,
                amount,
                currencyCode: TEST_CURRENCY_CODE,
            });

            expect(response.status).toBe(HTTP_STATUSES.CREATED);
            expect(response.body.data.amountInMinorUnits).toBe(expected);
        },
    );

    it("unlocks the first achievement as a side effect of the request", async () => {
        const { userId } = await createTestAppUser();

        await post({
            userId,
            amount: AMOUNT,
            currencyCode: TEST_CURRENCY_CODE,
        });

        const unlocked = await db
            .selectFrom("appUserAchievements")
            .select(["achievementKey"])
            .where("userId", "=", userId)
            .execute();

        expect(unlocked.map(({ achievementKey }) => achievementKey)).toEqual([
            ACHIEVEMENT_KEYS.FIRST_PURCHASE,
        ]);
    });

    it("accepts a lowercase currency code and normalises it", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            amount: AMOUNT,
            currencyCode: TEST_CURRENCY_CODE.toLowerCase(),
        });

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(response.body.data.currencyCode).toBe(TEST_CURRENCY_CODE);
    });

    it("rejects a user that does not exist", async () => {
        const response = await post({
            userId: "6f8b9a1c-0d2e-4f3a-8b5c-7d9e1f2a3b4c",
            amount: AMOUNT,
            currencyCode: TEST_CURRENCY_CODE,
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects an unsupported currency", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            amount: AMOUNT,
            currencyCode: "ZZZ",
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects more decimal places than the currency has, rather than rounding", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            amount: "300.555",
            currencyCode: TEST_CURRENCY_CODE,
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it.each(["-1", "abc", "1e5", "", "1..0", "300."])(
        "rejects %s as an amount",
        async (amount) => {
            const { userId } = await createTestAppUser();

            const response = await post({
                userId,
                amount,
                currencyCode: TEST_CURRENCY_CODE,
            });

            expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
        },
    );

    it("rejects an amount sent as a number rather than a string", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            amount: 300,
            currencyCode: TEST_CURRENCY_CODE,
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });
});
