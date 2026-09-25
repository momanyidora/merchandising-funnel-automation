import { Request, Response } from "express";
import {
  createVendor,
  findVendorById,
  listVendors,
  updateVendor,
  deleteVendor,
} from "../services/vendorService.js";

export async function createVendorController(req: Request, res: Response) {
  try {
    const vendor = await createVendor(req.body);

    res.status(201).json(vendor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create vendor";

    res.status(400).json({ error: message });
  }
}

export async function listVendorsController(_req: Request, res: Response) {
  try {
    const vendors = await listVendors();

    res.status(200).json(vendors);
  } catch {
    res.status(500).json({
      error: "Failed to retrieve vendors",
    });
  }
}

export async function findVendorController(
  req: Request<{ vendorId: string }>,
  res: Response,
) {
  try {
    const vendor = await findVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({
        error: "Vendor not found",
      });
      return;
    }

    res.status(200).json(vendor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve vendor";

    res.status(400).json({ error: message });
  }
}

export async function updateVendorController(
  req: Request<{ vendorId: string }>,
  res: Response,
) {
  try {
    const vendor = await updateVendor(req.params.vendorId, req.body);

    if (!vendor) {
      res.status(404).json({
        error: "Vendor not found",
      });
      return;
    }

    res.status(200).json(vendor);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update vendor";

    res.status(400).json({ error: message });
  }
}

export async function deleteVendorController(
  req: Request<{ vendorId: string }>,
  res: Response,
) {
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
      error instanceof Error ? error.message : "Failed to remove vendor";

    res.status(400).json({ error: message });
  }
}
