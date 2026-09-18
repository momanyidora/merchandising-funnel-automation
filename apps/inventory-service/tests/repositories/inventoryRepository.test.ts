import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createInventoryItem,
  getInventoryItemById,
  getInventoryItemByProductId,
} from "../../src/repositories/inventoryRepository.js";

describe("Inventory Repository", () => {
  it("should create an inventory item", async () => {
    const productId = randomUUID();

    const item = await createInventoryItem({
      productId,
      unitCost: 500,
    });

    expect(item).toBeDefined();
    expect(item.productId).toBe(productId);
    expect(item.unitCost).toBe(500);
  });

  it("should retrieve an inventory item by ID", async () => {
    const item = await createInventoryItem({
      productId: randomUUID(),
      unitCost: 700,
    });

    const found = await getInventoryItemById(item.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(item.id);
  });

  it("should retrieve an inventory item by product ID", async () => {
    const productId = randomUUID();

    const item = await createInventoryItem({
      productId,
      unitCost: 900,
    });

    const found = await getInventoryItemByProductId(productId);

    expect(found).toBeDefined();
    expect(found?.productId).toBe(productId);
  });

  it("should return null for a missing inventory item", async () => {
    const found = await getInventoryItemById(
      "00000000-0000-4000-8000-000000000000",
    );

    expect(found).toBeNull();
  });
});
