import { Router } from "express";
import {
  createVendor,
  findVendorById,
  listVendors,
  updateVendor,
  deleteVendor,
} from "../services/vendorService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const vendor = await createVendor(req.body);

    res.status(201).json(vendor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create vendor";

    res.status(400).json({
      error: message,
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const vendors = await listVendors();

    res.json(vendors);
  } catch {
    res.status(500).json({
      error: "Failed to retrieve vendors",
    });
  }
});

router.get("/:vendorId", async (req, res) => {
  try {
    const vendor = await findVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({
        error: "Vendor not found",
      });
      return;
    }

    res.json(vendor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve vendor";

    res.status(400).json({ error: message });
  }
});

router.patch("/:vendorId", async (req, res) => {
  try {
    const vendor = await updateVendor(req.params.vendorId, req.body);

    if (!vendor) {
      res.status(404).json({
        error: "Vendor not found",
      });
      return;
    }

    res.json(vendor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update vendor";

    res.status(400).json({
      error: message,
    });
  }
});

router.delete("/:vendorId", async (req, res) => {
  try {
    const vendor = await deleteVendor(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({
        error: "Vendor not found",
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove vendor product";

    res.status(400).json({ error: message });
  }
});

export default router;
