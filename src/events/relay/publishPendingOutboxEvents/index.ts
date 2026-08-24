import { withTransaction } from "@/database";
import monitoring from "@/utils/monitoring";
import domainEventQueue from "@/queue/domainEventQueue";
import selectPendingOutboxEvents from "../queries/selectPendingOutboxEvents";
import markOutboxEventPublished from "../queries/markOutboxEventPublished";
import recordOutboxEventPublishFailure from "../queries/recordOutboxEventPublishFailure";

interface IPublishPendingOutboxEvents {
    batchSize: number;
    maxPublishAttempts: number;
}

/**
 * Moves one batch of pending events from the outbox onto the queue.
 *
 * The job id is the outbox event id, so a crash between enqueueing and marking
 * the row PUBLISHED results in the same job being offered again and dropped by
 * BullMQ as a duplicate. Delivery is therefore at-least-once, never lost, and
 * handlers must stay idempotent — the queue is not the correctness guarantee.
 */
const publishPendingOutboxEvents = async ({
    batchSize,
    maxPublishAttempts,
}: IPublishPendingOutboxEvents) =>
    withTransaction(async (trx) => {
        const events = await selectPendingOutboxEvents({ trx, batchSize });

        let publishedCount = 0;
        let failedCount = 0;

        for (const event of events) {
            try {
                await domainEventQueue.add(
                    event.eventName,
                    {
                        outboxEventId: event.outboxEventId,
                        eventName: event.eventName,
                        aggregateType: event.aggregateType,
                        aggregateId: event.aggregateId,
                        payload: JSON.parse(event.payloadJson),
                    },
                    { jobId: event.outboxEventId },
                );

                await markOutboxEventPublished({
                    trx,
                    outboxEventId: event.outboxEventId,
                });

                publishedCount += 1;
            } catch (error) {
                // Caught per event so one unpublishable row cannot block the
                // rest of the batch from being delivered.
                await recordOutboxEventPublishFailure({
                    trx,
                    outboxEventId: event.outboxEventId,
                    publishAttemptCount: event.publishAttemptCount,
                    maxPublishAttempts,
                    lastErrorMessage: (error as Error).message,
                });

                monitoring.error(
                    `Failed to publish outbox event ${event.outboxEventId}`,
                    error as Error,
                );

                failedCount += 1;
            }
        }

        return { data: { publishedCount, failedCount } };
    });

export default publishPendingOutboxEvents;
