import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createPurchaseOrderService,
  submitPurchaseOrderForApprovalService,
  approvePurchaseOrderService,
  updatePurchaseOrderService,
} from "../../src/services/purchaseOrderService.js";
import * as approverRepository from "../../src/repositories/purchaseOrderApproverRepository.js";
import * as itemRepository from "../../src/repositories/purchaseOrderItemRepository.js";
import * as repository from "../../src/repositories/purchaseOrderRepository.js";

import * as vendorClient from "../../src/clients/vendorClient.js";

vi.mock("../../src/repositories/purchaseOrderRepository.js");
vi.mock("../../src/repositories/purchaseOrderItemRepository.js");

vi.mock("../../src/clients/vendorClient.js");

vi.mock("../../src/repositories/purchaseOrderApproverRepository.js");

describe("Purchase Order Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a purchase order using the vendor's payment terms", async () => {
    vi.mocked(vendorClient.getVendorById).mockResolvedValue({
      id: "vendor-1",
      paymentTerms: "NET_60",
    });

    vi.mocked(repository.createPurchaseOrder).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_60",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createPurchaseOrderService({
      vendorId: "vendor-1",
      currency: "KES",
    });

    expect(repository.createPurchaseOrder).toHaveBeenCalledWith({
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_60",
      currency: "KES",
    });

    expect(result.status).toBe("DRAFT");
    expect(result.paymentTerms).toBe("NET_60");
  });

  it("submits a draft purchase order for approval", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(itemRepository.getPurchaseOrderItems).mockResolvedValue([
      {
        id: "item-1",
        purchaseOrderId: "11111111-1111-1111-1111-111111111111",
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
        createdAt: new Date(),
      },
    ]);

    const result = await submitPurchaseOrderForApprovalService(
      "11111111-1111-1111-111111111111",
    );

    expect(result.status).toBe("PENDING_APPROVAL");
  });

  it("approves a purchase order pending approval", async () => {
    const orderId = "11111111-1111-1111-1111-111111111111";

    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: orderId,
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const items = [
      {
        id: "item-1",
        purchaseOrderId: orderId,
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
        createdAt: new Date(),
      },
    ];

    vi.mocked(itemRepository.getPurchaseOrderItems).mockResolvedValue(items);

    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "APPROVER",
      active: true,
    });

    vi.mocked(repository.approvePurchaseOrderAndQueueEvent).mockResolvedValue({
      id: orderId,
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await approvePurchaseOrderService(orderId, "approver-1");

    expect(result.status).toBe("APPROVED");

    expect(repository.approvePurchaseOrderAndQueueEvent).toHaveBeenCalledWith({
      id: orderId,
      approverId: "approver-1",
      items,
    });
  });

  it("queues PurchaseOrderApproved when a purchase order is approved", async () => {
    const orderId = "11111111-1111-1111-1111-111111111111";

    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: orderId,
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const items = [
      {
        id: "item-1",
        purchaseOrderId: orderId,
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
        createdAt: new Date(),
      },
    ];

    vi.mocked(itemRepository.getPurchaseOrderItems).mockResolvedValue(items);

    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "APPROVER",
      active: true,
    });

    vi.mocked(repository.approvePurchaseOrderAndQueueEvent).mockResolvedValue({
      id: orderId,
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await approvePurchaseOrderService(orderId, "approver-1");

    expect(result.status).toBe("APPROVED");

    expect(repository.approvePurchaseOrderAndQueueEvent).toHaveBeenCalledWith({
      id: orderId,
      approverId: "approver-1",
      items,
    });
  });

  it("propagates approval errors from the transactional approval repository", async () => {
    const orderId = "11111111-1111-1111-1111-111111111111";

    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: orderId,
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_45",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(itemRepository.getPurchaseOrderItems).mockResolvedValue([
      {
        id: "item-1",
        purchaseOrderId: orderId,
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
        createdAt: new Date(),
      },
    ]);

    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "APPROVER",
      active: true,
    });

    vi.mocked(repository.approvePurchaseOrderAndQueueEvent).mockRejectedValue(
      new Error("Approval transaction failed"),
    );

    await expect(
      approvePurchaseOrderService(orderId, "approver-1"),
    ).rejects.toThrow("Approval transaction failed");
  });

  it("rejects purchase order creation when vendor does not exist", async () => {
    vi.mocked(vendorClient.getVendorById).mockResolvedValue(null);

    await expect(
      createPurchaseOrderService({
        vendorId: "missing-vendor",
        currency: "KES",
      }),
    ).rejects.toThrow("Vendor not found");

    expect(repository.createPurchaseOrder).not.toHaveBeenCalled();
  });

  it("rejects purchase order creation when vendor payment terms are missing", async () => {
    vi.mocked(vendorClient.getVendorById).mockResolvedValue({
      id: "vendor-1",
      paymentTerms: "",
    });

    await expect(
      createPurchaseOrderService({
        vendorId: "vendor-1",
        currency: "KES",
      }),
    ).rejects.toThrow("Vendor payment terms are not configured");

    expect(repository.createPurchaseOrder).not.toHaveBeenCalled();
  });

  it("rejects approval when the purchase order has no items", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(itemRepository.getPurchaseOrderItems).mockResolvedValue([]);

    await expect(
      approvePurchaseOrderService(
        "11111111-1111-1111-1111-111111111111",
        "approver-1",
      ),
    ).rejects.toThrow("Purchase order must contain at least one item");

    expect(repository.updatePurchaseOrder).not.toHaveBeenCalled();
    expect(
      repository.approvePurchaseOrderAndQueueEvent,
    ).not.toHaveBeenCalled();
  });

  it("rejects approval when approver ID is missing", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      approvePurchaseOrderService("11111111-1111-1111-1111-111111111111", ""),
    ).rejects.toThrow("Approver ID is required");

    expect(repository.updatePurchaseOrder).not.toHaveBeenCalled();
    expect(
      repository.approvePurchaseOrderAndQueueEvent,
    ).not.toHaveBeenCalled();
  });
  it("does not allow an unauthorized user to approve a purchase order", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue(null);

    await expect(
      approvePurchaseOrderService(
        "11111111-1111-1111-1111-111111111111",
        "unknown-user",
      ),
    ).rejects.toThrow("User is not authorized to approve purchase orders");

    expect(repository.updatePurchaseOrder).not.toHaveBeenCalled();
    expect(
      repository.approvePurchaseOrderAndQueueEvent,
    ).not.toHaveBeenCalled();
  });

  it("does not allow an inactive approver to approve a purchase order", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "APPROVER",
      active: false,
    });

    await expect(
      approvePurchaseOrderService(
        "11111111-1111-1111-1111-111111111111",
        "approver-1",
      ),
    ).rejects.toThrow("User is not authorized to approve purchase orders");

    expect(repository.updatePurchaseOrder).not.toHaveBeenCalled();
  });

  it("does not allow a user with the wrong role to approve a purchase order", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "BUYER",
      active: true,
    });

    await expect(
      approvePurchaseOrderService(
        "11111111-1111-1111-1111-111111111111",
        "approver-1",
      ),
    ).rejects.toThrow("User is not authorized to approve purchase orders");

    expect(repository.updatePurchaseOrder).not.toHaveBeenCalled();
  });
});
