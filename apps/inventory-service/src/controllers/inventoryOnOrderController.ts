import { Request, Response } from "express";
import { changeOnOrder } from "../services/inventoryOnOrderService.js";

export async function changeOnOrderController(req: Request, res: Response) {
  try {
    const { inventoryItemId, quantity } = req.body;

    if (!inventoryItemId || quantity === undefined) {
      return res.status(400).json({
        error: "inventoryItemId and quantity are required",
      });
    }

    const inventory = await changeOnOrder(inventoryItemId, quantity);

    return res.status(200).json(inventory);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Inventory item not found") {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message === "On-order quantity cannot be zero" ||
        error.message === "On-order quantity cannot be negative"
      ) {
        return res.status(409).json({
          error: error.message,
        });
      }
    }

    return res.status(500).json({
      error: "Failed to update on-order inventory",
    });
  }
}
