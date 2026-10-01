import { randomUUID } from "node:crypto";
import {
  createInventoryItem,
  getInventoryItemById,
  getInventoryItemByProductId,
  searchInventoryProducts,
} from "../repositories/inventoryRepository.js";

export async function createInventory(data: {
  productId?: string;
  productName: string;
  unitCost: number;
}) {
  if (!data.productName?.trim() || data.productName.trim().length < 2) throw new Error("Product name must be at least 2 characters");
  if (!Number.isSafeInteger(data.unitCost) || data.unitCost < 0) throw new Error("Unit cost must be a non-negative whole number in the selected currency");
  const productId = data.productId || randomUUID();
  const existingItem = await getInventoryItemByProductId(productId);

  if (existingItem) {
    throw new Error("Inventory item already exists for this product");
  }
  return createInventoryItem({ ...data, productId, productName: data.productName.trim() });
}
export async function searchProducts(search: string, limit?: number, ids?: string[]) { return searchInventoryProducts(search, limit, ids); }

export async function getInventoryById(id: string) {
  return getInventoryItemById(id);
}

export async function getInventoryByProductId(productId: string) {
  return getInventoryItemByProductId(productId);
}
