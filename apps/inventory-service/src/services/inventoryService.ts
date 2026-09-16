import {
  createInventoryItem,
  getInventoryItemById,
  getInventoryItemByProductId,
} from "../repositories/inventoryRepository.js";

export async function createInventory(data: {
  productId: string;
  unitCost: number;
}) {
  const existingItem = await getInventoryItemByProductId(data.productId);

  if (existingItem) {
    throw new Error("Inventory item already exists for this product");
  }

  return createInventoryItem(data);
}

export async function getInventoryById(id: string) {
  return getInventoryItemById(id);
}

export async function getInventoryByProductId(productId: string) {
  return getInventoryItemByProductId(productId);
}
