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
    `${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function PATCH(
  request: Request,
  { params }: Params,
) {
  const { id } = await params;
  const body = await request.json();

  const response = await fetch(
    `${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function DELETE(
  _request: Request,
  { params }: Params,
) {
  const { id } = await params;

  const response = await fetch(
    `${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}`,
    {
      method: "DELETE",
    },
  );

  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
