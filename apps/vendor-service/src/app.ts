import express from "express";
import vendorRoutes from "./routes/vendorRoutes.js";
import vendorProductRoutes from "./routes/vendorProductRoutes.js";
import vendorReliabilityRoutes from "./routes/vendorReliabilityRoutes.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "vendor-service",
    status: "ok",
  });
});

app.use("/vendors", vendorRoutes);
app.use("/vendors/:vendorId/products", vendorProductRoutes);
app.use("/vendors/:vendorId/reliability", vendorReliabilityRoutes);

export default app;
