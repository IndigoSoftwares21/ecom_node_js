import { Request, Response } from "express";
import handleError from "@/utils/handleError";
import handleSuccess from "@/utils/handleSuccess";
import HTTP_STATUSES from "@/constants/http_statuses";
import createAppUser from "@/actions/app/user/createAppUser";
import postUserSchema from "./schema/postUser.schema";

const postAppUser = async (req: Request, res: Response) => {
    try {
        const { emailAddress, firstName, middleName, lastName, payoutRecipient } =
            req.body;

        const validatedData = await postUserSchema.parseAsync({
            emailAddress,
            firstName,
            middleName,
            lastName,
            payoutRecipient,
        });

        const { data } = await createAppUser({
            emailAddress: validatedData.emailAddress,
            firstName: validatedData.firstName,
            middleName: validatedData.middleName,
            lastName: validatedData.lastName,
            payoutRecipient: validatedData.payoutRecipient,
        });

        return handleSuccess({
            req,
            res,
            message: "User created successfully",
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

export default postAppUser;
