import type { DatabaseExecutor } from "@/database/executor";

export interface IOutboxEventInput {
    eventName: string;
    aggregateType: string;
    aggregateId: string;
    payload: unknown;
}

interface IRecordOutboxEvents {
    trx: DatabaseExecutor;
    events: IOutboxEventInput[];
}

/**
 * Appends events to the outbox on the caller's transaction, so they commit
 * atomically with the state change that produced them. Nothing is sent here:
 * the relay publishes them afterwards, and a crash before that leaves them
 * PENDING rather than losing them.
 */
const recordOutboxEvents = async ({ trx, events }: IRecordOutboxEvents) => {
    if (!events.length) {
        return { data: [] };
    }

    const data = await trx
        .insertInto("outboxEvents")
        .values(
            events.map(
                ({ eventName, aggregateType, aggregateId, payload }) => ({
                    eventName,
                    aggregateType,
                    aggregateId,
                    payload: JSON.stringify(payload),
                }),
            ),
        )
        .returning("outboxEventId")
        .execute();

    return { data };
};

export default recordOutboxEvents;
