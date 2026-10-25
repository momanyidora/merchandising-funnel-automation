const WAREHOUSE_SERVICE_URL = "http://localhost:3005";

export async function GET() {
  const response = await fetch(`${WAREHOUSE_SERVICE_URL}/warehouse/locations`);
  const data = await response.json();
  return Response.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${WAREHOUSE_SERVICE_URL}/warehouse/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
