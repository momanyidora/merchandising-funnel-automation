export function movementPlan(taskId: string, productId: string, quantity: number, sourceLocationId: string, destinationLocationId: string) {
  if (!taskId || !productId || !sourceLocationId || !destinationLocationId || sourceLocationId === destinationLocationId || !Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("Invalid warehouse movement");
  return [
    { locationId: sourceLocationId, quantity: -quantity, idempotencyKey: `${taskId}:source` },
    { locationId: destinationLocationId, quantity, idempotencyKey: `${taskId}:destination` },
  ];
}
