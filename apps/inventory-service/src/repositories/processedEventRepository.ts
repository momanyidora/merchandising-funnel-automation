import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { processedEvents } from "../db/schema.js";

export async function hasProcessedEvent(eventId: string) {
  const [event] = await db
    .select()
    .from(processedEvents)
    .where(eq(processedEvents.eventId, eventId))
    .limit(1);

  return Boolean(event);
}

export async function markEventAsProcessed(eventId: string) {
  await db.insert(processedEvents).values({
    eventId,
  });
}
