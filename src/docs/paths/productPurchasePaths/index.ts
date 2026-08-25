const productPurchasePaths = {
    "/product-purchases": {
        post: {
            tags: ["Product purchases"],
            summary: "Record a purchase",
            description:
                "Recording a purchase unlocks any achievements the new count entitles the customer to, awards any badge earned, and queues the cashback. All of it commits with the purchase or not at all.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["userId", "amount", "currencyCode"],
                            properties: {
                                userId: { type: "string", format: "uuid" },
                                amount: {
                                    type: "string",
                                    example: "300.50",
                                    description:
                                        "Major units as a decimal string. The server converts to minor units using the currency's exponent, so clients never do the arithmetic. More decimal places than the currency has is rejected, not rounded.",
                                },
                                currencyCode: {
                                    type: "string",
                                    example: "NGN",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Purchase recorded",
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
                                                $ref: "#/components/schemas/ProductPurchase",
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
                        "Unknown customer, unsupported currency, or invalid amount",
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

export default productPurchasePaths;
