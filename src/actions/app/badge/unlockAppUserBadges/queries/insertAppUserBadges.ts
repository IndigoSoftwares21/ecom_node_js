import type { DatabaseExecutor } from "@/database/executor";

interface IInsertAppUserBadges {
    trx: DatabaseExecutor;
    userId: string;
    badgeKeys: string[];
}

/**
 * RETURNING after ON CONFLICT DO NOTHING yields only rows that genuinely
 * inserted, which is what stops a replay re-triggering a cashback.
 */
const insertAppUserBadges = async ({
    trx,
    userId,
    badgeKeys,
}: IInsertAppUserBadges) => {
    const data = await trx
        .insertInto("appUserBadges")
        .values(badgeKeys.map((badgeKey) => ({ userId, badgeKey })))
        .onConflict((onConflict) =>
            onConflict.columns(["userId", "badgeKey"]).doNothing(),
        )
        .returning("badgeKey")
        .execute();

    return data;
};

export default insertAppUserBadges;
