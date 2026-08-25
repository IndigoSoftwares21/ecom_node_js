import { db } from "@/database";

interface ISelectCurrencyMinorUnitExponent {
    isoCurrencyCode: string;
}

const selectCurrencyMinorUnitExponent = async ({
    isoCurrencyCode,
}: ISelectCurrencyMinorUnitExponent): Promise<number | null> => {
    const currency = await db
        .selectFrom("currencies")
        .select(["minorUnitExponent"])
        .where("isoCurrencyCode", "=", isoCurrencyCode)
        .executeTakeFirst();

    return currency?.minorUnitExponent ?? null;
};

export default selectCurrencyMinorUnitExponent;
