import { Router } from "express";
import { getInventoryLocationStocksController } from "../controllers/inventoryLocationStockController.js";

const router = Router();

router.get("/:inventoryItemId", getInventoryLocationStocksController);

export default router;
