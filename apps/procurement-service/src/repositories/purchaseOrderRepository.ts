import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { eventOutbox, purchaseOrderApprovals, purchaseOrders } from "../db/schema.js";

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

export async function approvePurchaseOrderAndQueueEvent(data: { id: string; approverId: string; items: unknown[] }) {
  return db.transaction(async (tx) => {
    const [purchaseOrder] = await tx.update(purchaseOrders).set({ status: "APPROVED", updatedAt: new Date() }).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.status, "PENDING_APPROVAL"))).returning();
    if (!purchaseOrder) throw new Error("Purchase order is no longer pending approval");
    await tx.insert(purchaseOrderApprovals).values({ purchaseOrderId: data.id, approverId: data.approverId });
    const eventId = randomUUID();
    const payload = { eventId, eventType: "PurchaseOrderApproved", purchaseOrder, items: data.items };
    await tx.insert(eventOutbox).values({ eventId, eventType: "PurchaseOrderApproved", payload });
    return purchaseOrder;
  });
}
