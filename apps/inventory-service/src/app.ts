import express from "express";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import inventoryMovementRoutes from "./routes/inventoryMovementRoutes.js";
import inventoryLocationRoutes from "./routes/inventoryLocationRoutes.js";
import inventoryReservationRoutes from "./routes/inventoryReservationRoutes.js";
import inventoryValuationRoutes from "./routes/inventoryValuationRoutes.js";
import inventoryOnOrderRoutes from "./routes/inventoryOnOrderRoutes.js";
import { isFeatureEnabled } from "@mms/feature-flags";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "inventory-service",
    status: "ok",
  });
});

if (isFeatureEnabled("inventory")) {
  app.use("/inventory", inventoryRoutes);
  app.use("/inventory/locations", inventoryLocationRoutes);
  app.use("/inventory/movements", inventoryMovementRoutes);
  app.use("/inventory/reservations", inventoryReservationRoutes);
  app.use("/inventory/valuation", inventoryValuationRoutes);
  app.use("/inventory/on-order", inventoryOnOrderRoutes);
}

export default app;
