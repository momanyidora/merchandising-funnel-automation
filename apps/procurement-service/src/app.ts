import express from "express";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import purchaseOrderItemRoutes from "./routes/purchaseOrderItemRoutes.js";
import purchaseOrderAmendmentRoutes from "./routes/purchaseOrderAmendmentRoutes.js";
import { requireFeature } from "./middleware/featureFlagMiddleware.js";

const app = express();

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
app.use("/purchase-orders", requireFeature("procurement"), purchaseOrderAmendmentRoutes);

export default app;
