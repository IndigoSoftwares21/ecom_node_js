import { Worker, type Job } from "bullmq";
import QUEUES from "@/constants/queues";
import DOMAIN_EVENTS from "@/constants/domain_events";
import monitoring from "@/utils/monitoring";
import redisService from "@/services/redis";
import handleAchievementUnlocked from "./handlers/handleAchievementUnlocked";
import handleBadgeUnlocked from "./handlers/handleBadgeUnlocked";
import type { IDomainEventJob } from "./domainEventQueue";

const HANDLERS: Record<
    string,
    (job: IDomainEventJob) => Promise<void>
> = {
    [DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED]: handleAchievementUnlocked,
    [DOMAIN_EVENTS.BADGE_UNLOCKED]: handleBadgeUnlocked,
};

const WORKER_CONCURRENCY = 5;

/**
 * Consumes domain events. Gets its own Redis connection because workers issue
 * blocking commands that would stall anything sharing the socket.
 *
 * An unrecognised event name is acknowledged rather than failed: the outbox is a
 * general log, and a subscriber that does not care about an event should not send
 * it round the retry loop.
 */
const createDomainEventWorker = (): Worker<IDomainEventJob> => {
    const worker = new Worker<IDomainEventJob>(
        QUEUES.DOMAIN_EVENTS,
        async (job: Job<IDomainEventJob>) => {
            const handler = HANDLERS[job.data.eventName];

            if (!handler) {
                monitoring.info(
                    `No handler registered for ${job.data.eventName}; acknowledging`,
                );

                return;
            }

            await handler(job.data);
        },
        {
            connection: redisService.createConnection("domain-event-worker"),
            concurrency: WORKER_CONCURRENCY,
        },
    );

    worker.on("failed", (job, error) => {
        monitoring.error(
            `Domain event job ${job?.id} failed on attempt ${job?.attemptsMade}`,
            error,
        );
    });

    worker.on("completed", (job) => {
        monitoring.info(`Domain event job ${job.id} completed`);
    });

    return worker;
};

export default createDomainEventWorker;
