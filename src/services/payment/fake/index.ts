import monitoring from "@/utils/monitoring";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";
import FAKE_PAYMENT_PROVIDER from "@/constants/fake_payment_provider";
import type {
    IPaymentProvider,
    ITransferRequest,
    ITransferResult,
} from "../types";

/**
 * Stands in for Paystack when no secret key is configured, so the flow is fully
 * exercisable in tests and local development without moving real money or
 * depending on an external service being reachable.
 */
class FakePaymentProvider implements IPaymentProvider {
    public readonly name = PAYMENT_PROVIDERS.PAYSTACK;

    public async transfer({
        reference,
        amountInMinorUnits,
        currencyCode,
    }: ITransferRequest): Promise<ITransferResult> {
        monitoring.info(
            `Fake payment provider: transferring ${amountInMinorUnits} ${currencyCode} for ${reference}`,
        );

        return {
            providerReference: `${FAKE_PAYMENT_PROVIDER.TRANSFER_REFERENCE_PREFIX}${reference}`,
            providerRecipientCode: `${FAKE_PAYMENT_PROVIDER.RECIPIENT_CODE_PREFIX}${reference}`,
        };
    }
}

export default FakePaymentProvider;
