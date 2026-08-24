import { z } from "zod";
import appUserExists from "@/schemaHelpers/appUserExists";

const getAchievementSchema = z.object({
    userId: z
        .string()
        .trim()
        .uuid()
        .refine((userId) => appUserExists({ userId }), {
            message: "User does not exist",
        }),
});

export default getAchievementSchema;
