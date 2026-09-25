import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/inventoryService.js", () => ({
  createInventory: vi.fn(),
  getInventoryById: vi.fn(),
  getInventoryByProductId: vi.fn(),
}));

vi.mock("../src/services/inventoryLocationService.js", () => ({
  createLocation: vi.fn(),
  getLocationById: vi.fn(),
}));

vi.mock("../src/services/inventoryMovementService.js", () => ({
  recordInventoryMovement: vi.fn(),
}));

import {
  createInventory,
  getInventoryById,
} from "../src/services/inventoryService.js";

describe("Inventory API Requests", () => {
  const inventoryId = "8091e673-b27e-4a3d-b2af-5ba32e89318e";
  const productId = "11111111-1111-4111-8111-111111111111";

  it("GET /health should return 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: "inventory-service",
      status: "ok",
    });
  });

  it("POST /inventory should return 201 with payload", async () => {
    const inventory = {
      id: inventoryId,
      productId,
      unitCost: 500,
    };

    vi.mocked(createInventory).mockResolvedValue(inventory as never);

    const payload = {
      productId,
      unitCost: 500,
    };

    const response = await request(app).post("/inventory").send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(inventory);
  });

  it("POST /inventory should return 400 when required fields are missing", async () => {
    const response = await request(app).post("/inventory").send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "productId and unitCost are required",
    });
  });

  it("GET /inventory/:id should return 200", async () => {
    const inventory = {
      id: inventoryId,
      productId,
      unitCost: 500,
    };

    vi.mocked(getInventoryById).mockResolvedValue(inventory as never);

    const response = await request(app).get(`/inventory/${inventoryId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(inventory);
  });

  it("GET /inventory/:id should return 404 when missing", async () => {
    vi.mocked(getInventoryById).mockResolvedValue(null);

    const response = await request(app).get(`/inventory/${inventoryId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Inventory item not found",
    });
  });
});
