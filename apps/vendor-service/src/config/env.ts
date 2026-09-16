import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  VENDOR_DATABASE_URL: z.string().min(1, "VENDOR_DATABASE_URL is required"),

  VENDOR_SERVICE_PORT: z.coerce.number().int().positive(),
});

export const env = envSchema.parse(process.env);
