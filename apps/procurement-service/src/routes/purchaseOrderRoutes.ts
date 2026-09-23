import { Router, Request, Response } from "express";
import {
  createPurchaseOrderService,
  getPurchaseOrderService,
  listPurchaseOrdersService,
  updatePurchaseOrderService,
  deletePurchaseOrderService,
  submitPurchaseOrderForApprovalService,
  approvePurchaseOrderService,
} from "../services/purchaseOrderService.js";
function getParam(value: string | string[]): string {
  if (Array.isArray(value)) {
    throw new Error("Invalid route parameter");
  }

  return value;
}
const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const purchaseOrder = await createPurchaseOrderService(req.body);

    res.status(201).json(purchaseOrder);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase order",
    });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const purchaseOrders = await listPurchaseOrdersService();

    res.status(200).json(purchaseOrders);
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to list purchase orders",
    });
  }
});
router.post("/:id/submit", async (req: Request, res: Response) => {
  try {
    const purchaseOrder = await submitPurchaseOrderForApprovalService(
      getParam(req.params.id),
    );

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit purchase order for approval";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const purchaseOrder = await approvePurchaseOrderService(
      getParam(req.params.id),
      req.body.approverId,
    );
    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to approve purchase order";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const purchaseOrder = await getPurchaseOrderService(getParam(req.params.id));

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get purchase order";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const purchaseOrder = await updatePurchaseOrderService(
      getParam(req.params.id),
      req.body,
    );

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update purchase order";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await deletePurchaseOrderService(getParam(req.params.id));

    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete purchase order";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});

export default router;
