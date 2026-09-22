const PROCUREMENT_SERVICE_URL = "http://localhost:3002";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: Params,
) {
  const { id } = await params;

  const response = await fetch(
    `${PROCUREMENT_SERVICE_URL}/purchase-orders/${id}/submit`,
    {
      method: "POST",
    },
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
