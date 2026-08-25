import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";
import resolvePaymentProvider from "@/services/payment";
import NonRetryablePaymentError from "@/services/payment/nonRetryablePaymentError";
import createAppProductPurchase from "@/actions/app/productPurchase/createAppProductPurchase";
import processAppCashbackPayout from ".";
import {
    ADVANCED_BADGE,
    CASHBACK_AMOUNT_IN_MINOR_UNITS,
    TEST_CURRENCY_CODE,
} from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";
import createTestPayoutRecipient from "@fixtures/createTestPayoutRecipient";

jest.mock("@/services/payment", () => ({
    __esModule: true,
    default: jest.fn(),
}));

const resolveProviderMock = resolvePaymentProvider as jest.Mock;

const PROVIDER_REFERENCE = "tr_test_reference";

const PURCHASE_AMOUNT = "5000.00";

let transfer: jest.Mock;

const earnTheBadge = async () => {
    const { userId } = await createTestAppUser();

    for (
        let index = 0;
        index < ADVANCED_BADGE.REQUIRED_ACHIEVEMENT_COUNT;
        index += 1
    ) {
        await createAppProductPurchase({
            userId,
            amount: PURCHASE_AMOUNT,
            currencyCode: TEST_CURRENCY_CODE,
        });
    }

    return userId;
};

const payoutRow = async (userId: string) =>
    db
        .selectFrom("cashbackPayouts")
        .select([
            "cashbackPayoutId",
            "status",
            "attemptCount",
            "providerReference",
            "payoutRecipientId",
            "lastErrorMessage",
        ])
        .where("userId", "=", userId)
        .executeTakeFirstOrThrow();

const settle = (userId: string) =>
    processAppCashbackPayout({ userId, badgeKey: ADVANCED_BADGE.KEY });

describe("processAppCashbackPayout", () => {
    beforeEach(() => {
        transfer = jest.fn().mockResolvedValue({
            providerReference: PROVIDER_REFERENCE,
            providerRecipientCode: "rcp_test",
        });

        resolveProviderMock.mockReturnValue({
            name: PAYMENT_PROVIDERS.PAYSTACK,
            transfer,
        });
    });

    it("transfers the cashback and records the provider reference", async () => {
        const userId = await earnTheBadge();
        const { payoutRecipientId } = await createTestPayoutRecipient({
            userId,
        });

        await settle(userId);
        const payout = await payoutRow(userId);

        expect(payout).toMatchObject({
            status: CASHBACK_PAYOUT_STATUSES.SUCCEEDED,
            attemptCount: 1,
            providerReference: PROVIDER_REFERENCE,
            payoutRecipientId,
        });
    });

    it("sends the payout id as the provider reference so a retry cannot double pay", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        const { cashbackPayoutId } = await payoutRow(userId);

        await settle(userId);

        expect(transfer).toHaveBeenCalledWith(
            expect.objectContaining({
                reference: cashbackPayoutId,
                amountInMinorUnits: CASHBACK_AMOUNT_IN_MINOR_UNITS,
                currencyCode: TEST_CURRENCY_CODE,
            }),
        );
    });

    it("ignores a redelivered event instead of transferring twice", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        await settle(userId);
        const { data } = await settle(userId);
        const payout = await payoutRow(userId);

        expect(data).toBeNull();
        expect(transfer).toHaveBeenCalledTimes(1);
        expect(payout.attemptCount).toBe(1);
        expect(payout.status).toBe(CASHBACK_PAYOUT_STATUSES.SUCCEEDED);
    });

    it("leaves the payout pending and spends no attempt when no recipient is on file", async () => {
        const userId = await earnTheBadge();

        const { data } = await settle(userId);
        const payout = await payoutRow(userId);

        expect(data).toBeNull();
        expect(transfer).not.toHaveBeenCalled();
        expect(payout.lastErrorMessage).toContain(TEST_CURRENCY_CODE);
        // A missing precondition is not a failed attempt: burning the retry
        // budget here would forfeit cashback for anyone slow to add details.
        expect(payout.status).toBe(CASHBACK_PAYOUT_STATUSES.PENDING);
        expect(payout.attemptCount).toBe(0);
    });

    it("still pays after many sweeps with no recipient, once details arrive", async () => {
        const userId = await earnTheBadge();

        for (let attempt = 0; attempt < 15; attempt += 1) {
            await settle(userId);
        }

        expect((await payoutRow(userId)).attemptCount).toBe(0);

        await createTestPayoutRecipient({ userId });
        await settle(userId);

        expect((await payoutRow(userId)).status).toBe(
            CASHBACK_PAYOUT_STATUSES.SUCCEEDED,
        );
    });

    it("rethrows a transient provider failure so the queue retries it", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        const timeout = new Error("socket hang up");
        transfer.mockRejectedValueOnce(timeout);

        await expect(settle(userId)).rejects.toThrow(timeout.message);

        const payout = await payoutRow(userId);

        expect(payout.status).toBe(CASHBACK_PAYOUT_STATUSES.FAILED);
        expect(payout.lastErrorMessage).toBe(timeout.message);
    });

    it("settles on a later attempt after a transient failure", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        transfer.mockRejectedValueOnce(new Error("socket hang up"));

        await expect(settle(userId)).rejects.toThrow();
        await settle(userId);

        const payout = await payoutRow(userId);

        expect(payout.status).toBe(CASHBACK_PAYOUT_STATUSES.SUCCEEDED);
        expect(payout.providerReference).toBe(PROVIDER_REFERENCE);
        // Claimed twice, so the retry is visible rather than hidden.
        expect(payout.attemptCount).toBe(2);
    });

    it("swallows a non-retryable failure so the queue stops retrying", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        const refusal = new NonRetryablePaymentError("invalid account number");
        transfer.mockRejectedValueOnce(refusal);

        await expect(settle(userId)).resolves.toEqual({ data: null });

        const payout = await payoutRow(userId);

        expect(payout.status).toBe(CASHBACK_PAYOUT_STATUSES.FAILED);
        expect(payout.lastErrorMessage).toBe(refusal.message);
    });

    it("does nothing for a badge the user has not earned", async () => {
        const userId = await earnTheBadge();

        const { data } = await processAppCashbackPayout({
            userId,
            badgeKey: "NOT_A_BADGE",
        });

        expect(data).toBeNull();
        expect(transfer).not.toHaveBeenCalled();
    });

    it("does nothing when the user has earned no badge", async () => {
        const { userId } = await createTestAppUser();

        const { data } = await settle(userId);

        expect(data).toBeNull();
        expect(transfer).not.toHaveBeenCalled();
    });
});
