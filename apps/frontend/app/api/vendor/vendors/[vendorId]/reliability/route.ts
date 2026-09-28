const VENDOR_SERVICE_URL = "http://localhost:3001";

type Params = {
  params: Promise<{
    vendorId: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { vendorId } = await params;

  const response = await fetch(
    `${VENDOR_SERVICE_URL}/vendors/${vendorId}/reliability`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function POST(request: Request, { params }: Params) {
  const { vendorId } = await params;
  const body = await request.json();

  const response = await fetch(
    `${VENDOR_SERVICE_URL}/vendors/${vendorId}/reliability`,
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
