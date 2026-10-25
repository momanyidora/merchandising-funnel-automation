import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { purchaseOrderAmendments } from "../db/schema.js";

export function listPurchaseOrderAmendments(purchaseOrderId: string) {
  return db.select().from(purchaseOrderAmendments)
    .where(eq(purchaseOrderAmendments.purchaseOrderId, purchaseOrderId))
    .orderBy(desc(purchaseOrderAmendments.createdAt));
}

export async function createPurchaseOrderAmendment(data: {
  purchaseOrderId: string; requestedBy: string; reason: string; changeSummary: string;
}) {
  const [amendment] = await db.insert(purchaseOrderAmendments).values(data).returning();
  return amendment;
}

export async function reviewPurchaseOrderAmendment(id: string, status: "APPROVED" | "REJECTED", reviewedBy: string) {
  const [amendment] = await db.update(purchaseOrderAmendments)
    .set({ status, reviewedBy, reviewedAt: new Date() })
    .where(and(eq(purchaseOrderAmendments.id, id), eq(purchaseOrderAmendments.status, "PENDING")))
    .returning();
  return amendment;
}
