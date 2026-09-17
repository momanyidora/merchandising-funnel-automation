import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createInventoryItem } from "../../src/repositories/inventoryRepository.js";
import { createInventoryLocation } from "../../src/repositories/inventoryLocationRepository.js";
import { applyInventoryMovement } from "../../src/repositories/inventoryMovementRepository.js";

describe("Inventory Movement Repository", () => {
  it("should apply an inventory movement", async () => {
    const item = await createInventoryItem({
      productId: randomUUID(),
      unitCost: 500,
    });

    const location = await createInventoryLocation({
      name: `Location ${Date.now()}`,
      code: `LOC-${Date.now()}`,
    });

    const result = await applyInventoryMovement({
      inventoryItemId: item.id,
      locationId: location.id,
      type: "RECEIPT",
      quantity: 25,
      reason: "Test receipt",
    });

    expect(result).not.toBeNull();
    expect(result!.inventory.onHand).toBe(item.onHand + 25);
    expect(result!.movement.quantity).toBe(25);
  });
  it("should return null for a missing inventory item", async () => {
    const location = await createInventoryLocation({
      name: `Location ${Date.now()}`,
      code: `LOC-${Date.now()}`,
    });

    const result = await applyInventoryMovement({
      inventoryItemId: "00000000-0000-4000-8000-000000000000",
      locationId: location.id,
      type: "RECEIPT",
      quantity: 10,
    });

    expect(result).toBeNull();
  });

  it("should reject a movement that makes on-hand negative", async () => {
    const item = await createInventoryItem({
      productId: randomUUID(),
      unitCost: 500,
    });

    const location = await createInventoryLocation({
      name: `Location ${Date.now()}`,
      code: `LOC-${Date.now()}`,
    });

    await expect(
      applyInventoryMovement({
        inventoryItemId: item.id,
        locationId: location.id,
        type: "SALE",
        quantity: -1,
      }),
    ).rejects.toThrow("Insufficient inventory");
  });
});
