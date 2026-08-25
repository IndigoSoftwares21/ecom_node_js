import { z } from "zod";
import REGEX_PATTERNS from "@/constants/regex_patterns";
import appUserExists from "@/schemaHelpers/appUserExists";
import selectCurrencyMinorUnitExponent from "@/schemaHelpers/selectCurrencyMinorUnitExponent";
import convertAmountToMinorUnits from "@/utils/convertAmountToMinorUnits";

/**
 * The amount arrives as a decimal string in major units — "300.50", not 30050 —
 * and the server converts it. Taking minor units from the caller means a client
 * that forgets to multiply undercharges by a factor of a hundred, silently and
 * legally. Taking a string rather than a number avoids float parsing before the
 * conversion can be done exactly.
 */
const postProductPurchaseSchema = z
    .object({
        userId: z
            .string()
            .trim()
            .uuid()
            .refine((userId) => appUserExists({ userId }), {
                message: "User does not exist",
            }),
        amount: z.string().trim().regex(REGEX_PATTERNS.DECIMAL_AMOUNT, {
            message:
                "Amount must be a decimal with up to four places, for example 300.50",
        }),
        currencyCode: z.string().trim().toUpperCase().length(3),
    })
    .superRefine(async ({ amount, currencyCode }, context) => {
        const minorUnitExponent = await selectCurrencyMinorUnitExponent({
            isoCurrencyCode: currencyCode,
        });

        if (minorUnitExponent === null) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["currencyCode"],
                message: "Currency is not supported",
            });

            return;
        }

        try {
            convertAmountToMinorUnits({ amount, minorUnitExponent });
        } catch (error) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["amount"],
                message: (error as Error).message,
            });
        }
    });

export default postProductPurchaseSchema;
