import { Router } from "express";
import { getInventoryValuation } from "../services/inventoryValuationService.js";

const router = Router();

router.get("/:inventoryItemId", async (req, res) => {
  try {
    const valuation = await getInventoryValuation(req.params.inventoryItemId);

    return res.json(valuation);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Inventory item not found"
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to calculate inventory valuation",
    });
  }
});

export default router;
