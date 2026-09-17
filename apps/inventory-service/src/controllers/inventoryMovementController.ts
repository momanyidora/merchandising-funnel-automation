import { Request, Response } from "express";
import { recordInventoryMovement } from "../services/inventoryMovementService.js";

export async function recordInventoryMovementController(
  req: Request,
  res: Response,
) {
  try {
    const { inventoryItemId, locationId, type, quantity, reason } = req.body;

    if (!inventoryItemId || !locationId || !type || quantity === undefined) {
      return res.status(400).json({
        error: "inventoryItemId, locationId, type and quantity are required",
      });
    }

    const result = await recordInventoryMovement({
      inventoryItemId,
      locationId,
      type,
      quantity,
      reason,
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Inventory item not found") {
        return res.status(404).json({ error: error.message });
      }

      if (error.message === "Insufficient inventory") {
        return res.status(409).json({ error: error.message });
      }

      if (error.message === "Movement quantity cannot be zero") {
        return res.status(400).json({ error: error.message });
      }
    }

    return res.status(500).json({
      error: "Failed to record inventory movement",
    });
  }
}
