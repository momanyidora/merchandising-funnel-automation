import { describe, expect, it, vi, beforeEach } from "vitest";

import { createPurchaseOrderService } from "../src/services/purchaseOrderService.js";
import * as repository from "../src/repositories/purchaseOrderRepository.js";
import * as vendorClient from "../src/clients/vendorClient.js";

vi.mock("../src/repositories/purchaseOrderRepository.js", () => ({
  createPurchaseOrder: vi.fn(),
}));

vi.mock("../src/clients/vendorClient.js", () => ({
  getVendorById: vi.fn(),
}));

describe("Purchase Order Repository Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects purchase order creation when vendor ID is missing", async () => {
    await expect(
      createPurchaseOrderService({
        vendorId: "",
        currency: "KES",
      }),
    ).rejects.toThrow("Vendor ID is required");

    expect(vendorClient.getVendorById).not.toHaveBeenCalled();
    expect(repository.createPurchaseOrder).not.toHaveBeenCalled();
  });

  it("rejects purchase order creation when currency is missing", async () => {
    await expect(
      createPurchaseOrderService({
        vendorId: "vendor-1",
        currency: "",
      }),
    ).rejects.toThrow("Currency is required");

    expect(vendorClient.getVendorById).not.toHaveBeenCalled();
    expect(repository.createPurchaseOrder).not.toHaveBeenCalled();
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
});
