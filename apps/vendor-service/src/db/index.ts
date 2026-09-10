import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.VENDOR_DATABASE_URL,
});

export const db = drizzle(pool);
