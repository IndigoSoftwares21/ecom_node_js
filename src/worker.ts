import * as dotenv from "dotenv";
import monitoring from "@/utils/monitoring";
import { disconnect } from "@/database";
import redisService from "@/services/redis";
import startOutboxRelay from "@/events/relay/startOutboxRelay";
import createDomainEventWorker from "@/queue/domainEventWorker";
import type { Worker } from "bullmq";

dotenv.config();

const OUTBOX_RELAY_INTERVAL_MS = process.env.OUTBOX_RELAY_INTERVAL_MS
    ? parseInt(process.env.OUTBOX_RELAY_INTERVAL_MS, 10)
    : 1000;

const OUTBOX_RELAY_BATCH_SIZE = 50;

const OUTBOX_MAX_PUBLISH_ATTEMPTS = 5;

/**
 * Background process: relays outbox events onto the queue and consumes them.
 * Kept out of the API process so a slow payment provider can never delay a
 * request, and so it can be scaled independently.
 */
class WorkerProcess {
    private stopOutboxRelay?: () => void;

    private domainEventWorker?: Worker;

    public start(): void {
        this.domainEventWorker = createDomainEventWorker();

        this.stopOutboxRelay = startOutboxRelay({
            intervalMs: OUTBOX_RELAY_INTERVAL_MS,
            batchSize: OUTBOX_RELAY_BATCH_SIZE,
            maxPublishAttempts: OUTBOX_MAX_PUBLISH_ATTEMPTS,
        });

        this.registerShutdownHandlers();

        monitoring.info("Worker process started");
    }

    private registerShutdownHandlers(): void {
        const shutdown = async (signal: string): Promise<void> => {
            monitoring.info(`Worker received ${signal}, shutting down`);

            this.stopOutboxRelay?.();

            // Closed before the connections so in-flight jobs finish rather
            // than being abandoned mid-transfer.
            await this.domainEventWorker?.close();

            await Promise.allSettled([redisService.disconnect(), disconnect()]);

            process.exit(0);
        };

        process.on("SIGTERM", () => {
            void shutdown("SIGTERM");
        });

        process.on("SIGINT", () => {
            void shutdown("SIGINT");
        });
    }
}

const worker = new WorkerProcess();

worker.start();

export default worker;
