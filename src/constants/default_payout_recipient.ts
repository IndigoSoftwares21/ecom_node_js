/**
 * Placeholder bank details used when a customer is created without any.
 *
 * This exists so the cashback path can be exercised in one request, which
 * matters for review and local testing. It is safe only because the fake payment
 * provider is the default: with a real PAYSTACK_SECRET_KEY these details are
 * rejected by the provider, which is the correct outcome rather than money going
 * somewhere arbitrary. Real deployments supply details explicitly.
 */
const DEFAULT_PAYOUT_RECIPIENT = {
    BANK_CODE: "058",
    BANK_ACCOUNT_NUMBER: "0000000000",
    BANK_ACCOUNT_NAME: "Placeholder Account",
    CURRENCY_CODE: "NGN",
} as const;

export default DEFAULT_PAYOUT_RECIPIENT;
