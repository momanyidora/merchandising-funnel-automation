import { getInventoryItemByProductId } from "../repositories/inventoryRepository.js";
import { changeOnOrder } from "../services/inventoryOnOrderService.js";
import { recordInventoryMovement } from "../services/inventoryMovementService.js";
import {
  hasProcessedEvent,
  markEventAsProcessed,
} from "../repositories/processedEventRepository.js";
import { checkAndPublishStockLow } from "../services/inventoryStockLowService.js";
export async function processGoodsReceivedEvent(event: {
  eventId: string;
  purchaseOrderId?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    locationId: string;
  }>;
}) {
  if (!event.eventId) {
    throw new Error("Event ID is missing");
  }

  if (await hasProcessedEvent(event.eventId)) {
    console.log(`Event already processed: ${event.eventId}`);
    return;
  }

  for (const item of event.items ?? []) {
    if (item.quantity <= 0) {
      throw new Error("Received quantity must be greater than zero");
    }

    const inventory = await getInventoryItemByProductId(item.productId);

    if (!inventory) {
      console.error(`Inventory item not found for product: ${item.productId}`);
      continue;
    }

    await recordInventoryMovement({
      inventoryItemId: inventory.id,
      locationId: item.locationId,
      type: "GOODS_RECEIVED",
      quantity: item.quantity,
      reason: event.purchaseOrderId
        ? `Goods received for purchase order ${event.purchaseOrderId}`
        : "Goods received",
    });

    await changeOnOrder(inventory.id, -item.quantity);
    await checkAndPublishStockLow(item.productId);
  }

  await markEventAsProcessed(event.eventId);
}
