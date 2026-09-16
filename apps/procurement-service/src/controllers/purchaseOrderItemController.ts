import { Request, Response } from "express";
import {
  createPurchaseOrderItemService,
  getPurchaseOrderItemsService,
  getPurchaseOrderItemService,
  updatePurchaseOrderItemService,
  deletePurchaseOrderItemService,
} from "../services/purchaseOrderItemService.js";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getStatus(message: string): number {
  return message === "Purchase order not found" ||
    message === "Purchase order item not found"
    ? 404
    : 400;
}

export async function createPurchaseOrderItemController(
  req: Request<{ purchaseOrderId: string }>,
  res: Response,
) {
  try {
    const item = await createPurchaseOrderItemService({
      purchaseOrderId: req.params.purchaseOrderId,
      ...req.body,
    });

    res.status(201).json(item);
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to create purchase order item",
    );

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function getPurchaseOrderItemsController(
  req: Request<{ purchaseOrderId: string }>,
  res: Response,
) {
  try {
    const items = await getPurchaseOrderItemsService(
      req.params.purchaseOrderId,
    );

    res.status(200).json(items);
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to get purchase order items",
    );

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function getPurchaseOrderItemController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const item = await getPurchaseOrderItemService(req.params.id);

    res.status(200).json(item);
  } catch (error) {
    const message = getErrorMessage(error, "Failed to get purchase order item");

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function updatePurchaseOrderItemController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const item = await updatePurchaseOrderItemService(req.params.id, req.body);

    res.status(200).json(item);
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to update purchase order item",
    );

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function deletePurchaseOrderItemController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    await deletePurchaseOrderItemService(req.params.id);

    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to delete purchase order item",
    );

    res.status(getStatus(message)).json({ error: message });
  }
}
