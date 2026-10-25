const RECEIVING_SERVICE_URL = "http://localhost:3004";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ purchaseOrderId: string }> },
) {
  const { purchaseOrderId } = await params;
  const response = await fetch(
    `${RECEIVING_SERVICE_URL}/receiving/receivable/${purchaseOrderId}`,
  );
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
