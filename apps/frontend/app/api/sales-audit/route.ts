const SALES_AUDIT_SERVICE_URL = "http://localhost:3007";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(
      `${SALES_AUDIT_SERVICE_URL}/audits${url.search}`,
    );
    const text = await response.text();
    if (!text) return Response.json([], { status: response.status });
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Sales audit service unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${SALES_AUDIT_SERVICE_URL}/audits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!text) {
      return Response.json(
        { error: "Empty response from sales audit service" },
        { status: 502 },
      );
    }
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Sales audit service unavailable" },
      { status: 503 },
    );
  }
}
