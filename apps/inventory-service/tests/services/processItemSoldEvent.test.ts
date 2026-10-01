import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getInventoryItemByProductId: vi.fn(),
  recordInventoryMovement: vi.fn(),
  sell: vi.fn(),
  hasProcessedEvent: vi.fn(),
  markEventAsProcessed: vi.fn(),
}));

vi.mock("../../src/repositories/inventoryRepository.js", () => ({
  getInventoryItemByProductId: mocks.getInventoryItemByProductId,
}));

vi.mock("../../src/services/inventoryMovementService.js", () => ({
  recordInventoryMovement: mocks.recordInventoryMovement,
}));

vi.mock("../../src/services/inventoryReservationService.js", () => ({
  sell: mocks.sell,
}));

vi.mock("../../src/repositories/processedEventRepository.js", () => ({
  hasProcessedEvent: mocks.hasProcessedEvent,
  markEventAsProcessed: mocks.markEventAsProcessed,
}));

import { processItemSoldEvent } from "../../src/events/processItemSoldEvent.js";

describe("processItemSoldEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.hasProcessedEvent.mockResolvedValue(false);

    mocks.getInventoryItemByProductId.mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
    });

    mocks.sell.mockResolvedValue({});
    mocks.recordInventoryMovement.mockResolvedValue({});
    mocks.markEventAsProcessed.mockResolvedValue({});
  });

  it("should reduce on-hand and reserved inventory and update location stock", async () => {
    await processItemSoldEvent({
      eventId: "event-1",
      saleId: "sale-1",
      items: [
        {
          productId: "product-1",
          quantity: 3,
          locationId: "location-1",
        },
      ],
    });

    expect(mocks.sell).toHaveBeenCalledWith(
      "inventory-1",
      3,
    );

    expect(mocks.recordInventoryMovement).toHaveBeenCalledWith({
      inventoryItemId: "inventory-1",
      locationId: "location-1",
      type: "ITEM_SOLD",
      quantity: -3,
      reason: "Item sold in sale sale-1",
    });

    expect(mocks.markEventAsProcessed).toHaveBeenCalledWith(
      "event-1",
    );
  });

  it("should ignore an event that was already processed", async () => {
    mocks.hasProcessedEvent.mockResolvedValue(true);

    await processItemSoldEvent({
      eventId: "event-1",
      items: [],
    });

    expect(mocks.sell).not.toHaveBeenCalled();
    expect(mocks.recordInventoryMovement).not.toHaveBeenCalled();
    expect(mocks.markEventAsProcessed).not.toHaveBeenCalled();
  });

  it("should reject zero or negative sale quantity", async () => {
    await expect(
      processItemSoldEvent({
        eventId: "event-1",
        items: [
          {
            productId: "product-1",
            quantity: 0,
            locationId: "location-1",
          },
        ],
      }),
    ).rejects.toThrow("Sale quantity must be greater than zero");
  });
});
