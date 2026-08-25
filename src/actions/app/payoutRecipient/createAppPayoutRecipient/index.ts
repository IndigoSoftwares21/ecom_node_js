import { db } from "@/database";
import insertAppPayoutRecipient from "./queries/insertAppPayoutRecipient";

interface ICreateAppPayoutRecipient {
    userId: string;
    currencyCode: string;
    bankCode: string;
    bankAccountNumber: string;
    bankAccountName: string;
}

const createAppPayoutRecipient = async ({
    userId,
    currencyCode,
    bankCode,
    bankAccountNumber,
    bankAccountName,
}: ICreateAppPayoutRecipient) => {
    const data = await insertAppPayoutRecipient({
        trx: db,
        userId,
        currencyCode,
        bankCode,
        bankAccountNumber,
        bankAccountName,
    });

    return { data };
};

export default createAppPayoutRecipient;
