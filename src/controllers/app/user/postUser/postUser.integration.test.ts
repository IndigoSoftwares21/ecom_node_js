import request from "supertest";
import app from "@/app";
import HTTP_STATUSES from "@/constants/http_statuses";
import DEFAULT_PAYOUT_RECIPIENT from "@/constants/default_payout_recipient";
import { db } from "@/database";

const usersPath = `/api/${process.env.API_VERSION ?? "v1"}/users`;

const validBody = {
    emailAddress: "ada.obi@example.com",
    firstName: "Ada",
    middleName: "Ngozi",
    lastName: "Obi",
};

const post = (body: Record<string, unknown>) =>
    request(app.express).post(usersPath).send(body);

afterAll(async () => {
    await app.closeServer();
});

describe("POST /users", () => {
    it("creates a user", async () => {
        const response = await post(validBody);

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(response.body.data).toMatchObject({
            emailAddress: validBody.emailAddress,
            firstName: validBody.firstName,
            middleName: validBody.middleName,
            lastName: validBody.lastName,
            isActive: true,
        });
        expect(response.body.data.userId).toBeDefined();
    });

    it("treats a middle name as optional", async () => {
        const { middleName, ...withoutMiddleName } = validBody;

        const response = await post(withoutMiddleName);

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(response.body.data.middleName).toBeNull();
        expect(middleName).toBeDefined();
    });

    it("rejects an email address that is already taken", async () => {
        await post(validBody);

        const response = await post(validBody);

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects the same address in different casing", async () => {
        await post(validBody);

        const response = await post({
            ...validBody,
            emailAddress: validBody.emailAddress.toUpperCase(),
        });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects a malformed email address", async () => {
        const response = await post({ ...validBody, emailAddress: "not-mail" });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("rejects a name containing digits", async () => {
        const response = await post({ ...validBody, firstName: "Ada2" });

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
    });

    it("gives a new customer a placeholder payout account", async () => {
        const response = await post(validBody);

        expect(response.body.data.payoutRecipient).toMatchObject({
            currencyCode: DEFAULT_PAYOUT_RECIPIENT.CURRENCY_CODE,
            bankAccountNumber: DEFAULT_PAYOUT_RECIPIENT.BANK_ACCOUNT_NUMBER,
        });
    });

    it("uses supplied bank details instead of the placeholder", async () => {
        const payoutRecipient = {
            currencyCode: "NGN",
            bankCode: "058",
            bankAccountNumber: "0123456789",
            bankAccountName: "Ada Obi",
        };

        const response = await post({ ...validBody, payoutRecipient });

        expect(response.status).toBe(HTTP_STATUSES.CREATED);
        expect(response.body.data.payoutRecipient).toMatchObject(
            payoutRecipient,
        );
    });

    it("creates no customer at all when the bank details are invalid", async () => {
        const response = await post({
            ...validBody,
            payoutRecipient: {
                currencyCode: "NGN",
                bankCode: "058",
                bankAccountNumber: "not-digits",
                bankAccountName: "Ada Obi",
            },
        });

        const users = await db
            .selectFrom("appUsers")
            .select(["userId"])
            .where("emailAddress", "=", validBody.emailAddress)
            .execute();

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
        expect(users).toHaveLength(0);
    });

    it("rejects a missing last name", async () => {
        const { lastName, ...withoutLastName } = validBody;

        const response = await post(withoutLastName);

        expect(response.status).toBe(HTTP_STATUSES.BAD_REQUEST);
        expect(lastName).toBeDefined();
    });
});
