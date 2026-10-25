const WAREHOUSE_SERVICE_URL = "http://localhost:3005";

export async function GET() {
  const response = await fetch(
    `${WAREHOUSE_SERVICE_URL}/warehouse/utilization`,
  );
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
