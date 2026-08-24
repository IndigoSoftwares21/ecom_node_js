const QUEUES = {
    DOMAIN_EVENTS: "domain-events",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export default QUEUES;
