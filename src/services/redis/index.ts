import { Redis, type RedisOptions } from "ioredis";
import monitoring from "@/utils/monitoring";

class RedisService {
    private readonly options: RedisOptions;

    private readonly client: Redis;

    constructor() {
        this.options = {
            host: process.env.REDIS_HOST ?? "localhost",
            port: process.env.REDIS_PORT
                ? parseInt(process.env.REDIS_PORT, 10)
                : 6379,
            // BullMQ drives blocking commands through its own reconnection
            // logic; ioredis' per-request retry cap would abort them.
            maxRetriesPerRequest: null,
        };

        this.client = this.buildClient("shared");
    }

    private buildClient(label: string): Redis {
        const client = new Redis(this.options);

        client.on("connect", () => {
            monitoring.info(`Redis (${label}) connected`);
        });

        client.on("reconnecting", () => {
            monitoring.warn(`Redis (${label}) reconnecting`);
        });

        client.on("error", (error: Error) => {
            monitoring.error(`Redis (${label}) connection error`, error);
        });

        return client;
    }

    /**
     * Shared connection, safe for producers such as queues.
     */
    public getClient(): Redis {
        return this.client;
    }

    /**
     * A dedicated connection for consumers. Workers issue blocking commands
     * that would stall anything else sharing the socket, so each gets its own.
     */
    public createConnection(label: string): Redis {
        return this.buildClient(label);
    }

    public async isReachable(): Promise<boolean> {
        try {
            return (await this.client.ping()) === "PONG";
        } catch (error) {
            monitoring.error("Redis ping failed", error as Error);
            return false;
        }
    }

    public async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

const redisService = new RedisService();

export default redisService;
