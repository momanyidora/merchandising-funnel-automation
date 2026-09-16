import dotenv from "dotenv";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const databaseUrl = process.env.INVENTORY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("INVENTORY_DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool);
