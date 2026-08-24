import type { DatabaseExecutor } from "@/database/executor";
import PRODUCT_PURCHASE_STATUSES from "@/constants/product_purchase_statuses";

interface IInsertAppProductPurchase {
    trx: DatabaseExecutor;
    userId: string;
    amountInMinorUnits: number;
    currencyCode: string;
}

const insertAppProductPurchase = async ({
    trx,
    userId,
    amountInMinorUnits,
    currencyCode,
}: IInsertAppProductPurchase) => {
    const data = await trx
        .insertInto("productPurchases")
        .values({
            userId,
            amountInMinorUnits,
            currencyCode,
            status: PRODUCT_PURCHASE_STATUSES.COMPLETED,
        })
        .returning([
            "productPurchaseId",
            "userId",
            "amountInMinorUnits",
            "currencyCode",
            "status",
            "createdAt",
        ])
        .executeTakeFirstOrThrow();

    return data;
};

export default insertAppProductPurchase;
