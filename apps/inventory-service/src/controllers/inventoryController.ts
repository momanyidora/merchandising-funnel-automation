import { Request, Response } from "express";
import {
  createInventory,
  getInventoryById,
  getInventoryByProductId,
} from "../services/inventoryService.js";

export async function createInventoryController(req: Request, res: Response) {
  try {
    const { productId, unitCost } = req.body;

    if (!productId || unitCost === undefined) {
      return res.status(400).json({
        error: "productId and unitCost are required",
      });
    }

    const inventory = await createInventory({
      productId,
      unitCost,
    });

    return res.status(201).json(inventory);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Inventory item already exists for this product"
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to create inventory item",
    });
  }
}

export async function getInventoryController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const inventory = await getInventoryById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    return res.status(200).json(inventory);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory item",
    });
  }
}

export async function getInventoryByProductController(
  req: Request<{ productId: string }>,
  res: Response,
) {
  try {
    const inventory = await getInventoryByProductId(req.params.productId);

    if (!inventory) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    return res.status(200).json(inventory);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory item",
    });
  }
}
