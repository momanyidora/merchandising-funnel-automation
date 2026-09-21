import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkAndPublishStockLow } from "../../src/services/inventoryStockLowService.js";
import { getInventoryItemByProductId } from "../../src/repositories/inventoryRepository.js";
import { publishEvent } from "../../src/events/rabbitmqPublisher.js";

vi.mock("../../src/repositories/inventoryRepository.js", () => ({
  getInventoryItemByProductId: vi.fn(),
}));

vi.mock("../../src/events/rabbitmqPublisher.js", () => ({
  publishEvent: vi.fn(),
}));

describe("checkAndPublishStockLow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes StockLow when on-hand stock is at or below the threshold", async () => {
    vi.mocked(getInventoryItemByProductId).mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
      onHand: 5,
      reserved: 0,
      onOrder: 10,
      unitCost: 500,
      lowStockThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await checkAndPublishStockLow("product-1");

    expect(publishEvent).toHaveBeenCalledWith("StockLow", {
      productId: "product-1",
      inventoryItemId: "inventory-1",
      onHand: 5,
      lowStockThreshold: 10,
    });
  });

  it("does not publish StockLow when stock is above the threshold", async () => {
    vi.mocked(getInventoryItemByProductId).mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
      onHand: 20,
      reserved: 0,
      onOrder: 10,
      unitCost: 500,
      lowStockThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await checkAndPublishStockLow("product-1");

    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("throws when the inventory item does not exist", async () => {
    vi.mocked(getInventoryItemByProductId).mockResolvedValue(null);

    await expect(
      checkAndPublishStockLow("product-1"),
    ).rejects.toThrow("Inventory item not found");

    expect(publishEvent).not.toHaveBeenCalled();
  });
});
