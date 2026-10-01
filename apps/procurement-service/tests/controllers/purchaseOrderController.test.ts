import { describe, expect, it, vi } from "vitest";
import {
  createPurchaseOrderService,
  getPurchaseOrderService,
  listPurchaseOrdersService,
  updatePurchaseOrderService,
  deletePurchaseOrderService,
  submitPurchaseOrderForApprovalService,
  approvePurchaseOrderService,
} from "../../src/services/purchaseOrderService.js";
import {
  createPurchaseOrderController,
  getPurchaseOrderController,
  listPurchaseOrdersController,
  updatePurchaseOrderController,
  deletePurchaseOrderController,
  submitPurchaseOrderController,
  approvePurchaseOrderController,
} from "../../src/controllers/purchaseOrderController.js";

vi.mock("../../src/services/purchaseOrderService.js", () => ({
  createPurchaseOrderService: vi.fn(),
  getPurchaseOrderService: vi.fn(),
  listPurchaseOrdersService: vi.fn(),
  updatePurchaseOrderService: vi.fn(),
  deletePurchaseOrderService: vi.fn(),
  submitPurchaseOrderForApprovalService: vi.fn(),
  approvePurchaseOrderService: vi.fn(),
}));

function mockResponse(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("Purchase Order Controller", () => {
  const id = "po-1";

  it("should create a purchase order and return 201", async () => {
    const purchaseOrder = { id, status: "DRAFT" };

    vi.mocked(createPurchaseOrderService).mockResolvedValue(
      purchaseOrder as never,
    );

    const req = {
      body: {
        vendorId: "vendor-1",
        paymentTerms: "NET_30",
        currency: "KES",
      },
    } as any;
    const res = mockResponse();

    await createPurchaseOrderController(req, res);

    expect(createPurchaseOrderService).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(purchaseOrder);
  });

  it("should return 400 when creation fails", async () => {
    vi.mocked(createPurchaseOrderService).mockRejectedValue(
      new Error("Vendor not found"),
    );

    const req = { body: {} } as any;
    const res = mockResponse();

    await createPurchaseOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor not found",
    });
  });

  it("should list purchase orders with 200", async () => {
    const orders = [{ id, status: "DRAFT" }];

    vi.mocked(listPurchaseOrdersService).mockResolvedValue(orders as never);

    const req = {} as any;
    const res = mockResponse();

    await listPurchaseOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orders);
  });

  it("should get a purchase order with 200", async () => {
    const order = { id, status: "DRAFT" };

    vi.mocked(getPurchaseOrderService).mockResolvedValue(order as never);

    const req = { params: { id } } as any;
    const res = mockResponse();

    await getPurchaseOrderController(req, res);

    expect(getPurchaseOrderService).toHaveBeenCalledWith(id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it("should return 404 when getting a missing purchase order", async () => {
    vi.mocked(getPurchaseOrderService).mockRejectedValue(
      new Error("Purchase order not found"),
    );

    const req = { params: { id } } as any;
    const res = mockResponse();

    await getPurchaseOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Purchase order not found",
    });
  });

  it("should update a purchase order with 200", async () => {
    const order = { id, status: "DRAFT", paymentTerms: "NET_60" };

    vi.mocked(updatePurchaseOrderService).mockResolvedValue(order as never);

    const req = {
      params: { id },
      body: { paymentTerms: "NET_60" },
    } as any;
    const res = mockResponse();

    await updatePurchaseOrderController(req, res);

    expect(updatePurchaseOrderService).toHaveBeenCalledWith(id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it("should delete a purchase order with 204", async () => {
    vi.mocked(deletePurchaseOrderService).mockResolvedValue(undefined as never);

    const req = { params: { id } } as any;
    const res = mockResponse();

    await deletePurchaseOrderController(req, res);

    expect(deletePurchaseOrderService).toHaveBeenCalledWith(id);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("should submit a purchase order with 200", async () => {
    const order = { id, status: "PENDING_APPROVAL" };

    vi.mocked(submitPurchaseOrderForApprovalService).mockResolvedValue(
      order as never,
    );

    const req = { params: { id } } as any;
    const res = mockResponse();

    await submitPurchaseOrderController(req, res);

    expect(submitPurchaseOrderForApprovalService).toHaveBeenCalledWith(id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it("should approve a purchase order with 200", async () => {
    const order = { id, status: "APPROVED" };

    vi.mocked(approvePurchaseOrderService).mockResolvedValue(order as never);

    const req = { params: { id } } as any;
    const res = mockResponse();

    await approvePurchaseOrderController(req, res);

    expect(approvePurchaseOrderService).toHaveBeenCalledWith(id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(order);
  });
});
