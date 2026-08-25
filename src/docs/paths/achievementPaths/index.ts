const achievementPaths = {
    "/users/{userId}/achievements": {
        get: {
            tags: ["Achievements"],
            summary: "Read a customer's achievement and badge progress",
            parameters: [
                {
                    name: "userId",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "Progress for the customer",
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
                                                $ref: "#/components/schemas/AchievementProgress",
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                400: {
                    description: "Unknown or malformed customer identifier",
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

export default achievementPaths;
