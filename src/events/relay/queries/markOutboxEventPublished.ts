import type { DatabaseExecutor } from "@/database/executor";
import OUTBOX_EVENT_STATUSES from "@/constants/outbox_event_statuses";

interface IMarkOutboxEventPublished {
    trx: DatabaseExecutor;
    outboxEventId: string;
}

const markOutboxEventPublished = async ({
    trx,
    outboxEventId,
}: IMarkOutboxEventPublished) => {
    const data = await trx
        .updateTable("outboxEvents")
        .set({
            status: OUTBOX_EVENT_STATUSES.PUBLISHED,
            publishedAt: new Date(),
        })
        .where("outboxEventId", "=", outboxEventId)
        .returning("outboxEventId")
        .executeTakeFirstOrThrow();

    return data;
};

export default markOutboxEventPublished;
