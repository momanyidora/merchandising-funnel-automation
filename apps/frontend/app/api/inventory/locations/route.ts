const INVENTORY_SERVICE_URL = "http://localhost:3003";

export async function GET() {
  const response = await fetch(
    `${INVENTORY_SERVICE_URL}/inventory/locations`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
