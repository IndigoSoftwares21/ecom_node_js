import { z } from "zod";
import appUserExists from "@/schemaHelpers/appUserExists";
import currencyIsSupported from "@/schemaHelpers/currencyIsSupported";
import REGEX_PATTERNS from "@/constants/regex_patterns";

const postPayoutRecipientSchema = z.object({
    userId: z
        .string()
        .trim()
        .uuid()
        .refine((userId) => appUserExists({ userId }), {
            message: "User does not exist",
        }),
    currencyCode: z
        .string()
        .trim()
        .toUpperCase()
        .length(3)
        .refine(
            (isoCurrencyCode) => currencyIsSupported({ isoCurrencyCode }),
            { message: "Currency is not supported" },
        ),
    bankCode: z.string().trim().regex(REGEX_PATTERNS.BANK_CODE),
    // Kept as a string: account numbers are identifiers with significant
    // leading zeros, and parsing one as a number destroys them.
    bankAccountNumber: z.string().trim().regex(REGEX_PATTERNS.BANK_ACCOUNT_NUMBER),
    bankAccountName: z
        .string()
        .trim()
        .min(1)
        .max(128)
        .regex(REGEX_PATTERNS.PERSON_NAME),
});

export default postPayoutRecipientSchema;
