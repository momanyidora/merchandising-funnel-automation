import { Router } from "express";
import {
  createInventory,
  getInventoryById,
  getInventoryByProductId,
} from "../services/inventoryService.js";

const router = Router();

router.post("/", async (req, res) => {
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
});

router.get("/:id", async (req, res) => {
  try {
    const inventory = await getInventoryById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    return res.json(inventory);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory item",
    });
  }
});

router.get("/product/:productId", async (req, res) => {
  try {
    const inventory = await getInventoryByProductId(req.params.productId);

    if (!inventory) {
      return res.status(404).json({
        error: "Inventory item not found",
      });
    }

    return res.json(inventory);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory item",
    });
  }
});

export default router;
