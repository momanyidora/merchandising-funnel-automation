import { Router, Request, Response } from "express";

import {
  createPurchaseOrderItemService,
  getPurchaseOrderItemsService,
  getPurchaseOrderItemService,
  updatePurchaseOrderItemService,
  deletePurchaseOrderItemService,
} from "../services/purchaseOrderItemService.js";
function getParam(value: string | string[]): string {
  if (Array.isArray(value)) {
    throw new Error("Invalid route parameter");
  }

  return value;
}
const router = Router();

router.post("/:purchaseOrderId/items", async (req: Request, res: Response) => {
  try {
    const item = await createPurchaseOrderItemService({
      purchaseOrderId: getParam(req.params.purchaseOrderId),
      ...req.body,
    });

    res.status(201).json(item);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create purchase order item";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});

router.get("/:purchaseOrderId/items", async (req: Request, res: Response) => {
  try {
    const items = await getPurchaseOrderItemsService(
     getParam(req.params.purchaseOrderId),
    );

    res.status(200).json(items);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get purchase order items";

    const status = message === "Purchase order not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});

router.get("/items/:id", async (req: Request, res: Response) => {
  try {
    const item = await getPurchaseOrderItemService(getParam(req.params.id));

    res.status(200).json(item);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get purchase order item";

    const status = message === "Purchase order item not found" ? 404 : 400;

    res.status(status).json({
      error: message,
    });
  }
});

router.patch("/items/:id", async (req: Request, res: Response) => {
  try {
    const item = await updatePurchaseOrderItemService(getParam(req.params.id), req.body);

    res.status(200).json(item);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update purchase order item";

    const status =
      message === "Purchase order item not found" ||
      message === "Purchase order not found"
        ? 404
        : 400;

    res.status(status).json({
      error: message,
    });
  }
});

router.delete("/items/:id", async (req: Request, res: Response) => {
  try {
    await deletePurchaseOrderItemService(getParam(req.params.id));

    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete purchase order item";

    const status =
      message === "Purchase order item not found" ||
      message === "Purchase order not found"
        ? 404
        : 400;

    res.status(status).json({
      error: message,
    });
  }
});

export default router;
