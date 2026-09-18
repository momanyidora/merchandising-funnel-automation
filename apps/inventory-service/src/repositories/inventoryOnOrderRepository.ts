import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems } from "../db/schema.js";

export async function updateOnOrder(inventoryItemId: string, quantity: number) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (!item) {
      return null;
    }

    const newOnOrder = item.onOrder + quantity;

    if (newOnOrder < 0) {
      throw new Error("On-order quantity cannot be negative");
    }

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        onOrder: newOnOrder,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, inventoryItemId))
      .returning();

    return updatedItem;
  });
}
