import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  checkAndPublishStockLow: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: {
    transaction: mocks.transaction,
  },
}));

vi.mock("../../src/services/inventoryStockLowService.js", () => ({
  checkAndPublishStockLow: mocks.checkAndPublishStockLow,
}));

function createTransactionMock() {
  const tx = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };

  return tx;
}

import { processGoodsReceivedEvent } from "../../src/events/processGoodsReceivedEvent.js";

describe("processGoodsReceivedEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.checkAndPublishStockLow.mockResolvedValue(false);

    mocks.transaction.mockImplementation(async (callback) => {
      const tx = createTransactionMock();
      return callback(tx);
    });
  });

  it("should increase on-hand, decrease on-order, and update location stock", async () => {
    const inventoryId = "f8fd9271-ccb0-4dca-be87-a6a88942fbaf";
    const productId = "22222222-2222-2222-2222-222222222222";
    const locationId = "f1e6fe7d-392c-4962-bdd1-0e98c3425b72";
    const eventId = "a74f1267-6003-4f60-a001-f5e8d1096ca2";

    const tx = createTransactionMock();

    const processedLimit = vi.fn().mockResolvedValue([]);
    const inventoryForUpdate = vi.fn().mockResolvedValue([
      {
        id: inventoryId,
        productId,
        onHand: 0,
        onOrder: 10,
      },
    ]);
    const locationLimit = vi.fn().mockResolvedValue([
      {
        id: locationId,
      },
    ]);
    const locationStockForUpdate = vi.fn().mockResolvedValue([]);

    tx.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: processedLimit,
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              for: inventoryForUpdate,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: locationLimit,
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: locationStockForUpdate,
          }),
        }),
      });

    tx.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    tx.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    mocks.transaction.mockImplementationOnce(async (callback) => {
      return callback(tx);
    });

    await processGoodsReceivedEvent({
      eventId,
      purchaseOrderId:
        "4d4345ad-08c5-4b1e-b28a-d5a8f6a99307",
      items: [
        {
          productId,
          quantity: 10,
          locationId,
        },
      ],
    });

    expect(tx.update).toHaveBeenCalled();
    expect(tx.insert).toHaveBeenCalled();
    expect(mocks.checkAndPublishStockLow).toHaveBeenCalledWith(productId);
  });

  it("should ignore an event that was already processed", async () => {
    const tx = createTransactionMock();

    const processedLimit = vi.fn().mockResolvedValue([
      {
        eventId: "a74f1267-6003-4f60-a001-f5e8d1096ca2",
      },
    ]);

    tx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: processedLimit,
        }),
      }),
    });

    mocks.transaction.mockImplementationOnce(async (callback) => {
      return callback(tx);
    });

    await processGoodsReceivedEvent({
      eventId: "a74f1267-6003-4f60-a001-f5e8d1096ca2",
      items: [],
    });

    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(mocks.checkAndPublishStockLow).not.toHaveBeenCalled();
  });

  it("should reject zero or negative received quantity", async () => {
    const tx = createTransactionMock();

    tx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    mocks.transaction.mockImplementationOnce(async (callback) => {
      return callback(tx);
    });

    await expect(
      processGoodsReceivedEvent({
        eventId: "b85d4e4e-7b5d-4e11-8b5a-1d9b0f2a1234",
        items: [
          {
            productId: "22222222-2222-2222-2222-222222222222",
            quantity: 0,
            locationId:
              "f1e6fe7d-392c-4962-bdd1-0e98c3425b72",
          },
        ],
      }),
    ).rejects.toThrow("Received quantity must be greater than zero");
  });
});
