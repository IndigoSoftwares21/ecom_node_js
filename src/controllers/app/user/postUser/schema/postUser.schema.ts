import { z } from "zod";
import emailAddressIsAvailable from "@/schemaHelpers/emailAddressIsAvailable";
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
});

export default postUserSchema;
