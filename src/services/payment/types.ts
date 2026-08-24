export interface ITransferRecipientDetails {
    bankCode: string;
    bankAccountNumber: string;
    bankAccountName: string;
    currencyCode: string;
    providerRecipientCode: string | null;
}

export interface ITransferRequest {
    /**
     * The cashback payout id. Sent as the provider's own reference so a retry
     * presents the same value and is rejected as a duplicate rather than paying
     * twice.
     */
    reference: string;
    amountInMinorUnits: number;
    currencyCode: string;
    recipient: ITransferRecipientDetails;
    reason: string;
}

export interface ITransferResult {
    providerReference: string;
    providerRecipientCode: string;
}

export interface IPaymentProvider {
    readonly name: string;

    transfer(request: ITransferRequest): Promise<ITransferResult>;
}
