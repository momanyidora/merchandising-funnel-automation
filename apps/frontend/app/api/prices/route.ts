const RETAIL_SERVICE_URL = "http://localhost:3006";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = await fetch(`${RETAIL_SERVICE_URL}/prices${url.search}`);
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
