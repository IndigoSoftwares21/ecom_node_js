import type { DatabaseExecutor } from "@/database/executor";

export interface IProductPurchasedPayload {
    userId: string;
    productPurchaseId: string;
    currencyCode: string;
}

export interface IDomainEventContext<TPayload> {
    trx: DatabaseExecutor;
    payload: TPayload;
}

export type DomainEventListener<TPayload> = (
    context: IDomainEventContext<TPayload>,
) => Promise<void>;
