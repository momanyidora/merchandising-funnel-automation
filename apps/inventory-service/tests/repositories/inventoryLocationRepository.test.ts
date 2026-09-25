import { describe, expect, it } from "vitest";
import {
  createInventoryLocation,
  getInventoryLocationById,
} from "../../src/repositories/inventoryLocationRepository.js";

describe("Inventory Location Repository", () => {
  it("should create an inventory location", async () => {
    const location = await createInventoryLocation({
      name: `Warehouse ${Date.now()}`,
      code: `WH-${Date.now()}`,
    });

    expect(location).toBeDefined();
    expect(location.name).toContain("Warehouse");
    expect(location.code).toContain("WH-");
  });

  it("should retrieve an inventory location by ID", async () => {
    const location = await createInventoryLocation({
      name: `Storage ${Date.now()}`,
      code: `ST-${Date.now()}`,
    });

    const found = await getInventoryLocationById(location.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(location.id);
  });

  it("should return null for a missing location", async () => {
    const found = await getInventoryLocationById(
      "00000000-0000-4000-8000-000000000000",
    );

    expect(found).toBeNull();
  });
});
