import { Request, Response } from "express";
import handleError from "@/utils/handleError";
import handleSuccess from "@/utils/handleSuccess";
import HTTP_STATUSES from "@/constants/http_statuses";
import fetchAppUserAchievements from "@/actions/app/achievement/fetchAppUserAchievements";
import getAchievementSchema from "./schema/getAchievement.schema";

const getAppAchievement = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const validatedData = await getAchievementSchema.parseAsync({ userId });

        const { data } = await fetchAppUserAchievements({
            userId: validatedData.userId,
        });

        return handleSuccess({
            req,
            res,
            message: "Achievements retrieved successfully",
            // Snake case: these field names are fixed by the specification,
            // so they are mapped explicitly rather than following the
            // camelCase used internally.
            data: {
                unlocked_achievements: data.unlockedAchievements,
                next_available_achievements: data.nextAvailableAchievements,
                current_badge: data.currentBadge,
                next_badge: data.nextBadge,
                remaining_to_unlock_next_badge: data.remainingToUnlockNextBadge,
            },
            code: HTTP_STATUSES.OK,
        });
    } catch (error) {
        return handleError({
            req,
            res,
            error,
        });
    }
};

export default getAppAchievement;
