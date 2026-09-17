import { Router } from "express";
import {
  createInventoryController,
  getInventoryController,
  getInventoryByProductController,
} from "../controllers/inventoryController.js";

const router = Router();

router.post("/", createInventoryController);
router.get("/product/:productId", getInventoryByProductController);
router.get("/:id", getInventoryController);

export default router;
