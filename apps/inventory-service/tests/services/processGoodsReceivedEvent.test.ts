import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getInventoryItemByProductId: vi.fn(),
  recordInventoryMovement: vi.fn(),
  changeOnOrder: vi.fn(),
  hasProcessedEvent: vi.fn(),
  markEventAsProcessed: vi.fn(),
}));

vi.mock("../../src/repositories/inventoryRepository.js", () => ({
  getInventoryItemByProductId: mocks.getInventoryItemByProductId,
}));

vi.mock("../../src/services/inventoryMovementService.js", () => ({
  recordInventoryMovement: mocks.recordInventoryMovement,
}));

vi.mock("../../src/services/inventoryOnOrderService.js", () => ({
  changeOnOrder: mocks.changeOnOrder,
}));

vi.mock("../../src/repositories/processedEventRepository.js", () => ({
  hasProcessedEvent: mocks.hasProcessedEvent,
  markEventAsProcessed: mocks.markEventAsProcessed,
}));

import { processGoodsReceivedEvent } from "../../src/events/processGoodsReceivedEvent.js";

describe("processGoodsReceivedEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.hasProcessedEvent.mockResolvedValue(false);
    mocks.getInventoryItemByProductId.mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
    });
    mocks.recordInventoryMovement.mockResolvedValue({});
    mocks.changeOnOrder.mockResolvedValue({});
    mocks.markEventAsProcessed.mockResolvedValue({});
  });

  it("should increase on-hand, decrease on-order, and update location stock", async () => {
    await processGoodsReceivedEvent({
      eventId: "event-1",
      purchaseOrderId: "po-1",
      items: [
        {
          productId: "product-1",
          quantity: 10,
          locationId: "location-1",
        },
      ],
    });

    expect(mocks.recordInventoryMovement).toHaveBeenCalledWith({
      inventoryItemId: "inventory-1",
      locationId: "location-1",
      type: "GOODS_RECEIVED",
      quantity: 10,
      reason: "Goods received for purchase order po-1",
    });

    expect(mocks.changeOnOrder).toHaveBeenCalledWith(
      "inventory-1",
      -10,
    );

    expect(mocks.markEventAsProcessed).toHaveBeenCalledWith("event-1");
  });

  it("should ignore an event that was already processed", async () => {
    mocks.hasProcessedEvent.mockResolvedValue(true);

    await processGoodsReceivedEvent({
      eventId: "event-1",
      items: [],
    });

    expect(mocks.recordInventoryMovement).not.toHaveBeenCalled();
    expect(mocks.changeOnOrder).not.toHaveBeenCalled();
    expect(mocks.markEventAsProcessed).not.toHaveBeenCalled();
  });

  it("should reject zero or negative received quantity", async () => {
    await expect(
      processGoodsReceivedEvent({
        eventId: "event-1",
        items: [
          {
            productId: "product-1",
            quantity: 0,
            locationId: "location-1",
          },
        ],
      }),
    ).rejects.toThrow("Received quantity must be greater than zero");
  });
});
