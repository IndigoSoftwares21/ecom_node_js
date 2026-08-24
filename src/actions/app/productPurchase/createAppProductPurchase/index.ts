import { withTransaction } from "@/database";
import DOMAIN_EVENTS from "@/constants/domain_events";
import dispatchDomainEvent from "@/events/dispatchDomainEvent";
import unlockAchievementsOnProductPurchased from "@/events/listeners/unlockAchievementsOnProductPurchased";
import type { IProductPurchasedPayload } from "@/events/types";
import insertAppProductPurchase from "./queries/insertAppProductPurchase";

interface ICreateAppProductPurchase {
    userId: string;
    amountInMinorUnits: number;
    currencyCode: string;
}

const PRODUCT_PURCHASED_LISTENERS = [unlockAchievementsOnProductPurchased];

/**
 * Records the purchase and dispatches ProductPurchased inside one transaction,
 * so achievements, badges and their outbox events either all commit with the
 * purchase or none of them do. A crash mid-flight cannot leave a purchase whose
 * achievements were never unlocked.
 */
const createAppProductPurchase = async ({
    userId,
    amountInMinorUnits,
    currencyCode,
}: ICreateAppProductPurchase) => {
    const data = await withTransaction(async (trx) => {
        const productPurchase = await insertAppProductPurchase({
            trx,
            userId,
            amountInMinorUnits,
            currencyCode,
        });

        await dispatchDomainEvent<IProductPurchasedPayload>({
            eventName: DOMAIN_EVENTS.PRODUCT_PURCHASED,
            trx,
            payload: {
                userId,
                productPurchaseId: productPurchase.productPurchaseId,
                currencyCode,
            },
            listeners: PRODUCT_PURCHASED_LISTENERS,
        });

        return productPurchase;
    });

    return { data };
};

export default createAppProductPurchase;
