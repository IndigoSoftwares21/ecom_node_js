import { z } from "zod";
import appUserExists from "@/schemaHelpers/appUserExists";
import currencyIsSupported from "@/schemaHelpers/currencyIsSupported";

const postProductPurchaseSchema = z.object({
    userId: z
        .string()
        .trim()
        .uuid()
        .refine((userId) => appUserExists({ userId }), {
            message: "User does not exist",
        }),
    // Minor units, so an integer: 300 Naira is 30000 kobo.
    amountInMinorUnits: z.coerce.number().int().positive(),
    currencyCode: z
        .string()
        .trim()
        .toUpperCase()
        .length(3)
        .refine(
            (isoCurrencyCode) => currencyIsSupported({ isoCurrencyCode }),
            { message: "Currency is not supported" },
        ),
});

export default postProductPurchaseSchema;
