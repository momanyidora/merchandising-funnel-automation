import { describe, expect, it } from "vitest";
import {
  hasProcessedEvent,
  markEventAsProcessed,
} from "../../src/repositories/processedEventRepository.js";

describe("Processed Event Repository", () => {
  it("should report false for an unprocessed event", async () => {
    const eventId = `event-${Date.now()}`;

    expect(await hasProcessedEvent(eventId)).toBe(false);
  });

  it("should mark an event as processed", async () => {
    const eventId = `event-${Date.now()}`;

    await markEventAsProcessed(eventId);

    expect(await hasProcessedEvent(eventId)).toBe(true);
  });
});
