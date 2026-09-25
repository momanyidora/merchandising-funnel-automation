import { Request, Response } from "express";
import {
  createLocation,
  getLocationById,
} from "../services/inventoryLocationService.js";

export async function createLocationController(req: Request, res: Response) {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        error: "name and code are required",
      });
    }

    const location = await createLocation({ name, code });

    return res.status(201).json(location);
  } catch {
    return res.status(500).json({
      error: "Failed to create inventory location",
    });
  }
}

export async function getLocationController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const location = await getLocationById(req.params.id);

    if (!location) {
      return res.status(404).json({
        error: "Inventory location not found",
      });
    }

    return res.status(200).json(location);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory location",
    });
  }
}
