import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  inventoryItems,
  inventoryLocationStock,
  inventoryMovements,
  processedEvents,
} from "../db/schema.js";
import { checkAndPublishStockLow } from "../services/inventoryStockLowService.js";

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

  const stockLowProductIds = await db.transaction(async (tx) => {
    const [processed] = await tx
      .select()
      .from(processedEvents)
      .where(eq(processedEvents.eventId, event.eventId))
      .limit(1);

    if (processed) {
      return [] as string[];
    }

    const productIds: string[] = [];
    for (const item of event.items ?? []) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("Sale quantity must be greater than zero");
      }

      const [inventory] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.productId, item.productId))
        .limit(1)
        .for("update");

      if (!inventory) {
        throw new Error(`Inventory item not found for product: ${item.productId}`);
      }

      const [locationStock] = await tx
        .select()
        .from(inventoryLocationStock)
        .where(
          and(
            eq(inventoryLocationStock.inventoryItemId, inventory.id),
            eq(inventoryLocationStock.locationId, item.locationId),
          ),
        )
        .limit(1)
        .for("update");

      if (!locationStock || locationStock.quantity < item.quantity) {
        throw new Error("Insufficient inventory at this location");
      }
      if (inventory.reserved < item.quantity) {
        throw new Error("Cannot sell more than reserved inventory");
      }

      await tx
        .update(inventoryItems)
        .set({
          onHand: inventory.onHand - item.quantity,
          reserved: inventory.reserved - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, inventory.id));
      await tx
        .update(inventoryLocationStock)
        .set({
          quantity: locationStock.quantity - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(inventoryLocationStock.id, locationStock.id));
      await tx.insert(inventoryMovements).values({
        inventoryItemId: inventory.id,
        locationId: item.locationId,
        type: "ITEM_SOLD",
        quantity: -item.quantity,
        reason: event.saleId ? `Item sold in sale ${event.saleId}` : "Item sold",
        idempotencyKey: `ItemSold:${event.eventId}:${item.productId}:${item.locationId}`,
      });
      productIds.push(item.productId);
    }

    await tx.insert(processedEvents).values({ eventId: event.eventId });
    return productIds;
  });

  for (const productId of stockLowProductIds) {
    await checkAndPublishStockLow(productId);
  }
}
