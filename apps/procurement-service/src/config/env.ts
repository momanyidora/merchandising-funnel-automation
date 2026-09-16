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

  PROCUREMENT_DATABASE_URL: z
    .string()
    .min(1, "PROCUREMENT_DATABASE_URL is required"),

  PROCUREMENT_SERVICE_PORT: z.coerce.number().int().positive(),

  RABBITMQ_URL: z.string().min(1, "RABBITMQ_URL is required"),

  VENDOR_SERVICE_URL: z.string().url().default("http://localhost:3001"),
});

export const env = envSchema.parse(process.env);
