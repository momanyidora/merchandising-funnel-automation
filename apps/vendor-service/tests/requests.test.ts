import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/vendorService.js", () => ({
  createVendor: vi.fn(),
  listVendors: vi.fn(),
  findVendorById: vi.fn(),
  updateVendor: vi.fn(),
  deleteVendor: vi.fn(),
}));

import { createVendor, findVendorById } from "../src/services/vendorService.js";

describe("Vendor API Requests", () => {
  const vendorId = "8091e673-b27e-4a3d-b2af-5ba32e89318e";

  it("GET /health should return 200 and health payload", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: "vendor-service",
      status: "ok",
    });
  });

  it("POST /vendors should return 201 with the created vendor", async () => {
    const vendor = {
      id: vendorId,
      name: "Test Vendor",
    };

    vi.mocked(createVendor).mockResolvedValue(vendor as never);

    const response = await request(app).post("/vendors").send({
      name: "Test Vendor",
      email: "test@example.com",
      phone: "+254700000000",
      paymentTerms: "Net 30",
      leadTimeDays: 14,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(vendor);
  });

  it("POST /vendors should return 400 for invalid input", async () => {
    vi.mocked(createVendor).mockRejectedValue(
      new Error("Invalid email address"),
    );

    const response = await request(app).post("/vendors").send({
      name: "Test Vendor",
      email: "wrong",
      phone: "+254700000000",
      paymentTerms: "Net 30",
      leadTimeDays: 14,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid email address",
    });
  });

  it("GET /vendors/:vendorId should return 200 with the vendor", async () => {
    const vendor = {
      id: vendorId,
      name: "Test Vendor",
    };

    vi.mocked(findVendorById).mockResolvedValue(vendor as never);

    const response = await request(app).get(`/vendors/${vendorId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(vendor);
  });

  it("GET /vendors/:vendorId should return 404 when vendor is missing", async () => {
    vi.mocked(findVendorById).mockResolvedValue(undefined as never);

    const response = await request(app).get(`/vendors/${vendorId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Vendor not found",
    });
  });
});
