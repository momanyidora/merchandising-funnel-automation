import { describe, expect, it } from "vitest";
import { createInventoryItem } from "../../src/repositories/inventoryRepository.js";
import { createInventoryLocation } from "../../src/repositories/inventoryLocationRepository.js";
import { applyInventoryMovement } from "../../src/repositories/inventoryMovementRepository.js";
import {
  reserveInventory,
  releaseInventory,
} from "../../src/repositories/inventoryReservationRepository.js";

async function createItemWithStock() {
  const item = await createInventoryItem({
    productId: crypto.randomUUID(),
    unitCost: 500,
  });

  const location = await createInventoryLocation({
    name: `Location ${Date.now()}`,
    code: `LOC-${Date.now()}`,
  });

  await applyInventoryMovement({
    inventoryItemId: item.id,
    locationId: location.id,
    type: "RECEIPT",
    quantity: 20,
  });

  return item;
}

describe("Inventory Reservation Repository", () => {
  it("should reserve inventory", async () => {
    const item = await createItemWithStock();

    const updated = await reserveInventory(item.id, 10);

    expect(updated).not.toBeNull();
    expect(updated!.reserved).toBe(10);
  });

  it("should release reserved inventory", async () => {
    const item = await createItemWithStock();

    await reserveInventory(item.id, 10);
    const updated = await releaseInventory(item.id, 5);

    expect(updated).not.toBeNull();
    expect(updated!.reserved).toBe(5);
  });

  it("should return null for a missing inventory item", async () => {
    const result = await reserveInventory(
      "00000000-0000-4000-8000-000000000000",
      10,
    );

    expect(result).toBeNull();
  });

  it("should reject a reservation larger than available inventory", async () => {
    const item = await createItemWithStock();

    await expect(reserveInventory(item.id, 21)).rejects.toThrow(
      "Insufficient available inventory",
    );
  });

  it("should reject releasing more than reserved inventory", async () => {
    const item = await createItemWithStock();

    await reserveInventory(item.id, 5);

    await expect(releaseInventory(item.id, 10)).rejects.toThrow(
      "Cannot release more than reserved inventory",
    );
  });
});
