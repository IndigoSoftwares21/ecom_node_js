import request from "supertest";
import app from "@/app";
import HTTP_STATUSES from "@/constants/http_statuses";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";
import { db } from "@/database";
import { TEST_CURRENCY_CODE } from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";

const recipientsPath = `/api/${process.env.API_VERSION ?? "v1"}/payout-recipients`;

const bankDetails = {
    currencyCode: TEST_CURRENCY_CODE,
    bankCode: "058",
    bankAccountNumber: "0123456789",
    bankAccountName: "Ada Obi",
};

const post = (body: Record<string, unknown>) =>
    request(app.express).post(recipientsPath).send(body);

afterAll(async () => {
    await app.closeServer();
});

describe("POST /payout-recipients", () => {
    it("saves the account the cashback will be sent to", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({ userId, ...bankDetails });

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(response.body.data).toMatchObject({
            userId,
            provider: PAYMENT_PROVIDERS.PAYSTACK,
            ...bankDetails,
        });
    });

    it("preserves a leading zero in the account number", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({ userId, ...bankDetails });

        expect(response.body.data.bankAccountNumber).toBe(
            bankDetails.bankAccountNumber,
        );
    });

    it("replaces the account on file rather than rejecting a second submission", async () => {
        const { userId } = await createTestAppUser();
        const NEW_ACCOUNT_NUMBER = "9876543210";

        await post({ userId, ...bankDetails });
        const response = await post({
            userId,
            ...bankDetails,
            bankAccountNumber: NEW_ACCOUNT_NUMBER,
        });

        const recipients = await db
            .selectFrom("payoutRecipients")
            .select(["bankAccountNumber"])
            .where("userId", "=", userId)
            .execute();

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(recipients).toEqual([
            { bankAccountNumber: NEW_ACCOUNT_NUMBER },
        ]);
    });

    it("clears the cached provider recipient code when the account changes", async () => {
        const { userId } = await createTestAppUser();
        const CACHED_CODE = "rcp_stale";

        await post({ userId, ...bankDetails });

        await db
            .updateTable("payoutRecipients")
            .set({ providerRecipientCode: CACHED_CODE })
            .where("userId", "=", userId)
            .execute();

        await post({
            userId,
            ...bankDetails,
            bankAccountNumber: "9876543210",
        });

        const recipient = await db
            .selectFrom("payoutRecipients")
            .select(["providerRecipientCode"])
            .where("userId", "=", userId)
            .executeTakeFirstOrThrow();

        // Reusing it would send the transfer to the replaced account.
        expect(recipient.providerRecipientCode).toBeNull();
    });

    it("rejects an account number that is not all digits", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            ...bankDetails,
            bankAccountNumber: "01234abcde",
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects an unsupported currency", async () => {
        const { userId } = await createTestAppUser();

        const response = await post({
            userId,
            ...bankDetails,
            currencyCode: "ZZZ",
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects a user that does not exist", async () => {
        const response = await post({
            userId: "6f8b9a1c-0d2e-4f3a-8b5c-7d9e1f2a3b4c",
            ...bankDetails,
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });
});
