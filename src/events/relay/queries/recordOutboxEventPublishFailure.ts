import type { DatabaseExecutor } from "@/database/executor";
import OUTBOX_EVENT_STATUSES from "@/constants/outbox_event_statuses";

interface IRecordOutboxEventPublishFailure {
    trx: DatabaseExecutor;
    outboxEventId: string;
    publishAttemptCount: number;
    maxPublishAttempts: number;
    lastErrorMessage: string;
}

/**
 * Stays PENDING until the attempt cap is reached so a transient Redis outage
 * drains on its own. Past the cap it becomes FAILED, which the relay no longer
 * selects — a poison event stops burning the loop and waits for a human.
 */
const recordOutboxEventPublishFailure = async ({
    trx,
    outboxEventId,
    publishAttemptCount,
    maxPublishAttempts,
    lastErrorMessage,
}: IRecordOutboxEventPublishFailure) => {
    const attemptCount = publishAttemptCount + 1;

    const data = await trx
        .updateTable("outboxEvents")
        .set({
            publishAttemptCount: attemptCount,
            lastErrorMessage,
            status:
                attemptCount >= maxPublishAttempts
                    ? OUTBOX_EVENT_STATUSES.FAILED
                    : OUTBOX_EVENT_STATUSES.PENDING,
        })
        .where("outboxEventId", "=", outboxEventId)
        .returning(["outboxEventId", "status"])
        .executeTakeFirstOrThrow();

    return data;
};

export default recordOutboxEventPublishFailure;
