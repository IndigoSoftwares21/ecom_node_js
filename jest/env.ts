import * as dotenv from "dotenv";

dotenv.config();

// dotenv never overwrites an existing value, so setting this before any other
// module loads is what keeps the suite off the development database.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? "database_test";
process.env.NODE_ENV = "test";

// Importing the app starts its listener. Port 0 makes the OS assign a free port
// per worker, so parallel test files cannot collide on the configured port
// while supertest talks to the Express instance directly.
process.env.PORT = "0";
