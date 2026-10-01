import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { purchaseOrderApprovers } from "../db/schema.js";

export async function getPurchaseOrderApproverByUserId(
  userId: string,
): Promise<{
  id: string;
  userId: string;
  role: string;
  active: boolean;
} | null> {
  const [approver] = await db
    .select()
    .from(purchaseOrderApprovers)
    .where(eq(purchaseOrderApprovers.userId, userId))
    .limit(1);

  return approver ?? null;
}
