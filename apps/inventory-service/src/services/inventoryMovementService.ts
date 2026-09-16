import { applyInventoryMovement } from "../repositories/inventoryMovementRepository.js";

export async function recordInventoryMovement(data: {
  inventoryItemId: string;
  locationId: string;
  type: string;
  quantity: number;
  reason?: string;
}) {
  if (data.quantity === 0) {
    throw new Error("Movement quantity cannot be zero");
  }

  const result = await applyInventoryMovement(data);

  if (!result) {
    throw new Error("Inventory item not found");
  }

  return result;
}
