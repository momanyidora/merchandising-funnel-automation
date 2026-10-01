export type TenderCount = { method: string; actual: number };
export const tenderMethods = ["CASH", "CARD", "GIFT_CARD"] as const;
export function reconcile(expectedByMethod: Map<string, number>, counts: TenderCount[]) {
  if (counts.length !== tenderMethods.length || new Set(counts.map((x) => x.method)).size !== tenderMethods.length || !tenderMethods.every((method) => counts.some((x) => x.method === method))) throw new Error("Count cash, card, and gift card tenders exactly once");
  if (counts.some((x) => !Number.isSafeInteger(x.actual) || x.actual < 0)) throw new Error("Tender counts must be non-negative whole currency values");
  const expectedTotal = counts.reduce((sum, count) => sum + (expectedByMethod.get(count.method) ?? 0), 0);
  const actualTotal = counts.reduce((sum, count) => sum + count.actual, 0);
  return { expectedTotal, actualTotal, variance: actualTotal - expectedTotal };
}
