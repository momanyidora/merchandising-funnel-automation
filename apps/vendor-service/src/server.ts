import express from "express";
import dotenv from "dotenv";
import vendorRoutes from "./routes/vendorRoutes.js";
import vendorProductRoutes from "./routes/vendorProductRoutes.js";
import  vendorReliabilityRoutes  from "./routes/vendorReliabilityRoutes.js";


dotenv.config({
  path: "../../.env",
});

const app = express();

app.use(express.json());

const PORT = process.env.VENDOR_SERVICE_PORT || 3001;

app.get("/health", (_req, res) => {
  res.json({
    service: "vendor-service",
    status: "ok",
  });
});

app.use("/vendors", vendorRoutes);
app.use("/vendors/:vendorId/products", vendorProductRoutes);
app.use("/vendors/:vendorId/reliability", vendorReliabilityRoutes);


app.listen(PORT, () => {
  console.log(`Vendor service running on port ${PORT}`);
});
