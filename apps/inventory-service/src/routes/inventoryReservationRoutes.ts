import { Router } from "express";
import {
  reserveInventoryController,
  releaseInventoryController,
} from "../controllers/inventoryReservationController.js";

const router = Router();

router.post("/", reserveInventoryController);
router.post("/:inventoryItemId/release", releaseInventoryController);

export default router;
