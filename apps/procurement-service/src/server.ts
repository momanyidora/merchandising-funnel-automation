import express from "express";

import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import purchaseOrderItemRoutes from "./routes/purchaseOrderItemRoutes.js";
import { requireFeature } from "./middleware/featureFlagMiddleware.js";
const app = express();

const port = Number(process.env.PROCUREMENT_SERVICE_PORT) || 3002;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "procurement-service",
    status: "ok",
  });
});

app.use("/purchase-orders", requireFeature("procurement"), purchaseOrderRoutes);

app.use(
  "/purchase-orders",
  requireFeature("procurement"),
  purchaseOrderItemRoutes,
);
app.listen(port, () => {
  console.log(`Procurement service running on port ${port}`);
});
