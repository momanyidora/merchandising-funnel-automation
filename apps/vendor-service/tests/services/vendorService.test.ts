import { describe, expect, it } from "vitest";
import { createVendor, updateVendor } from "../../src/services/vendorService.js";
import { approveVendorProduct } from "../../src/services/vendorProductService.js";
import {
  recordVendorReliability,
  findReliabilityRecord,
} from "../../src/services/vendorReliabilityService.js";

describe("Vendor Management", () => {

  describe("createVendor", () => {

    it("should reject a vendor with an empty name", async () => {
      await expect(
        createVendor({
          name: "",
          email: "supplier@example.com",
          phone: "+254700000000",
          paymentTerms: "Net 30",
          leadTimeDays: 14,
        }),
      ).rejects.toThrow("Vendor name is required");
    });

    it("should reject an invalid email", async () => {
      await expect(
        createVendor({
          name: "Test Supplier",
          email: "invalid-email",
          phone: "+254700000000",
          paymentTerms: "Net 30",
          leadTimeDays: 14,
        }),
      ).rejects.toThrow("Invalid email address");
    });

    it("should reject an empty phone number", async () => {
      await expect(
        createVendor({
          name: "Test Supplier",
          email: "supplier@example.com",
          phone: "",
          paymentTerms: "Net 30",
          leadTimeDays: 14,
        }),
      ).rejects.toThrow("Vendor phone is required");
    });

    it("should reject negative lead time", async () => {
      await expect(
        createVendor({
          name: "Test Supplier",
          email: "supplier@example.com",
          phone: "+254700000000",
          paymentTerms: "Net 30",
          leadTimeDays: -1,
        }),
      ).rejects.toThrow("Lead time cannot be negative");
    });
    it("should reject a vendor name shorter than 2 characters", async () => {
      await expect(
        createVendor({
          name: "A",
          email: "test@example.com",
          phone: "+254700000000",
          paymentTerms: "Net 30",
          leadTimeDays: 7,
        }),
      ).rejects.toThrow("Vendor name must be at least 2 characters");
    });
    it("should reject a vendor with a missing name", async () => {
      await expect(
        createVendor({
          name: undefined as unknown as string,
          email: "test@example.com",
          phone: "+254700000000",
          paymentTerms: "Net 30",
          leadTimeDays: 7,
        }),
      ).rejects.toThrow("Vendor name is required");
    });

    it("should reject a vendor with a missing phone number", async () => {
      await expect(
        createVendor({
          name: "Test Vendor",
          email: "test@example.com",
          phone: undefined as unknown as string,
          paymentTerms: "Net 30",
          leadTimeDays: 7,
        }),
      ).rejects.toThrow("Vendor phone is required");
    });

    it("should reject a vendor with missing payment terms", async () => {
      await expect(
        createVendor({
          name: "Test Vendor",
          email: "test@example.com",
          phone: "+254700000000",
          paymentTerms: undefined as unknown as string,
          leadTimeDays: 7,
        }),
      ).rejects.toThrow("Payment terms are required");
    });
  });
  describe("updateVendor", () => {
    const vendorId = "8091e673-b27e-4a3d-b2af-5ba32e89318e";

    it("should reject an empty vendor name", async () => {
      await expect(
        updateVendor(vendorId, {
          name: "",
        }),
      ).rejects.toThrow("Vendor name cannot be empty");
    });

    it("should reject a vendor name shorter than 2 characters", async () => {
      await expect(
        updateVendor(vendorId, {
          name: "A",
        }),
      ).rejects.toThrow("Vendor name must be at least 2 characters");
    });

    it("should reject an invalid email", async () => {
      await expect(
        updateVendor(vendorId, {
          email: "invalid-email",
        }),
      ).rejects.toThrow("Invalid email address");
    });

    it("should reject an empty phone number", async () => {
      await expect(
        updateVendor(vendorId, {
          phone: "",
        }),
      ).rejects.toThrow("Vendor phone cannot be empty");
    });

    it("should reject empty payment terms", async () => {
      await expect(
        updateVendor(vendorId, {
          paymentTerms: "",
        }),
      ).rejects.toThrow("Payment terms cannot be empty");
    });

    it("should reject negative lead time", async () => {
      await expect(
        updateVendor(vendorId, {
          leadTimeDays: -1,
        }),
      ).rejects.toThrow("Lead time cannot be negative");
    });
  });

  describe("approveVendorProduct", () => {
    it("should reject a missing vendor ID", async () => {
      await expect(
        approveVendorProduct({
          vendorId: "",
          productId: "11111111-1111-1111-1111-111111111111",
          supplierCost: 80000,
        }),
      ).rejects.toThrow("Vendor ID is required");
    });

    it("should reject a missing product ID", async () => {
      await expect(
        approveVendorProduct({
          vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
          productId: "",
          supplierCost: 80000,
        }),
      ).rejects.toThrow("Product ID is required");
    });

    it("should reject a negative supplier cost", async () => {
      await expect(
        approveVendorProduct({
          vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
          productId: "11111111-1111-4111-8111-111111111111",
          supplierCost: -100,
        }),
      ).rejects.toThrow("Supplier cost must be a non-negative integer");
    });
    it("should reject an invalid vendor UUID", async () => {
      await expect(
        approveVendorProduct({
          vendorId: "not-a-uuid",
          productId: "11111111-1111-4111-8111-111111111111",
          supplierCost: 80000,
        }),
      ).rejects.toThrow("Vendor ID must be a valid UUID");
    });

    it("should reject an invalid product UUID", async () => {
      await expect(
        approveVendorProduct({
          vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
          productId: "not-a-uuid",
          supplierCost: 80000,
        }),
      ).rejects.toThrow("Product ID must be a valid UUID");
    });

    it("should reject a product for a vendor that does not exist", async () => {
      await expect(
        approveVendorProduct({
          vendorId: "00000000-0000-4000-8000-000000000000",
          productId: "11111111-1111-4111-8111-111111111111",
          supplierCost: 80000,
        }),
      ).rejects.toThrow("Vendor not found");
    });
  });
  describe("recordVendorReliability", () => {
    it("should reject a missing vendor ID", async () => {
      await expect(
        recordVendorReliability({
          vendorId: "",
          expectedDeliveryDate: new Date("2026-09-10"),
          expectedQuantity: 100,
          receivedQuantity: 100,
          status: "ON_TIME",
        }),
      ).rejects.toThrow("Vendor ID is required");
    });
    it("should reject an invalid vendor UUID", async () => {
      await expect(
        recordVendorReliability({
          vendorId: "not-a-uuid",
          expectedDeliveryDate: new Date("2026-09-10"),
          expectedQuantity: 100,
          receivedQuantity: 100,
          status: "ON_TIME",
        }),
      ).rejects.toThrow("Vendor ID must be a valid UUID");
    });
    it("should reject zero expected quantity", async () => {
      await expect(
        recordVendorReliability({
          vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
          expectedDeliveryDate: new Date("2026-09-10"),
          expectedQuantity: 0,
          receivedQuantity: 0,
          status: "ON_TIME",
        }),
      ).rejects.toThrow("Expected quantity must be greater than 0");
    });

    it("should reject negative received quantity", async () => {
      await expect(
        recordVendorReliability({
          vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
          expectedDeliveryDate: new Date("2026-09-10"),
          expectedQuantity: 100,
          receivedQuantity: -1,
          status: "ON_TIME",
        }),
      ).rejects.toThrow("Received quantity cannot be negative");
    });

    it("should reject an invalid reliability status", async () => {
      await expect(
        recordVendorReliability({
          vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
          expectedDeliveryDate: new Date("2026-09-10"),
          expectedQuantity: 100,
          receivedQuantity: 100,
          status: "INVALID" as "ON_TIME",
        }),
      ).rejects.toThrow("Invalid reliability status");
    });
  });
  it("should reject an invalid reliability record UUID", async () => {
    await expect(
      findReliabilityRecord(
        "8091e673-b27e-4a3d-b2af-5ba32e89318e",
        "not-a-uuid",
      ),
    ).rejects.toThrow("Reliability record ID must be a valid UUID");
  });

  it("should reject an invalid expected delivery date", async () => {
    await expect(
      recordVendorReliability({
        vendorId: "00000000-0000-4000-8000-000000000000",
        expectedDeliveryDate: new Date("invalid-date"),
        expectedQuantity: 10,
        receivedQuantity: 10,
        status: "ON_TIME",
      }),
    ).rejects.toThrow("Expected delivery date must be a valid date");
  });

  it("should reject an invalid actual delivery date", async () => {
    await expect(
      recordVendorReliability({
        vendorId: "00000000-0000-4000-8000-000000000000",
        expectedDeliveryDate: new Date("2026-09-10"),
        actualDeliveryDate: new Date("invalid-date"),
        expectedQuantity: 10,
        receivedQuantity: 10,
        status: "ON_TIME",
      }),
    ).rejects.toThrow("Actual delivery date must be a valid date");
  });
  it("should reject a reliability record for a vendor that does not exist", async () => {
    await expect(
      recordVendorReliability({
        vendorId: "00000000-0000-4000-8000-000000000000",
        expectedDeliveryDate: new Date("2026-09-10"),
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: "ON_TIME",
      }),
    ).rejects.toThrow("Vendor not found");
  });
});
