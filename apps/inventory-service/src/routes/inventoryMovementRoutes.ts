import { Router } from "express";
import { recordInventoryMovementController, getInventoryMovementsController, transferInventoryController } from "../controllers/inventoryMovementController.js";

const router = Router();

router.get("/:inventoryItemId", getInventoryMovementsController);
router.post("/", recordInventoryMovementController);
router.post("/transfer", transferInventoryController);

export default router;
