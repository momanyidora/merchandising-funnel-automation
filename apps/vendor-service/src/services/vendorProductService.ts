import {
  addVendorProduct,
  getVendorProducts,
  getVendorProduct,
  updateVendorProduct,
  removeVendorProduct,
} from "../repositories/vendorProductRepository.js";

import { vendorExists } from "../repositories/vendorRepository.js";
import { validateUuid } from "../utils/validation.js";

function validateSupplierCost(supplierCost: number): void {
  if (!Number.isInteger(supplierCost) || supplierCost < 0) {
    throw new Error("Supplier cost must be a non-negative integer");
  }
}

function validateId(id: string, fieldName: string): void {
  validateUuid(id, fieldName);
}
function isDuplicateVendorProductError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = (
    error as Error & {
      cause?: {
        code?: string;
        constraint?: string;
      };
    }
  ).cause;

  return (
    cause?.code === "23505" && cause?.constraint === "vendor_product_unique"
  );
}
export async function approveVendorProduct(data: {
  vendorId: string;
  productId: string;
  supplierCost: number;
}) {
  validateId(data.vendorId, "Vendor ID");
  validateId(data.productId, "Product ID");
  validateSupplierCost(data.supplierCost);

  const exists = await vendorExists(data.vendorId);

  if (!exists) {
    throw new Error("Vendor not found");
  }

  try {
    return await addVendorProduct(data);
  } catch (error) {
    if (isDuplicateVendorProductError(error)) {
      throw new Error("Product is already approved for this vendor");
    }

    throw error;
  }
}

export async function listVendorProducts(vendorId: string) {
  validateId(vendorId, "Vendor ID");

  return getVendorProducts(vendorId);
}

export async function findVendorProduct(vendorId: string, productId: string) {
  validateId(vendorId, "Vendor ID");
  validateId(productId, "Product ID");

  return getVendorProduct(vendorId, productId);
}

export async function changeSupplierCost(
  vendorId: string,
  productId: string,
  supplierCost: number,
) {
  validateId(vendorId, "Vendor ID");
  validateId(productId, "Product ID");
  validateSupplierCost(supplierCost);

  return updateVendorProduct(vendorId, productId, supplierCost);
}

export async function revokeVendorProduct(vendorId: string, productId: string) {
  validateId(vendorId, "Vendor ID");
  validateId(productId, "Product ID");

  return removeVendorProduct(vendorId, productId);
}
