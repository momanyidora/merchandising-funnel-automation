import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  checkAndPublishStockLow: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: { transaction: mocks.transaction },
}));
vi.mock("../../src/services/inventoryStockLowService.js", () => ({
  checkAndPublishStockLow: mocks.checkAndPublishStockLow,
}));

import { processItemSoldEvent } from "../../src/events/processItemSoldEvent.js";

function queryResult<T>(value: T) {
  const query = {
    from: () => query,
    where: () => query,
    limit: () => query,
    for: () => Promise.resolve(value),
    then: (resolve: (result: T) => unknown) => Promise.resolve(value).then(resolve),
  };
  return query;
}

describe("processItemSoldEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkAndPublishStockLow.mockResolvedValue(false);
  });

  it("atomically consumes the reservation, location stock, and records the event", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      select: vi
        .fn()
        .mockReturnValueOnce(queryResult([]))
        .mockReturnValueOnce(
          queryResult([
            { id: "inventory-1", productId: "product-1", onHand: 8, reserved: 3 },
          ]),
        )
        .mockReturnValueOnce(queryResult([{ id: "stock-1", quantity: 3 }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    };
    mocks.transaction.mockImplementation((callback) => callback(tx));

    await processItemSoldEvent({
      eventId: "event-1",
      saleId: "sale-1",
      items: [{ productId: "product-1", quantity: 3, locationId: "location-1" }],
    });

    expect(tx.update).toHaveBeenCalledTimes(2);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ITEM_SOLD",
        quantity: -3,
        idempotencyKey: "ItemSold:event-1:product-1:location-1",
      }),
    );
    expect(mocks.checkAndPublishStockLow).toHaveBeenCalledWith("product-1");
  });

  it("does not apply a duplicate event", async () => {
    const tx = {
      select: vi.fn(() => queryResult([{ eventId: "event-1" }])),
      update: vi.fn(),
      insert: vi.fn(),
    };
    mocks.transaction.mockImplementation((callback) => callback(tx));

    await processItemSoldEvent({ eventId: "event-1", items: [] });

    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(mocks.checkAndPublishStockLow).not.toHaveBeenCalled();
  });

  it("rejects a zero or negative sale quantity", async () => {
    mocks.transaction.mockImplementation((callback) => callback({
      select: vi.fn(() => queryResult([])),
      update: vi.fn(),
      insert: vi.fn(),
    }));

    await expect(
      processItemSoldEvent({
        eventId: "event-1",
        items: [{ productId: "product-1", quantity: 0, locationId: "location-1" }],
      }),
    ).rejects.toThrow("Sale quantity must be greater than zero");
  });
});
