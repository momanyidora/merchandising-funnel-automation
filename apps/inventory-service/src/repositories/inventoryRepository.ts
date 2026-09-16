import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems } from "../db/schema.js";

export async function createInventoryItem(data: {
  productId: string;
  unitCost: number;
}) {
  const [item] = await db
    .insert(inventoryItems)
    .values({
      productId: data.productId,
      unitCost: data.unitCost,
    })
    .returning();

  return item;
}

export async function getInventoryItemById(id: string) {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id));

  return item ?? null;
}

export async function getInventoryItemByProductId(productId: string) {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.productId, productId));

  return item ?? null;
}
