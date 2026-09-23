import { Router } from "express";
import { recordInventoryMovementController } from "../controllers/inventoryMovementController.js";

const router = Router();

router.post("/", recordInventoryMovementController);

export default router;
