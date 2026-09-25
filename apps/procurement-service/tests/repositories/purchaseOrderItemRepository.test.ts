import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  createPurchaseOrderItem,
  getPurchaseOrderItems,
  getPurchaseOrderItemById,
  updatePurchaseOrderItem,
  deletePurchaseOrderItem,
} from "../../src/repositories/purchaseOrderItemRepository.js";
import {
  createPurchaseOrder,
  deletePurchaseOrder,
} from "../../src/repositories/purchaseOrderRepository.js";

let purchaseOrderId: string;
let itemId: string;

describe("Purchase Order Item Repository", () => {
  beforeAll(async () => {
    const purchaseOrder = await createPurchaseOrder({
      vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      status: "DRAFT",
      paymentTerms: "NET_30",
      currency: "KES",
    });

    purchaseOrderId = purchaseOrder.id;
  });

  afterAll(async () => {
    if (purchaseOrderId) {
      await deletePurchaseOrder(purchaseOrderId);
    }
  });

  it("should create a purchase order item", async () => {
    const item = await createPurchaseOrderItem({
      purchaseOrderId,
      productId: "11111111-1111-4111-8111-111111111111",
      quantity: 10,
      lockedUnitCost: 500,
    });

    itemId = item.id;

    expect(item).toBeDefined();
    expect(item.purchaseOrderId).toBe(purchaseOrderId);
    expect(item.quantity).toBe(10);
    expect(item.lockedUnitCost).toBe(500);
  });

  it("should retrieve purchase order items", async () => {
    const items = await getPurchaseOrderItems(purchaseOrderId);

    expect(Array.isArray(items)).toBe(true);
    expect(items.some((item) => item.id === itemId)).toBe(true);
  });

  it("should retrieve a purchase order item by ID", async () => {
    const item = await getPurchaseOrderItemById(itemId);

    expect(item).toBeDefined();
    expect(item?.id).toBe(itemId);
    expect(item?.purchaseOrderId).toBe(purchaseOrderId);
  });

  it("should update a purchase order item", async () => {
    const updated = await updatePurchaseOrderItem(itemId, {
      quantity: 20,
      lockedUnitCost: 750,
    });

    expect(updated).toBeDefined();
    expect(updated?.id).toBe(itemId);
    expect(updated?.quantity).toBe(20);
    expect(updated?.lockedUnitCost).toBe(750);
  });

  it("should delete a purchase order item", async () => {
    const deleted = await deletePurchaseOrderItem(itemId);

    expect(deleted).toBeDefined();
    expect(deleted?.id).toBe(itemId);

    itemId = "";
  });
});
