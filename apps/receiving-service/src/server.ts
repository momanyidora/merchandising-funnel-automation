import express from "express";
import { env } from "./config/env.js";
import receivingRoutes from "./routes/receivingRoutes.js";
import { isFeatureEnabled } from "@mms/feature-flags";
import { startOutboxWorker } from "@mms/event-outbox";
import { pool } from "./db/index.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "receiving-service", status: "ok" }));
if (isFeatureEnabled("receiving")) { app.use("/receiving", receivingRoutes); startOutboxWorker(pool, env.RABBITMQ_URL, "receiving-service"); }

app.listen(env.RECEIVING_SERVICE_PORT, () => {
  console.log(
    `Receiving service running on port ${env.RECEIVING_SERVICE_PORT}`,
  );
});
