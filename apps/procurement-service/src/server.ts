import dotenv from "dotenv";
import app from "./app.js";
import { pool } from "./db/index.js";
import { env } from "./config/env.js";
import { startOutboxWorker } from "@mms/event-outbox";
import { isFeatureEnabled } from "@mms/feature-flags";

dotenv.config({
  path: "../../.env",
});

const port = Number(process.env.PROCUREMENT_SERVICE_PORT) || 3002;
if (isFeatureEnabled("procurement")) startOutboxWorker(pool, env.RABBITMQ_URL, "procurement-service");

app.listen(port, () => {
  console.log(`Procurement service running on port ${port}`);
});
