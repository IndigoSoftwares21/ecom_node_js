import * as dotenv from "dotenv";
import monitoring from "@/utils/monitoring";
import { disconnect } from "@/database";
import redisService from "@/services/redis";
import startOutboxRelay from "@/events/relay/startOutboxRelay";
import startCashbackPayoutSweeper from "@/queue/startCashbackPayoutSweeper";
import createDomainEventWorker from "@/queue/domainEventWorker";
import type { Worker } from "bullmq";

dotenv.config();

const OUTBOX_RELAY_INTERVAL_MS = process.env.OUTBOX_RELAY_INTERVAL_MS
    ? parseInt(process.env.OUTBOX_RELAY_INTERVAL_MS, 10)
    : 1000;

const OUTBOX_RELAY_BATCH_SIZE = 50;

const OUTBOX_MAX_PUBLISH_ATTEMPTS = 5;

const PAYOUT_SWEEP_INTERVAL_MS = process.env.PAYOUT_SWEEP_INTERVAL_MS
    ? parseInt(process.env.PAYOUT_SWEEP_INTERVAL_MS, 10)
    : 30000;

const PAYOUT_SWEEP_BATCH_SIZE = 50;

const PAYOUT_MAX_ATTEMPT_COUNT = 10;

// Long enough that a payout created moments ago is left to the queue rather
// than being picked up by a sweep that happens to run first.
const PAYOUT_MINIMUM_AGE_SECONDS = 30;

/**
 * Background process: relays outbox events onto the queue and consumes them.
 * Kept out of the API process so a slow payment provider can never delay a
 * request, and so it can be scaled independently.
 */
class WorkerProcess {
    private stopOutboxRelay?: () => void;

    private domainEventWorker?: Worker;

    private stopCashbackPayoutSweeper?: () => void;

    public start(): void {
        this.domainEventWorker = createDomainEventWorker();

        this.stopOutboxRelay = startOutboxRelay({
            intervalMs: OUTBOX_RELAY_INTERVAL_MS,
            batchSize: OUTBOX_RELAY_BATCH_SIZE,
            maxPublishAttempts: OUTBOX_MAX_PUBLISH_ATTEMPTS,
        });

        this.stopCashbackPayoutSweeper = startCashbackPayoutSweeper({
            intervalMs: PAYOUT_SWEEP_INTERVAL_MS,
            batchSize: PAYOUT_SWEEP_BATCH_SIZE,
            maxAttemptCount: PAYOUT_MAX_ATTEMPT_COUNT,
            minimumAgeSeconds: PAYOUT_MINIMUM_AGE_SECONDS,
        });

        this.registerShutdownHandlers();

        monitoring.info("Worker process started");
    }

    private registerShutdownHandlers(): void {
        const shutdown = async (signal: string): Promise<void> => {
            monitoring.info(`Worker received ${signal}, shutting down`);

            this.stopOutboxRelay?.();
            this.stopCashbackPayoutSweeper?.();

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
