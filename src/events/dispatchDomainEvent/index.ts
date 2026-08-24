import monitoring from "@/utils/monitoring";
import type { DatabaseExecutor } from "@/database/executor";
import type { DomainEventListener } from "../types";

interface IDispatchDomainEvent<TPayload> {
    eventName: string;
    trx: DatabaseExecutor;
    payload: TPayload;
    listeners: DomainEventListener<TPayload>[];
}

/**
 * Runs listeners sequentially on the caller's transaction. Sequential because
 * later listeners read what earlier ones wrote (badges derive from the
 * achievement count), and errors propagate so a failed listener rolls the
 * whole event back rather than leaving the aggregate half-updated.
 */
const dispatchDomainEvent = async <TPayload>({
    eventName,
    trx,
    payload,
    listeners,
}: IDispatchDomainEvent<TPayload>): Promise<void> => {
    monitoring.info(
        `Dispatching ${eventName} to ${listeners.length} listener(s)`,
    );

    for (const listener of listeners) {
        await listener({ trx, payload });
    }
};

export default dispatchDomainEvent;
