import { Request, Response } from "express";
import {
  createPurchaseOrderService,
  getPurchaseOrderService,
  listPurchaseOrdersService,
  updatePurchaseOrderService,
  deletePurchaseOrderService,
  submitPurchaseOrderForApprovalService,
  approvePurchaseOrderService,
} from "../services/purchaseOrderService.js";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getStatus(message: string): number {
  return message === "Purchase order not found" ? 404 : 400;
}

export async function createPurchaseOrderController(
  req: Request,
  res: Response,
) {
  try {
    const purchaseOrder = await createPurchaseOrderService(req.body);

    res.status(201).json(purchaseOrder);
  } catch (error) {
    res.status(400).json({
      error: getErrorMessage(error, "Failed to create purchase order"),
    });
  }
}

export async function listPurchaseOrdersController(
  _req: Request,
  res: Response,
) {
  try {
    const purchaseOrders = await listPurchaseOrdersService();

    res.status(200).json(purchaseOrders);
  } catch (error) {
    res.status(500).json({
      error: getErrorMessage(error, "Failed to list purchase orders"),
    });
  }
}

export async function getPurchaseOrderController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const purchaseOrder = await getPurchaseOrderService(req.params.id);

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message = getErrorMessage(error, "Failed to get purchase order");

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function updatePurchaseOrderController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const purchaseOrder = await updatePurchaseOrderService(
      req.params.id,
      req.body,
    );

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message = getErrorMessage(error, "Failed to update purchase order");

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function deletePurchaseOrderController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    await deletePurchaseOrderService(req.params.id);

    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error, "Failed to delete purchase order");

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function submitPurchaseOrderController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const purchaseOrder = await submitPurchaseOrderForApprovalService(
      req.params.id,
    );

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to submit purchase order for approval",
    );

    res.status(getStatus(message)).json({ error: message });
  }
}

export async function approvePurchaseOrderController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const purchaseOrder = await approvePurchaseOrderService(req.params.id);

    res.status(200).json(purchaseOrder);
  } catch (error) {
    const message = getErrorMessage(error, "Failed to approve purchase order");

    res.status(getStatus(message)).json({ error: message });
  }
}
