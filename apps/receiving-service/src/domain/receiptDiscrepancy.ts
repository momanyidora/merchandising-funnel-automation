export function classifyReceipt(expectedRemaining: number, received: number, condition: "GOOD" | "DAMAGED") {
  if (!Number.isSafeInteger(expectedRemaining) || expectedRemaining < 0 || !Number.isSafeInteger(received) || received < 0) throw new Error("Receipt quantities must be non-negative whole numbers");
  if (condition === "DAMAGED") return "DAMAGED" as const;
  if (received < expectedRemaining) return "SHORTAGE" as const;
  if (received > expectedRemaining) return "OVERAGE" as const;
  return "NONE" as const;
}
