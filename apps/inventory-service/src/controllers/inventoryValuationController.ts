import { Request, Response } from "express";
import { getInventoryValuation } from "../services/inventoryValuationService.js";

export async function getInventoryValuationController(
  req: Request<{ inventoryItemId: string }>,
  res: Response,
) {
  try {
    const valuation = await getInventoryValuation(req.params.inventoryItemId);

    return res.status(200).json(valuation);
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
}
