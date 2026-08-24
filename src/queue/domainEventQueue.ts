import { Queue } from "bullmq";
import QUEUES from "@/constants/queues";
import redisService from "@/services/redis";

export interface IDomainEventJob {
    outboxEventId: string;
    eventName: string;
    aggregateType: string;
    aggregateId: string;
    payload: unknown;
}

const domainEventQueue = new Queue<IDomainEventJob>(QUEUES.DOMAIN_EVENTS, {
    connection: redisService.getClient(),
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        // Completed jobs are kept for a while so a re-enqueue of the same
        // outbox event is still recognised as a duplicate by its jobId.
        removeOnComplete: { count: 1000 },
        removeOnFail: false,
    },
});

export default domainEventQueue;
