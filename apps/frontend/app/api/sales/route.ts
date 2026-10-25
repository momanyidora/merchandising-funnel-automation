const RETAIL_SERVICE_URL = "http://localhost:3006";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(`${RETAIL_SERVICE_URL}/sales${url.search}`);
    const text = await response.text();
    if (!text) {
      return Response.json([], { status: response.status });
    }
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Retail sales service unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${RETAIL_SERVICE_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!text) {
      return Response.json(
        { error: "Empty response from retail service" },
        { status: 502 },
      );
    }
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Retail sales service unavailable" },
      { status: 503 },
    );
  }
}
