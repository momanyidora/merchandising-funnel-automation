import { publishEvent } from "../events/rabbitmqPublisher.js";
import { getInventoryItemByProductId } from "../repositories/inventoryRepository.js";

export async function checkAndPublishStockLow(productId: string) {
  const inventory = await getInventoryItemByProductId(productId);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  if (inventory.onHand <= inventory.lowStockThreshold) {
    await publishEvent("StockLow", {
      productId: inventory.productId,
      inventoryItemId: inventory.id,
      onHand: inventory.onHand,
      lowStockThreshold: inventory.lowStockThreshold,
    });

    return true;
  }

  return false;
}
