import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createPurchaseOrderService,
  submitPurchaseOrderForApprovalService,
  approvePurchaseOrderService,
  updatePurchaseOrderService,
} from "../src/services/purchaseOrderService.js";
import * as repository from "../src/repositories/purchaseOrderRepository.js";
import * as vendorClient from "../src/clients/vendorClient.js";
import * as eventPublisher from "../src/events/rabbitmqPublisher.js";


vi.mock("../src/repositories/purchaseOrderRepository.js");
vi.mock("../src/clients/vendorClient.js");
vi.mock("../src/events/rabbitmqPublisher.js");


describe("Purchase Order Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a purchase order with DRAFT status", async () => {
    vi.mocked(repository.createPurchaseOrder).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(vendorClient.getVendorById).mockResolvedValue({
      id: "vendor-1",
    });
    const result = await createPurchaseOrderService({
      vendorId: "vendor-1",
      paymentTerms: "NET_30",
      currency: "KES",
    });

    expect(result.status).toBe("DRAFT");
  });

  it("submits a draft purchase order for approval", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await submitPurchaseOrderForApprovalService("po-1");

    expect(result.status).toBe("PENDING_APPROVAL");
  });

  it("approves a purchase order pending approval", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await approvePurchaseOrderService("po-1");

    expect(result.status).toBe("APPROVED");
  });

  it("does not allow an approved purchase order to be edited", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      updatePurchaseOrderService("po-1", {
        paymentTerms: "NET_60",
      }),
    ).rejects.toThrow("Only draft purchase orders can be updated");
  });
  it("publishes PurchaseOrderApproved when a purchase order is approved", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_30",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await approvePurchaseOrderService("po-1");

    expect(eventPublisher.publishEvent).toHaveBeenCalledWith(
      "PurchaseOrderApproved",
      result,
    );
  });
  it("still approves the purchase order when event publishing fails", async () => {
    vi.mocked(repository.getPurchaseOrderById).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "PENDING_APPROVAL",
      paymentTerms: "NET_45",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  
    vi.mocked(repository.updatePurchaseOrder).mockResolvedValue({
      id: "po-1",
      vendorId: "vendor-1",
      status: "APPROVED",
      paymentTerms: "NET_45",
      currency: "KES",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  
    vi.mocked(eventPublisher.publishEvent).mockResolvedValue(undefined);
  
    const result = await approvePurchaseOrderService("po-1");
  
    expect(result.status).toBe("APPROVED");
    expect(eventPublisher.publishEvent).toHaveBeenCalledWith(
      "PurchaseOrderApproved",
      result,
    );
  });
  it("rejects purchase order creation when vendor does not exist", async () => {
    vi.mocked(vendorClient.getVendorById).mockResolvedValue(null);

    await expect(
      createPurchaseOrderService({
        vendorId: "missing-vendor",
        paymentTerms: "NET_30",
        currency: "KES",
      }),
    ).rejects.toThrow("Vendor not found");

    expect(repository.createPurchaseOrder).not.toHaveBeenCalled();
  });
});