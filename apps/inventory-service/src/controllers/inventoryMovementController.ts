import { Request, Response } from "express";
import {
  getMovements,
  recordInventoryMovement,
  transferInventory,
} from "../services/inventoryMovementService.js";
import {
  InventoryItemNotFoundError,
  InventoryLocationNotFoundError,
  InsufficientInventoryError,
  InsufficientLocationInventoryError,
  InvalidMovementQuantityError,
} from "../errors/inventoryErrors.js";

export async function recordInventoryMovementController(
  req: Request,
  res: Response,
) {
  try {
    const { inventoryItemId, locationId, type, quantity, reason, idempotencyKey } = req.body;

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
      idempotencyKey,
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof InventoryItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof InventoryLocationNotFoundError) {
      return res.status(409).json({ error: error.message });
    }

    if (error instanceof InsufficientInventoryError) {
      return res.status(409).json({ error: error.message });
    }

    if (error instanceof InsufficientLocationInventoryError) {
      return res.status(409).json({ error: error.message });
    }

    if (error instanceof InvalidMovementQuantityError) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({
      error: "Failed to record inventory movement",
    });
  }
}
export async function getInventoryMovementsController(
  req: Request<{ inventoryItemId: string }>,
  res: Response,
) {
  try {
    const movements = await getMovements(req.params.inventoryItemId);

    return res.status(200).json(movements);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory movements",
    });
  }
}
export async function transferInventoryController(req: Request, res: Response) {
  try {
    const { inventoryItemId, sourceLocationId, destinationLocationId, quantity, reason, idempotencyKey } = req.body;
    if (!inventoryItemId || !sourceLocationId || !destinationLocationId || !idempotencyKey) return res.status(400).json({ error: "Inventory item, source, destination, and idempotency key are required" });
    const result = await transferInventory({ inventoryItemId, sourceLocationId, destinationLocationId, quantity, reason, idempotencyKey });
    return result ? res.status(200).json(result) : res.status(404).json({ error: "Inventory item not found" });
  } catch (error) {
    if (error instanceof InventoryLocationNotFoundError) return res.status(404).json({ error: error.message });
    if (error instanceof InsufficientLocationInventoryError) return res.status(409).json({ error: error.message });
    if (error instanceof InvalidMovementQuantityError) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to transfer inventory" });
  }
}
