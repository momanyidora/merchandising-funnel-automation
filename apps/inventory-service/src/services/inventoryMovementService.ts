import {
  applyInventoryMovement,
  getInventoryMovements,
  transferInventory as transferInventoryRepository,
} from "../repositories/inventoryMovementRepository.js";
import {
  InventoryItemNotFoundError,
  InvalidMovementQuantityError,
} from "../errors/inventoryErrors.js";

export async function recordInventoryMovement(data: {
  inventoryItemId: string;
  locationId: string;
  type: string;
  quantity: number;
  reason?: string;
  idempotencyKey?: string;
}) {
  if (data.quantity === 0) {
    throw new InvalidMovementQuantityError();
  }
  const result = await applyInventoryMovement(data);

  if (!result) {
    throw new InventoryItemNotFoundError();
  }

  return result;
}
export async function getMovements(inventoryItemId: string) {
  return getInventoryMovements(inventoryItemId);
}
export async function transferInventory(data: { inventoryItemId: string; sourceLocationId: string; destinationLocationId: string; quantity: number; reason?: string; idempotencyKey: string }) {
  return transferInventoryRepository(data);
}
