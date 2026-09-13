import {
  createPurchaseOrderItem,
  getPurchaseOrderItems,
  getPurchaseOrderItemById,
  updatePurchaseOrderItem,
  deletePurchaseOrderItem,
} from "../repositories/purchaseOrderItemRepository.js";

import { getPurchaseOrderById } from "../repositories/purchaseOrderRepository.js";

export async function createPurchaseOrderItemService(data: {
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  lockedUnitCost: number;
}) {
  if (!data.purchaseOrderId) {
    throw new Error("Purchase order ID is required");
  }

  if (!data.productId) {
    throw new Error("Product ID is required");
  }

  if (data.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  if (data.lockedUnitCost < 0) {
    throw new Error("Locked unit cost cannot be negative");
  }

  const purchaseOrder = await getPurchaseOrderById(data.purchaseOrderId);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error("Items can only be added to draft purchase orders");
  }

  return createPurchaseOrderItem(data);
}

export async function getPurchaseOrderItemsService(purchaseOrderId: string) {
  const purchaseOrder = await getPurchaseOrderById(purchaseOrderId);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  return getPurchaseOrderItems(purchaseOrderId);
}

export async function getPurchaseOrderItemService(id: string) {
  if (!id) {
    throw new Error("Purchase order item ID is required");
  }

  const item = await getPurchaseOrderItemById(id);

  if (!item) {
    throw new Error("Purchase order item not found");
  }

  return item;
}

export async function updatePurchaseOrderItemService(
  id: string,
  data: {
    quantity?: number;
    lockedUnitCost?: number;
  },
) {
  const item = await getPurchaseOrderItemById(id);

  if (!item) {
    throw new Error("Purchase order item not found");
  }

  const purchaseOrder = await getPurchaseOrderById(item.purchaseOrderId);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error("Items can only be updated on draft purchase orders");
  }

  if (data.quantity !== undefined && data.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  if (data.lockedUnitCost !== undefined && data.lockedUnitCost < 0) {
    throw new Error("Locked unit cost cannot be negative");
  }

  return updatePurchaseOrderItem(id, data);
}

export async function deletePurchaseOrderItemService(id: string) {
  const item = await getPurchaseOrderItemById(id);

  if (!item) {
    throw new Error("Purchase order item not found");
  }

  const purchaseOrder = await getPurchaseOrderById(item.purchaseOrderId);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error("Items can only be deleted from draft purchase orders");
  }

  return deletePurchaseOrderItem(id);
}
