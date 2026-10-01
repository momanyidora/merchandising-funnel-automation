import { db } from "../db/index.js";
import { eventAuditLogs } from "../db/schema.js";

export async function createEventAuditLog(data: {
  eventId: string;
  eventType: string;
  status: string;
  payload: unknown;
  processedAt?: Date;
}) {
  const [auditLog] = await db
    .insert(eventAuditLogs)
    .values({
      eventId: data.eventId,
      eventType: data.eventType,
      status: data.status,
      payload: data.payload,
      processedAt: data.processedAt,
    })
    .returning();

  return auditLog;
}
