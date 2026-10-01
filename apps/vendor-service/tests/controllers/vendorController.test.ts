import { describe, expect, it, vi } from "vitest";
import {
  createVendor,
  listVendors,
  findVendorById,
  updateVendor,
  deleteVendor,
} from "../../src/services/vendorService.js";
import {
  createVendorController,
  listVendorsController,
  findVendorController,
  updateVendorController,
  deleteVendorController,
} from "../../src/controllers/vendorController.js";

vi.mock("../../src/services/vendorService.js", () => ({
  createVendor: vi.fn(),
  listVendors: vi.fn(),
  findVendorById: vi.fn(),
  updateVendor: vi.fn(),
  deleteVendor: vi.fn(),
}));

function mockResponse(): any {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };

  return res;
}

describe("Vendor Controller", () => {
  it("should create a vendor and return 201 with the payload", async () => {
    const vendor = {
      id: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      name: "Test Vendor",
    };

    vi.mocked(createVendor).mockResolvedValue(vendor as never);

    const req = {
      body: {
        name: "Test Vendor",
        email: "test@example.com",
        phone: "+254700000000",
        paymentTerms: "Net 30",
        leadTimeDays: 14,
      },
    } as any;

    const res = mockResponse();

    await createVendorController(req, res);

    expect(createVendor).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(vendor);
  });

  it("should return 400 when creating a vendor fails", async () => {
    vi.mocked(createVendor).mockRejectedValue(
      new Error("Invalid email address"),
    );

    const req = {
      body: {},
    } as any;

    const res = mockResponse();

    await createVendorController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid email address",
    });
  });

  it("should return 200 with the list of vendors", async () => {
    const vendors = [
      {
        id: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
        name: "Vendor One",
      },
    ];

    vi.mocked(listVendors).mockResolvedValue(vendors as never);

    const req = {} as any;
    const res = mockResponse();

    await listVendorsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(vendors);
  });

  it("should return 200 when a vendor is found", async () => {
    const vendor = {
      id: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      name: "Test Vendor",
    };

    vi.mocked(findVendorById).mockResolvedValue(vendor as never);

    const req = {
      params: {
        vendorId: vendor.id,
      },
    } as any;

    const res = mockResponse();

    await findVendorController(req, res);

    expect(findVendorById).toHaveBeenCalledWith(vendor.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(vendor);
  });

  it("should return 404 when a vendor does not exist", async () => {
    vi.mocked(findVendorById).mockResolvedValue(undefined as never);

    const req = {
      params: {
        vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      },
    } as any;

    const res = mockResponse();

    await findVendorController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor not found",
    });
  });

  it("should update a vendor and return 200", async () => {
    const vendor = {
      id: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      name: "Updated Vendor",
    };

    const req = {
      params: {
        vendorId: vendor.id,
      },
      body: {
        name: "Updated Vendor",
      },
    } as any;

    vi.mocked(updateVendor).mockResolvedValue(vendor as never);

    const res = mockResponse();

    await updateVendorController(req, res);

    expect(updateVendor).toHaveBeenCalledWith(vendor.id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(vendor);
  });

  it("should return 404 when updating a vendor that does not exist", async () => {
    vi.mocked(updateVendor).mockResolvedValue(undefined as never);

    const req = {
      params: {
        vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      },
      body: {
        name: "Updated Vendor",
      },
    } as any;

    const res = mockResponse();

    await updateVendorController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor not found",
    });
  });

  it("should delete a vendor and return 204", async () => {
    const vendor = {
      id: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
    };

    vi.mocked(deleteVendor).mockResolvedValue(vendor as never);

    const req = {
      params: {
        vendorId: vendor.id,
      },
    } as any;

    const res = mockResponse();

    await deleteVendorController(req, res);

    expect(deleteVendor).toHaveBeenCalledWith(vendor.id);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return 404 when deleting a vendor that does not exist", async () => {
    vi.mocked(deleteVendor).mockResolvedValue(undefined as never);

    const req = {
      params: {
        vendorId: "8091e673-b27e-4a3d-b2af-5ba32e89318e",
      },
    } as any;

    const res = mockResponse();

    await deleteVendorController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor not found",
    });
  });
});
