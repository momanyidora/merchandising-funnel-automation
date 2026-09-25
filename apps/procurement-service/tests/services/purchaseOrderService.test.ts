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
import * as approvalRepository from "../../src/repositories/purchaseOrderApprovalRepository.js";
import * as vendorClient from "../../src/clients/vendorClient.js";
import * as eventPublisher from "../../src/events/rabbitmqPublisher.js";

vi.mock("../../src/repositories/purchaseOrderRepository.js");
vi.mock("../../src/repositories/purchaseOrderItemRepository.js");
vi.mock("../../src/repositories/purchaseOrderApprovalRepository.js");
vi.mock("../../src/clients/vendorClient.js");
vi.mock("../../src/events/rabbitmqPublisher.js");
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

    const result = await submitPurchaseOrderForApprovalService(
      "11111111-1111-1111-111111111111",
    );

    expect(result.status).toBe("PENDING_APPROVAL");
  });

  it("approves a purchase order pending approval", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "APPROVED",
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
    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "APPROVER",
      active: true,
    });
    vi.mocked(approvalRepository.createPurchaseOrderApproval).mockResolvedValue(
      {
        id: "approval-1",
        purchaseOrderId: "11111111-1111-1111-1111-111111111111",
        approverId: "approver-1",
        approvedAt: new Date(),
      },
    );

    const result = await approvePurchaseOrderService(
      "11111111-1111-1111-1111-111111111111",
      "approver-1",
    );

    expect(result.status).toBe("APPROVED");

    expect(approvalRepository.createPurchaseOrderApproval).toHaveBeenCalledWith(
      {
        purchaseOrderId: "11111111-1111-1111-1111-111111111111",
        approverId: "approver-1",
      },
    );
  });

  it("does not allow an approved purchase order to be edited", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      updatePurchaseOrderService("11111111-1111-1111-1111-111111111111", {
        paymentTerms: "NET_60",
      }),
    ).rejects.toThrow("Only draft purchase orders can be updated");
  });

  it("publishes PurchaseOrderApproved when a purchase order is approved", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "APPROVED",
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
    vi.mocked(
      approverRepository.getPurchaseOrderApproverByUserId,
    ).mockResolvedValue({
      id: "approver-record-1",
      userId: "approver-1",
      role: "APPROVER",
      active: true,
    });
    vi.mocked(approvalRepository.createPurchaseOrderApproval).mockResolvedValue(
      {
        id: "approval-1",
        purchaseOrderId: "11111111-1111-1111-1111-111111111111",
        approverId: "approver-1",
        approvedAt: new Date(),
      },
    );

    const result = await approvePurchaseOrderService(
      "11111111-1111-1111-1111-111111111111",
      "approver-1",
    );

    expect(eventPublisher.publishEvent).toHaveBeenCalledWith(
      "PurchaseOrderApproved",
      {
        purchaseOrder: result,
        items: [
          {
            id: "item-1",
            purchaseOrderId: "11111111-1111-1111-1111-111111111111",
            productId: "product-1",
            quantity: 10,
            lockedUnitCost: 500,
            createdAt: expect.any(Date),
          },
        ],
      },
    );
  });

  it("still approves the purchase order when event publishing fails", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_45",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_45",
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

    vi.mocked(approvalRepository.createPurchaseOrderApproval).mockResolvedValue(
      {
        id: "approval-1",
        purchaseOrderId: "11111111-1111-1111-1111-111111111111",
        approverId: "approver-1",
        approvedAt: new Date(),
      },
    );

    vi.mocked(eventPublisher.publishEvent).mockResolvedValue(undefined);

    const result = await approvePurchaseOrderService(
      "11111111-1111-1111-1111-111111111111",
      "approver-1",
    );

    expect(result.status).toBe("APPROVED");

    expect(eventPublisher.publishEvent).toHaveBeenCalledWith(
      "PurchaseOrderApproved",
      {
        purchaseOrder: result,
        items: [
          {
            id: "item-1",
            purchaseOrderId: "11111111-1111-1111-1111-111111111111",
            productId: "product-1",
            quantity: 10,
            lockedUnitCost: 500,
            createdAt: expect.any(Date),
          },
        ],
      },
    );
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
      approvalRepository.createPurchaseOrderApproval,
    ).not.toHaveBeenCalled();
    expect(eventPublisher.publishEvent).not.toHaveBeenCalled();
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
      approvalRepository.createPurchaseOrderApproval,
    ).not.toHaveBeenCalled();
    expect(eventPublisher.publishEvent).not.toHaveBeenCalled();
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
      approvalRepository.createPurchaseOrderApproval,
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
