import { Router } from "express";
import {
  createPurchaseOrderItemController,
  getPurchaseOrderItemsController,
  getPurchaseOrderItemController,
  updatePurchaseOrderItemController,
  deletePurchaseOrderItemController,
} from "../controllers/purchaseOrderItemController.js";

const router = Router();

router.post("/:purchaseOrderId/items", createPurchaseOrderItemController);

router.get("/:purchaseOrderId/items", getPurchaseOrderItemsController);

router.get("/items/:id", getPurchaseOrderItemController);

router.patch("/items/:id", updatePurchaseOrderItemController);

router.delete("/items/:id", deletePurchaseOrderItemController);

export default router;
