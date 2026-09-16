import { Router } from "express";
import { reserve, release } from "../services/inventoryReservationService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { inventoryItemId, quantity } = req.body;

    if (!inventoryItemId || quantity === undefined) {
      return res.status(400).json({
        error: "inventoryItemId and quantity are required",
      });
    }

    const inventory = await reserve(inventoryItemId, quantity);

    return res.status(200).json(inventory);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Inventory item not found") {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message === "Insufficient available inventory" ||
        error.message === "Reservation quantity must be greater than zero"
      ) {
        return res.status(409).json({
          error: error.message,
        });
      }
    }

    return res.status(500).json({
      error: "Failed to reserve inventory",
    });
  }
});
router.post("/:inventoryItemId/release", async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        error: "quantity is required",
      });
    }

    const inventory = await release(req.params.inventoryItemId, quantity);

    return res.status(200).json(inventory);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Inventory item not found") {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message === "Cannot release more than reserved inventory" ||
        error.message === "Release quantity must be greater than zero"
      ) {
        return res.status(409).json({
          error: error.message,
        });
      }
    }

    return res.status(500).json({
      error: "Failed to release inventory reservation",
    });
  }
});
export default router;
