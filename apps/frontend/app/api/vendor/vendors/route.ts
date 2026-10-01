const VENDOR_SERVICE_URL = "http://localhost:3001";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  const response = await fetch(`${VENDOR_SERVICE_URL}/vendors${query}`);
  const data = await response.json();

  return Response.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${VENDOR_SERVICE_URL}/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
