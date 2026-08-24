const OUTBOX_EVENT_STATUSES = {
    PENDING: "PENDING",
    PUBLISHED: "PUBLISHED",
    FAILED: "FAILED",
} as const;

export type OutboxEventStatus =
    (typeof OUTBOX_EVENT_STATUSES)[keyof typeof OUTBOX_EVENT_STATUSES];

export default OUTBOX_EVENT_STATUSES;
