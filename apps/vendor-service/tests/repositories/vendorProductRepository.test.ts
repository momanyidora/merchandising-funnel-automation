import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  addVendorProduct,
  getVendorProducts,
  getVendorProduct,
  updateVendorProduct,
  removeVendorProduct,
} from "../../src/repositories/vendorProductRepository.js";
import {
  createVendor,
  deleteVendor,
} from "../../src/repositories/vendorRepository.js";

const vendorData = {
  name: "Product Repository Vendor",
  email: `product-repo-${Date.now()}@example.com`,
  phone: "+254700000002",
  paymentTerms: "Net 30",
  leadTimeDays: 10,
};

const productId = "11111111-1111-4111-8111-111111111111";

let vendorId: string;

describe("Vendor Product Repository", () => {
  beforeAll(async () => {
    const vendor = await createVendor(vendorData);
    vendorId = vendor.id;
  });

  afterAll(async () => {
    if (vendorId) {
      await deleteVendor(vendorId);
    }
  });

  it("should add a vendor product", async () => {
    const product = await addVendorProduct({
      vendorId,
      productId,
      supplierCost: 80000,
    });

    expect(product).toBeDefined();
    expect(product.vendorId).toBe(vendorId);
    expect(product.productId).toBe(productId);
    expect(product.supplierCost).toBe(80000);
  });

  it("should retrieve vendor products", async () => {
    const products = await getVendorProducts(vendorId);

    expect(products.length).toBeGreaterThan(0);
    expect(products.some((product) => product.productId === productId)).toBe(
      true,
    );
  });

  it("should retrieve a specific vendor product", async () => {
    const product = await getVendorProduct(vendorId, productId);

    expect(product).toBeDefined();
    expect(product?.vendorId).toBe(vendorId);
    expect(product?.productId).toBe(productId);
  });

  it("should update supplier cost", async () => {
    const updated = await updateVendorProduct(vendorId, productId, 95000);

    expect(updated).toBeDefined();
    expect(updated?.supplierCost).toBe(95000);
  });

  it("should remove a vendor product", async () => {
    const removed = await removeVendorProduct(vendorId, productId);

    expect(removed).toBeDefined();
    expect(removed?.productId).toBe(productId);
  });
});
