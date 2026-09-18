import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/inventoryOnOrderRepository.js", () => ({
  updateOnOrder: vi.fn(),
}));

import { updateOnOrder } from "../../src/repositories/inventoryOnOrderRepository.js";
import { changeOnOrder } from "../../src/services/inventoryOnOrderService.js";

const mockedUpdateOnOrder = vi.mocked(updateOnOrder);

describe("inventory on-order service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increases on-order quantity", async () => {
    const inventory = {
      id: "inventory-1",
      productId: "product-1",
      onHand: 20,
      reserved: 3,
      onOrder: 10,
      unitCost: 500,
    };

    mockedUpdateOnOrder.mockResolvedValue(inventory as never);

    const result = await changeOnOrder("inventory-1", 10);

    expect(result).toEqual(inventory);
    expect(mockedUpdateOnOrder).toHaveBeenCalledWith("inventory-1", 10);
  });

  it("decreases on-order quantity", async () => {
    const inventory = {
      id: "inventory-1",
      productId: "product-1",
      onHand: 20,
      reserved: 3,
      onOrder: 5,
      unitCost: 500,
    };

    mockedUpdateOnOrder.mockResolvedValue(inventory as never);

    const result = await changeOnOrder("inventory-1", -5);

    expect(result.onOrder).toBe(5);
    expect(mockedUpdateOnOrder).toHaveBeenCalledWith("inventory-1", -5);
  });

  it("rejects zero quantity", async () => {
    await expect(changeOnOrder("inventory-1", 0)).rejects.toThrow(
      "On-order quantity cannot be zero",
    );

    expect(mockedUpdateOnOrder).not.toHaveBeenCalled();
  });

  it("handles a missing inventory item", async () => {
    mockedUpdateOnOrder.mockResolvedValue(null);

    await expect(changeOnOrder("missing-id", 10)).rejects.toThrow(
      "Inventory item not found",
    );
  });

  it("propagates negative on-order error", async () => {
    mockedUpdateOnOrder.mockRejectedValue(
      new Error("On-order quantity cannot be negative"),
    );

    await expect(changeOnOrder("inventory-1", -10)).rejects.toThrow(
      "On-order quantity cannot be negative",
    );
  });
});
