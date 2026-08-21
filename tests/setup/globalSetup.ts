import { execSync } from "child_process";
import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const testDatabaseName = process.env.TEST_DB_NAME ?? "database_test";

const createTestDatabase = async (): Promise<void> => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: "postgres",
    });

    await client.connect();

    try {
        const existing = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [testDatabaseName],
        );

        if (existing.rowCount === 0) {
            // Cannot be parameterised or run inside a transaction.
            await client.query(`CREATE DATABASE "${testDatabaseName}"`);
        }
    } finally {
        await client.end();
    }
};

const migrateTestDatabase = (): void => {
    // The knex CLI registers ts-node itself, which is what lets it load the
    // .ts migrations. Calling knex programmatically from here would not.
    execSync("npx knex migrate:latest --env development", {
        stdio: "inherit",
        env: { ...process.env, DB_NAME: testDatabaseName },
    });
};

const globalSetup = async (): Promise<void> => {
    await createTestDatabase();
    migrateTestDatabase();
};

export default globalSetup;
