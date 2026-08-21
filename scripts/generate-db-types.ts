import { promises as fs } from "fs";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import toCamelCase from "../src/utils/toCamelCase";

dotenv.config();

interface TableColumn {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    udt_name: string;
}

interface TableGroups {
    [tableName: string]: TableColumn[];
}

async function main() {
    // Add a small delay to ensure migrations have fully completed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Database connection details
    const connectionDetails = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        ssl:
            (process.env.DB_SSL ?? "false").toLowerCase() === "true"
                ? { rejectUnauthorized: false }
                : undefined,
    };

    const pool = new Pool({
        ...connectionDetails,
        max: 2, // Limit connections for this script
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
    });

    try {
        // Query to get all tables and their columns
        const result = await pool.query(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.udt_name
      FROM 
        information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE 
        t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY 
        t.table_name,
        c.ordinal_position
    `);

        const tables = result.rows as TableColumn[];

        // Generate TypeScript interfaces
        let typeDefinitions = `/**
 * This file was automatically generated.
 * DO NOT MODIFY IT MANUALLY.
 */

import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

// Database interface with auto-generated fields marked as optional
export interface Database {
`;

        const tableGroups: TableGroups = tables.reduce((acc, row) => {
            if (!acc[row.table_name]) {
                acc[row.table_name] = [];
            }
            acc[row.table_name].push(row);
            return acc;
        }, {} as TableGroups);

        // PostgreSQL to TypeScript type mapping
        const typeMap: Record<string, string> = {
            integer: "number",
            bigint: "number",
            numeric: "number",
            decimal: "number",
            real: "number",
            "double precision": "number",
            smallint: "number",
            text: "string",
            "character varying": "string",
            varchar: "string",
            char: "string",
            character: "string",
            boolean: "boolean",
            timestamp: "Date",
            "timestamp with time zone": "Date",
            "timestamp without time zone": "Date",
            date: "Date",
            time: "string",
            json: "unknown",
            jsonb: "unknown",
            uuid: "string",
        };

        // Generate interface for each table
        Object.entries(tableGroups).forEach(([tableName, columns]) => {
            typeDefinitions += `  ${toCamelCase(tableName)}: {
`;

            columns.forEach((column) => {
                const isNullable = column.is_nullable === "YES";
                const nullableSuffix = isNullable ? " | null" : "";
                const hasDefault = column.column_default !== null;

                // Optional on insert whenever the database can supply the
                // value itself: either a DEFAULT, or NULL for a nullable column.
                const isOptionalOnInsert = hasDefault || isNullable;

                let tsType = typeMap[column.data_type] || "unknown";

                // Handle arrays
                if (column.data_type === "ARRAY") {
                    const elementType =
                        typeMap[column.udt_name.replace("_", "")] || "unknown";
                    tsType = `${elementType}[]`;
                }

                const propertyName = toCamelCase(column.column_name);

                if (isOptionalOnInsert) {
                    typeDefinitions += `    ${propertyName}?: ColumnType<${tsType}${nullableSuffix}>;
`;
                } else {
                    typeDefinitions += `    ${propertyName}: ColumnType<${tsType}${nullableSuffix}>;
`;
                }
            });

            typeDefinitions += `  };

`;
        });

        typeDefinitions += `}

// Utility types for better type safety
export type Row<Table extends keyof Database> = Selectable<Database[Table]>;
export type InsertRow<Table extends keyof Database> = Insertable<Database[Table]>;
export type UpdateRow<Table extends keyof Database> = Updateable<Database[Table]>;
`;

        // Write the generated types to a file
        await fs.writeFile("src/database/types.ts", typeDefinitions);

        console.log("✨ Database types generated successfully!");
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
