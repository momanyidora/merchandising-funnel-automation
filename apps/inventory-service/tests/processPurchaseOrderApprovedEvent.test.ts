import { describe, expect, it, vi, beforeEach } from "vitest";

import { processPurchaseOrderApprovedEvent } from "../src/events/processPurchaseOrderApprovedEvent.js";

import { getInventoryItemByProductId } from "../src/repositories/inventoryRepository.js";
import { changeOnOrder } from "../src/services/inventoryOnOrderService.js";
import {
  hasProcessedEvent,
  markEventAsProcessed,
} from "../src/repositories/processedEventRepository.js";

vi.mock("../src/repositories/inventoryRepository.js", () => ({
  getInventoryItemByProductId: vi.fn(),
}));

vi.mock("../src/services/inventoryOnOrderService.js", () => ({
  changeOnOrder: vi.fn(),
}));

vi.mock("../src/repositories/processedEventRepository.js", () => ({
  hasProcessedEvent: vi.fn(),
  markEventAsProcessed: vi.fn(),
}));

describe("processPurchaseOrderApprovedEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes an approved purchase order", async () => {
    vi.mocked(hasProcessedEvent).mockResolvedValue(false);

    vi.mocked(getInventoryItemByProductId).mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
    } as never);

    vi.mocked(changeOnOrder).mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
      onHand: 20,
      reserved: 0,
      onOrder: 10,
      unitCost: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(markEventAsProcessed).mockResolvedValue(undefined);

    await processPurchaseOrderApprovedEvent({
      eventId: "event-1",
      purchaseOrder: {
        status: "APPROVED",
      },
      items: [
        {
          productId: "product-1",
          quantity: 10,
        },
      ],
    });

    expect(getInventoryItemByProductId).toHaveBeenCalledWith("product-1");

    expect(changeOnOrder).toHaveBeenCalledWith("inventory-1", 10);

    expect(markEventAsProcessed).toHaveBeenCalledWith("event-1");
  });

  it("ignores an event that was already processed", async () => {
    vi.mocked(hasProcessedEvent).mockResolvedValue(true);

    await processPurchaseOrderApprovedEvent({
      eventId: "event-1",
      purchaseOrder: {
        status: "APPROVED",
      },
      items: [
        {
          productId: "product-1",
          quantity: 10,
        },
      ],
    });

    expect(getInventoryItemByProductId).not.toHaveBeenCalled();
    expect(changeOnOrder).not.toHaveBeenCalled();
    expect(markEventAsProcessed).not.toHaveBeenCalled();
  });

  it("throws an error when event ID is missing", async () => {
    await expect(
      processPurchaseOrderApprovedEvent({
        eventId: "",
        purchaseOrder: {
          status: "APPROVED",
        },
      }),
    ).rejects.toThrow("Event ID is missing");
  });

  it("ignores events that are not approved", async () => {
    vi.mocked(hasProcessedEvent).mockResolvedValue(false);

    await processPurchaseOrderApprovedEvent({
      eventId: "event-2",
      purchaseOrder: {
        status: "PENDING_APPROVAL",
      },
      items: [
        {
          productId: "product-1",
          quantity: 10,
        },
      ],
    });

    expect(getInventoryItemByProductId).not.toHaveBeenCalled();
    expect(changeOnOrder).not.toHaveBeenCalled();
    expect(markEventAsProcessed).not.toHaveBeenCalled();
  });
});
