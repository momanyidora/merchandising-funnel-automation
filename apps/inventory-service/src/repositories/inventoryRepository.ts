import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems } from "../db/schema.js";


type InventoryItem = InferSelectModel<typeof inventoryItems>;
export async function createInventoryItem(data: {
  productId: string;
  productName: string;
  unitCost: number;
}) {
  const [item] = await db
    .insert(inventoryItems)
    .values({
      productId: data.productId,
      productName: data.productName,
      unitCost: data.unitCost,
    })
    .returning();

  return item;
}

export async function getInventoryItemById(id: string): Promise<typeof inventoryItems.$inferSelect | null> {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id));

  return item ?? null;
}

export async function getInventoryItemByProductId(
  productId: string,
): Promise<typeof inventoryItems.$inferSelect | null> {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.productId, productId));

  return item ?? null;
}
