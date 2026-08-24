import { db } from "@/database";

interface ICurrencyIsSupported {
    isoCurrencyCode: string;
}

const currencyIsSupported = async ({
    isoCurrencyCode,
}: ICurrencyIsSupported): Promise<boolean> => {
    const currency = await db
        .selectFrom("currencies")
        .select(["isoCurrencyCode"])
        .where("isoCurrencyCode", "=", isoCurrencyCode)
        .executeTakeFirst();

    return Boolean(currency);
};

export default currencyIsSupported;
