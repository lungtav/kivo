import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { env } from "../../config/env.js";

const migrationsDirectory = path.join(
  process.cwd(),
  "src/infrastructure/database/migrations",
);

export async function runMigrations() {
  const client = new Client({
    connectionString: env.databaseUrlDirect,
  });

  await client.connect();

  try {
    await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const result = await client.query(
        `
                SELECT 1
                FROM schema_migrations
                WHERE version = $1
                `,
        [file],
      );

      if (result.rowCount !== 0) {
        continue;
      }

      const filePath = path.join(migrationsDirectory, file);
      const sql = await fs.readFile(filePath, "utf8");

      console.log(`Running migration: ${file}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          `
                    INSERT INTO schema_migrations (version)
                    VALUES ($1)
                    `,
          [file],
        );

        await client.query("COMMIT");

        console.log(`Completed migration: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

runMigrations()
  .then(() => {
    console.log("Migrations completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
