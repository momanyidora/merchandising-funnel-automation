import { Router } from "express";
import {
  createInventoryController,
  getInventoryController,
  getInventoryByProductController,
  searchInventoryProductsController,
} from "../controllers/inventoryController.js";

const router = Router();

router.post("/", createInventoryController);
router.get("/products", searchInventoryProductsController);
router.get("/product/:productId", getInventoryByProductController);
router.get("/:id", getInventoryController);

export default router;
