const VENDOR_SERVICE_URL = "http://localhost:3001";

type Params = {
  params: Promise<{
    vendorId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Params,
) {
  const { vendorId } = await params;

  const response = await fetch(
    `${VENDOR_SERVICE_URL}/vendors/${vendorId}`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function PATCH(
  request: Request,
  { params }: Params,
) {
  const { vendorId } = await params;
  const body = await request.json();

  const response = await fetch(
    `${VENDOR_SERVICE_URL}/vendors/${vendorId}`,
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
  const { vendorId } = await params;

  const response = await fetch(
    `${VENDOR_SERVICE_URL}/vendors/${vendorId}`,
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
