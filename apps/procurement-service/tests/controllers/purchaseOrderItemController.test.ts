import { describe, expect, it, vi } from "vitest";
import {
  createPurchaseOrderItemService,
  getPurchaseOrderItemsService,
  getPurchaseOrderItemService,
  updatePurchaseOrderItemService,
  deletePurchaseOrderItemService,
} from "../../src/services/purchaseOrderItemService.js";
import {
  createPurchaseOrderItemController,
  getPurchaseOrderItemsController,
  getPurchaseOrderItemController,
  updatePurchaseOrderItemController,
  deletePurchaseOrderItemController,
} from "../../src/controllers/purchaseOrderItemController.js";

vi.mock("../../src/services/purchaseOrderItemService.js", () => ({
  createPurchaseOrderItemService: vi.fn(),
  getPurchaseOrderItemsService: vi.fn(),
  getPurchaseOrderItemService: vi.fn(),
  updatePurchaseOrderItemService: vi.fn(),
  deletePurchaseOrderItemService: vi.fn(),
}));

function mockResponse(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("Purchase Order Item Controller", () => {
  const purchaseOrderId = "po-1";
  const itemId = "item-1";

  it("should create an item and return 201", async () => {
    const item = {
      id: itemId,
      purchaseOrderId,
      productId: "product-1",
      quantity: 10,
      lockedUnitCost: 500,
    };

    vi.mocked(createPurchaseOrderItemService).mockResolvedValue(item as never);

    const req = {
      params: { purchaseOrderId },
      body: {
        productId: "product-1",
        quantity: 10,
        lockedUnitCost: 500,
      },
    } as any;
    const res = mockResponse();

    await createPurchaseOrderItemController(req, res);

    expect(createPurchaseOrderItemService).toHaveBeenCalledWith({
      purchaseOrderId,
      ...req.body,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it("should return 404 when the purchase order does not exist", async () => {
    vi.mocked(createPurchaseOrderItemService).mockRejectedValue(
      new Error("Purchase order not found"),
    );

    const req = {
      params: { purchaseOrderId },
      body: {},
    } as any;
    const res = mockResponse();

    await createPurchaseOrderItemController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Purchase order not found",
    });
  });

  it("should return purchase order items with 200", async () => {
    const items = [{ id: itemId, purchaseOrderId, quantity: 10 }];

    vi.mocked(getPurchaseOrderItemsService).mockResolvedValue(items as never);

    const req = { params: { purchaseOrderId } } as any;
    const res = mockResponse();

    await getPurchaseOrderItemsController(req, res);

    expect(getPurchaseOrderItemsService).toHaveBeenCalledWith(purchaseOrderId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(items);
  });

  it("should return a purchase order item with 200", async () => {
    const item = { id: itemId, purchaseOrderId, quantity: 10 };

    vi.mocked(getPurchaseOrderItemService).mockResolvedValue(item as never);

    const req = { params: { id: itemId } } as any;
    const res = mockResponse();

    await getPurchaseOrderItemController(req, res);

    expect(getPurchaseOrderItemService).toHaveBeenCalledWith(itemId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it("should update a purchase order item with 200", async () => {
    const item = { id: itemId, quantity: 20 };

    vi.mocked(updatePurchaseOrderItemService).mockResolvedValue(item as never);

    const req = {
      params: { id: itemId },
      body: { quantity: 20 },
    } as any;
    const res = mockResponse();

    await updatePurchaseOrderItemController(req, res);

    expect(updatePurchaseOrderItemService).toHaveBeenCalledWith(
      itemId,
      req.body,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it("should delete a purchase order item with 204", async () => {
    vi.mocked(deletePurchaseOrderItemService).mockResolvedValue(
      undefined as never,
    );

    const req = { params: { id: itemId } } as any;
    const res = mockResponse();

    await deletePurchaseOrderItemController(req, res);

    expect(deletePurchaseOrderItemService).toHaveBeenCalledWith(itemId);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
