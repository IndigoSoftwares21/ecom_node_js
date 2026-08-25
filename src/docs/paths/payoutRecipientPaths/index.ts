const payoutRecipientPaths = {
    "/payout-recipients": {
        post: {
            tags: ["Payout recipients"],
            summary: "Save the bank account cashback is sent to",
            description:
                "Submitting again for the same customer and currency replaces the account on file and clears the cached provider recipient code.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: [
                                "userId",
                                "currencyCode",
                                "bankCode",
                                "bankAccountNumber",
                                "bankAccountName",
                            ],
                            properties: {
                                userId: { type: "string", format: "uuid" },
                                currencyCode: {
                                    type: "string",
                                    example: "NGN",
                                },
                                bankCode: { type: "string", example: "058" },
                                bankAccountNumber: {
                                    type: "string",
                                    example: "0123456789",
                                    description:
                                        "Digits only, kept as a string so leading zeros survive.",
                                },
                                bankAccountName: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Recipient saved",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    {
                                        $ref: "#/components/schemas/SuccessEnvelope",
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            data: {
                                                $ref: "#/components/schemas/PayoutRecipient",
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                400: {
                    description:
                        "Unknown customer, unsupported currency, or malformed account details",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ValidationError",
                            },
                        },
                    },
                },
            },
        },
    },
} as const;

export default payoutRecipientPaths;
