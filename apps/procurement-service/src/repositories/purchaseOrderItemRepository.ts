import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { purchaseOrderItems } from "../db/schema.js";

export async function createPurchaseOrderItem(data: {
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  lockedUnitCost: number;
}) {
  const [item] = await db.insert(purchaseOrderItems).values(data).returning();

  return item;
}

export async function getPurchaseOrderItems(purchaseOrderId: string) {
  return db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function getPurchaseOrderItemById(id: string) {
  const [item] = await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.id, id))
    .limit(1);

  return item;
}

export async function updatePurchaseOrderItem(
  id: string,
  data: Partial<{
    quantity: number;
    lockedUnitCost: number;
  }>,
) {
  const [item] = await db
    .update(purchaseOrderItems)
    .set(data)
    .where(eq(purchaseOrderItems.id, id))
    .returning();

  return item;
}

export async function deletePurchaseOrderItem(id: string) {
  const [item] = await db
    .delete(purchaseOrderItems)
    .where(eq(purchaseOrderItems.id, id))
    .returning();

  return item;
}
