import { z } from "zod";
import emailAddressIsAvailable from "@/schemaHelpers/emailAddressIsAvailable";
import currencyIsSupported from "@/schemaHelpers/currencyIsSupported";
import REGEX_PATTERNS from "@/constants/regex_patterns";

const postUserSchema = z.object({
    emailAddress: z
        .string()
        .trim()
        .toLowerCase()
        .email()
        .max(255)
        .refine((emailAddress) => emailAddressIsAvailable({ emailAddress }), {
            message: "A user with this email address already exists",
        }),
    firstName: z.string().trim().min(1).max(80).regex(REGEX_PATTERNS.PERSON_NAME),
    middleName: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .regex(REGEX_PATTERNS.PERSON_NAME)
        .nullish()
        .transform((middleName) => middleName ?? null),
    lastName: z.string().trim().min(1).max(80).regex(REGEX_PATTERNS.PERSON_NAME),
    // Optional: omitted, the placeholder defaults are used so cashback earned
    // straight after signup still has a destination.
    payoutRecipient: z
        .object({
            currencyCode: z
                .string()
                .trim()
                .toUpperCase()
                .length(3)
                .refine(
                    (isoCurrencyCode) =>
                        currencyIsSupported({ isoCurrencyCode }),
                    { message: "Currency is not supported" },
                ),
            bankCode: z.string().trim().regex(REGEX_PATTERNS.BANK_CODE),
            bankAccountNumber: z
                .string()
                .trim()
                .regex(REGEX_PATTERNS.BANK_ACCOUNT_NUMBER),
            bankAccountName: z
                .string()
                .trim()
                .min(1)
                .max(128)
                .regex(REGEX_PATTERNS.PERSON_NAME),
        })
        .nullish()
        .transform((payoutRecipient) => payoutRecipient ?? null),
});

export default postUserSchema;
