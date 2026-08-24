import { sql } from "kysely";
import { db, disconnect } from "@/database";

// Seeded reference data (currencies, achievements, badges) is deliberately
// excluded: it is created by the migrations and every test depends on it.
const MUTABLE_TABLES = [
    "app_user_achievements",
    "app_user_badges",
    "cashback_payouts",
    "outbox_events",
    "payout_recipients",
    "product_purchases",
    "app_users",
];

beforeEach(async () => {
    await sql
        .raw(
            `TRUNCATE TABLE ${MUTABLE_TABLES.join(", ")} RESTART IDENTITY CASCADE`,
        )
        .execute(db);
});

afterAll(async () => {
    await disconnect();
});
