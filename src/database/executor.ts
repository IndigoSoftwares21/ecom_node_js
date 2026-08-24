import type { Kysely, Transaction } from "kysely";
import type { Database } from "./types";

export type DatabaseExecutor = Transaction<Database> | Kysely<Database>;
