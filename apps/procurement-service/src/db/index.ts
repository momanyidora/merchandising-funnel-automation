import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

try {
  const url = new URL(env.PROCUREMENT_DATABASE_URL);

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("Invalid database URL protocol");
  }
} catch {
  throw new Error("PROCUREMENT_DATABASE_URL is invalid");
}

const pool = new Pool({
  connectionString: env.PROCUREMENT_DATABASE_URL,
});

export const db = drizzle(pool);
