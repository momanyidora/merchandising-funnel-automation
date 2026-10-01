import { Router } from "express";
import { getInventoryStocksAtLocationController } from "../controllers/inventoryLocationStockController.js";
import {
  createLocationController,
  getLocationController,
  getLocationsController,
} from "../controllers/inventoryLocationController.js";

const router = Router();

router.get("/", getLocationsController);
router.post("/", createLocationController);
router.get("/:locationId/stock", getInventoryStocksAtLocationController);
router.get("/:id", getLocationController);
export default router;
