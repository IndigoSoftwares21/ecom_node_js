const VALIDATION_RESPONSE = {
    description: "Validation failed",
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ValidationError" },
        },
    },
} as const;

const userPaths = {
    "/users": {
        post: {
            tags: ["Users"],
            summary: "Create a customer",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: [
                                "emailAddress",
                                "firstName",
                                "lastName",
                            ],
                            properties: {
                                emailAddress: {
                                    type: "string",
                                    format: "email",
                                },
                                firstName: { type: "string" },
                                middleName: { type: "string", nullable: true },
                                lastName: { type: "string" },
                                payoutRecipient: {
                                    type: "object",
                                    nullable: true,
                                    description:
                                        "Bank account the cashback is sent to. Omit and placeholder defaults are used, so the cashback path can be exercised in one call.",
                                    required: [
                                        "currencyCode",
                                        "bankCode",
                                        "bankAccountNumber",
                                        "bankAccountName",
                                    ],
                                    properties: {
                                        currencyCode: {
                                            type: "string",
                                            example: "NGN",
                                        },
                                        bankCode: {
                                            type: "string",
                                            example: "058",
                                        },
                                        bankAccountNumber: {
                                            type: "string",
                                            example: "0123456789",
                                        },
                                        bankAccountName: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Customer created",
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
                                                $ref: "#/components/schemas/AppUser",
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                400: VALIDATION_RESPONSE,
            },
        },
    },
} as const;

export default userPaths;
