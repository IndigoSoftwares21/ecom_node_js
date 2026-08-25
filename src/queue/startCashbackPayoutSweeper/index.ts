import monitoring from "@/utils/monitoring";
import settleUnsettledCashbackPayouts from "@/actions/app/cashbackPayout/settleUnsettledCashbackPayouts";

interface IStartCashbackPayoutSweeper {
    intervalMs: number;
    batchSize: number;
    maxAttemptCount: number;
    minimumAgeSeconds: number;
}

/**
 * Sweeps immediately as well as on the interval, so starting the worker settles
 * whatever was left owing while it was down.
 */
const startCashbackPayoutSweeper = ({
    intervalMs,
    batchSize,
    maxAttemptCount,
    minimumAgeSeconds,
}: IStartCashbackPayoutSweeper): (() => void) => {
    let isSweeping = false;

    const sweep = async (): Promise<void> => {
        if (isSweeping) {
            return;
        }

        isSweeping = true;

        try {
            const { data } = await settleUnsettledCashbackPayouts({
                batchSize,
                maxAttemptCount,
                minimumAgeSeconds,
            });

            if (data.sweptCount > 0) {
                monitoring.info(
                    `Cashback sweeper settled ${data.settledCount} of ${data.sweptCount} unsettled payouts`,
                );
            }
        } catch (error) {
            monitoring.error("Cashback sweeper failed", error as Error);
        } finally {
            isSweeping = false;
        }
    };

    void sweep();

    const timer = setInterval(sweep, intervalMs);

    monitoring.info(`Cashback sweeper started, sweeping every ${intervalMs}ms`);

    return () => {
        clearInterval(timer);
        monitoring.info("Cashback sweeper stopped");
    };
};

export default startCashbackPayoutSweeper;
