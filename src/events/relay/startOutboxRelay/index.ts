import monitoring from "@/utils/monitoring";
import publishPendingOutboxEvents from "../publishPendingOutboxEvents";

interface IStartOutboxRelay {
    intervalMs: number;
    batchSize: number;
    maxPublishAttempts: number;
}

/**
 * Polls the outbox on an interval. Polling rather than LISTEN/NOTIFY because a
 * notification is lost when no listener is connected, whereas a pending row
 * survives any outage and is picked up on the next tick.
 *
 * Returns a stop function so the process can shut down cleanly.
 */
const startOutboxRelay = ({
    intervalMs,
    batchSize,
    maxPublishAttempts,
}: IStartOutboxRelay): (() => void) => {
    let isDraining = false;

    const drain = async (): Promise<void> => {
        // Guards against a slow batch overlapping the next tick, which would
        // put two relays on the same rows and double the load for nothing.
        if (isDraining) {
            return;
        }

        isDraining = true;

        try {
            const { data } = await publishPendingOutboxEvents({
                batchSize,
                maxPublishAttempts,
            });

            if (data.publishedCount > 0 || data.failedCount > 0) {
                monitoring.info(
                    `Outbox relay published ${data.publishedCount}, failed ${data.failedCount}`,
                );
            }
        } catch (error) {
            monitoring.error("Outbox relay tick failed", error as Error);
        } finally {
            isDraining = false;
        }
    };

    const timer = setInterval(drain, intervalMs);

    monitoring.info(`Outbox relay started, polling every ${intervalMs}ms`);

    return () => {
        clearInterval(timer);
        monitoring.info("Outbox relay stopped");
    };
};

export default startOutboxRelay;
