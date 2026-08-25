import { withTransaction } from "@/database";
import DEFAULT_PAYOUT_RECIPIENT from "@/constants/default_payout_recipient";
import insertAppPayoutRecipient from "@/actions/app/payoutRecipient/createAppPayoutRecipient/queries/insertAppPayoutRecipient";
import insertAppUser from "./queries/insertAppUser";

interface IPayoutRecipientInput {
    currencyCode: string;
    bankCode: string;
    bankAccountNumber: string;
    bankAccountName: string;
}

interface ICreateAppUser {
    emailAddress: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    payoutRecipient: IPayoutRecipientInput | null;
}

/**
 * Creates the customer and the account their cashback will be sent to, in one
 * transaction so a customer is never left half configured.
 *
 * Bank details are optional; without them the placeholder defaults are used, so
 * a badge earned immediately after signup still has somewhere to pay.
 */
const createAppUser = async ({
    emailAddress,
    firstName,
    middleName,
    lastName,
    payoutRecipient,
}: ICreateAppUser) => {
    const data = await withTransaction(async (trx) => {
        const appUser = await insertAppUser({
            trx,
            emailAddress,
            firstName,
            middleName,
            lastName,
        });

        const recipient = await insertAppPayoutRecipient({
            trx,
            userId: appUser.userId,
            currencyCode:
                payoutRecipient?.currencyCode ??
                DEFAULT_PAYOUT_RECIPIENT.CURRENCY_CODE,
            bankCode:
                payoutRecipient?.bankCode ??
                DEFAULT_PAYOUT_RECIPIENT.BANK_CODE,
            bankAccountNumber:
                payoutRecipient?.bankAccountNumber ??
                DEFAULT_PAYOUT_RECIPIENT.BANK_ACCOUNT_NUMBER,
            bankAccountName:
                payoutRecipient?.bankAccountName ??
                DEFAULT_PAYOUT_RECIPIENT.BANK_ACCOUNT_NAME,
        });

        return { ...appUser, payoutRecipient: recipient };
    });

    return { data };
};

export default createAppUser;
