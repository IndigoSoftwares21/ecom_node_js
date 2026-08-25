import type { Config } from "jest";

const moduleNameMapper = {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@fixtures/(.*)$": "<rootDir>/jest/fixtures/$1",
};

/**
 * Split so unit tests need no database and stay fast, while integration tests
 * get a migrated test database and truncation between cases.
 * Tests live beside the code they cover: src/**\/name/name.test.ts
 */
const config: Config = {
    projects: [
        {
            displayName: "unit",
            preset: "ts-jest",
            testEnvironment: "node",
            roots: ["<rootDir>/src"],
            testMatch: ["**/*.test.ts"],
            testPathIgnorePatterns: ["\\.integration\\.test\\.ts$"],
            moduleNameMapper,
            clearMocks: true,
        },
        {
            displayName: "integration",
            preset: "ts-jest",
            testEnvironment: "node",
            roots: ["<rootDir>/src"],
            testMatch: ["**/*.integration.test.ts"],
            moduleNameMapper,
            clearMocks: true,
            setupFiles: ["<rootDir>/jest/env.ts"],
            globalSetup: "<rootDir>/jest/globalSetup.ts",
            setupFilesAfterEnv: ["<rootDir>/jest/afterEnv.ts"],
        },
    ],
    // Integration tests share one database and truncate between cases, so
    // parallel workers deadlock on TRUNCATE and delete each other's rows.
    maxWorkers: 1,
    passWithNoTests: true,
    // The application logs verbosely; suppress it so test output stays readable.
    silent: true,
    testTimeout: 20000,
};

export default config;
