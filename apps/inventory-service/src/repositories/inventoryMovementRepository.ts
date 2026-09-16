import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems, inventoryMovements } from "../db/schema.js";

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
      movement,
    };
  });
}
