import { Router } from "express";
import { getInventoryValuationController } from "../controllers/inventoryValuationController.js";

const router = Router();

router.get("/:inventoryItemId", getInventoryValuationController);

export default router;
