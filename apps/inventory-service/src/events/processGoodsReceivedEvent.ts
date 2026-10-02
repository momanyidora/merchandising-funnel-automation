import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  inventoryItems,
  inventoryLocations,
  inventoryLocationStock,
  inventoryMovements,
  processedEvents,
} from "../db/schema.js";
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

  const stockLowProductIds = await db.transaction(async (tx) => {
    const [processed] = await tx
      .select()
      .from(processedEvents)
      .where(eq(processedEvents.eventId, event.eventId))
      .limit(1);

    if (processed) {
      console.log(`Event already processed: ${event.eventId}`);
      return [];
    }

    const productsForStockLow: string[] = [];

    for (const item of event.items ?? []) {
      if (item.quantity <= 0) {
        throw new Error("Received quantity must be greater than zero");
      }

      const [inventory] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.productId, item.productId))
        .limit(1)
        .for("update");

      if (!inventory) {
        console.error(
          `Inventory item not found for product: ${item.productId}`,
        );
        continue;
      }

      const [location] = await tx
        .select()
        .from(inventoryLocations)
        .where(eq(inventoryLocations.id, item.locationId))
        .limit(1);

      if (!location) {
        throw new Error("Inventory location not found");
      }

      const [locationStock] = await tx
        .select()
        .from(inventoryLocationStock)
        .where(
          sql`${inventoryLocationStock.inventoryItemId} = ${inventory.id}
              AND ${inventoryLocationStock.locationId} = ${item.locationId}`,
        )
        .for("update");

      const currentLocationQuantity = locationStock?.quantity ?? 0;
      const newLocationQuantity =
        currentLocationQuantity + item.quantity;

      if (newLocationQuantity < 0) {
        throw new Error("Insufficient inventory at this location");
      }

      const newOnHand = inventory.onHand + item.quantity;

      if (newOnHand < 0) {
        throw new Error("Insufficient inventory");
      }

      const newOnOrder = inventory.onOrder - item.quantity;

      if (newOnOrder < 0) {
        throw new Error("On-order quantity cannot be negative");
      }

      await tx
        .update(inventoryItems)
        .set({
          onHand: newOnHand,
          onOrder: newOnOrder,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, inventory.id));

      if (locationStock) {
        await tx
          .update(inventoryLocationStock)
          .set({
            quantity: newLocationQuantity,
            updatedAt: new Date(),
          })
          .where(eq(inventoryLocationStock.id, locationStock.id));
      } else {
        await tx.insert(inventoryLocationStock).values({
          inventoryItemId: inventory.id,
          locationId: item.locationId,
          quantity: item.quantity,
        });
      }

      await tx.insert(inventoryMovements).values({
        inventoryItemId: inventory.id,
        locationId: item.locationId,
        type: "GOODS_RECEIVED",
        quantity: item.quantity,
        reason: event.purchaseOrderId
          ? `Goods received for purchase order ${event.purchaseOrderId}`
          : "Goods received",
        idempotencyKey: `GoodsReceived:${event.eventId}:${item.productId}`,
      });

      productsForStockLow.push(item.productId);
    }

    await tx.insert(processedEvents).values({
      eventId: event.eventId,
    });

    return productsForStockLow;
  });

  for (const productId of stockLowProductIds) {
    await checkAndPublishStockLow(productId);
  }
}
