const procurementServiceUrl =
  process.env.PROCUREMENT_SERVICE_URL ?? "http://localhost:3002";

export async function getPurchaseOrderById(purchaseOrderId: string) {
  const response = await fetch(
    `${procurementServiceUrl}/purchase-orders/${purchaseOrderId}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Procurement service is unavailable");
  }

  return response.json();
}

export async function getPurchaseOrderItems(purchaseOrderId: string) {
  const response = await fetch(
    `${procurementServiceUrl}/purchase-orders/${purchaseOrderId}/items`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Procurement service is unavailable");
  }

  return response.json();
}
