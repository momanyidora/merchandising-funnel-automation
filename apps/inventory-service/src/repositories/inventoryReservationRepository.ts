import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems } from "../db/schema.js";

export async function reserveInventory(
  inventoryItemId: string,
  quantity: number,
) {
  return db.transaction(async (tx) => {
    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        reserved: sql`${inventoryItems.reserved} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryItems.id, inventoryItemId),
          sql`${inventoryItems.onHand} - ${inventoryItems.reserved} >= ${quantity}`,
        ),
      )
      .returning();

    if (updatedItem) {
      return updatedItem;
    }

    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (!item) {
      return null;
    }

    throw new Error("Insufficient available inventory");
  });
}
export async function releaseInventory(
  inventoryItemId: string,
  quantity: number,
) {
  return db.transaction(async (tx) => {
    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        reserved: sql`${inventoryItems.reserved} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryItems.id, inventoryItemId),
          gte(inventoryItems.reserved, quantity),
        ),
      )
      .returning();

    if (updatedItem) {
      return updatedItem;
    }

    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (!item) {
      return null;
    }

    throw new Error("Cannot release more than reserved inventory");
  });
}
export async function sellInventory(inventoryItemId: string, quantity: number) {
  return db.transaction(async (tx) => {
    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        onHand: sql`${inventoryItems.onHand} - ${quantity}`,
        reserved: sql`${inventoryItems.reserved} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryItems.id, inventoryItemId),
          gte(inventoryItems.reserved, quantity),
          gte(inventoryItems.onHand, quantity),
        ),
      )
      .returning();

    if (updatedItem) {
      return updatedItem;
    }

    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (!item) {
      return null;
    }

    if (quantity > item.reserved) {
      throw new Error("Cannot sell more than reserved inventory");
    }

    throw new Error("Cannot sell more than on-hand inventory");
  });
}