import * as dotenv from "dotenv";

dotenv.config();

// dotenv never overwrites an existing value, so setting this before any other
// module loads is what keeps the suite off the development database.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? "database_test";
process.env.NODE_ENV = "test";
