import { Request, Response } from "express";
import handleError from "@/utils/handleError";
import handleSuccess from "@/utils/handleSuccess";
import HTTP_STATUSES from "@/constants/http_statuses";
import createAppPayoutRecipient from "@/actions/app/payoutRecipient/createAppPayoutRecipient";
import postPayoutRecipientSchema from "./schema/postPayoutRecipient.schema";

const postAppPayoutRecipient = async (req: Request, res: Response) => {
    try {
        const {
            userId,
            currencyCode,
            bankCode,
            bankAccountNumber,
            bankAccountName,
        } = req.body;

        const validatedData = await postPayoutRecipientSchema.parseAsync({
            userId,
            currencyCode,
            bankCode,
            bankAccountNumber,
            bankAccountName,
        });

        const { data } = await createAppPayoutRecipient({
            userId: validatedData.userId,
            currencyCode: validatedData.currencyCode,
            bankCode: validatedData.bankCode,
            bankAccountNumber: validatedData.bankAccountNumber,
            bankAccountName: validatedData.bankAccountName,
        });

        return handleSuccess({
            req,
            res,
            message: "Payout recipient saved successfully",
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

export default postAppPayoutRecipient;
