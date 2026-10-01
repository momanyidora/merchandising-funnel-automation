import { db } from "../db/index.js";
import { purchaseOrderApprovals } from "../db/schema.js";

export async function createPurchaseOrderApproval(data: {
  purchaseOrderId: string;
  approverId: string;
}) {
  const [approval] = await db
    .insert(purchaseOrderApprovals)
    .values({
      purchaseOrderId: data.purchaseOrderId,
      approverId: data.approverId,
    })
    .returning();

  return approval;
}
