const PAYSTACK = {
    BASE_URL: "https://api.paystack.co",
    REQUEST_TIMEOUT_MS: 15000,
    CONTENT_TYPE: "application/json",
    ENDPOINTS: {
        TRANSFER_RECIPIENT: "/transferrecipient",
        TRANSFER: "/transfer",
    },
    RECIPIENT_TYPES: {
        NUBAN: "nuban",
    },
    TRANSFER_SOURCES: {
        BALANCE: "balance",
    },
} as const;

export default PAYSTACK;
