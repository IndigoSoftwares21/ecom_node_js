import { sql } from "kysely";
import { db } from "@/database";
import CASHBACK_PAYOUT_STATUSES from "@/constants/cashback_payout_statuses";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";
import resolvePaymentProvider from "@/services/payment";
import createAppProductPurchase from "@/actions/app/productPurchase/createAppProductPurchase";
import processAppCashbackPayout from "@/actions/app/cashbackPayout/processAppCashbackPayout";
import settleUnsettledCashbackPayouts from ".";
import { ADVANCED_BADGE, TEST_CURRENCY_CODE } from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";
import createTestPayoutRecipient from "@fixtures/createTestPayoutRecipient";

jest.mock("@/services/payment", () => ({
    __esModule: true,
    default: jest.fn(),
}));

const resolveProviderMock = resolvePaymentProvider as jest.Mock;

const PURCHASE_AMOUNT = "5000.00";

const BATCH_SIZE = 50;

const MAX_ATTEMPT_COUNT = 10;

// Zero, so payouts created inside the test are eligible immediately.
const MINIMUM_AGE_SECONDS = 0;

let transfer: jest.Mock;

const sweep = () =>
    settleUnsettledCashbackPayouts({
        batchSize: BATCH_SIZE,
        maxAttemptCount: MAX_ATTEMPT_COUNT,
        minimumAgeSeconds: MINIMUM_AGE_SECONDS,
    });

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
        .select(["status", "attemptCount", "providerReference"])
        .where("userId", "=", userId)
        .executeTakeFirstOrThrow();

describe("settleUnsettledCashbackPayouts", () => {
    beforeEach(() => {
        transfer = jest.fn().mockResolvedValue({
            providerReference: "tr_swept",
            providerRecipientCode: "rcp_swept",
        });

        resolveProviderMock.mockReturnValue({
            name: PAYMENT_PROVIDERS.PAYSTACK,
            transfer,
        });
    });

    it("settles nothing when nothing is owed", async () => {
        const { data } = await sweep();

        expect(data).toEqual({ sweptCount: 0, settledCount: 0 });
    });

    it("pays a badge whose cashback was never sent", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        const { data } = await sweep();

        expect(data).toEqual({ sweptCount: 1, settledCount: 1 });
        expect(await payoutRow(userId)).toMatchObject({
            status: CASHBACK_PAYOUT_STATUSES.SUCCEEDED,
            providerReference: "tr_swept",
        });
    });

    it("recovers a payout blocked because bank details were missing", async () => {
        const userId = await earnTheBadge();

        // Blocked: no recipient. The queue cannot recover this, since the job
        // completed and its outbox event is already published.
        await processAppCashbackPayout({ userId, badgeKey: ADVANCED_BADGE.KEY });
        expect((await payoutRow(userId)).status).toBe(
            CASHBACK_PAYOUT_STATUSES.PENDING,
        );

        await createTestPayoutRecipient({ userId });
        await sweep();

        expect(await payoutRow(userId)).toMatchObject({
            status: CASHBACK_PAYOUT_STATUSES.SUCCEEDED,
        });
        expect(transfer).toHaveBeenCalledTimes(1);
    });

    it("leaves a settled payout alone", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        await sweep();
        const { data } = await sweep();

        expect(data).toEqual({ sweptCount: 0, settledCount: 0 });
        expect(transfer).toHaveBeenCalledTimes(1);
    });

    it("gives up once a payout has been attempted too many times", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        await db
            .updateTable("cashbackPayouts")
            .set({
                status: CASHBACK_PAYOUT_STATUSES.FAILED,
                attemptCount: MAX_ATTEMPT_COUNT,
            })
            .where("userId", "=", userId)
            .execute();

        const { data } = await sweep();

        expect(data).toEqual({ sweptCount: 0, settledCount: 0 });
        expect(transfer).not.toHaveBeenCalled();
    });

    it("ignores a payout still being processed", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        await db
            .updateTable("cashbackPayouts")
            .set({ status: CASHBACK_PAYOUT_STATUSES.PROCESSING })
            .where("userId", "=", userId)
            .execute();

        const { data } = await sweep();

        expect(data).toEqual({ sweptCount: 0, settledCount: 0 });
        expect(transfer).not.toHaveBeenCalled();
    });

    it("skips a payout younger than the grace period", async () => {
        const userId = await earnTheBadge();
        await createTestPayoutRecipient({ userId });

        const { data } = await settleUnsettledCashbackPayouts({
            batchSize: BATCH_SIZE,
            maxAttemptCount: MAX_ATTEMPT_COUNT,
            minimumAgeSeconds: 3600,
        });

        expect(data).toEqual({ sweptCount: 0, settledCount: 0 });
        expect(transfer).not.toHaveBeenCalled();
    });

    it("keeps going when one payout in the batch cannot be settled", async () => {
        const settleableUserId = await earnTheBadge();
        await createTestPayoutRecipient({ userId: settleableUserId });

        const unsettleableUserId = await earnTheBadge();

        await db
            .updateTable("cashbackPayouts")
            .set({ createdAt: sql<Date>`now() - interval '1 hour'` })
            .where("userId", "=", unsettleableUserId)
            .execute();

        const { data } = await sweep();

        expect(data.sweptCount).toBe(2);
        expect(data.settledCount).toBe(1);
        expect((await payoutRow(settleableUserId)).status).toBe(
            CASHBACK_PAYOUT_STATUSES.SUCCEEDED,
        );
        expect((await payoutRow(unsettleableUserId)).status).toBe(
            CASHBACK_PAYOUT_STATUSES.PENDING,
        );
    });
});
