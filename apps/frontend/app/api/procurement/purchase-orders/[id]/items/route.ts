const PROCUREMENT_SERVICE_URL = "http://localhost:3002";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Params,
) {
  const { id } = await params;

  const response = await fetch(
    `${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}/items`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function POST(
  request: Request,
  { params }: Params,
) {
  const { id } = await params;
  const body = await request.json();

  const response = await fetch(
    `${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
