import type { DatabaseExecutor } from "@/database/executor";
import PRODUCT_PURCHASE_STATUSES from "@/constants/product_purchase_statuses";

interface ISelectAppUserCompletedProductPurchaseCount {
    trx: DatabaseExecutor;
    userId: string;
}

/**
 * Counts only COMPLETED purchases, so a refund lowers the count. Achievements
 * already unlocked are never revoked; the lower count only withholds new ones.
 */
const selectAppUserCompletedProductPurchaseCount = async ({
    trx,
    userId,
}: ISelectAppUserCompletedProductPurchaseCount) => {
    const data = await trx
        .selectFrom("productPurchases")
        .select((eb) =>
            eb.fn.countAll<number>().as("completedProductPurchaseCount"),
        )
        .where("userId", "=", userId)
        .where("status", "=", PRODUCT_PURCHASE_STATUSES.COMPLETED)
        .executeTakeFirstOrThrow();

    return data;
};

export default selectAppUserCompletedProductPurchaseCount;
