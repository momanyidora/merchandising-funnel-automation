import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  createPurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../../src/repositories/purchaseOrderRepository.js";

let purchaseOrderId: string;

describe("Purchase Order Repository", () => {
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

  it("should create a purchase order", async () => {
    expect(purchaseOrderId).toBeDefined();
  });

  it("should retrieve a purchase order by ID", async () => {
    const purchaseOrder = await getPurchaseOrderById(purchaseOrderId);

    expect(purchaseOrder).toBeDefined();
    expect(purchaseOrder?.id).toBe(purchaseOrderId);
    expect(purchaseOrder?.status).toBe("DRAFT");
  });

  it("should list purchase orders", async () => {
    const purchaseOrders = await listPurchaseOrders();

    expect(Array.isArray(purchaseOrders)).toBe(true);
    expect(
      purchaseOrders.some(
        (purchaseOrder) => purchaseOrder.id === purchaseOrderId,
      ),
    ).toBe(true);
  });

  it("should update a purchase order", async () => {
    const updated = await updatePurchaseOrder(purchaseOrderId, {
      paymentTerms: "NET_60",
      currency: "USD",
    });

    expect(updated).toBeDefined();
    expect(updated?.id).toBe(purchaseOrderId);
    expect(updated?.paymentTerms).toBe("NET_60");
    expect(updated?.currency).toBe("USD");
  });

  it("should delete a purchase order", async () => {
    const deleted = await deletePurchaseOrder(purchaseOrderId);

    expect(deleted).toBeDefined();
    expect(deleted?.id).toBe(purchaseOrderId);

    purchaseOrderId = "";
  });
});
