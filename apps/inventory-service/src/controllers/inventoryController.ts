import { Request, Response } from "express";
import {
  createInventory,
  getInventoryById,
  getInventoryByProductId,
  searchProducts,
} from "../services/inventoryService.js";

export async function createInventoryController(req: Request, res: Response) {
  try {
    const { productId, productName, unitCost } = req.body;
    if (!productName || unitCost === undefined) return res.status(400).json({ error: "productName and unitCost are required" });
    const inventory = await createInventory({ productId, productName, unitCost });

    return res.status(201).json(inventory);
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        error: "Failed to create inventory item",
      });
    }

    if (
      error.message === "Product name must be at least 2 characters" ||
      error.message ===
        "Unit cost must be a non-negative whole number in the selected currency"
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (error.message === "Inventory item already exists for this product") {
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

export async function searchInventoryProductsController(req: Request, res: Response) {
  try { const ids = String(req.query.ids ?? "").split(",").filter(Boolean); const items = await searchProducts(String(req.query.search ?? ""), Number(req.query.limit) || 20, ids); return res.json(items); } catch { return res.status(500).json({ error: "Failed to search products" }); }
}
