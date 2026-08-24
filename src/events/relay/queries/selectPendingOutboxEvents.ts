import { sql } from "kysely";
import type { DatabaseExecutor } from "@/database/executor";
import OUTBOX_EVENT_STATUSES from "@/constants/outbox_event_statuses";

interface ISelectPendingOutboxEvents {
    trx: DatabaseExecutor;
    batchSize: number;
}

/**
 * The payload is read as text and parsed by the caller rather than selected as
 * jsonb. CamelCasePlugin recurses into object values, so reading the column
 * directly rewrites the payload's own keys — achievement_name would reach
 * subscribers as achievementName, breaking the published contract.
 *
 * FOR UPDATE SKIP LOCKED lets several relay instances drain the outbox
 * concurrently: each claims rows the others have not locked instead of queueing
 * behind them.
 */
const selectPendingOutboxEvents = async ({
    trx,
    batchSize,
}: ISelectPendingOutboxEvents) => {
    const data = await trx
        .selectFrom("outboxEvents")
        .select([
            "outboxEventId",
            "eventName",
            "aggregateType",
            "aggregateId",
            "publishAttemptCount",
            sql<string>`payload::text`.as("payloadJson"),
        ])
        .where("status", "=", OUTBOX_EVENT_STATUSES.PENDING)
        .orderBy("createdAt", "asc")
        .limit(batchSize)
        .forUpdate()
        .skipLocked()
        .execute();

    return data;
};

export default selectPendingOutboxEvents;
