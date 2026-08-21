import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    // Points DB_NAME at the test database before any module imports @/database,
    // which builds its pool from process.env at import time.
    setupFiles: ["<rootDir>/tests/setup/env.ts"],
    globalSetup: "<rootDir>/tests/setup/globalSetup.ts",
    setupFilesAfterEnv: ["<rootDir>/tests/setup/afterEnv.ts"],
    clearMocks: true,
    testTimeout: 20000,
};

export default config;
