import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems } from "../db/schema.js";

export async function reserveInventory(
  inventoryItemId: string,
  quantity: number,
) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (!item) {
      return null;
    }

    const available = item.onHand - item.reserved;

    if (quantity > available) {
      throw new Error("Insufficient available inventory");
    }

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        reserved: item.reserved + quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, inventoryItemId))
      .returning();

    return updatedItem;
  });
}
export async function releaseInventory(
  inventoryItemId: string,
  quantity: number,
) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (!item) {
      return null;
    }

    if (quantity > item.reserved) {
      throw new Error("Cannot release more than reserved inventory");
    }

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        reserved: item.reserved - quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, inventoryItemId))
      .returning();

    return updatedItem;
  });
}