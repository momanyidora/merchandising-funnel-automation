import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendorReliabilityHistory } from "../db/schema.js";

export async function createReliabilityRecord(data: {
  vendorId: string;
  purchaseOrderId?: string;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  expectedQuantity: number;
  receivedQuantity: number;
  status: string;
  notes?: string;
}) {
  const [record] = await db
    .insert(vendorReliabilityHistory)
    .values({
      vendorId: data.vendorId,
      purchaseOrderId: data.purchaseOrderId,
      expectedDeliveryDate: data.expectedDeliveryDate,
      actualDeliveryDate: data.actualDeliveryDate,
      expectedQuantity: data.expectedQuantity,
      receivedQuantity: data.receivedQuantity,
      status: data.status,
      notes: data.notes,
    })
    .returning();

  return record;
}

export async function getVendorReliabilityHistory(vendorId: string) {
  return db
    .select()
    .from(vendorReliabilityHistory)
    .where(eq(vendorReliabilityHistory.vendorId, vendorId));
}

export async function getReliabilityRecordById(vendorId: string, id: string) {
  const [record] = await db
    .select()
    .from(vendorReliabilityHistory)
    .where(eq(vendorReliabilityHistory.id, id))
    .limit(1);

  if (!record || record.vendorId !== vendorId) {
    return undefined;
  }

  return record;
}
