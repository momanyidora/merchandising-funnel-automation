import { describe, expect, it, vi } from "vitest";

import {
  createInventory,
  getInventoryById,
  getInventoryByProductId,
} from "../../src/services/inventoryService.js";
import {
  createLocation,
  getLocationById,
} from "../../src/services/inventoryLocationService.js";
import { recordInventoryMovement } from "../../src/services/inventoryMovementService.js";
import { changeOnOrder } from "../../src/services/inventoryOnOrderService.js";
import {
  reserve,
  release,
} from "../../src/services/inventoryReservationService.js";
import { getInventoryValuation } from "../../src/services/inventoryValuationService.js";

import {
  createInventoryController,
  getInventoryController,
  getInventoryByProductController,
} from "../../src/controllers/inventoryController.js";
import {
  createLocationController,
  getLocationController,
} from "../../src/controllers/inventoryLocationController.js";
import { recordInventoryMovementController } from "../../src/controllers/inventoryMovementController.js";
import { changeOnOrderController } from "../../src/controllers/inventoryOnOrderController.js";
import {
  reserveInventoryController,
  releaseInventoryController,
} from "../../src/controllers/inventoryReservationController.js";
import { getInventoryValuationController } from "../../src/controllers/inventoryValuationController.js";

vi.mock("../../src/services/inventoryService.js", () => ({
  createInventory: vi.fn(),
  getInventoryById: vi.fn(),
  getInventoryByProductId: vi.fn(),
}));

vi.mock("../../src/services/inventoryLocationService.js", () => ({
  createLocation: vi.fn(),
  getLocationById: vi.fn(),
}));

vi.mock("../../src/services/inventoryMovementService.js", () => ({
  recordInventoryMovement: vi.fn(),
}));

vi.mock("../../src/services/inventoryOnOrderService.js", () => ({
  changeOnOrder: vi.fn(),
}));

vi.mock("../../src/services/inventoryReservationService.js", () => ({
  reserve: vi.fn(),
  release: vi.fn(),
}));

vi.mock("../../src/services/inventoryValuationService.js", () => ({
  getInventoryValuation: vi.fn(),
}));

function mockResponse(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("Inventory Controllers", () => {
  const inventoryId = "8091e673-b27e-4a3d-b2af-5ba32e89318e";
  const productId = "11111111-1111-4111-8111-111111111111";
  const locationId = "22222222-2222-4222-8222-222222222222";

  it("creates inventory and returns 201", async () => {
    const inventory = { id: inventoryId, productId, unitCost: 500 };

    vi.mocked(createInventory).mockResolvedValue(inventory as never);

    const req = {
      body: { productId, unitCost: 500 },
    } as any;
    const res = mockResponse();

    await createInventoryController(req, res);

    expect(createInventory).toHaveBeenCalledWith({
      productId,
      unitCost: 500,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(inventory);
  });

  it("returns 404 when inventory is not found", async () => {
    vi.mocked(getInventoryById).mockResolvedValue(null);

    const req = { params: { id: inventoryId } } as any;
    const res = mockResponse();

    await getInventoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Inventory item not found",
    });
  });

  it("gets inventory by product and returns 200", async () => {
    const inventory = { id: inventoryId, productId, unitCost: 500 };

    vi.mocked(getInventoryByProductId).mockResolvedValue(inventory as never);

    const req = { params: { productId } } as any;
    const res = mockResponse();

    await getInventoryByProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(inventory);
  });

  it("creates a location and returns 201", async () => {
    const location = { id: locationId, name: "Main", code: "MAIN" };

    vi.mocked(createLocation).mockResolvedValue(location as never);

    const req = {
      body: { name: "Main", code: "MAIN" },
    } as any;
    const res = mockResponse();

    await createLocationController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(location);
  });

  it("returns 200 when a location is found", async () => {
    const location = { id: locationId, name: "Main", code: "MAIN" };

    vi.mocked(getLocationById).mockResolvedValue(location as never);

    const req = { params: { id: locationId } } as any;
    const res = mockResponse();

    await getLocationController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(location);
  });

  it("records an inventory movement and returns 201", async () => {
    const result = {
      inventory: { id: inventoryId },
      movement: { quantity: 10 },
    };

    vi.mocked(recordInventoryMovement).mockResolvedValue(result as never);

    const req = {
      body: {
        inventoryItemId: inventoryId,
        locationId,
        type: "RECEIPT",
        quantity: 10,
      },
    } as any;
    const res = mockResponse();

    await recordInventoryMovementController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("changes on-order quantity and returns 200", async () => {
    const inventory = { id: inventoryId, onOrder: 10 };

    vi.mocked(changeOnOrder).mockResolvedValue(inventory as never);

    const req = {
      body: { inventoryItemId: inventoryId, quantity: 10 },
    } as any;
    const res = mockResponse();

    await changeOnOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(inventory);
  });

  it("reserves inventory and returns 200", async () => {
    const inventory = { id: inventoryId, reserved: 10 };

    vi.mocked(reserve).mockResolvedValue(inventory as never);

    const req = {
      body: { inventoryItemId: inventoryId, quantity: 10 },
    } as any;
    const res = mockResponse();

    await reserveInventoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(inventory);
  });

  it("releases inventory and returns 200", async () => {
    const inventory = { id: inventoryId, reserved: 5 };

    vi.mocked(release).mockResolvedValue(inventory as never);

    const req = {
      params: { inventoryItemId: inventoryId },
      body: { quantity: 5 },
    } as any;
    const res = mockResponse();

    await releaseInventoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(inventory);
  });

  it("returns inventory valuation with 200", async () => {
    const valuation = {
      inventoryItemId: inventoryId,
      productId,
      onHand: 10,
      unitCost: 500,
      inventoryValue: 5000,
    };

    vi.mocked(getInventoryValuation).mockResolvedValue(valuation as never);

    const req = { params: { inventoryItemId: inventoryId } } as any;
    const res = mockResponse();

    await getInventoryValuationController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(valuation);
  });
});
