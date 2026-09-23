import { getInventoryItemByProductId } from "../repositories/inventoryRepository.js";
import { changeOnOrder } from "../services/inventoryOnOrderService.js";
import {
  hasProcessedEvent,
  markEventAsProcessed,
} from "../repositories/processedEventRepository.js";

export async function processPurchaseOrderApprovedEvent(event: {
  eventId: string;
  purchaseOrder?: {
    status?: string;
  };
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}) {
  if (!event.eventId) {
    throw new Error("Event ID is missing");
  }

  if (await hasProcessedEvent(event.eventId)) {
    console.log(`Event already processed: ${event.eventId}`);
    return;
  }

  if (event.purchaseOrder?.status !== "APPROVED") {
    return;
  }

  for (const item of event.items ?? []) {
    const inventory = await getInventoryItemByProductId(item.productId);

    if (!inventory) {
      console.error(`Inventory item not found for product: ${item.productId}`);
      continue;
    }

    await changeOnOrder(inventory.id, item.quantity);
  }

  await markEventAsProcessed(event.eventId);
}
