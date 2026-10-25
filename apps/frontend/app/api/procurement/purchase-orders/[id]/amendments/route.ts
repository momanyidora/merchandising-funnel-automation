const PROCUREMENT_SERVICE_URL = "http://localhost:3002";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const response = await fetch(`${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}/amendments`);
  return Response.json(await response.json(), { status: response.status });
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const response = await fetch(`${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}/amendments`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(await request.json()),
  });
  return Response.json(await response.json(), { status: response.status });
}
