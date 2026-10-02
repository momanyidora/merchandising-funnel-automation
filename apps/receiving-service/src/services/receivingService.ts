import {
  getPurchaseOrderById,
  getPurchaseOrderItems,
} from "../clients/procurementClient.js";

import {
  createGoodsReceiptWithItems,
  getReceivedQuantitiesByPurchaseOrder,
} from "../repositories/goodsReceiptRepository.js";
import { randomUUID } from "node:crypto";
import { classifyReceipt } from "../domain/receiptDiscrepancy.js";

type ReceivingItemInput = {
  productId: string;
  receivedQuantity: number;
  condition: "GOOD" | "DAMAGED";
  locationId: string;
};

export async function getReceivablePurchaseOrder(purchaseOrderId: string) {
  if (!purchaseOrderId) {
    throw new Error("Purchase order ID is required");
  }

  const purchaseOrder = await getPurchaseOrderById(purchaseOrderId);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  if (purchaseOrder.status !== "APPROVED") {
    throw new Error("Only approved purchase orders can be received");
  }

  const items = await getPurchaseOrderItems(purchaseOrderId);

  if (!items) {
    throw new Error("Purchase order items not found");
  }

  return {
    purchaseOrder,
    items,
  };
}

export async function createReceiving(data: {
  purchaseOrderId: string;
  items: ReceivingItemInput[];
}) {
  if (!data.purchaseOrderId) {
    throw new Error("Purchase order ID is required");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("At least one receiving item is required");
  }

  const { purchaseOrder, items: purchaseOrderItems } =
    await getReceivablePurchaseOrder(data.purchaseOrderId);
  const grnNumber = `GRN-${new Date().getFullYear()}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`;
  const receivedToDate = await getReceivedQuantitiesByPurchaseOrder(
    purchaseOrder.id,
  );
  const receivingItems = data.items.map((receivingItem) => {
    const purchaseOrderItem = purchaseOrderItems.find(
      (item: { productId: string }) =>
        item.productId === receivingItem.productId,
    );

    if (!purchaseOrderItem) {
      throw new Error(
        `Product ${receivingItem.productId} is not part of the purchase order`,
      );
    }

    if (
      !Number.isInteger(receivingItem.receivedQuantity) ||
      receivingItem.receivedQuantity < 0
    ) {
      throw new Error("Received quantity must be a non-negative integer");
    }
    const expectedQuantity = Math.max(
      0,
      purchaseOrderItem.quantity -
        (receivedToDate.get(receivingItem.productId) ?? 0),
    );
    const discrepancyType = classifyReceipt(
      expectedQuantity,
      receivingItem.receivedQuantity,
      receivingItem.condition,
    );
    return {
      productId: receivingItem.productId,
      expectedQuantity,
      receivedQuantity: receivingItem.receivedQuantity,
      condition: receivingItem.condition,
      discrepancyType,
      locationId: receivingItem.locationId,
    };
  });
  const result = await createGoodsReceiptWithItems({
    purchaseOrderId: purchaseOrder.id,
    grnNumber:grnNumber,
    status: receivingItems.some((item) => item.discrepancyType !== "NONE")
      ? "DISCREPANCY"
      : "COMPLETED",
    items: receivingItems,
    event: {
      eventId: randomUUID(),
      eventType: "GoodsReceived",
      payload: {
        purchaseOrderId: purchaseOrder.id,
        grnNumber:grnNumber,
        vendorId: purchaseOrder.vendorId,
        currency: purchaseOrder.currency,
        paymentTerms: purchaseOrder.paymentTerms,
        businessDate: new Date().toISOString().slice(0, 10),
        items: data.items
          .filter((item) => item.condition === "GOOD")
          .map((item) => {
            const poItem = purchaseOrderItems.find(
              (line: { productId: string }) =>
                line.productId === item.productId,
            );
            return {
              productId: item.productId,
              quantity: item.receivedQuantity,
              locationId: item.locationId,
              condition: item.condition,
              unitCost: poItem?.lockedUnitCost ?? 0,
            };
          }),
        discrepancies: receivingItems
          .filter((item) => item.discrepancyType !== "NONE")
          .map(
            ({
              productId,
              expectedQuantity,
              receivedQuantity,
              discrepancyType,
            }) => ({
              productId,
              expectedQuantity,
              receivedQuantity,
              discrepancyType,
            }),
          ),
      },
    },
  });
  return result;
}
