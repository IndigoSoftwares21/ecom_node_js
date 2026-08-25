/**
 * Reusable OpenAPI schemas. Kept separate from the path definitions so a shape
 * used by several endpoints is described once.
 */
const components = {
    schemas: {
        AppUser: {
            type: "object",
            properties: {
                userId: { type: "string", format: "uuid" },
                emailAddress: { type: "string", format: "email" },
                firstName: { type: "string" },
                middleName: { type: "string", nullable: true },
                lastName: { type: "string" },
                isActive: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        AchievementProgress: {
            type: "object",
            description:
                "Field names are snake_case because they are fixed by the API specification.",
            properties: {
                unlocked_achievements: {
                    type: "array",
                    items: { type: "string" },
                },
                next_available_achievements: {
                    type: "array",
                    items: { type: "string" },
                    description:
                        "At most one entry per achievement group: the next one the user can unlock.",
                },
                current_badge: { type: "string", nullable: true },
                next_badge: { type: "string", nullable: true },
                remaining_to_unlock_next_badge: { type: "integer" },
            },
        },
        ProductPurchase: {
            type: "object",
            properties: {
                productPurchaseId: { type: "string", format: "uuid" },
                userId: { type: "string", format: "uuid" },
                amountInMinorUnits: { type: "integer" },
                currencyCode: { type: "string", example: "NGN" },
                status: { type: "string", example: "COMPLETED" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        PayoutRecipient: {
            type: "object",
            properties: {
                payoutRecipientId: { type: "string", format: "uuid" },
                userId: { type: "string", format: "uuid" },
                provider: { type: "string", example: "PAYSTACK" },
                currencyCode: { type: "string", example: "NGN" },
                bankCode: { type: "string", example: "058" },
                bankAccountNumber: { type: "string", example: "0123456789" },
                bankAccountName: { type: "string" },
            },
        },
        SuccessEnvelope: {
            type: "object",
            properties: {
                message: { type: "string" },
                code: { type: "integer" },
                data: {},
            },
        },
        ValidationError: {
            type: "object",
            properties: {
                message: { type: "string", example: "Validation failed" },
                code: { type: "integer", example: 400 },
                validationErrors: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            path: { type: "array", items: { type: "string" } },
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
    },
} as const;

export default components;
