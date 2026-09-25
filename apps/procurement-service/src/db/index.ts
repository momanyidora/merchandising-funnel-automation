import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.PROCUREMENT_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("PROCUREMENT_DATABASE_URL is not set");
}

try {
  const url = new URL(databaseUrl);

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("Invalid database URL protocol");
  }
} catch {
  throw new Error("PROCUREMENT_DATABASE_URL is invalid");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool);
