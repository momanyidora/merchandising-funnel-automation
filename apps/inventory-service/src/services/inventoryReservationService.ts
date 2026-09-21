import {
  reserveInventory,
  releaseInventory,
  sellInventory,
} from "../repositories/inventoryReservationRepository.js";

export async function reserve(inventoryItemId: string, quantity: number) {
  if (quantity <= 0) {
    throw new Error("Reservation quantity must be greater than zero");
  }

  const inventory = await reserveInventory(inventoryItemId, quantity);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  return inventory;
}

export async function release(inventoryItemId: string, quantity: number) {
  if (quantity <= 0) {
    throw new Error("Release quantity must be greater than zero");
  }

  const inventory = await releaseInventory(inventoryItemId, quantity);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  return inventory;
}

export async function sell(inventoryItemId: string, quantity: number) {
  if (quantity <= 0) {
    throw new Error("Sale quantity must be greater than zero");
  }

  const inventory = await sellInventory(inventoryItemId, quantity);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  return inventory;
}
