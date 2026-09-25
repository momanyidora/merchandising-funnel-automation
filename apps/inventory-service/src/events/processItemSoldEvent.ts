import { getInventoryItemByProductId } from "../repositories/inventoryRepository.js";
import { recordInventoryMovement } from "../services/inventoryMovementService.js";
import { sell } from "../services/inventoryReservationService.js";
import {
  hasProcessedEvent,
  markEventAsProcessed,
} from "../repositories/processedEventRepository.js";

export async function processItemSoldEvent(event: {
  eventId: string;
  saleId?: string;
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
      throw new Error("Sale quantity must be greater than zero");
    }

    const inventory = await getInventoryItemByProductId(item.productId);

    if (!inventory) {
      console.error(
        `Inventory item not found for product: ${item.productId}`,
      );
      continue;
    }

    await sell(inventory.id, item.quantity);

    await recordInventoryMovement({
      inventoryItemId: inventory.id,
      locationId: item.locationId,
      type: "ITEM_SOLD",
      quantity: -item.quantity,
      reason: event.saleId
        ? `Item sold in sale ${event.saleId}`
        : "Item sold",
    });
  }

  await markEventAsProcessed(event.eventId);
}
