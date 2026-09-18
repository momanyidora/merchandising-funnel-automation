import { describe, expect, it, vi, beforeEach } from "vitest";

import { createPurchaseOrderItemService } from "../src/services/purchaseOrderItemService.js";

import * as itemRepository from "../src/repositories/purchaseOrderItemRepository.js";
import * as purchaseOrderRepository from "../src/repositories/purchaseOrderRepository.js";

vi.mock("../src/repositories/purchaseOrderItemRepository.js");
vi.mock("../src/repositories/purchaseOrderRepository.js");

describe("Purchase Order Item Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a purchase order item for a draft purchase order", async () => {
    vi.mocked(purchaseOrderRepository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(itemRepository.createPurchaseOrderItem).mockResolvedValue({
      id: "item-1",
      purchaseOrderId: "po-1",
      productId: "product-1",
      quantity: 10,
      lockedUnitCost: 500,
      createdAt: new Date(),
    });

    const result = await createPurchaseOrderItemService({
      purchaseOrderId: "po-1",
      productId: "product-1",
      quantity: 10,
      lockedUnitCost: 500,
    });

    expect(result.quantity).toBe(10);
    expect(result.lockedUnitCost).toBe(500);
  });

  it("rejects an item when the purchase order does not exist", async () => {
    vi.mocked(purchaseOrderRepository.getPurchaseOrderById).mockResolvedValue(
      undefined as never,
    );

    await expect(
      createPurchaseOrderItemService({
        purchaseOrderId: "missing-po",
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
      }),
    ).rejects.toThrow("Purchase order not found");

    expect(itemRepository.createPurchaseOrderItem).not.toHaveBeenCalled();
  });

  it("rejects an item for a non-draft purchase order", async () => {
    vi.mocked(purchaseOrderRepository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      createPurchaseOrderItemService({
        purchaseOrderId: "po-1",
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
      }),
    ).rejects.toThrow("Items can only be added to draft purchase orders");

    expect(itemRepository.createPurchaseOrderItem).not.toHaveBeenCalled();
  });

  it("rejects an item with zero quantity", async () => {
    await expect(
      createPurchaseOrderItemService({
        purchaseOrderId: "po-1",
        productId: "product-1",
        quantity: 0,
        lockedUnitCost: 500,
      }),
    ).rejects.toThrow("Quantity must be greater than zero");

    expect(purchaseOrderRepository.getPurchaseOrderById).not.toHaveBeenCalled();
  });

  it("rejects an item with a negative locked unit cost", async () => {
    await expect(
      createPurchaseOrderItemService({
        purchaseOrderId: "po-1",
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: -1,
      }),
    ).rejects.toThrow("Locked unit cost cannot be negative");

    expect(purchaseOrderRepository.getPurchaseOrderById).not.toHaveBeenCalled();
  });
});
