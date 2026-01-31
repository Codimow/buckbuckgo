import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = "postgres://buckbuckgo:postgres@localhost:5432/buckbuckgo";

async function runMigration() {
    console.log("Starting migration...");
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        const migrationPath = path.join(
            process.cwd(),
            "../../infra/postgres/init-scripts/02_fuzzy_search.sql"
        );
        const sql = fs.readFileSync(migrationPath, "utf-8");

        console.log(`Executing migration from: ${migrationPath}`);
        await client.query(sql);
        console.log("Migration executed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
