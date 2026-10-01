import { describe, expect, it, vi } from "vitest";
import {
  recordVendorReliability,
  getVendorHistory,
  findReliabilityRecord,
} from "../../src/services/vendorReliabilityService.js";
import {
  recordVendorReliabilityController,
  getVendorHistoryController,
  findReliabilityRecordController,
} from "../../src/controllers/vendorReliabilityController.js";

vi.mock("../../src/services/vendorReliabilityService.js", () => ({
  recordVendorReliability: vi.fn(),
  getVendorHistory: vi.fn(),
  findReliabilityRecord: vi.fn(),
}));

function mockResponse(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("Vendor Reliability Controller", () => {
  const vendorId = "8091e673-b27e-4a3d-b2af-5ba32e89318e";
  const reliabilityId = "22222222-2222-4222-8222-222222222222";

  it("should record reliability and return 201", async () => {
    const record = {
      id: reliabilityId,
      vendorId,
      status: "ON_TIME",
    };

    vi.mocked(recordVendorReliability).mockResolvedValue(record as never);

    const req = {
      params: { vendorId },
      body: {
        purchaseOrderId: "33333333-3333-4333-8333-333333333333",
        expectedDeliveryDate: "2026-09-10",
        actualDeliveryDate: "2026-09-10",
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: "ON_TIME",
        notes: "Test",
      },
    } as any;
    const res = mockResponse();

    await recordVendorReliabilityController(req, res);

    expect(recordVendorReliability).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(record);
  });

  it("should return 400 when recording reliability fails", async () => {
    vi.mocked(recordVendorReliability).mockRejectedValue(
      new Error("Vendor not found"),
    );

    const req = {
      params: { vendorId },
      body: {
        expectedDeliveryDate: "2026-09-10",
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: "ON_TIME",
      },
    } as any;
    const res = mockResponse();

    await recordVendorReliabilityController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor not found",
    });
  });

  it("should return vendor reliability history with 200", async () => {
    const history = [
      {
        id: reliabilityId,
        vendorId,
        status: "ON_TIME",
      },
    ];

    vi.mocked(getVendorHistory).mockResolvedValue(history as never);

    const req = { params: { vendorId } } as any;
    const res = mockResponse();

    await getVendorHistoryController(req, res);

    expect(getVendorHistory).toHaveBeenCalledWith(vendorId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(history);
  });

  it("should return a reliability record with 200", async () => {
    const record = {
      id: reliabilityId,
      vendorId,
      status: "ON_TIME",
    };

    vi.mocked(findReliabilityRecord).mockResolvedValue(record as never);

    const req = {
      params: { vendorId, reliabilityId },
    } as any;
    const res = mockResponse();

    await findReliabilityRecordController(req, res);

    expect(findReliabilityRecord).toHaveBeenCalledWith(vendorId, reliabilityId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(record);
  });

  it("should return 404 when a reliability record is not found", async () => {
    vi.mocked(findReliabilityRecord).mockResolvedValue(undefined);

    const req = {
      params: { vendorId, reliabilityId },
    } as any;
    const res = mockResponse();

    await findReliabilityRecordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Reliability record not found",
    });
  });
});
