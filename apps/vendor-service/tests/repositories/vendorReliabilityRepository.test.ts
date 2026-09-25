import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  createReliabilityRecord,
  getVendorReliabilityHistory,
  getReliabilityRecordById,
} from "../../src/repositories/vendorReliabilityRepository.js";
import {
  createVendor,
  deleteVendor,
} from "../../src/repositories/vendorRepository.js";

const vendorData = {
  name: "Reliability Repository Vendor",
  email: `reliability-repo-${Date.now()}@example.com`,
  phone: "+254700000003",
  paymentTerms: "Net 30",
  leadTimeDays: 12,
};

let vendorId: string;
let reliabilityId: string;

describe("Vendor Reliability Repository", () => {
  beforeAll(async () => {
    const vendor = await createVendor(vendorData);
    vendorId = vendor.id;
  });

  afterAll(async () => {
    if (vendorId) {
      await deleteVendor(vendorId);
    }
  });

  it("should create a reliability record", async () => {
    const record = await createReliabilityRecord({
      vendorId,
      expectedDeliveryDate: new Date("2026-09-10"),
      actualDeliveryDate: new Date("2026-09-10"),
      expectedQuantity: 100,
      receivedQuantity: 100,
      status: "ON_TIME",
      notes: "Repository test",
    });

    reliabilityId = record.id;

    expect(record).toBeDefined();
    expect(record.vendorId).toBe(vendorId);
    expect(record.status).toBe("ON_TIME");
  });

  it("should retrieve vendor reliability history", async () => {
    const history = await getVendorReliabilityHistory(vendorId);

    expect(history.length).toBeGreaterThan(0);
    expect(history.some((record) => record.id === reliabilityId)).toBe(true);
  });

  it("should retrieve a reliability record by ID", async () => {
    const record = await getReliabilityRecordById(vendorId, reliabilityId);

    expect(record).toBeDefined();
    expect(record?.id).toBe(reliabilityId);
    expect(record?.vendorId).toBe(vendorId);
  });

  it("should return undefined when the record belongs to another vendor", async () => {
    const differentVendor = await createVendor({
      name: "Other Reliability Vendor",
      email: `other-reliability-${Date.now()}@example.com`,
      phone: "+254700000004",
      paymentTerms: "Net 30",
      leadTimeDays: 8,
    });

    const record = await getReliabilityRecordById(
      differentVendor.id,
      reliabilityId,
    );

    expect(record).toBeUndefined();

    await deleteVendor(differentVendor.id);
  });
});
