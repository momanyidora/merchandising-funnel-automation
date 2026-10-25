const PROCUREMENT_SERVICE_URL = "http://localhost:3002";
type Context = { params: Promise<{ id: string; amendmentId: string }> };
export async function POST(request: Request, { params }: Context) {
  const { id, amendmentId } = await params;
  const response = await fetch(`${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}/amendments/${amendmentId}/review`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(await request.json()),
  });
  return Response.json(await response.json(), { status: response.status });
}
