import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  createVendor,
  getVendorById,
  getAllVendors,
  updateVendor,
  deleteVendor,
} from "../../src/repositories/vendorRepository.js";

const testVendor = {
  name: "Repository Test Vendor",
  email: `repo-test-${Date.now()}@example.com`,
  phone: "+254700000001",
  paymentTerms: "Net 30",
  leadTimeDays: 14,
};

let vendorId: string;

describe("Vendor Repository", () => {
  beforeAll(async () => {
    const vendor = await createVendor(testVendor);
    vendorId = vendor.id;
  });

  afterAll(async () => {
    if (vendorId) {
      await deleteVendor(vendorId);
    }
  });

  it("should create a vendor", async () => {
    expect(vendorId).toBeDefined();
  });

  it("should retrieve a vendor by ID", async () => {
    const vendor = await getVendorById(vendorId);

    expect(vendor).toBeDefined();
    expect(vendor?.id).toBe(vendorId);
    expect(vendor?.name).toBe(testVendor.name);
    expect(vendor?.email).toBe(testVendor.email);
  });

  it("should return all vendors", async () => {
    const vendors = await getAllVendors();

    expect(Array.isArray(vendors)).toBe(true);
    expect(vendors.some((vendor) => vendor.id === vendorId)).toBe(true);
  });

  it("should update a vendor", async () => {
    const updated = await updateVendor(vendorId, {
      name: "Updated Repository Vendor",
      leadTimeDays: 21,
    });

    expect(updated).toBeDefined();
    expect(updated?.id).toBe(vendorId);
    expect(updated?.name).toBe("Updated Repository Vendor");
    expect(updated?.leadTimeDays).toBe(21);
  });

  it("should delete a vendor", async () => {
    const deleted = await deleteVendor(vendorId);

    expect(deleted).toBeDefined();
    expect(deleted?.id).toBe(vendorId);

    vendorId = "";
  });
});
