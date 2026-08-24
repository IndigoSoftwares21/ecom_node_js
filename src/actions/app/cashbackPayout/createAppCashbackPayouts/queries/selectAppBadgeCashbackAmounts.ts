import type { DatabaseExecutor } from "@/database/executor";

interface ISelectAppBadgeCashbackAmounts {
    trx: DatabaseExecutor;
    badgeKeys: string[];
    currencyCode: string;
}

const selectAppBadgeCashbackAmounts = async ({
    trx,
    badgeKeys,
    currencyCode,
}: ISelectAppBadgeCashbackAmounts) => {
    const data = await trx
        .selectFrom("badgeCashbackAmounts")
        .select(["badgeKey", "currencyCode", "amountInMinorUnits"])
        .where("badgeKey", "in", badgeKeys)
        .where("currencyCode", "=", currencyCode)
        .execute();

    return data;
};

export default selectAppBadgeCashbackAmounts;
