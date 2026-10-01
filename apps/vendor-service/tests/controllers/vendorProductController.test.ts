import { describe, expect, it, vi } from "vitest";
import {
  approveVendorProduct,
  listVendorProducts,
  findVendorProduct,
  changeSupplierCost,
  revokeVendorProduct,
} from "../../src/services/vendorProductService.js";
import {
  approveVendorProductController,
  listVendorProductsController,
  findVendorProductController,
  changeSupplierCostController,
  revokeVendorProductController,
} from "../../src/controllers/vendorProductController.js";

vi.mock("../../src/services/vendorProductService.js", () => ({
  approveVendorProduct: vi.fn(),
  listVendorProducts: vi.fn(),
  findVendorProduct: vi.fn(),
  changeSupplierCost: vi.fn(),
  revokeVendorProduct: vi.fn(),
}));

function mockResponse(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe("Vendor Product Controller", () => {
  const vendorId = "8091e673-b27e-4a3d-b2af-5ba32e89318e";
  const productId = "11111111-1111-4111-8111-111111111111";

  it("should approve a vendor product and return 201", async () => {
    const product = { vendorId, productId, supplierCost: 80000 };

    vi.mocked(approveVendorProduct).mockResolvedValue(product as never);

    const req = {
      params: { vendorId },
      body: { productId, supplierCost: 80000 },
    } as any;
    const res = mockResponse();

    await approveVendorProductController(req, res);

    expect(approveVendorProduct).toHaveBeenCalledWith(
      req.bodyWithParams ?? {
        vendorId,
        productId,
        supplierCost: 80000,
      },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it("should return 400 when approval fails", async () => {
    vi.mocked(approveVendorProduct).mockRejectedValue(
      new Error("Vendor not found"),
    );

    const req = {
      params: { vendorId },
      body: { productId, supplierCost: 80000 },
    } as any;
    const res = mockResponse();

    await approveVendorProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor not found",
    });
  });

  it("should return 200 with vendor products", async () => {
    const products = [{ vendorId, productId, supplierCost: 80000 }];

    vi.mocked(listVendorProducts).mockResolvedValue(products as never);

    const req = { params: { vendorId } } as any;
    const res = mockResponse();

    await listVendorProductsController(req, res);

    expect(listVendorProducts).toHaveBeenCalledWith(vendorId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products);
  });

  it("should return 200 when a product is found", async () => {
    const product = { vendorId, productId, supplierCost: 80000 };

    vi.mocked(findVendorProduct).mockResolvedValue(product as never);

    const req = { params: { vendorId, productId } } as any;
    const res = mockResponse();

    await findVendorProductController(req, res);

    expect(findVendorProduct).toHaveBeenCalledWith(vendorId, productId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it("should return 404 when a product is not found", async () => {
    vi.mocked(findVendorProduct).mockResolvedValue(undefined as never);

    const req = { params: { vendorId, productId } } as any;
    const res = mockResponse();

    await findVendorProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor product not found",
    });
  });

  it("should update supplier cost and return 200", async () => {
    const product = { vendorId, productId, supplierCost: 95000 };

    vi.mocked(changeSupplierCost).mockResolvedValue(product as never);

    const req = {
      params: { vendorId, productId },
      body: { supplierCost: 95000 },
    } as any;
    const res = mockResponse();

    await changeSupplierCostController(req, res);

    expect(changeSupplierCost).toHaveBeenCalledWith(vendorId, productId, 95000);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it("should delete a vendor product and return 204", async () => {
    const product = { vendorId, productId, supplierCost: 80000 };

    vi.mocked(revokeVendorProduct).mockResolvedValue(product as never);

    const req = { params: { vendorId, productId } } as any;
    const res = mockResponse();

    await revokeVendorProductController(req, res);

    expect(revokeVendorProduct).toHaveBeenCalledWith(vendorId, productId);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return 404 when deleting a product that does not exist", async () => {
    vi.mocked(revokeVendorProduct).mockResolvedValue(undefined as never);

    const req = { params: { vendorId, productId } } as any;
    const res = mockResponse();

    await revokeVendorProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Vendor product not found",
    });
  });
});
