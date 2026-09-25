import { getInventoryItemById } from "../repositories/inventoryRepository.js";

export async function getInventoryValuation(inventoryItemId: string) {
  const inventory = await getInventoryItemById(inventoryItemId);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  const inventoryValue = inventory.onHand * inventory.unitCost;

  return {
    inventoryItemId: inventory.id,
    productId: inventory.productId,
    onHand: inventory.onHand,
    unitCost: inventory.unitCost,
    inventoryValue,
  };
}
