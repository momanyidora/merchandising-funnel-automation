import { Router } from "express";
import {
  createPurchaseOrderController,
  getPurchaseOrderController,
  listPurchaseOrdersController,
  updatePurchaseOrderController,
  deletePurchaseOrderController,
  submitPurchaseOrderController,
  approvePurchaseOrderController,
} from "../controllers/purchaseOrderController.js";

const router = Router();

router.post("/", createPurchaseOrderController);
router.get("/", listPurchaseOrdersController);
router.post("/:id/submit", submitPurchaseOrderController);
router.post("/:id/approve", approvePurchaseOrderController);
router.get("/:id", getPurchaseOrderController);
router.patch("/:id", updatePurchaseOrderController);
router.delete("/:id", deletePurchaseOrderController);

export default router;
