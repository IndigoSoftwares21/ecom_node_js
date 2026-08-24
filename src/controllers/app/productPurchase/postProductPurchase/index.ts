import { Request, Response } from "express";
import handleError from "@/utils/handleError";
import handleSuccess from "@/utils/handleSuccess";
import HTTP_STATUSES from "@/constants/http_statuses";
import createAppProductPurchase from "@/actions/app/productPurchase/createAppProductPurchase";
import postProductPurchaseSchema from "./schema/postProductPurchase.schema";

const postAppProductPurchase = async (req: Request, res: Response) => {
    try {
        const { userId, amountInMinorUnits, currencyCode } = req.body;

        await postProductPurchaseSchema.parseAsync({
            userId,
            amountInMinorUnits,
            currencyCode,
        });

        const { data } = await createAppProductPurchase({
            userId,
            amountInMinorUnits,
            currencyCode,
        });

        return handleSuccess({
            req,
            res,
            message: "Product purchase recorded successfully",
            data,
            code: HTTP_STATUSES.CREATED,
        });
    } catch (error) {
        return handleError({
            req,
            res,
            error,
        });
    }
};

export default postAppProductPurchase;
