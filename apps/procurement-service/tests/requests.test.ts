import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/services/purchaseOrderService.js", () => ({
  createPurchaseOrderService: vi.fn(),
  getPurchaseOrderService: vi.fn(),
  listPurchaseOrdersService: vi.fn(),
  updatePurchaseOrderService: vi.fn(),
  deletePurchaseOrderService: vi.fn(),
  submitPurchaseOrderForApprovalService: vi.fn(),
  approvePurchaseOrderService: vi.fn(),
}));

import {
  createPurchaseOrderService,
  getPurchaseOrderService,
  listPurchaseOrdersService,
} from "../src/services/purchaseOrderService.js";

describe("Procurement API Requests", () => {
  const purchaseOrderId = "po-1";

  it("GET /health should return 200 with health payload", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: "procurement-service",
      status: "ok",
    });
  });

  it("POST /purchase-orders should return 201 with the created purchase order", async () => {
    const purchaseOrder = {
      id: purchaseOrderId,
      vendorId: "vendor-1",
      status: "DRAFT",
      paymentTerms: "NET_30",
      currency: "KES",
    };

    vi.mocked(createPurchaseOrderService).mockResolvedValue(
      purchaseOrder as never,
    );

    const payload = {
      vendorId: "vendor-1",
      paymentTerms: "NET_30",
      currency: "KES",
    };

    const response = await request(app).post("/purchase-orders").send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(purchaseOrder);
    expect(createPurchaseOrderService).toHaveBeenCalledWith(payload);
  });

  it("POST /purchase-orders should return 400 when creation fails", async () => {
    vi.mocked(createPurchaseOrderService).mockRejectedValue(
      new Error("Vendor not found"),
    );

    const response = await request(app).post("/purchase-orders").send({
      vendorId: "missing-vendor",
      paymentTerms: "NET_30",
      currency: "KES",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Vendor not found",
    });
  });

  it("GET /purchase-orders should return 200 with purchase orders", async () => {
    const purchaseOrders = [
      {
        id: purchaseOrderId,
        vendorId: "vendor-1",
        status: "DRAFT",
      },
    ];

    vi.mocked(listPurchaseOrdersService).mockResolvedValue(
      purchaseOrders as never,
    );

    const response = await request(app).get("/purchase-orders");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(purchaseOrders);
  });

  it("GET /purchase-orders/:id should return 200 with the purchase order", async () => {
    const purchaseOrder = {
      id: purchaseOrderId,
      vendorId: "vendor-1",
      status: "DRAFT",
    };

    vi.mocked(getPurchaseOrderService).mockResolvedValue(
      purchaseOrder as never,
    );

    const response = await request(app).get(
      `/purchase-orders/${purchaseOrderId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(purchaseOrder);
    expect(getPurchaseOrderService).toHaveBeenCalledWith(purchaseOrderId);
  });

  it("GET /purchase-orders/:id should return 404 when not found", async () => {
    vi.mocked(getPurchaseOrderService).mockRejectedValue(
      new Error("Purchase order not found"),
    );

    const response = await request(app).get(
      `/purchase-orders/${purchaseOrderId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Purchase order not found",
    });
  });
});
