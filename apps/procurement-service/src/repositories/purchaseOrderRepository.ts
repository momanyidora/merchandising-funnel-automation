import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { purchaseOrders } from "../db/schema.js";

export async function createPurchaseOrder(data: {
  vendorId: string;
  status: string;
  paymentTerms: string;
  currency: string;
}) {
  const [purchaseOrder] = await db
    .insert(purchaseOrders)
    .values(data)
    .returning();

  return purchaseOrder;
}

export async function getPurchaseOrderById(id: string) {
  const [purchaseOrder] = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, id))
    .limit(1);

  return purchaseOrder;
}

export async function listPurchaseOrders() {
  return db.select().from(purchaseOrders);
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<{
    status: string;
    paymentTerms: string;
    currency: string;
  }>,
) {
  const [purchaseOrder] = await db
    .update(purchaseOrders)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, id))
    .returning();

  return purchaseOrder;
}

export async function deletePurchaseOrder(id: string) {
  const [purchaseOrder] = await db
    .delete(purchaseOrders)
    .where(eq(purchaseOrders.id, id))
    .returning();

  return purchaseOrder;
}
