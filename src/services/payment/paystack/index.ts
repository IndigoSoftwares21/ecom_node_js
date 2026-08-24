import axios, { type AxiosInstance, isAxiosError } from "axios";
import PAYMENT_PROVIDERS from "@/constants/payment_providers";
import PAYSTACK from "@/constants/paystack";
import HTTP_STATUSES from "@/constants/http_statuses";
import monitoring from "@/utils/monitoring";
import NonRetryablePaymentError from "../nonRetryablePaymentError";
import type {
    IPaymentProvider,
    ITransferRecipientDetails,
    ITransferRequest,
    ITransferResult,
} from "../types";

interface IPaystackRecipientResponse {
    data: { recipient_code: string };
}

interface IPaystackTransferResponse {
    data: { transfer_code: string; reference: string };
}

/**
 * Paystack requires a two-step transfer: register the destination account to
 * obtain a recipient_code, then transfer to that code. The code is reusable, so
 * it is cached on payout_recipients and only created when absent.
 */
class PaystackPaymentProvider implements IPaymentProvider {
    public readonly name = PAYMENT_PROVIDERS.PAYSTACK;

    private readonly httpClient: AxiosInstance;

    constructor(secretKey: string) {
        this.httpClient = axios.create({
            baseURL: process.env.PAYSTACK_BASE_URL ?? PAYSTACK.BASE_URL,
            timeout: PAYSTACK.REQUEST_TIMEOUT_MS,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": PAYSTACK.CONTENT_TYPE,
            },
        });
    }

    /**
     * A 4xx means Paystack understood us and refused — a bad account number, an
     * unsupported currency for this account — so repeating it cannot help and it
     * is raised as non-retryable. Timeouts, network faults and 5xx are left as
     * ordinary errors for the queue to retry with backoff. 429 is excluded from
     * the terminal case because rate limiting resolves on its own.
     */
    private toPaymentError(error: unknown): Error {
        if (!isAxiosError(error) || !error.response) {
            return error as Error;
        }

        const { status, data } = error.response;
        const detail =
            (data as { message?: string } | undefined)?.message ?? error.message;

        const isClientRefusal =
            status >= HTTP_STATUSES.BAD_REQUEST &&
            status < HTTP_STATUSES.INTERNAL_SERVER_ERROR &&
            status !== HTTP_STATUSES.TOO_MANY_REQUESTS;

        if (isClientRefusal) {
            return new NonRetryablePaymentError(
                `Paystack refused the request (${status}): ${detail}`,
            );
        }

        return new Error(`Paystack request failed (${status}): ${detail}`);
    }

    private async post<TResponse>(
        endpoint: string,
        body: unknown,
    ): Promise<TResponse> {
        try {
            const { data } = await this.httpClient.post<TResponse>(
                endpoint,
                body,
            );

            return data;
        } catch (error) {
            throw this.toPaymentError(error);
        }
    }

    private async createRecipient({
        bankCode,
        bankAccountNumber,
        bankAccountName,
        currencyCode,
    }: ITransferRecipientDetails): Promise<string> {
        const response = await this.post<IPaystackRecipientResponse>(
            PAYSTACK.ENDPOINTS.TRANSFER_RECIPIENT,
            {
                type: PAYSTACK.RECIPIENT_TYPES.NUBAN,
                name: bankAccountName,
                account_number: bankAccountNumber,
                bank_code: bankCode,
                currency: currencyCode,
            },
        );

        return response.data.recipient_code;
    }

    public async transfer({
        reference,
        amountInMinorUnits,
        currencyCode,
        recipient,
        reason,
    }: ITransferRequest): Promise<ITransferResult> {
        const providerRecipientCode =
            recipient.providerRecipientCode ??
            (await this.createRecipient(recipient));

        monitoring.info(
            `Paystack: initiating transfer ${reference} of ${amountInMinorUnits} ${currencyCode}`,
        );

        const response = await this.post<IPaystackTransferResponse>(
            PAYSTACK.ENDPOINTS.TRANSFER,
            {
                source: PAYSTACK.TRANSFER_SOURCES.BALANCE,
                amount: amountInMinorUnits,
                recipient: providerRecipientCode,
                currency: currencyCode,
                reference,
                reason,
            },
        );

        return {
            providerReference: response.data.transfer_code,
            providerRecipientCode,
        };
    }
}

export default PaystackPaymentProvider;
