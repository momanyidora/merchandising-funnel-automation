import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  inventoryItems,
  inventoryLocations,
  inventoryLocationStock,
  inventoryMovements,
} from "../db/schema.js";

export async function applyInventoryMovement(data: {
  inventoryItemId: string;
  locationId: string;
  type: string;
  quantity: number;
  reason?: string;
}) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.inventoryItemId));

    if (!item) {
      return null;
    }

    const [location] = await tx
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, data.locationId));

    if (!location) {
      throw new Error("Inventory location not found");
    }

    const [locationStock] = await tx
      .select()
      .from(inventoryLocationStock)
      .where(
        and(
          eq(inventoryLocationStock.inventoryItemId, data.inventoryItemId),
          eq(inventoryLocationStock.locationId, data.locationId),
        ),
      );

    const currentLocationQuantity = locationStock?.quantity ?? 0;
    const newLocationQuantity = currentLocationQuantity + data.quantity;

    if (newLocationQuantity < 0) {
      throw new Error("Insufficient inventory at this location");
    }

    const newOnHand = item.onHand + data.quantity;

    if (newOnHand < 0) {
      throw new Error("Insufficient inventory");
    }

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        onHand: newOnHand,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, data.inventoryItemId))
      .returning();

    const [updatedLocationStock] = await tx
      .insert(inventoryLocationStock)
      .values({
        inventoryItemId: data.inventoryItemId,
        locationId: data.locationId,
        quantity: data.quantity,
      })
      .onConflictDoUpdate({
        target: [
          inventoryLocationStock.inventoryItemId,
          inventoryLocationStock.locationId,
        ],
        set: {
          quantity: sql`${inventoryLocationStock.quantity} + ${data.quantity}`,
          updatedAt: new Date(),
        },
      })
      .returning();

    const [movement] = await tx
      .insert(inventoryMovements)
      .values({
        inventoryItemId: data.inventoryItemId,
        locationId: data.locationId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      })
      .returning();

    return {
      inventory: updatedItem,
      locationStock: updatedLocationStock,
      movement,
    };
  });
}
