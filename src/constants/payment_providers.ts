const PAYMENT_PROVIDERS = {
    PAYSTACK: "PAYSTACK",
} as const;

export type PaymentProvider =
    (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export default PAYMENT_PROVIDERS;
