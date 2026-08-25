import { db, withTransaction } from "@/database";
import DOMAIN_EVENTS from "@/constants/domain_events";
import AGGREGATE_TYPES from "@/constants/aggregate_types";
import OUTBOX_EVENT_STATUSES from "@/constants/outbox_event_statuses";
import recordOutboxEvents from "@/events/recordOutboxEvents";
import domainEventQueue from "@/queue/domainEventQueue";
import publishPendingOutboxEvents from ".";
import { ACHIEVEMENT_NAMES } from "@fixtures/achievements";
import createTestAppUser from "@fixtures/createTestAppUser";

// The queue is stubbed rather than driven through Redis: what matters here is
// the database state machine and the exact payload handed to the queue.
jest.mock("@/queue/domainEventQueue", () => ({
    __esModule: true,
    default: { add: jest.fn() },
}));

const queueAdd = domainEventQueue.add as jest.Mock;

const BATCH_SIZE = 50;

const MAX_PUBLISH_ATTEMPTS = 5;

const publish = () =>
    publishPendingOutboxEvents({
        batchSize: BATCH_SIZE,
        maxPublishAttempts: MAX_PUBLISH_ATTEMPTS,
    });

const recordAchievementUnlocked = async (userId: string) =>
    withTransaction((trx) =>
        recordOutboxEvents({
            trx,
            events: [
                {
                    eventName: DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED,
                    aggregateType: AGGREGATE_TYPES.APP_USER,
                    aggregateId: userId,
                    payload: {
                        achievement_name: ACHIEVEMENT_NAMES.FIRST_PURCHASE,
                        user: { userId },
                    },
                },
            ],
        }),
    );

const outboxRow = async (userId: string) =>
    db
        .selectFrom("outboxEvents")
        .select([
            "outboxEventId",
            "status",
            "publishAttemptCount",
            "publishedAt",
            "lastErrorMessage",
        ])
        .where("aggregateId", "=", userId)
        .executeTakeFirstOrThrow();

describe("publishPendingOutboxEvents", () => {
    beforeEach(() => {
        queueAdd.mockReset();
        queueAdd.mockResolvedValue(undefined);
    });

    it("publishes nothing when the outbox is empty", async () => {
        const { data } = await publish();

        expect(data).toEqual({ publishedCount: 0, failedCount: 0 });
        expect(queueAdd).not.toHaveBeenCalled();
    });

    it("marks a published event and stamps when it was published", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        const { data } = await publish();
        const row = await outboxRow(userId);

        expect(data).toEqual({ publishedCount: 1, failedCount: 0 });
        expect(row.status).toBe(OUTBOX_EVENT_STATUSES.PUBLISHED);
        expect(row.publishedAt).toBeInstanceOf(Date);
    });

    it("keys the job by outbox event id so a redelivery is deduplicated", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        await publish();
        const row = await outboxRow(userId);

        expect(queueAdd).toHaveBeenCalledWith(
            DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED,
            expect.objectContaining({ outboxEventId: row.outboxEventId }),
            { jobId: row.outboxEventId },
        );
    });

    it("hands the queue the payload with its specified snake_case keys intact", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        await publish();

        const [, job] = queueAdd.mock.calls[0];

        // Reading the jsonb column directly would return achievementName,
        // because CamelCasePlugin rewrites keys inside object values.
        expect(job.payload).toEqual({
            achievement_name: ACHIEVEMENT_NAMES.FIRST_PURCHASE,
            user: { userId },
        });
    });

    it("leaves an event pending and counts the attempt when publishing fails", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        const failure = new Error("redis unavailable");
        queueAdd.mockRejectedValueOnce(failure);

        const { data } = await publish();
        const row = await outboxRow(userId);

        expect(data).toEqual({ publishedCount: 0, failedCount: 1 });
        expect(row.status).toBe(OUTBOX_EVENT_STATUSES.PENDING);
        expect(row.publishAttemptCount).toBe(1);
        expect(row.lastErrorMessage).toBe(failure.message);
    });

    it("publishes an event that failed earlier once the queue recovers", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        queueAdd.mockRejectedValueOnce(new Error("redis unavailable"));
        await publish();

        const { data } = await publish();
        const row = await outboxRow(userId);

        expect(data).toEqual({ publishedCount: 1, failedCount: 0 });
        expect(row.status).toBe(OUTBOX_EVENT_STATUSES.PUBLISHED);
    });

    it("gives up on an event that keeps failing so it stops burning the loop", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        queueAdd.mockRejectedValue(new Error("poison event"));

        for (let attempt = 0; attempt < MAX_PUBLISH_ATTEMPTS; attempt += 1) {
            await publish();
        }

        const row = await outboxRow(userId);

        expect(row.publishAttemptCount).toBe(MAX_PUBLISH_ATTEMPTS);
        expect(row.status).toBe(OUTBOX_EVENT_STATUSES.FAILED);

        // FAILED is not selected again, so a further tick does nothing.
        const { data } = await publish();

        expect(data).toEqual({ publishedCount: 0, failedCount: 0 });
    });

    it("does not publish the same event twice", async () => {
        const { userId } = await createTestAppUser();
        await recordAchievementUnlocked(userId);

        await publish();
        const { data } = await publish();

        expect(data).toEqual({ publishedCount: 0, failedCount: 0 });
        expect(queueAdd).toHaveBeenCalledTimes(1);
    });
});
