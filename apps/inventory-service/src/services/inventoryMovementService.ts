import { applyInventoryMovement } from "../repositories/inventoryMovementRepository.js";
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
