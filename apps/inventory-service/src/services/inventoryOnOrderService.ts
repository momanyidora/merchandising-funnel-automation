import { updateOnOrder } from "../repositories/inventoryOnOrderRepository.js";

export async function changeOnOrder(inventoryItemId: string, quantity: number) {
  if (quantity === 0) {
    throw new Error("On-order quantity cannot be zero");
  }

  const inventory = await updateOnOrder(inventoryItemId, quantity);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  return inventory;
}
