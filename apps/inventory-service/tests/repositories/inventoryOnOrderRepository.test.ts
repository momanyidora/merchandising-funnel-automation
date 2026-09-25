import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createInventoryItem } from "../../src/repositories/inventoryRepository.js";
import { updateOnOrder } from "../../src/repositories/inventoryOnOrderRepository.js";

describe("Inventory On-Order Repository", () => {
  it("should increase on-order quantity", async () => {
    const item = await createInventoryItem({
      productId: randomUUID(),
      unitCost: 500,
    });

    const updated = await updateOnOrder(item.id, 20);

    expect(updated!.onOrder).toBe(item.onOrder + 20);
  });

  it("should decrease on-order quantity", async () => {
    const item = await createInventoryItem({
      productId: randomUUID(),
      unitCost: 500,
    });

    await updateOnOrder(item.id, 30);
    const updated = await updateOnOrder(item.id, -10);

    expect(updated!.onOrder).toBe(item.onOrder + 20);
  });

  it("should return null for a missing inventory item", async () => {
    const result = await updateOnOrder(
      "00000000-0000-4000-8000-000000000000",
      10,
    );

    expect(result).toBeNull();
  });

  it("should reject a negative resulting on-order quantity", async () => {
    const item = await createInventoryItem({
      productId: randomUUID(),
      unitCost: 500,
    });

    await expect(updateOnOrder(item.id, -1)).rejects.toThrow(
      "On-order quantity cannot be negative",
    );
  });
});
